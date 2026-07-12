import os
import markdown
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

doc_dir = os.path.dirname(os.path.abspath(__file__))
# Note: we are writing to DigifortLabs_Documentation.html as requested
html_output = os.path.join(doc_dir, 'DigifortLabs_Documentation.html')

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
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DigifortLabs HMS Specification</title>
    
    <!-- Premium Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
            --card-bg: rgba(255, 255, 255, 0.95);
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --accent: #0ea5e9;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
        }

        body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.7; 
            color: var(--text-main); 
            background: var(--bg-gradient);
            margin: 0;
            padding: 40px 20px;
            scroll-behavior: smooth;
        }

        .container { 
            background: var(--card-bg); 
            padding: 60px 80px; 
            border-radius: 16px; 
            box-shadow: var(--shadow); 
            max-width: 1000px; 
            margin: 0 auto; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.4);
        }

        h1, h2, h3, h4 { 
            font-family: 'Outfit', sans-serif; 
            color: var(--text-main); 
            margin-top: 2.5em;
        }

        h1 { 
            font-size: 2.5em; 
            font-weight: 700;
            border-bottom: 3px solid var(--primary); 
            padding-bottom: 15px; 
            margin-top: 1.5em;
            display: inline-block;
        }

        h2 { 
            font-size: 1.75em; 
            color: var(--primary);
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
            color: var(--primary);
            text-decoration: none;
            transition: color 0.2s ease;
            font-weight: 500;
        }
        
        a:hover {
            color: var(--primary-hover);
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
        
        tr {
            transition: background-color 0.2s ease;
        }

        tr:hover td {
            background-color: #f1f5f9;
        }
        
        tr:last-child td {
            border-bottom: none;
        }

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
        
        pre code {
            background-color: transparent;
            color: inherit;
            padding: 0;
        }

        /* Mermaid styling */
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

        .page-break { margin: 60px 0; border-top: 2px dashed var(--border-color); }
        
        /* Interactive TOC */
        ol {
            padding-left: 20px;
        }
        ol li {
            margin-bottom: 12px;
            font-size: 1.1em;
        }
        ol li a {
            display: inline-block;
            padding: 5px 0;
            position: relative;
        }
        ol li a::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            bottom: 0;
            left: 0;
            background-color: var(--accent);
            transform: scaleX(0);
            transform-origin: bottom right;
            transition: transform 0.3s ease-out;
        }
        ol li a:hover::after {
            transform: scaleX(1);
            transform-origin: bottom left;
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
    <div class="container">
        {content}
    </div>
</body>
</html>
"""

full_md_text = ""
for i, chapter in enumerate(chapters):
    filepath = os.path.join(doc_dir, chapter)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            if i > 0:
                full_md_text += "\n\n<div class=\"page-break\"></div>\n\n"
            full_md_text += f'<a id="chapter-{i}"></a>\n\n'
            full_md_text += f.read()

# Convert Markdown to HTML
try:
    html_content = markdown.markdown(full_md_text, extensions=['tables', 'fenced_code'])
except Exception as e:
    print(f"Make sure 'markdown' package is installed: pip install markdown")
    raise e

def fix_mermaid(match):
    code = match.group(1)
    # unescape html entities in the code that python-markdown added
    code = code.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('\r', '')
    # Important: strip leading/trailing whitespace which can break mermaid
    code = code.strip()
    return f'<div class="mermaid">\n{code}\n</div>'

html_content = re.sub(r'<pre><code class="language-mermaid">(.*?)</code></pre>', fix_mermaid, html_content, flags=re.DOTALL)

final_html = html_template.replace('{content}', html_content)

with open(html_output, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Created redesigned HTML document successfully at {html_output}")
