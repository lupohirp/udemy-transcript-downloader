from PIL import Image, ImageDraw
import os

icons_dir = os.path.join(os.path.dirname(__file__), '..', 'icons')
os.makedirs(icons_dir, exist_ok=True)

def generate_icon(size):
    # High resolution canvas for antialiasing
    scale = 4
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Base rounded rect with Udemy purple theme
    radius = int(s * 0.22)
    margin = int(s * 0.04)
    # Gradient or solid elegant purple #6B21A8 / #9333EA
    bg_color = (138, 43, 226, 255) # BlueViolet / Udemy purple
    draw.rounded_rectangle(
        [margin, margin, s - margin, s - margin],
        radius=radius,
        fill=bg_color
    )

    # Inner document / CC badge or transcript lines
    # Let's draw a white document / speech bubble shape
    # Document box
    doc_left = int(s * 0.24)
    doc_top = int(s * 0.20)
    doc_right = int(s * 0.76)
    doc_bottom = int(s * 0.80)
    doc_radius = int(s * 0.08)

    draw.rounded_rectangle(
        [doc_left, doc_top, doc_right, doc_bottom],
        radius=doc_radius,
        fill=(255, 255, 255, 240)
    )

    # Transcript text lines inside document
    line_color = (109, 40, 217, 255) # Deep purple
    line_height = max(1 * scale, int(s * 0.045))
    line_x1 = int(s * 0.32)
    line_x2_long = int(s * 0.68)
    line_x2_mid = int(s * 0.58)

    # Line 1
    y1 = int(s * 0.33)
    draw.rounded_rectangle([line_x1, y1, line_x2_long, y1 + line_height], radius=line_height//2, fill=line_color)

    # Line 2
    y2 = int(s * 0.44)
    draw.rounded_rectangle([line_x1, y2, line_x2_mid, y2 + line_height], radius=line_height//2, fill=line_color)

    # Line 3
    y3 = int(s * 0.55)
    draw.rounded_rectangle([line_x1, y3, line_x2_long, y3 + line_height], radius=line_height//2, fill=line_color)

    # Download arrow badge at bottom right
    badge_cx = int(s * 0.72)
    badge_cy = int(s * 0.72)
    badge_r = int(s * 0.20)
    badge_color = (16, 185, 129, 255) # Emerald green download accent
    draw.ellipse(
        [badge_cx - badge_r, badge_cy - badge_r, badge_cx + badge_r, badge_cy + badge_r],
        fill=badge_color,
        outline=(255, 255, 255, 255),
        width=int(s * 0.03)
    )

    # Arrow inside badge
    arr_color = (255, 255, 255, 255)
    aw = max(2 * scale, int(s * 0.035))
    ay_top = badge_cy - int(badge_r * 0.5)
    ay_bot = badge_cy + int(badge_r * 0.2)
    draw.line([badge_cx, ay_top, badge_cx, ay_bot], fill=arr_color, width=aw)
    # Arrowhead
    ah_size = int(badge_r * 0.42)
    draw.polygon([
        (badge_cx, badge_cy + int(badge_r * 0.55)),
        (badge_cx - ah_size, badge_cy + int(badge_r * 0.05)),
        (badge_cx + ah_size, badge_cy + int(badge_r * 0.05))
    ], fill=arr_color)

    # Downscale with high quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    out_path = os.path.join(icons_dir, f'icon-{size}.png')
    final_img.save(out_path, format='PNG')
    print(f'Generated {out_path} ({size}x{size})')

for sz in [16, 48, 128]:
    generate_icon(sz)

print("Icon generation completed.")
