#!/usr/bin/env python3
"""Bundle abira/preview into ONE self-contained HTML fragment (CSS, JS, font, images inlined)
for hosts that wrap the page in their own <html>/<head> skeleton. Usage: build_single_file.py <out.html>"""
import re, sys, base64, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'preview'
html = (root / 'index.html').read_text()
b64 = lambda p, mime: f'data:{mime};base64,' + base64.b64encode((root / p).read_bytes()).decode()

css = ''.join((root / f'assets/css/{n}.css').read_text() for n in ('tokens', 'base', 'home'))
css = css.replace('url("../fonts/Vazirmatn-Variable.woff2")', f'url("{b64("assets/fonts/Vazirmatn-Variable.woff2", "font/woff2")}")')
js = (root / 'assets/js/main.js').read_text()

body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
body = re.sub(r'<script src="assets/js/main.js" defer></script>', '', body)
body = re.sub(r'(assets/img/[\w.-]+\.webp)', lambda m: b64(m.group(1), 'image/webp'), body)
boot = re.search(r'<script>\n/\* Adds .js.*?</script>', html, re.S).group(0)
boot = boot.replace('var h=d.documentElement; h.classList.add(\'js\');', "var h=d.documentElement; h.setAttribute('lang','fa'); h.setAttribute('dir','rtl'); h.setAttribute('data-motion','balanced'); h.classList.add('js');")
out = f'<title>آبیرا</title>\n<meta name="description" content="پیش‌نمایش قالب وردپرس شرکتی آبیرا">\n{boot}\n<style>{css}\nbody{{font-family:var(--font);font-size:var(--fs-md);}}</style>\n{body}\n<script>{js}</script>\n'
pathlib.Path(sys.argv[1]).write_text(out)
print(len(out) // 1024, 'KB')
