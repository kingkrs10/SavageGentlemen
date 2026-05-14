import os
import json
from PIL import Image, ImageDraw, ImageFont

# Constants
DPI = 300
PAGE_WIDTH = int(8.5 * DPI)  # 2550
PAGE_HEIGHT = int(11 * DPI)  # 3300
TICKET_WIDTH = int(6 * DPI)   # 1800
TICKET_HEIGHT = int(2.5 * DPI) # 750
MARGIN_X = (PAGE_WIDTH - TICKET_WIDTH) // 2
MARGIN_Y = (PAGE_HEIGHT - (TICKET_HEIGHT * 4)) // 2

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, 'tickets_temp')
MAPPING_FILE = os.path.join(BASE_DIR, 'ticket_mapping.json')
FLYER_PATH = os.path.join(BASE_DIR, 'elysium_flyer.jpeg')
FONT_PATH = '/System/Library/Fonts/Supplemental/Arial.ttf'
OUTPUT_FILE = os.path.join(BASE_DIR, 'Elysium_Tickets_Batch_Updated.pdf')

def assemble_pdf():
    print("Loading ticket mapping...")
    with open(MAPPING_FILE, 'r') as f:
        mapping = json.load(f)

    # Load flyer
    print("Loading flyer...")
    flyer = Image.open(FLYER_PATH).convert("RGB")
    
    # We want a 6x2.5 ticket.
    # Let's use the flyer as the background for the left 2/3 of the ticket, 
    # and a clean area for the QR code on the right.
    
    # Aspect ratio of ticket: 6 / 2.5 = 2.4
    # Aspect ratio of flyer: 1438 / 2161 = 0.66
    
    # Let's crop the flyer to a square or a nice vertical section
    flyer_crop_width = flyer.width
    flyer_crop_height = int(flyer.width / (TICKET_HEIGHT / TICKET_HEIGHT)) # dummy
    # Actually, let's just resize the flyer to fit the height of the ticket.
    flyer_scaled_height = TICKET_HEIGHT
    flyer_scaled_width = int(flyer.width * (TICKET_HEIGHT / flyer.height))
    flyer_scaled = flyer.resize((flyer_scaled_width, flyer_scaled_height), Image.Resampling.LANCZOS)

    # Fonts
    font_large = ImageFont.truetype(FONT_PATH, 45)
    font_medium = ImageFont.truetype(FONT_PATH, 35)
    font_small = ImageFont.truetype(FONT_PATH, 25)

    pages = []
    
    for p in range(25):
        print(f"Generating page {p+1}/25...")
        page = Image.new('RGB', (PAGE_WIDTH, PAGE_HEIGHT), (255, 255, 255))
        draw_page = ImageDraw.Draw(page)

        for t in range(4):
            idx = p * 4 + t
            if idx >= len(mapping):
                break
            
            ticket_data = mapping[idx]
            qr_path = os.path.join(TEMP_DIR, ticket_data['file'])
            qr_img = Image.open(qr_path).convert("RGB")
            qr_size = int(TICKET_HEIGHT * 0.7)
            qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

            # Create ticket image
            ticket = Image.new('RGB', (TICKET_WIDTH, TICKET_HEIGHT), (255, 255, 255))
            draw_ticket = ImageDraw.Draw(ticket)

            # Paste flyer on the left (tiled or centered?)
            # Let's stretch the flyer to fit the left 70% of the ticket
            flyer_bg_width = int(TICKET_WIDTH * 0.75)
            flyer_bg = flyer.resize((flyer_bg_width, TICKET_HEIGHT), Image.Resampling.LANCZOS)
            ticket.paste(flyer_bg, (0, 0))

            # Add a white box for QR code on the right
            qr_box_width = TICKET_WIDTH - flyer_bg_width
            draw_ticket.rectangle([flyer_bg_width, 0, TICKET_WIDTH, TICKET_HEIGHT], fill=(255, 255, 255))
            
            # Paste QR Code in the white box
            qr_x = flyer_bg_width + (qr_box_width - qr_size) // 2
            qr_y = (TICKET_HEIGHT - qr_size) // 2 - 40
            ticket.paste(qr_img, (qr_x, qr_y))

            # Add Ticket Info in the white box
            text_color = (0, 0, 0)
            draw_ticket.text((flyer_bg_width + 20, TICKET_HEIGHT - 120), f"Ticket #{ticket_data['index']}", font=font_medium, fill=text_color)
            draw_ticket.text((flyer_bg_width + 20, TICKET_HEIGHT - 70), f"ID: {ticket_data['id'][:8]}...", font=font_small, fill=(100, 100, 100))

            # Draw dashed border/cut mark on page
            pos_y = MARGIN_Y + t * TICKET_HEIGHT
            page.paste(ticket, (MARGIN_X, pos_y))
            
            # Draw cut marks
            draw_page.rectangle([MARGIN_X, pos_y, MARGIN_X + TICKET_WIDTH, pos_y + TICKET_HEIGHT], outline=(150, 150, 150), width=3)

        pages.append(page)

    print(f"Saving PDF to {OUTPUT_FILE}...")
    pages[0].save(OUTPUT_FILE, save_all=True, append_images=pages[1:])
    print("Done!")

if __name__ == "__main__":
    assemble_pdf()
