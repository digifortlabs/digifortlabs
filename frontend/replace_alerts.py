import os
import re

dir_path = r'd:\Website\DIGIFORTLABS\frontend\src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'alert(' not in content:
        return

    needs_import = False
    
    def replacer(match):
        nonlocal needs_import
        needs_import = True
        msg = match.group(1)
        if 'success' in msg.lower():
            return f'toast.success({msg})'
        else:
            return f'toast.error({msg})'

    new_content = re.sub(r'alert\((.*?)\)', replacer, content, flags=re.DOTALL)
    
    if needs_import and 'react-hot-toast' not in new_content:
        lines = new_content.split('\n')
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                insert_idx = i + 1
        lines.insert(insert_idx, "import toast from 'react-hot-toast';")
        new_content = '\n'.join(lines)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            process_file(os.path.join(root, file))
print('Done replacing alerts!')
