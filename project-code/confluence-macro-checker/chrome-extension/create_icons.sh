#!/bin/bash
# Create simple placeholder icons using ImageMagick or Python
# If neither is available, we'll create them manually

# Try to create with ImageMagick convert command
if command -v convert &> /dev/null; then
    convert -size 16x16 xc:'#0052CC' -gravity center -pointsize 10 -fill white -annotate +0+0 'C' icon16.png
    convert -size 48x48 xc:'#0052CC' -gravity center -pointsize 30 -fill white -annotate +0+0 'C' icon48.png
    convert -size 128x128 xc:'#0052CC' -gravity center -pointsize 80 -fill white -annotate +0+0 'C' icon128.png
    echo "Icons created with ImageMagick"
else
    echo "ImageMagick not found. Creating placeholder files..."
    # Create simple colored squares as placeholders
    python3 << 'PYTHON'
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color='#0052CC')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple 'C' in the center
    font_size = size // 2
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "C"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2)
    draw.text(position, text, fill='white', font=font)
    
    img.save(filename)
    print(f"Created {filename}")

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
PYTHON
fi
