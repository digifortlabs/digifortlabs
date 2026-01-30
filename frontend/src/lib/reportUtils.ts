/**
 * Report Generation Utilities
 * Provides CSV and PDF export capabilities for dashboard data
 */
import { formatDate, formatDateTime } from './dateFormatter';

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: any[], headers?: string[]): string {
    if (!data || data.length === 0) return '';

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(data[0]);

    // Create header row
    const headerRow = csvHeaders.join(',');

    // Create data rows
    const dataRows = data.map(row => {
        return csvHeaders.map(header => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    }).join('\n');

    return `${headerRow}\n${dataRows}`;
}

/**
 * Download CSV file
 */
export function downloadCSV(filename: string, csvContent: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export dashboard metrics to CSV
 */
export function exportDashboardMetrics(stats: any, hospitalName?: string): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = hospitalName
        ? `${hospitalName.replace(/\s+/g, '_')}_Dashboard_${timestamp}.csv`
        : `Platform_Dashboard_${timestamp}.csv`;

    const metrics = [
        { Metric: 'Total Patients', Value: stats?.patients?.total || 0, Trend: stats?.patients?.trend || 'N/A' },
        { Metric: 'Total Users', Value: stats?.users?.total || 0, Trend: stats?.users?.trend || 'N/A' },
        { Metric: 'Active Users', Value: stats?.users?.active || 0, Trend: 'N/A' },
        { Metric: 'Storage Usage', Value: stats?.storage?.usage || '0 GB', Trend: stats?.storage?.trend || 'N/A' },
        { Metric: 'File Requests', Value: stats?.requests?.total || 0, Trend: stats?.requests?.trend || 'N/A' },
        { Metric: 'Pending Requests', Value: stats?.requests?.pending || 0, Trend: 'N/A' },
        { Metric: 'QA Issues', Value: stats?.qa_issues?.length || 0, Trend: 'N/A' },
    ];

    // Add billing metrics if available
    if (stats?.billing) {
        metrics.push(
            { Metric: 'Subscription Tier', Value: stats.billing.subscription_tier, Trend: 'N/A' },
            { Metric: 'Price Per File', Value: `${stats.billing.currency}${stats.billing.price_per_file}`, Trend: 'N/A' },
            { Metric: 'Total Files', Value: stats.billing.files_count || 0, Trend: 'N/A' },
            { Metric: 'Estimated Cost', Value: `${stats.billing.currency}${stats.billing.total_estimated_cost || 0}`, Trend: 'N/A' }
        );
    }

    const csv = arrayToCSV(metrics);
    downloadCSV(filename, csv);
}

/**
 * Export patient list to CSV
 */
export function exportPatientList(patients: any[]): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Patient_List_${timestamp}.csv`;

    const patientData = patients.map(p => ({
        'Patient ID': p.patient_u_id || p.uhid || 'N/A',
        'Name': p.name || 'N/A',
        'Age': p.age || 'N/A',
        'Gender': p.gender || 'N/A',
        'Contact': p.contact_number || 'N/A',
        'Status': p.status || 'Active',
        'Created Date': formatDate(p.created_at)
    }));

    const csv = arrayToCSV(patientData);
    downloadCSV(filename, csv);
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogs(logs: any[]): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Audit_Logs_${timestamp}.csv`;

    const auditData = logs.map(log => ({
        'Timestamp': log.timestamp || log.time || 'N/A',
        'Action': log.action || 'N/A',
        'User': log.user_email || log.user || 'System',
        'Details': log.details || log.description || 'N/A',
        'IP Address': log.ip_address || 'N/A'
    }));

    const csv = arrayToCSV(auditData);
    downloadCSV(filename, csv);
}

/**
 * Generate printable PDF report using browser print
 * Creates a formatted HTML document and triggers print dialog
 */
export function generatePDFReport(stats: any, hospitalName?: string): void {
    const timestamp = formatDateTime(new Date());
    const reportTitle = hospitalName
        ? `${hospitalName} - Dashboard Report`
        : 'Platform Dashboard Report';

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to generate PDF reports');
        return;
    }

    // Build HTML content
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportTitle}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 40px;
                    color: #1e293b;
                }
                h1 {
                    color: #4f46e5;
                    border-bottom: 3px solid #4f46e5;
                    padding-bottom: 10px;
                    margin-bottom: 30px;
                }
                .meta {
                    color: #64748b;
                    font-size: 14px;
                    margin-bottom: 30px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th {
                    background-color: #f1f5f9;
                    padding: 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #cbd5e1;
                }
                td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                tr:hover {
                    background-color: #f8fafc;
                }
                .section-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-top: 30px;
                    margin-bottom: 15px;
                    color: #334155;
                }
                @media print {
                    body { padding: 20px; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>${reportTitle}</h1>
            <div class="meta">Generated on: ${timestamp}</div>
            
            <div class="section-title">Key Metrics</div>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                        <th>Trend</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Total Patients</td><td>${stats?.patients?.total || 0}</td><td>${stats?.patients?.trend || 'N/A'}</td></tr>
                    <tr><td>Total Users</td><td>${stats?.users?.total || 0}</td><td>${stats?.users?.trend || 'N/A'}</td></tr>
                    <tr><td>Active Users</td><td>${stats?.users?.active || 0}</td><td>N/A</td></tr>
                    <tr><td>Storage Usage</td><td>${stats?.storage?.usage || '0 GB'}</td><td>${stats?.storage?.trend || 'N/A'}</td></tr>
                    <tr><td>File Requests</td><td>${stats?.requests?.total || 0}</td><td>${stats?.requests?.trend || 'N/A'}</td></tr>
                    <tr><td>Pending Requests</td><td>${stats?.requests?.pending || 0}</td><td>N/A</td></tr>
                    <tr><td>QA Issues</td><td>${stats?.qa_issues?.length || 0}</td><td>N/A</td></tr>
                </tbody>
            </table>
            
            ${stats?.billing ? `
                <div class="section-title">Billing Information</div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Subscription Tier</td><td>${stats.billing.subscription_tier}</td></tr>
                        <tr><td>Price Per File</td><td>${stats.billing.currency}${stats.billing.price_per_file}</td></tr>
                        <tr><td>Total Files</td><td>${stats.billing.files_count || 0}</td></tr>
                        <tr><td>Estimated Cost</td><td><strong>${stats.billing.currency}${stats.billing.total_estimated_cost?.toLocaleString() || 0}</strong></td></tr>
                    </tbody>
                </table>
            ` : ''}
            
            ${stats?.recent_activity?.length > 0 ? `
                <div class="section-title">Recent Activity</div>
                <table>
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Details</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.recent_activity.slice(0, 10).map((log: any) => `
                            <tr>
                                <td>${log.action || 'N/A'}</td>
                                <td>${log.details || 'N/A'}</td>
                                <td>${log.time || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : ''}
            
            <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
                <p>This is an automated report generated by DIGIFORT LABS Dashboard System.</p>
                <p>For questions or support, please contact your system administrator.</p>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Trigger print dialog after content loads
    printWindow.onload = () => {
        printWindow.print();
    };
}
