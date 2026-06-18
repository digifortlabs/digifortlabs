import re

with open('leaflet.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_cards = '<!-- Interactive Consultation Cards (Span 7) - Matches the three circular doctor crops perfectly -->'
end_cards = '<!-- Dark Dashboard Screen in Desktop Monitor Stand (Span 12) - Matches Crop 2 -->'

idx1 = content.find(start_cards)
idx2 = content.find(end_cards)

new_cards = """<!-- Interactive Consultation Cards (Now Hospital Modules Grid) -->
                <div class="col-span-12 flex flex-wrap justify-center gap-x-5 gap-y-4 bg-slate-50/80 rounded-2xl p-4 border border-slate-200 shadow-sm mx-auto w-full max-w-4xl relative z-10">
                    
                    <!-- HMS -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-hospital fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">HMS</span>
                    </div>
                    
                    <!-- OPD -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center border border-teal-200 text-teal-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-stethoscope fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">OPD</span>
                    </div>

                    <!-- IPD -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-bed-pulse fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">IPD</span>
                    </div>

                    <!-- OT -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center border border-rose-200 text-rose-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-scalpel fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">OT</span>
                    </div>

                    <!-- Emergency -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center border border-red-200 text-red-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-truck-medical fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">ER</span>
                    </div>

                    <!-- Dental -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center border border-sky-200 text-sky-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-tooth fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">Dental</span>
                    </div>

                    <!-- ENT -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center border border-purple-200 text-purple-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-ear-listen fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">ENT</span>
                    </div>

                    <!-- MRD -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center border border-amber-200 text-amber-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-file-medical fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">MRD</span>
                    </div>

                    <!-- Pharma -->
                    <div class="flex flex-col items-center gap-1.5 w-[60px]">
                        <div class="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-600 shadow-sm transform hover:-translate-y-1 transition-transform">
                            <i class="fa-solid fa-pills fa-lg"></i>
                        </div>
                        <span class="text-[10px] font-black text-clinicalDark uppercase tracking-wide">Pharma</span>
                    </div>

                </div>

                """

if idx1 != -1 and idx2 != -1:
    content = content[:idx1] + new_cards + content[idx2:]

# 2. Extract the Dashboard and move it to the bottom
dash_start = content.find(end_cards)
monitor_base = '<div class="w-20 h-1 bg-slate-850 rounded-full shadow-md"></div>'
dash_end = content.find(monitor_base, dash_start) + len(monitor_base)
dash_end = content.find('</div>', dash_end) + 6 # close col-span-5

if dash_start != -1 and dash_end != -1:
    dashboard_html = content[dash_start:dash_end]
    content = content[:dash_start] + content[dash_end:]
    
    # Change dashboard classes
    dashboard_html = dashboard_html.replace('col-span-5 flex flex-col items-center mt-2', 'col-span-12 flex flex-col items-center')
    
    # Add NMC Badge
    dashboard_html = dashboard_html.replace(
        '<span class="w-1 h-1 rounded-full bg-teal-400 animate-pulse"></span> active sync',
        '<span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span> NMC COMPLIANT & NABH READY'
    )
    
    # Insert before footer
    footer_idx = content.find('<!-- 6. Call To Action Footer Zone -->')
    bottom_section = """
            <!-- Bottom Section: Sleek Desktop Monitor showing complete dark dashboard preview -->
            <div class="grid grid-cols-12 gap-3 items-end relative z-10 mt-6">
    """ + dashboard_html + """
            </div>
    """
    content = content[:footer_idx] + bottom_section + '\n            ' + content[footer_idx:]

with open('leaflet.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done updating layout')
