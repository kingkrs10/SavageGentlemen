from PIL import Image, ImageDraw
import sys

def create_icon(size, filename):
    # Dark blue background
    img = Image.new('RGB', (size, size), color=(5, 5, 16))
    d = ImageDraw.Draw(img)
    
    # Draw a stylized piano key or neon circle
    margin = size // 5
    d.ellipse([margin, margin, size-margin, size-margin], outline=(0, 243, 255), width=size//10)
    
    # Some inner shapes
    d.rectangle([size//3, size//3, size*2//3, size*2//3], fill=(255, 0, 234))
    
    img.save(filename)

if __name__ == "__main__":
    try:
        create_icon(192, "icon-192.png")
        create_icon(512, "icon-512.png")
        print("Icons generated successfully!")
    except Exception as e:
        print(f"Error: {e}")
