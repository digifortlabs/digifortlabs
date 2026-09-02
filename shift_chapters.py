import os
import re

doc_dir = r'd:\Website\DIGIFORTLABS\document'

# 1. Rename chapter_11.md to chapter_temp.md to avoid collision
if os.path.exists(os.path.join(doc_dir, 'chapter_11.md')):
    os.rename(os.path.join(doc_dir, 'chapter_11.md'), os.path.join(doc_dir, 'chapter_temp.md'))

# 2. Shift 2-10 to 3-11
for i in range(10, 1, -1):
    old_file = os.path.join(doc_dir, f'chapter_{i}.md')
    new_file = os.path.join(doc_dir, f'chapter_{i+1}.md')
    if os.path.exists(old_file):
        os.rename(old_file, new_file)

# 3. Rename chapter_temp.md to chapter_2.md
if os.path.exists(os.path.join(doc_dir, 'chapter_temp.md')):
    os.rename(os.path.join(doc_dir, 'chapter_temp.md'), os.path.join(doc_dir, 'chapter_2.md'))

# 4. Update the text inside chapters 2 to 11
for i in range(2, 12):
    filepath = os.path.join(doc_dir, f'chapter_{i}.md')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We know chapter 2 used to be 11, and chapters 3-11 used to be 2-10
        # Let's replace the chapter number strings cautiously.
        
        if i == 2:
            old_num = 11
        else:
            old_num = i - 1
            
        # Update main heading
        content = re.sub(rf'# Chapter {old_num}:', f'# Chapter {i}:', content)
        # Update sub headings (e.g. ## 2.1 -> ## 3.1)
        content = re.sub(rf'## {old_num}\.', f'## {i}.', content)
        content = re.sub(rf'### {old_num}\.', f'### {i}.', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 5. Update index.md
index_path = os.path.join(doc_dir, 'index.md')
if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        idx_content = f.read()
    
    new_toc = '''<ol>
<li><strong><a href="#chapter-1">Chapter 1: Executive Summary & Patient Management</a></strong></li>
<li><strong><a href="#chapter-2">Chapter 2: Super Admin & SaaS Tenant Management</a></strong></li>
<li><strong><a href="#chapter-3">Chapter 3: Inpatient (IPD) Operations</a></strong></li>
<li><strong><a href="#chapter-4">Chapter 4: Pharmacy, Inventory & Supply Chain</a></strong></li>
<li><strong><a href="#chapter-5">Chapter 5: Financial Accounting, Billing & TPA</a></strong></li>
<li><strong><a href="#chapter-6">Chapter 6: Laboratory & Diagnostics (LIS/RIS)</a></strong></li>
<li><strong><a href="#chapter-7">Chapter 7: SURGERY AND OPERATION THEATRE</a></strong></li>
<li><strong><a href="#chapter-8">Chapter 8: Medical Records Department (MRD) & Telemedicine</a></strong></li>
<li><strong><a href="#chapter-9">Chapter 9: Analytics, Reports & Business Intelligence</a></strong></li>
<li><strong><a href="#chapter-10">Chapter 10: Configuration & Master Data Management</a></strong></li>
<li><strong><a href="#chapter-11">Chapter 11: Human Resources, Staff Management & Onboarding</a></strong></li>
</ol>'''

    idx_content = re.sub(r'<ol>.*?</ol>', new_toc, idx_content, flags=re.DOTALL)
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(idx_content)
    print('Updated all chapters and index.md!')
