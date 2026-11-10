from PIL import Image, ImageDraw, ImageFont
import os

width, height = 800, 420
image = Image.new('RGB', (width, height), color=(15, 23, 42))  # Deep navy #0F172A
draw = ImageDraw.Draw(image)

# Top Cyan line
draw.rectangle([(0, 0), (width, 8)], fill=(14, 165, 233))  # #0EA5E9

# Aureon Logo placeholder
draw.rounded_rectangle([(40, 40), (160, 80)], radius=6, fill=(14, 165, 233))
draw.text((58, 52), 'AUREON', fill=(255, 255, 255))

# Official Ad badge
draw.rounded_rectangle([(180, 48), (280, 72)], radius=4, outline=(100, 116, 139), width=1)
draw.text((195, 54), 'OFFICIAL AD', fill=(148, 163, 184))

# Headline with intentional PRD policy violations
draw.text((40, 120), "India's #1 Fraud Protection Platform", fill=(255, 255, 255))
draw.text((40, 165), "Guaranteed 100% Protection Against Every Threat", fill=(244, 63, 94))
draw.text((40, 220), "Aureon Shield reduces enterprise fraud by 73% in real-time.", fill=(203, 213, 225))

# Low contrast footer (fails accessibility test)
draw.text((40, 260), "Terms and conditions apply. Guaranteed results.", fill=(25, 35, 60))

# CTA Button
draw.rounded_rectangle([(40, 310), (220, 360)], radius=8, fill=(14, 165, 233))
draw.text((70, 326), 'Claim 100% Safety', fill=(15, 23, 42))

out_path = r'C:\Users\Shivu\.gemini\antigravity\scratch\brandos\frontend\public\sample_violation_creative.png'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
image.save(out_path, format='PNG')
print('Demo violation image generated at:', out_path)
