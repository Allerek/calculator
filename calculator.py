# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: 'tuning_kalkulator.py'
# Bytecode version: 3.14rc3 (3627)
# Source timestamp: 1970-01-01 00:00:00 UTC (0)

# ***<module>: Failure: Different bytecode
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import sys
import os
BG = '#121212'
FG = '#FFFFFF'
RED = '#C62828'
GOLD = '#FBC02D'
PANEL = '#1E1E1E'
VISUAL_PARTS = {'Spoiler': 400, 'Zderzak przód': 400, 'Zderzak tył': 400, 'Klatka': 400, 'Maska': 400, 'Dach': 400, 'Progi': 200, 'Błotnik lewy': 200, 'Błotnik prawy': 200, 'Wydech': 150, 'Grill': 150, 'Xenon': 150}
EXTRA_PARTS = {f'Element {i}': 100 for i in range(24, 46)}
FIXED_ITEMS = {'Lakier #1': 200, 'Lakier #2': 50, 'Lakier #3': 50, 'Lakier #4': 50, 'Lakier #5': 50, 'Szyby Stage 1': 200, 'Szyby Stage 2': 250, 'Szyby Stage 3': 300, 'Livery': 500, 'Felgi': 400, 'Felgi - Street / Lowrider': 600}
PERFORMANCE = {'Silnik': {0: (0, 0, 0), 1: (1000, 0.1, 0.05), 2: (1500, 0.14, 0.06), 3: (2000, 0.17, 0.08), 4: (3000, 0.2, 0.1)}, 'Hamulce': {0: (0, 0, 0), 1: (500, 0.06, 0.02), 2: (1500, 0.14, 0.06), 3: (2000, 0.17, 0.08)}, 'Zawieszenie': {0: (0, 0, 0), 1: (500, 0.06, 0.02), 2: (700, 0.1, 0.03), 3: (900, 0.13, 0.05), 4: (1100, 0.15, 0.06)}, 'Turbo': {0: (0, 0, 0), 1: (1000, 0.2, 0.1)}}
def visual_percent(price):
    if price <= 10000:
        return 0
    else:
        if price <= 30000:
            return 0.04
        else:
            return 0.02
def calculate(*args):
    try:
        price = int(price_entry.get())
    except:
        price = 0
    try:
        labor = float(labor_entry.get())
    except:
        labor = 0
    total = labor
    vp = visual_percent(price)
    invoice_text = f'DEUTSCHE STYLE STUDIO\nCena pojazdu: ${price:,.0f}\nRobocizna: ${labor:,.0f}\n\nWybrane części:\n'
    for name, var in visual_vars.items():
        if var.get():
            base = VISUAL_PARTS.get(name, EXTRA_PARTS.get(name))
            cost = base + price * vp
            total += cost
            invoice_text += f'  - {name}: ${cost:.0f}\n'
    for name, var in fixed_vars.items():
        if var.get():
            cost = FIXED_ITEMS[name]
            total += cost
            invoice_text += f'  - {name}: ${cost:.0f}\n'
    for part, var in perf_vars.items():
        stage = var.get()
        if stage is not None and stage >= 0:
                base, mid, high = PERFORMANCE[part][stage]
                cost = base if price <= 10000 else base + price * (mid if price <= 30000 else high)
                total += cost
                if stage > 0:
                    invoice_text += f'  - {part} Stage {stage}: ${cost:.0f}\n'
    invoice_text += f'\n====================\nŁącznie: ${total:,.0f}'
    cost_label.config(text=f'Koszt tuningu: ${total:,.0f}')
    invoice_box.config(state='normal')
    invoice_box.delete('1.0', tk.END)
    invoice_box.insert(tk.END, invoice_text)
    invoice_box.config(state='disabled')
root = tk.Tk()
root.title('Deutsche Style Studio – Kalkulator Tuningu')
root.geometry('1200x700')
root.configure(bg=BG)
style = ttk.Style()
style.theme_use('default')
style.configure('TFrame', background=PANEL)
style.configure('TLabel', background=PANEL, foreground=FG, font=('Segoe UI', 10))
style.configure('TCheckbutton', background=PANEL, foreground=FG)
style.configure('TCombobox', background=PANEL, foreground=FG)
style.configure('TEntry', background='#1E1E1E', foreground=FG)
style.configure('TButton', background=RED, foreground='white', font=('Segoe UI', 11, 'bold'))
def resource_path(relative_path):
    if getattr(sys, 'frozen', False):
        return os.path.join(sys._MEIPASS, relative_path)
    else:
        return relative_path
header = tk.Frame(root, bg=BG)
header.pack(fill='x', pady=10, padx=10)
img_path = resource_path('logo.png')
img = Image.open(img_path).resize((260, 80))
logo_img = ImageTk.PhotoImage(img)
tk.Label(header, image=logo_img, bg=BG).pack(side='left')
tk.Label(header, text='Cena pojazdu:', fg=GOLD, bg=BG, font=('Segoe UI', 12)).pack(side='left', padx=5)
price_entry = tk.Entry(header, width=15)
price_entry.pack(side='left', padx=5)
price_entry.insert(0, '0')
price_entry.bind('<KeyRelease>', calculate)
tk.Label(header, text='Robocizna $:', fg=GOLD, bg=BG, font=('Segoe UI', 12)).pack(side='left', padx=5)
labor_entry = tk.Entry(header, width=10)
labor_entry.pack(side='left', padx=5)
labor_entry.insert(0, '0')
labor_entry.bind('<KeyRelease>', calculate)
cost_label = tk.Label(header, text='Koszt tuningu: $0', fg=GOLD, bg=BG, font=('Segoe UI', 14, 'bold'))
cost_label.pack(side='right', padx=10)
notebook = ttk.Notebook(root)
notebook.pack(fill='both', expand=True, padx=10, pady=10)
tabs = {}
for name in ['Wizual', 'Performance', 'Dodatki', 'Faktura']:
    tabs[name] = ttk.Frame(notebook)
    notebook.add(tabs[name], text=name)
visual_vars = {}
row = col = 0
for part in VISUAL_PARTS:
    var = tk.BooleanVar()
    cb = ttk.Checkbutton(tabs['Wizual'], text=part, variable=var, command=calculate)
    cb.grid(row=row, column=col, sticky='w', padx=10, pady=2)
    visual_vars[part] = var
    row += 1
    if row > 12:
        row, col = (0, col + 1)
row1 = 0
row2 = 0
for i, part in enumerate(EXTRA_PARTS):
    var = tk.BooleanVar()
    cb = ttk.Checkbutton(tabs['Wizual'], text=part, variable=var, command=calculate)
    if i < 11:
        cb.grid(row=row1, column=2, sticky='w', padx=10, pady=2)
        row1 += 1
    else:
        cb.grid(row=row2, column=3, sticky='w', padx=10, pady=2)
        row2 += 1
    visual_vars[part] = var
fixed_vars = {}
row = 0
for part in FIXED_ITEMS:
    var = tk.BooleanVar()
    cb = ttk.Checkbutton(tabs['Dodatki'], text=part, variable=var, command=calculate)
    cb.grid(row=row, column=0, sticky='w', padx=10)
    fixed_vars[part] = var
    row += 1
perf_vars = {}
row = 0
for part in PERFORMANCE:
    ttk.Label(tabs['Performance'], text=part).grid(row=row, column=0, sticky='w', padx=10)
    var = tk.IntVar()
    cb = ttk.Combobox(tabs['Performance'], textvariable=var, values=list(PERFORMANCE[part].keys()), width=5, state='readonly')
    cb.grid(row=row, column=1)
    cb.bind('<<ComboboxSelected>>', calculate)
    var.set(0)
    perf_vars[part] = var
    row += 1
invoice_box = tk.Text(tabs['Faktura'], height=25, width=80, bg='#0E0E0E', fg=GOLD, font=('Consolas', 11))
invoice_box.pack(padx=10, pady=10)
invoice_box.config(state='disabled')
calculate()
root.mainloop()