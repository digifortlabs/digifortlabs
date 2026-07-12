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
    'chapter_10.md'
]

html_template = """
<!DOCTYPE html>
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
            --sidebar-width: 280px;
            --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
            --card-bg: rgba(255, 255, 255, 0.95);
            --primary: #1e293b;
            --primary-hover: #334155;
            --accent: #0ea5e9;
            --accent-hover: #0284c7;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
        }
        body {
            margin: 0;
            font-family: 'Inter', sans-serif;
            display: flex;
            height: 100vh;
            background: var(--bg-gradient);
            color: var(--text-main);
            overflow: hidden;
            line-height: 1.7;
        }
        
        /* Sidebar Styling */
        .sidebar {
            width: var(--sidebar-width);
            background-color: var(--primary);
            color: white;
            padding: 30px 0;
            overflow-y: auto;
            box-shadow: 4px 0 15px rgba(0,0,0,0.1);
            flex-shrink: 0;
            z-index: 10;
        }
        .sidebar h2 {
            font-family: 'Outfit', sans-serif;
            text-align: center;
            margin-bottom: 40px;
            font-size: 1.8em;
            padding: 0 20px;
            letter-spacing: 0.05em;
            color: #f8fafc;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 20px;
        }
        .nav-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .nav-item {
            padding: 15px 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
            font-size: 14px;
            font-weight: 500;
            color: #cbd5e1;
        }
        .nav-item:hover {
            background-color: rgba(255,255,255,0.05);
            color: white;
            border-left-color: rgba(14, 165, 233, 0.5);
        }
        .nav-item.active {
            background-color: var(--primary-hover);
            border-left-color: var(--accent);
            color: white;
            font-weight: 600;
        }
        
        /* Main Content Styling */
        .main-content {
            flex: 1;
            padding: 40px;
            overflow-y: auto;
            scroll-behavior: smooth;
        }
        .page-content {
            background: var(--card-bg);
            padding: 60px 80px;
            border-radius: 16px;
            box-shadow: var(--shadow);
            max-width: 900px;
            margin: 0 auto;
            min-height: 80vh;
            display: none;
            animation: fadeIn 0.4s ease-out;
            border: 1px solid rgba(255,255,255,0.4);
            backdrop-filter: blur(10px);
        }
        .page-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Typography & Elements */
        h1, h2, h3, h4 { 
            font-family: 'Outfit', sans-serif; 
            color: var(--text-main); 
            margin-top: 2.5em;
        }
        h1 { 
            font-size: 2.5em; 
            font-weight: 700;
            border-bottom: 3px solid var(--accent); 
            padding-bottom: 15px; 
            margin-top: 0;
            display: inline-block;
        }
        h2 { 
            font-size: 1.75em; 
            color: var(--accent-hover);
            position: relative;
            padding-left: 20px;
        }
        h2::before {
            content: '';
            position: absolute;
            left: 0;
            top: 5px;
            bottom: 5px;
            width: 5px;
            background: var(--accent);
            border-radius: 4px;
        }
        h3 { color: var(--text-muted); font-size: 1.25em; }

        a {
            color: var(--accent);
            text-decoration: none;
            transition: color 0.2s ease;
            font-weight: 500;
        }
        a:hover {
            color: var(--accent-hover);
            text-decoration: underline;
        }

        /* Modern Tables */
        table { 
            border-collapse: separate; 
            border-spacing: 0;
            width: 100%; 
            margin: 30px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        th, td { 
            padding: 16px 20px; 
            text-align: left; 
            border-bottom: 1px solid var(--border-color);
        }
        th { 
            background-color: #f8fafc; 
            font-weight: 600; 
            color: var(--text-main);
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.05em;
        }
        tr { transition: background-color 0.2s ease; }
        tr:hover td { background-color: #f1f5f9; }
        tr:last-child td { border-bottom: none; }

        /* Code Blocks & Mermaid */
        pre { 
            background-color: #0f172a; 
            color: #f8fafc;
            padding: 20px; 
            border-radius: 10px; 
            overflow-x: auto; 
            font-family: 'Consolas', monospace;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        code { 
            font-family: 'Consolas', monospace; 
            background-color: #f1f5f9; 
            color: #ef4444;
            padding: 4px 8px; 
            border-radius: 6px; 
            font-size: 0.9em;
        }
        pre code { background-color: transparent; color: inherit; padding: 0; }

        .mermaid { 
            text-align: center; 
            margin: 40px 0; 
            background: #ffffff; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--border-color);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .mermaid:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
    </style>
    <!-- Include Mermaid JS for diagrams -->
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
        window.mermaid = mermaid;
        mermaid.initialize({ 
            startOnLoad: false, 
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
        <h2>DigifortLabs</h2>
        <ul class="nav-list" id="navList">
            {nav_items}
        </ul>
    </div>

    <div class="main-content">
        {page_contents}
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const navItems = document.querySelectorAll('.nav-item');
            const pages = document.querySelectorAll('.page-content');

            const renderMermaid = async (pageId) => {
                if (window.mermaid) {
                    const page = document.getElementById(pageId);
                    const diagrams = page.querySelectorAll('.mermaid');
                    if (diagrams.length > 0) {
                        try {
                            // Ensure mermaid diagrams have not already been rendered
                            diagrams.forEach(d => {
                                if(d.getAttribute('data-processed') !== 'true') {
                                    d.removeAttribute('data-processed');
                                }
                            });
                            await window.mermaid.run({ nodes: diagrams });
                        } catch (err) {
                            console.warn('Mermaid rendering error:', err);
                        }
                    }
                }
            };

            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    navItems.forEach(nav => nav.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    
                    pages.forEach(page => page.classList.remove('active'));
                    
                    const targetId = e.currentTarget.getAttribute('data-target');
                    document.getElementById(targetId).classList.add('active');

                    renderMermaid(targetId);
                });
            });
            
            const activePage = document.querySelector('.page-content.active');
            if (activePage) {
                renderMermaid(activePage.id);
            }
        });
    </script>
</body>
</html>
"""

def fix_mermaid(match):
    code = match.group(1)
    code = code.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('\r', '')
    code = code.strip()
    return f'<div class="mermaid">\n{code}\n</div>'

nav_items_html = ""
page_contents_html = ""

for i, chapter in enumerate(chapters):
    filepath = os.path.join(doc_dir, chapter)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            md_text = f.read()
            
            title = f"Chapter {i}"
            if chapter == 'index.md':
                title = "Table of Contents"
            else:
                match = re.search(r'^#\s+(.+)$', md_text, flags=re.MULTILINE)
                if match:
                    title = match.group(1).replace('Chapter ', 'Ch ')
                    if len(title) > 30:
                        title = title[:27] + "..."
            
            active_class = "active" if i == 0 else ""
            nav_items_html += f'<li class="nav-item {active_class}" data-target="page-{i}">{title}</li>\n'
            
            html_content = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
            html_content = re.sub(r'<pre><code class="language-mermaid">(.*?)</code></pre>', fix_mermaid, html_content, flags=re.DOTALL)
            
            active_page_class = "active" if i == 0 else ""
            page_contents_html += f'<div id="page-{i}" class="page-content {active_page_class}">\n{html_content}\n</div>\n\n'

final_html = html_template.replace('{nav_items}', nav_items_html).replace('{page_contents}', page_contents_html)

with open(html_output, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Created SPA Application successfully at {html_output}")
