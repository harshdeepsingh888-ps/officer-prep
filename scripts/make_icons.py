"""Render the app icons (the violet→teal chevron on black) into public/.

Run from the project root:  python scripts/make_icons.py   (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public"
VIOLET = (0x80, 0x52, 0xFF)
TEAL = (0x15, 0x84, 0x6E)
# Chevron in a 24-unit box — same path as the Logo component.
CHEVRON = [(12, 2.5), (21.5, 20), (12, 14.8), (2.5, 20)]
SS = 4  # supersampling for smooth edges


def gradient(size: int) -> Image.Image:
    """Diagonal violet→teal gradient, matching the SVG logo."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = min(1.0, max(0.0, (0.35 * x + 0.65 * y) / size))
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(VIOLET, TEAL))
    return img


def icon(size: int, logo_fraction: float, radius_fraction: float = 0.0) -> Image.Image:
    big = size * SS
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    bg = Image.new("L", (big, big), 0)
    ImageDraw.Draw(bg).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * radius_fraction), fill=255)
    canvas.paste((0, 0, 0, 255), mask=bg)

    logo = int(big * logo_fraction)
    offset = (big - logo) / 2
    scale = logo / 24
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).polygon([(offset + x * scale, offset + y * scale + logo * 0.03) for x, y in CHEVRON], fill=255)
    canvas.paste(gradient(big), mask=mask)
    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    icon(192, 0.62, 0.22).save(OUT / "pwa-192.png")
    icon(512, 0.62, 0.22).save(OUT / "pwa-512.png")
    icon(512, 0.5).save(OUT / "pwa-maskable-512.png")  # full-bleed, logo inside the 80% safe zone
    icon(180, 0.6).save(OUT / "apple-touch-icon.png")
    icon(64, 0.7, 0.22).save(OUT / "favicon-64.png")
    print("icons written to", OUT)


if __name__ == "__main__":
    main()
