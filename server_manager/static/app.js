// Global Session Logs Data Buffer
let logDatabase = {
    all: [],
    ssh: [],
    backend: [],
    frontend: [],
    live: []
};

let currentTab = "all";
let searchFilter = "";
let socket = null;
let statusInterval = null;
let lastStatusResponse = null;

// Clock: Tick-Tock
setInterval(() => {
    const now = new Date();
    document.getElementById("system-time").innerText = now.toLocaleTimeString();
}, 1000);

// Fetch historical logs from server
async function fetchLogs() {
    try {
        const res = await fetch("/api/logs/all");
        const data = await res.json();
        
        logDatabase.all = [];
        logDatabase.ssh = [];
        logDatabase.backend = [];
        logDatabase.frontend = [];
        logDatabase.live = [];
        
        data.forEach(entry => {
            logDatabase.all.push(entry);
            if (logDatabase[entry.service]) {
                logDatabase[entry.service].push(entry);
            }
        });
        
        redrawLogContainer();
    } catch (e) {
        console.error("Error fetching historical logs:", e);
    }
}

// Initialize Page Loader
window.addEventListener("DOMContentLoaded", () => {
    // Perform initial hydration
    fetchStatus();
    fetchConfig();
    fetchLogs().then(() => {
        connectWebSocket();
    });
    
    // Set status poller interval
    statusInterval = setInterval(fetchStatus, 2000);
});

// ANSI Escape Code colors map to CSS styles
function parseAnsiColorCodes(text) {
    if (!text) return "";
    
    // 1. Escape HTML entities to prevent DOM XSS vulnerabilities
    let escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
        
    // 2. Decode Standard ANSI Console colors into Styled Spans
    // Reset code
    escaped = escaped.replace(/\x1b\[0m/g, '</span>');
    
    const colorMap = {
        '31': 'term-red',
        '32': 'term-green',
        '33': 'term-yellow',
        '34': 'term-blue',
        '35': 'term-magenta',
        '36': 'term-cyan',
        '90': 'term-gray',
        '1;31': 'term-red', // Bold options
        '1;32': 'term-green',
        '1;33': 'term-yellow',
        '1;34': 'term-blue',
        '1;35': 'term-magenta',
        '1;36': 'term-cyan'
    };
    
    for (const [code, cssClass] of Object.entries(colorMap)) {
        const escapedCode = code.replace(/;/g, '\\;');
        const regex = new RegExp(`\\x1b\\[${escapedCode}m`, 'g');
        escaped = escaped.replace(regex, `<span class="${cssClass}">`);
    }
    
    // Clean up any remaining system terminal control characters
    escaped = escaped.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    
    return escaped;
}

// Format single log entry row
function renderLogLine(entry) {
    const timeSpan = `<span class="log-time">[${entry.timestamp}]</span>`;
    
    let chClass = "ch-ssh";
    let chLabel = "Tunnel";
    if (entry.service === "backend") {
        chClass = "ch-be";
        chLabel = "Backend";
    } else if (entry.service === "frontend") {
        chClass = "ch-fe";
        chLabel = "Frontend";
    } else if (entry.service === "live") {
        chClass = "ch-live";
        chLabel = "Live";
    }
    
    const channelSpan = `<span class="log-channel ${chClass}">${chLabel}</span>`;
    
    // ANSI parsed line
    let content = parseAnsiColorCodes(entry.line);
    
    // Apply Highlight filter if searching
    if (searchFilter) {
        try {
            const regex = new RegExp(`(${searchFilter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
            content = content.replace(regex, '<span class="search-highlight">$1</span>');
        } catch(e) {}
    }
    
    return `<div class="log-line log-${entry.service}">${timeSpan}${channelSpan}${content}</div>`;
}

// WebSocket Connection Stream
function connectWebSocket() {
    const wsStatusBadge = document.getElementById("ws-status");
    wsStatusBadge.innerText = "Connecting...";
    wsStatusBadge.className = "terminal-status connecting";
    
    const loc = window.location;
    let wsUri = "";
    if (loc.protocol === "https:") {
        wsUri = `wss://${loc.host}/ws/logs`;
    } else {
        wsUri = `ws://${loc.host}/ws/logs`;
    }
    
    socket = new WebSocket(wsUri);
    
    socket.onopen = () => {
        wsStatusBadge.innerText = "STREAM LIVE";
        wsStatusBadge.className = "terminal-status connected";
        console.log("WebSocket connected.");
    };
    
    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        // Handle count metadata updates
        if (msg.type === "counts") {
            updateTabCounts(msg.counts);
            return;
        }

        const entry = msg;

        // Push to relative queues
        logDatabase.all.push(entry);
        logDatabase[entry.service].push(entry);

        // Update tab count badges live
        updateTabCounts({
            all: logDatabase.all.length,
            ssh: logDatabase.ssh.length,
            backend: logDatabase.backend.length,
            frontend: logDatabase.frontend.length,
            live: logDatabase.live.length
        });

        // If current active tab matches, append live line
        if (currentTab === "all" || currentTab === entry.service) {
            // Apply text query match filter
            if (!searchFilter || entry.line.toLowerCase().includes(searchFilter.toLowerCase())) {
                const container = document.getElementById("console-log-lines");
                container.insertAdjacentHTML("beforeend", renderLogLine(entry));

                // Update line counter
                const statusEl = document.getElementById("log-line-count");
                if (statusEl) statusEl.textContent = `${logDatabase[currentTab].length} lines`;

                // Keep viewport scrolled to bottom if checked
                const autoScroll = document.getElementById("auto-scroll-toggle").checked;
                if (autoScroll) {
                    const consoleBody = document.getElementById("terminal-body-container");
                    consoleBody.scrollTop = consoleBody.scrollHeight;
                }
            }
        }
    };
    
    socket.onclose = () => {
        wsStatusBadge.innerText = "DISCONNECTED";
        wsStatusBadge.className = "terminal-status";
        console.warn("WebSocket closed. Attempting reconnect in 5 seconds...");
        setTimeout(connectWebSocket, 5000);
    };
    
    socket.onerror = (err) => {
        console.error("WebSocket encountered error: ", err);
        socket.close();
    };
}

// Fetch REST Service Status Statuses
async function fetchStatus() {
    try {
        const res = await fetch("/api/status");
        const data = await res.json();
        lastStatusResponse = data;
        
        // Header updates
        document.getElementById("local-ip-text").innerText = `LAN IP: ${data.local_ip}`;
        document.getElementById("lan-link-clipboard").innerText = `http://${data.local_ip}:8050`;
        
        // Update service cards dynamically
        for (const [key, svc] of Object.entries(data.services)) {
            updateCardUI(key, svc);
        }
    } catch (e) {
        console.error("Error fetching state status: ", e);
    }
}

// Helper: Update Individual card
function updateCardUI(key, svc) {
    const card = document.getElementById(`card-${key}`);
    const badge = document.getElementById(`badge-${key}`);
    const pid = document.getElementById(`pid-${key}`);
    const uptime = document.getElementById(`uptime-${key}`);
    
    // Status badges colors
    if (badge) {
        if (svc.status === "running") {
            if (svc.health === "online") {
                badge.innerText = "online";
                badge.className = "status-badge running";
            } else {
                badge.innerText = "offline";
                badge.className = "status-badge error";
            }
        } else {
            badge.innerText = svc.status;
            badge.className = `status-badge ${svc.status}`;
        }
    }
    
    // PID
    if (pid) {
        pid.innerText = svc.pid ? svc.pid : "-";
    }
    
    // Active time
    if (uptime) {
        if (svc.status === "running" && svc.start_time) {
            const start = new Date(svc.start_time);
            const diff = Math.floor((new Date() - start) / 1000);
            uptime.innerText = formatDuration(diff);
            
            // add active outline border class
            if (card) card.className = `service-card running-${key}`;
        } else {
            uptime.innerText = svc.status === "starting" ? "Starting..." : "-";
            if (card) card.className = `service-card`;
        }
    }
    
    // Link configurations
    if (key !== "ssh" && key !== "live") {
        const link = document.getElementById(`lan-link-${key}`);
        if (link) {
            link.innerText = svc.lan_url;
            link.href = svc.lan_url;
        }
    }
    
    // Action buttons locks based on status state
    const btnStart = document.getElementById(`btn-start-${key}`);
    const btnStop = document.getElementById(`btn-stop-${key}`);
    const btnRestart = document.getElementById(`btn-restart-${key}`);
    
    if (svc.status === "running") {
        if (btnStart) btnStart.disabled = true;
        if (btnStop) btnStop.disabled = false;
        if (btnRestart) btnRestart.disabled = false;
    } else if (svc.status === "stopped" || svc.status === "error") {
        if (btnStart) btnStart.disabled = false;
        if (btnStop) btnStop.disabled = true;
        if (btnRestart) btnRestart.disabled = true;
    } else if (svc.status === "starting") {
        if (btnStart) btnStart.disabled = true;
        if (btnStop) btnStop.disabled = true;
        if (btnRestart) btnRestart.disabled = true;
    }
    
    // Shortcuts states
    if (key === "backend") {
        const lnk = document.getElementById("btn-launch-be");
        if (lnk) {
            if (svc.status === "running") {
                lnk.className = "shortcut-btn secondary-btn";
            } else {
                lnk.className = "shortcut-btn secondary-btn disabled-link";
            }
        }
    } else if (key === "frontend") {
        const lnk = document.getElementById("btn-launch-fe");
        if (lnk) {
            if (svc.status === "running") {
                lnk.className = "shortcut-btn secondary-btn";
            } else {
                lnk.className = "shortcut-btn secondary-btn disabled-link";
            }
        }
    }
}

// Service triggers (start/stop/restart)
async function controlService(service, action) {
    const badge = document.getElementById(`badge-${service}`);
    badge.innerText = `${action}ing...`;
    badge.className = `status-badge starting`;
    
    try {
        const res = await fetch(`/api/${action}/${service}`, { method: "POST" });
        const data = await res.json();
        
        // immediate UI update
        fetchStatus();
    } catch(e) {
        console.error(`Error executing ${action} on ${service}:`, e);
        fetchStatus();
    }
}

// Fetch Loaded Config Environment parameters
async function fetchConfig() {
    try {
        const res = await fetch("/api/config");
        const config = await res.json();
        
        const envList = document.getElementById("env-list");
        envList.innerHTML = "";
        
        if (Object.keys(config).length === 0) {
            envList.innerHTML = '<div class="env-item"><div class="env-key">No backend environmental attributes loaded</div></div>';
            return;
        }
        
        for (const [key, val] of Object.entries(config)) {
            const item = `
                <div class="env-item">
                    <div class="env-key">${key}</div>
                    <div class="env-val">${val}</div>
                </div>
            `;
            envList.insertAdjacentHTML("beforeend", item);
        }
    } catch(e) {
        console.error("Error fetching config envs:", e);
    }
}

// Formatting seconds duration
function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const rM = m % 60;
    return `${h}h ${rM}m`;
}

// Update tab count badges
function updateTabCounts(counts) {
    const tabMap = { all: "tab-all", ssh: "tab-ssh", backend: "tab-backend", frontend: "tab-frontend", live: "tab-live" };
    for (const [key, tabId] of Object.entries(tabMap)) {
        const btn = document.getElementById(tabId);
        if (!btn) continue;
        const count = counts[key] || 0;
        // Remove existing badge if any
        const existing = btn.querySelector(".tab-count");
        if (existing) existing.remove();
        if (count > 0) {
            const badge = document.createElement("span");
            badge.className = "tab-count";
            badge.textContent = count >= 1000 ? `${Math.floor(count/1000)}k` : count;
            btn.appendChild(badge);
        }
    }
}

// Console tabs triggers
function switchTab(tab) {
    currentTab = tab;
    
    // Toggle active state classes
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(`tab-${tab}`).classList.add("active");
    
    // Clear and redraw log viewport
    redrawLogContainer();
}

// Redraw Logs viewport matching triggers and query
function redrawLogContainer() {
    const container = document.getElementById("console-log-lines");
    container.innerHTML = "";

    const lines = logDatabase[currentTab];
    let outputHTML = "";
    let visibleCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const entry = lines[i];
        if (!searchFilter || entry.line.toLowerCase().includes(searchFilter.toLowerCase())) {
            outputHTML += renderLogLine(entry);
            visibleCount++;
        }
    }

    container.innerHTML = outputHTML;

    // Update log counter status bar
    const statusEl = document.getElementById("log-line-count");
    if (statusEl) {
        if (searchFilter) {
            statusEl.textContent = `${visibleCount} / ${lines.length} lines`;
        } else {
            statusEl.textContent = `${lines.length} lines`;
        }
    }

    // Scroll to bottom
    const consoleBody = document.getElementById("terminal-body-container");
    consoleBody.scrollTop = consoleBody.scrollHeight;
}

// Real-time Text Log Query Searching
function filterLogs() {
    searchFilter = document.getElementById("log-search-input").value;
    redrawLogContainer();
}

// Clear screen logs
function clearConsoleLogs() {
    logDatabase.all = [];
    logDatabase.ssh = [];
    logDatabase.backend = [];
    logDatabase.frontend = [];
    logDatabase.live = [];
    updateTabCounts({ all: 0, ssh: 0, backend: 0, frontend: 0, live: 0 });
    redrawLogContainer();
}

// Export raw log buffer files
function downloadSessionLogs() {
    const activeLogs = logDatabase[currentTab];
    if (activeLogs.length === 0) {
        alert("The console log screen is currently empty.");
        return;
    }
    
    let plainText = `DIGIFORT LABS DEV CENTER LOGS - ${currentTab.toUpperCase()} - EXPORTED AT ${new Date().toISOString()}\n`;
    plainText += "=========================================================================\n\n";
    
    activeLogs.forEach(entry => {
        // Strip ANSI escape codes for local txt export file clarity
        const cleanLine = entry.line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
        plainText += `[${entry.timestamp}] [${entry.service.toUpperCase()}] ${cleanLine}`;
    });
    
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `digifort_logs_${currentTab}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Clipboard LAN URL copier
function copyLanUrl() {
    if (!lastStatusResponse || !lastStatusResponse.local_ip) return;
    const url = `http://${lastStatusResponse.local_ip}:8050`;
    
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector(".copy-btn-small");
        const oldHTML = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
            btn.innerHTML = oldHTML;
        }, 1500);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
    });
}
