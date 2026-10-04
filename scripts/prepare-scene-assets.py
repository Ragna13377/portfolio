"""Rebuild optimized runtime artwork from the untouched src/assets originals.

Run with Python + Pillow. Hero poses share a bottom anchor and a fixed canvas;
alpha noise outside the real artwork is excluded when measuring their bounds.
"""
from pathlib import Path
from PIL import Image

SOURCE = Path(__file__).resolve().parents[1] / 'src' / 'assets'
TARGET = SOURCE.parent / 'shared' / 'assets' / 'scene'
TARGET.mkdir(parents=True, exist_ok=True)

for name in ('site-background', 'hardware-composite', 'crt-main-background',
             'comet-trail-label', 'floating-island', 'clouds-mid',
             'clouds-near', 'clouds-foreground'):
    image = Image.open(SOURCE / f'{name}.png')
    if name == 'comet-trail-label':
        # Remove the supplied poster's transparent margin before fitting its face.
        image = image.crop(image.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox())
    if name == 'comet-trail-label':
        image.thumbnail((512, 384), Image.Resampling.LANCZOS)
    elif name == 'floating-island':
        image.thumbnail((392, 512), Image.Resampling.NEAREST)
    elif name.startswith('clouds-'):
        image.thumbnail((1468, 490), Image.Resampling.NEAREST)
    if name == 'site-background':
        image.save(TARGET / f'{name}.webp', 'WEBP', quality=92, method=6)
    else:
        image.save(TARGET / f'{name}.webp', 'WEBP', lossless=True, method=6)

for frame in range(1, 5):
    image = Image.open(SOURCE / f'hero-idle-{frame:02}.png')
    bounds = image.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox()
    image = image.crop(bounds)
    image.thumbnail((220, 250), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (240, 260))
    canvas.alpha_composite(image, ((240 - image.width) // 2, 252 - image.height))
    canvas.save(TARGET / f'hero-idle-{frame:02}.webp', 'WEBP', lossless=True, method=6)

print('Runtime scene:', sum(p.stat().st_size for p in TARGET.glob('*.webp')), 'bytes')
