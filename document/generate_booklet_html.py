import os
import markdown
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

doc_dir = os.path.dirname(os.path.abspath(__file__))
booklet_md = os.path.join(doc_dir, 'marketing_booklet.md')
html_output = os.path.join(doc_dir, 'DigifortLabs_Marketing_Booklet.html')

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DigifortLabs HMS - Enterprise Marketing & Onboarding Booklet</title>
    
    <!-- Premium Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            --card-bg: #ffffff;
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --accent: #0ea5e9;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.7; 
            color: var(--text-main); 
            background: #f8fafc;
            margin: 0;
            padding: 40px 20px;
            scroll-behavior: smooth;
        }

        .container { 
            background: var(--card-bg); 
            padding: 60px 80px; 
            border-radius: 20px; 
            box-shadow: var(--shadow); 
            max-width: 1050px; 
            margin: 0 auto; 
            border: 1px solid var(--border-color);
        }

        h1, h2, h3, h4 { 
            font-family: 'Outfit', sans-serif; 
            color: var(--text-main); 
        }

        h1 { 
            font-size: 2.6em; 
            font-weight: 800;
            color: var(--primary);
            margin-top: 1em;
            margin-bottom: 0.5em;
        }

        h2 { 
            font-size: 1.8em; 
            color: #0f172a;
            position: relative;
            padding-left: 18px;
            margin-top: 2em;
            border-left: 5px solid var(--primary);
        }

        h3 { 
            color: var(--primary-hover); 
            font-size: 1.3em;
            margin-top: 1.5em;
        }

        a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }
        
        a:hover {
            color: var(--primary-hover);
            text-decoration: underline;
        }

        /* Lists & Bullet Points */
        ul, ol {
            padding-left: 24px;
        }

        li {
            margin-bottom: 10px;
            font-size: 1.05em;
        }

        /* Modern Tables */
        table { 
            border-collapse: separate; 
            border-spacing: 0;
            width: 100%; 
            margin: 30px 0;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
        }
        
        th, td { 
            padding: 16px 22px; 
            text-align: left; 
            border-bottom: 1px solid var(--border-color);
        }
        
        th { 
            background-color: #f1f5f9; 
            font-weight: 700; 
            color: #0f172a;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.05em;
        }
        
        tr:hover td {
            background-color: #f8fafc;
        }

        /* Mermaid Diagrams */
        .mermaid { 
            text-align: center; 
            margin: 40px 0; 
            background: #ffffff;
            padding: 24px;
            border-radius: 14px;
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
        }

        /* Action Cards & Step Numbers */
        blockquote {
            background: #eff6ff;
            border-left: 5px solid var(--primary);
            padding: 20px 25px;
            margin: 30px 0;
            border-radius: 0 12px 12px 0;
            color: #1e3a8a;
            font-size: 1.05em;
        }

        /* Print Styles for A4 Output */
        @media print {
            @page {
                size: A4 portrait;
                margin: 15mm;
            }
            
            body {
                background: white !important;
                color: #000 !important;
                padding: 0 !important;
            }

            .container {
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                max-width: 100% !important;
                padding: 0 !important;
            }

            .page-break {
                break-before: page !important;
                page-break-before: always !important;
            }
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

if os.path.exists(booklet_md):
    with open(booklet_md, 'r', encoding='utf-8') as f:
        md_text = f.read()

    try:
        html_content = markdown.markdown(md_text, extensions=['tables', 'fenced_code'])
    except Exception as e:
        print(f"Error parsing markdown: {e}")
        sys.exit(1)

    def fix_mermaid(match):
        code = match.group(1)
        code = code.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&').replace('\r', '').strip()
        return f'<div class="mermaid">\n{code}\n</div>'

    html_content = re.sub(r'<pre><code class="language-mermaid">(.*?)</code></pre>', fix_mermaid, html_content, flags=re.DOTALL)
    final_html = html_template.replace('{content}', html_content)

    with open(html_output, 'w', encoding='utf-8') as f:
        f.write(final_html)

    print(f"Created Marketing & Onboarding Booklet HTML successfully at {html_output}")
else:
    print(f"File not found: {booklet_md}")
