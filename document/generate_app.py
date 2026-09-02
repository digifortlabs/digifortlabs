import os
import markdown
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

doc_dir = os.path.dirname(os.path.abspath(__file__))
html_output = os.path.join(doc_dir, 'digifortlabs_doc_app.html')

chapters = [
    'index.md',
    'chapter_1.md',
    'chapter_2.md',
    'chapter_3.md',
    'chapter_4.md',
    'chapter_5.md',
    'chapter_6.md',
    'chapter_7.md',
    'chapter_8.md',
    'chapter_9.md',
    'chapter_10.md',
    'chapter_11.md',
    'chapter_12.md',
    'chapter_13.md',
    'chapter_14.md',
    'chapter_15.md',
    'chapter_16.md',
    'chapter_17.md',
    'chapter_18.md',
    'chapter_19.md',
    'chapter_20.md',
    'chapter_21.md',
    'chapter_22.md',
    'chapter_23.md',
    'chapter_24.md',
    'chapter_25.md',
    'chapter_26.md'
]

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DigifortLabs HMS Web App</title>
    
    <!-- Premium Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --sidebar-width: 320px;
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --accent: #0ea5e9;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
        }

        * {
            box-sizing: border-box;
        }

        body { 
            font-family: 'Inter', sans-serif; 
            color: var(--text-main); 
            background: #f8fafc;
            margin: 0;
            padding: 0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        /* Sidebar Styling */
        .sidebar {
            width: var(--sidebar-width);
            background: #ffffff;
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            z-index: 10;
        }

        .sidebar-header {
            padding: 24px 20px 16px;
            border-bottom: 1px solid var(--border-color);
        }

        .sidebar-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.25em;
            font-weight: 700;
            color: var(--primary);
            margin: 0 0 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .search-box {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            font-size: 0.9em;
            outline: none;
            transition: all 0.2s ease;
            background: #f1f5f9;
        }

        .search-box:focus {
            background: #ffffff;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .nav-list {
            list-style: none;
            padding: 12px;
            margin: 0;
            overflow-y: auto;
            flex-grow: 1;
        }

        .nav-item {
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 0.9em;
            font-weight: 500;
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .nav-item:hover {
            background: #f1f5f9;
            color: var(--text-main);
        }

        .nav-item.active {
            background: #eff6ff;
            color: var(--primary);
            font-weight: 600;
        }

        /* Main Content Container */
        .main-content {
            flex-grow: 1;
            overflow-y: auto;
            padding: 40px 60px;
            scroll-behavior: smooth;
        }

        .content-card {
            background: #ffffff;
            padding: 50px 60px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow);
            max-width: 960px;
            margin: 0 auto 40px;
        }

        .section-view {
            display: none;
        }

        .section-view.active {
            display: block;
        }

        h1, h2, h3, h4 { 
            font-family: 'Outfit', sans-serif; 
            color: var(--text-main); 
            margin-top: 2em;
        }

        h1 { 
            font-size: 2.2em; 
            font-weight: 700;
            border-bottom: 3px solid var(--primary); 
            padding-bottom: 12px; 
            margin-top: 0.5em;
            color: var(--primary);
        }

        h2 { 
            font-size: 1.6em; 
            color: var(--text-main);
            position: relative;
            padding-left: 16px;
            border-left: 4px solid var(--accent);
        }

        h3 { color: var(--text-muted); font-size: 1.2em; }

        a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }
        
        a:hover {
            text-decoration: underline;
        }

        /* Modern Tables */
        table { 
            border-collapse: separate; 
            border-spacing: 0;
            width: 100%; 
            margin: 24px 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--border-color);
        }
        
        th, td { 
            padding: 14px 18px; 
            text-align: left; 
            border-bottom: 1px solid var(--border-color);
            font-size: 0.95em;
        }
        
        th { 
            background-color: #f8fafc; 
            font-weight: 600; 
            color: var(--text-main);
            text-transform: uppercase;
            font-size: 0.8em;
            letter-spacing: 0.05em;
        }
        
        tr:hover td {
            background-color: #f8fafc;
        }
        
        tr:last-child td {
            border-bottom: none;
        }

        /* Code Blocks & Mermaid */
        pre { 
            background-color: #0f172a; 
            color: #f8fafc;
            padding: 18px; 
            border-radius: 10px; 
            overflow-x: auto; 
            font-family: 'Consolas', monospace;
            font-size: 0.9em;
        }
        
        code { 
            font-family: 'Consolas', monospace; 
            background-color: #f1f5f9; 
            color: #ef4444;
            padding: 3px 6px; 
            border-radius: 4px; 
            font-size: 0.88em;
        }
        
        pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
        }

        .mermaid { 
            text-align: center; 
            margin: 30px 0; 
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        @media (max-width: 900px) {
            body { flex-direction: column; overflow: auto; }
            .sidebar { width: 100%; height: auto; }
            .main-content { padding: 20px; }
            .content-card { padding: 25px; }
        }
    </style>
    
    <!-- Include Mermaid JS -->
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        mermaid.initialize({ 
            startOnLoad: true, 
            theme: 'base',
            themeVariables: {
                primaryColor: '#e0f2fe',
                primaryTextColor: '#0f172a',
                primaryBorderColor: '#38bdf8',
                lineColor: '#64748b',
                secondaryColor: '#f1f5f9',
                tertiaryColor: '#fff'
            }
        });
    </script>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-title">
                🏥 Digifort HMS
            </div>
            <input type="text" id="search-box" class="search-box" placeholder="Search chapters...">
        </div>
        <ul class="nav-list" id="nav-list">
            {nav_items}
        </ul>
    </div>
    
    <div class="main-content">
        <div class="content-card">
            {sections}
        </div>
    </div>

    <script>
        // Tab Navigation
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section-view');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetId = item.getAttribute('data-target');

                navItems.forEach(n => n.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                item.classList.add('active');
                document.getElementById(targetId).classList.add('active');
                
                // Scroll top on main container
                document.querySelector('.main-content').scrollTop = 0;
            });
        });

        // Search Filter
        const searchInput = document.getElementById('search-box');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            navItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>
"""

nav_list_html = []
sections_html = []

for i, chapter in enumerate(chapters):
    filepath = os.path.join(doc_dir, chapter)
    sec_id = f"sec-{i}"
    
    # Read title for nav
    short_title = chapter
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            first_line = content.split('\n')[0].strip()
            if first_line.startswith('#'):
                short_title = first_line.replace('#', '').strip()
                if 'Chapter' in short_title and ':' in short_title:
                    parts = short_title.split(':', 1)
                    short_title = f"{parts[0].strip()}: {parts[1].strip()[:25]}..."
    
    is_active = ' active' if i == 0 else ''
    nav_list_html.append(f'<li class="nav-item{is_active}" data-target="{sec_id}">{short_title}</li>')
    
    # Convert chapter markdown
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            md_text = f.read()
            try:
                html_body = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
                
                # Fix mermaid tags
                def fix_mermaid(match):
                    code = match.group(1)
                    code = code.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('\r', '').strip()
                    return f'<div class="mermaid">\n{code}\n</div>'

                html_body = re.sub(r'<pre><code class="language-mermaid">(.*?)</code></pre>', fix_mermaid, html_body, flags=re.DOTALL)
                
                sections_html.append(f'<div class="section-view{is_active}" id="{sec_id}">\n{html_body}\n</div>')
            except Exception as e:
                print(f"Error parsing {chapter}: {e}")

final_nav = '\n            '.join(nav_list_html)
final_sections = '\n\n'.join(sections_html)

final_html = html_template.replace('{nav_items}', final_nav).replace('{sections}', final_sections)

with open(html_output, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Created standalone web app HTML successfully at {html_output}")
