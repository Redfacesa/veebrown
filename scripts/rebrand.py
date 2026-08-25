#!/usr/bin/env python3
from pathlib import Path

ROOT = Path('/Users/admin/Documents/GitHub/veebrown')
PROTECTED = ['pangolin_storefront_catalog', 'pangolin_tailoring_services', 'pangolin_site_content']
RENAME = {'PangolinLogo.tsx': 'VeeBrownLogo.tsx', 'PangolinIntroAnimation.tsx': 'VeeBrownIntroAnimation.tsx'}
REPL = [
    ('PangolinPlatformConfig', 'VeeBrownPlatformConfig'),
    ('getPangolinConfig', 'getVeeBrownConfig'),
    ('isPangolinAdmin', 'isVeeBrownAdmin'),
    ('NEXT_PUBLIC_PANGOLIN_MERCHANT_ID', 'NEXT_PUBLIC_VEEBROWN_MERCHANT_ID'),
    ('PANGOLIN_SOCIAL', 'VEEBROWN_SOCIAL'),
    ('PangolinIntroAnimation', 'VeeBrownIntroAnimation'),
    ('PangolinLogo', 'VeeBrownLogo'),
    ('pangolin-clothing', 'veebrown'),
    ('pangolinclothing.vercel.app', 'veebrown.vercel.app'),
    ('www.pangolinsa.store', 'veebrown.vercel.app'),
    ('pangolinsa.store', 'veebrown.vercel.app'),
    ('Pangolin Clothing', 'VV Brown Fragrances'),
    ('Pangolin Tailoring', 'VV Brown'),
    ("p_slug: 'pangolin'", "p_slug: 'veebrown'"),
    ("ecosystem_from: 'pangolin'", "ecosystem_from: 'veebrown'"),
    ("utm_source: 'pangolin'", "utm_source: 'veebrown'"),
    ("ecosystem_app: 'pangolin'", "ecosystem_app: 'veebrown'"),
    ('bg-pangolin-', 'bg-vbrown-'),
    ('text-pangolin-', 'text-vbrown-'),
    ('border-pangolin-', 'border-vbrown-'),
]

def transform(content: str) -> str:
    tokens = {}
    for i, name in enumerate(PROTECTED):
        token = f'__PROT{i}__'
        content = content.replace(name, token)
        tokens[token] = name
    for a, b in REPL:
        content = content.replace(a, b)
    for token, name in tokens.items():
        content = content.replace(token, name)
    return content

for path in list(ROOT.rglob('*')):
    if not path.is_file() or '.git' in path.parts:
        continue
    if path.suffix in {'.tsx', '.ts', '.css', '.json', '.md', '.mjs', '.example'} or path.name in {'vercel.json', '.gitignore'}:
        try:
            path.write_text(transform(path.read_text(encoding='utf-8')), encoding='utf-8')
        except UnicodeDecodeError:
            pass

for old, new in RENAME.items():
    for p in ROOT.rglob(old):
        p.rename(p.parent / new)

Path('/Users/admin/Documents/GitHub/veebrown/package.json').write_text(
    Path('/Users/admin/Documents/GitHub/veebrown/package.json').read_text().replace('"name": "pangolin-clothing"', '"name": "veebrown"'),
    encoding='utf-8',
)
print('ok')
