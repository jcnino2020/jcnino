import os
import glob
import re

def update_ui(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Containers
    content = re.sub(r'space-y-6', 'space-y-8', content)
    # 2. Main Headers
    content = re.sub(r'text-xl font-bold text-gray-900', 'text-2xl font-black text-gray-900 tracking-tight', content)
    content = re.sub(r'text-lg font-bold text-gray-900(.*?id="modal-title")', r'text-2xl font-black text-gray-900 tracking-tight\1', content)
    # 3. Subheaders
    content = re.sub(r'mt-0\.5', 'mt-1', content)
    # 4. Success alerts
    content = re.sub(r'p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold rounded flex items-center gap-2', 
                     'p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold rounded shadow-sm flex items-center gap-3', content)
    content = re.sub(r'<span class="material-symbols-outlined text-base">check_circle</span>([^\n]*)', 
                     r'<span class="material-symbols-outlined">check_circle</span> \1', content)
    # 5. Error alerts
    content = re.sub(r'p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded flex items-center gap-2', 
                     'p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded shadow-sm flex items-center gap-3', content)
    content = re.sub(r'<span class="material-symbols-outlined text-base">error</span>([^\n]*)', 
                     r'<span class="material-symbols-outlined">error</span> \1', content)
    
    # 6. Inputs & Selects
    # Often standard inputs are: pl-3 pr-3 py-2 bg-gray-50 border border-gray-100 rounded text-sm focus:ring-blue-500 outline-none w-72 font-medium
    # Or in forms: mt-1.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm
    content = re.sub(r'mt-1\.5 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-(blue|amber|red)-500 outline-none font-medium text-sm', 
                     r'w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-\1-500 outline-none font-bold', content)
    
    # Update regular search inputs
    content = re.sub(r'pl-3 pr-3 py-2 bg-gray-50 border border-gray-100 rounded text-sm focus:ring-blue-500 outline-none w-72 font-medium', 
                     'px-5 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-72 font-bold', content)
    content = re.sub(r'py-2 px-3 bg-gray-50 border border-gray-100 rounded text-sm focus:ring-blue-500 outline-none font-medium', 
                     'px-5 py-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold', content)

    # 7. Labels
    content = re.sub(r'text-\[11px\] font-black text-gray-500 uppercase tracking-widest', 
                     'text-[12px] font-black text-gray-500 uppercase tracking-widest', content)
    
    # 8. Submit Buttons
    # In users.php: px-6 py-2.5 bg-blue-600 text-white font-black text-sm rounded-lg hover:bg-blue-700 shadow
    content = re.sub(r'px-6 py-2\.5 bg-(blue|amber)-([0-9]{3}) text-white font-black text-sm rounded-lg hover:bg-\1-([0-9]{3}) shadow', 
                     r'px-8 py-4 bg-\1-\2 text-white font-black text-sm rounded-lg hover:bg-\1-\3 shadow-lg', content)
    
    # Header buttons: px-4 py-2 bg-blue-600 text-white text-base font-bold rounded shadow-lg transition-all
    content = re.sub(r'px-4 py-2 bg-blue-600 text-white text-base font-bold rounded shadow-lg transition-all', 
                     r'px-6 py-3 bg-blue-600 text-white text-sm font-black rounded-lg shadow-lg hover:bg-blue-700 transition-all', content)
                     
    # Dashboard stat cards:
    # We leave dashboard stat cards if they are somewhat okay, but we could make font larger
    
    with open(filepath, 'w') as f:
        f.write(content)

for filepath in glob.glob('*.php'):
    if filepath != 'settings.php':
        update_ui(filepath)
