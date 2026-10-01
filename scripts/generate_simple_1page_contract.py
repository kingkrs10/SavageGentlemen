import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class SimpleCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        # Top accent bar
        self.setFillColor(colors.HexColor("#D91B82")) # Magenta
        self.rect(32, letter[1] - 22, letter[0] - 64, 4, fill=1, stroke=0)
        self.setFillColor(colors.HexColor("#E5A93C")) # Gold
        self.rect(32, letter[1] - 25, letter[0] - 64, 2, fill=1, stroke=0)
        
        # Bottom footer
        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(32, 18, "EUPHORIA MAS  •  GUYANA CARNIVAL 2027  •  RHION ROMANY (ЯR)  •  CONFIDENTIAL PRODUCTION AGREEMENT")
        self.drawRightString(letter[0] - 32, 18, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_simple_pdf(filename="Euphoria_Mas_Rhion_Romany_Jaguar_Contract.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=32,
        rightMargin=32,
        topMargin=32,
        bottomMargin=28,
    )

    dark_navy = colors.HexColor("#0F172A")
    brand_magenta = colors.HexColor("#D91B82")
    brand_gold = colors.HexColor("#C8932A")
    emerald = colors.HexColor("#059669")
    text_dark = colors.HexColor("#1E293B")
    text_muted = colors.HexColor("#475569")

    # Typography
    p_title = ParagraphStyle(
        "PTitle",
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=15,
        textColor=dark_navy,
    )

    p_sub = ParagraphStyle(
        "PSub",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=brand_magenta,
    )

    p_meta = ParagraphStyle(
        "PMeta",
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=text_muted,
    )

    sec_title = ParagraphStyle(
        "SecTitle",
        fontName="Helvetica-Bold",
        fontSize=7.8,
        leading=9.8,
        textColor=dark_navy,
        spaceBefore=2.5,
        spaceAfter=1.5,
    )

    p_body = ParagraphStyle(
        "PBody",
        fontName="Helvetica",
        fontSize=6.6,
        leading=8.6,
        textColor=text_dark,
    )

    p_quote = ParagraphStyle(
        "PQuote",
        fontName="Helvetica-Oblique",
        fontSize=6.6,
        leading=8.6,
        textColor=colors.HexColor("#1E293B"),
    )

    th_style = ParagraphStyle(
        "TH",
        fontName="Helvetica-Bold",
        fontSize=6.6,
        leading=8.2,
        textColor=colors.white,
    )

    td_style = ParagraphStyle(
        "TD",
        fontName="Helvetica",
        fontSize=6.5,
        leading=8.2,
        textColor=text_dark,
    )

    td_bold = ParagraphStyle(
        "TDBold",
        fontName="Helvetica-Bold",
        fontSize=6.5,
        leading=8.2,
        textColor=text_dark,
    )

    td_right = ParagraphStyle(
        "TDRight",
        fontName="Helvetica-Bold",
        fontSize=6.8,
        leading=8.2,
        textColor=text_dark,
        alignment=2,
    )

    story = []

    # 1. Compact Header: Logo + Title + Reference
    logo_path = "public/images/euphoria-mas-logo.png"
    has_logo = os.path.exists(logo_path)

    header_table_data = [
        [
            Image(logo_path, width=82, height=58) if has_logo else Paragraph("<b>EUPHORIA MAS</b>", p_title),
            [
                Paragraph("CARNIVAL COSTUME DESIGN & PROTOTYPE AGREEMENT", p_title),
                Spacer(1, 1),
                Paragraph("GUYANA CARNIVAL 2027  •  SECTION: JAGUAR 🐆", p_sub),
                Spacer(1, 2),
                Paragraph("<b>Date:</b> October 1, 2026 &nbsp;|&nbsp; <b>Submission Deadline:</b> October 22, 2026 &nbsp;|&nbsp; <b>Ref:</b> EM-GC27-JAG-RR01-REV1", p_meta),
            ]
        ]
    ]
    t_head = Table(header_table_data, colWidths=[92, 456])
    t_head.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(t_head)
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceAfter=2))

    # 2. Parties Box
    parties_data = [
        [
            Paragraph("<b>PRODUCER / BAND (CLIENT):</b><br/>"
                      "<b>Euphoria Mas Carnival Band</b><br/>"
                      "Guyana Carnival 2027 Executive Committee<br/>"
                      "Official Band Management & Operations", td_style),
            Paragraph("<b>DESIGNER (CONTRACTOR):</b><br/>"
                      "<b>Rhion Romany</b> (Rhion Romany Designs / <b>ЯR</b>)<br/>"
                      "Instagram: @rhionromany (https://www.instagram.com/rhionromany/)<br/>"
                      "Role: Lead Section Couturier & Prototype Artisan", td_style),
        ]
    ]
    t_parties = Table(parties_data, colWidths=[274, 274])
    t_parties.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#F8FAFC")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#FDF2F8")),
        ('BOX', (0,0), (0,0), 0.5, colors.HexColor("#CBD5E1")),
        ('BOX', (1,0), (1,0), 0.5, colors.HexColor("#FBCFE8")),
        ('PADDING', (0,0), (-1,-1), 2.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_parties)
    story.append(Spacer(1, 1.5))

    # 3. Section Theme & Description Box
    story.append(Paragraph("1. SECTION THEME: GUYANA JAGUAR 🐆", sec_title))
    theme_box = [
        [
            Paragraph("<b>Costume Concept Narrative:</b> "
                      "<i>“Unleash your wild side and embody the spirit of Guyana with Jaguar—a fierce and captivating masterpiece inspired by the majestic national animal of Guyana. Designed to command attention, this striking costume blends untamed beauty with irresistible elegance. "
                      "Adorned with rich shades of <b>gold, black, and emerald green</b>, Jaguar features shimmering stones, intricate beadwork, and dramatic feather accents that mirror the power and mystery of the rainforest. Every detail celebrates the strength, grace, and resilience of the jaguar, creating a look that is both bold and unforgettable. "
                      "From the road to the stage, Jaguar is made for those who move with confidence, embrace their power, and leave a lasting impression. Step into your element and let your spirit run free—because legends aren't followed, they're remembered. "
                      "<b>JAGUAR: Power. Grace. Untamed Elegance. 🇬🇾✨🐆</b>”</i>", p_quote)
        ]
    ]
    t_theme = Table(theme_box, colWidths=[548])
    t_theme.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFFBEB")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#F59E0B")),
        ('LINELEFT', (0,0), (0,0), 3, colors.HexColor("#D91B82")),
        ('PADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_theme)
    story.append(Spacer(1, 1.5))

    # 4. Scope of Deliverables Table (Exact "What I'll Need")
    story.append(Paragraph("2. REQUIRED DELIVERABLES & PROTOTYPE BREAKDOWN", sec_title))
    deliv_rows = [
        [
            Paragraph("Item", th_style),
            Paragraph("Design & Construction Scope", th_style),
            Paragraph("Qty", th_style),
            Paragraph("Backpack Architecture", th_style),
        ],
        [
            Paragraph("<b>1. Frontline</b>", td_bold),
            Paragraph("Luxury wire-bra/centerpiece, feather tiara/crown, collar, bottom/belt, armbands, and leg pieces in gold, black & emerald.", td_style),
            Paragraph("1 Set", td_style),
            Paragraph("Ultra-Frontline Monarch Backpack (Option A)", td_style),
        ],
        [
            Paragraph("<b>2. Curvy</b>", td_bold),
            Paragraph("Full-figured tailored silhouette with enhanced bust support, waist harness/corsetry, extended coverage, tiara & cuffs.", td_style),
            Paragraph("1 Set", td_style),
            Paragraph("Curvy Frontline/Mid-Tier Compatible", td_style),
        ],
        [
            Paragraph("<b>3. Backline</b>", td_bold),
            Paragraph("High-impact monokini cut with signature Jaguar stone layout, lightweight feather tiara, waist sash & wrist/calf cuffs.", td_style),
            Paragraph("1 Set", td_style),
            Paragraph("Backline Accent Collar / Wings (Option C)", td_style),
        ],
        [
            Paragraph("<b>4. Male</b>", td_bold),
            Paragraph("Masquerader boardshorts with waistband detailing, embellished chest/shoulder harness, warrior gauntlets, and crown.", td_style),
            Paragraph("1 Set", td_style),
            Paragraph("Male Feather Shoulder Wings / Harness", td_style),
        ],
        [
            Paragraph("<b>5. Extra Frontline (Bodysuit)</b>", td_bold),
            Paragraph("Additional Frontline piece (bodyweight / bodysuit only): full-length stretch illusion mesh bodysuit with placed Jaguar crystals.", td_style),
            Paragraph("1 Piece", td_style),
            Paragraph("Interchangeable with Frontline Accessories", td_style),
        ],
        [
            Paragraph("<b>6. Backpack Suite</b>", td_bold),
            Paragraph("<b>Three (3) distinct backpack options</b> included with design: (A) Full Monarch, (B) Mid-Tier Wing, (C) Collar Wing.", td_style),
            Paragraph("3 Tiers", td_style),
            Paragraph("<b>3 Backpack Options Included in Package</b>", td_bold),
        ],
    ]
    t_deliv = Table(deliv_rows, colWidths=[95, 273, 35, 145])
    t_deliv.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 2.2),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(t_deliv)
    story.append(Spacer(1, 1.5))

    # 5. Pricing & Structured Milestone Breakdown
    story.append(Paragraph("3. COMMERCIAL PRICING & PAYMENT BREAKDOWN", sec_title))
    pricing_data = [
        [
            Paragraph("Fee Item", th_style),
            Paragraph("Scope & Remuneration Structure", th_style),
            Paragraph("Total (USD)", th_style),
            Paragraph("Payment Terms (To Begin & Balance)", th_style),
        ],
        [
            Paragraph("<b>Materials & Supplies</b>", td_bold),
            Paragraph("Raw materials (wireframes, emerald/gold crystals, plumage, fabrics, hardware) and artisan prototype labour.", td_style),
            Paragraph("<b>$2,300.00</b>", td_right),
            Paragraph("<font color='#059669'><b>100% Upfront to Begin ($2,300.00 USD)</b></font>", td_style),
        ],
        [
            Paragraph("<b>Creative Design Fee</b><br/><i>(Rhion Romany Brand)</i>", td_bold),
            Paragraph("Full creative remuneration (sketches, wireframes, stone maps, tech packs across Frontline, Curvy, Backline, Male, Bodysuit, 3 Backpacks).", td_style),
            Paragraph("<b>$3,500.00</b>", td_right),
            Paragraph("<b>50% Upfront ($1,750.00)</b> &nbsp;|&nbsp; <b>50% Handover by Oct 22 ($1,750.00)</b>", td_style),
        ],
        [
            Paragraph("<b>TOTAL CONTRACT</b>", td_bold),
            Paragraph("<b>All-Inclusive 5-Costume Suite + 3 Backpack Tiers + Production Tech Packs (No Backend Cuts)</b>", td_bold),
            Paragraph("<b>$5,800.00</b>", td_right),
            Paragraph("<b>Deposit: $4,050.00 USD &nbsp;|&nbsp; Balance: $1,750.00 USD</b>", td_bold),
        ],
    ]
    t_price = Table(pricing_data, colWidths=[98, 235, 65, 150])
    t_price.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0F172A")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 2.2),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#FEF3C7")),
    ]))
    story.append(t_price)
    story.append(Spacer(1, 1.5))

    # Highlight Payment Stages Box
    stages_data = [
        [
            Paragraph("<b>STAGE 1: COMMENCEMENT DEPOSIT (DUE NOW TO BEGIN)</b><br/>"
                      "• <b>100% Materials & Supplies:</b> $2,300.00 USD<br/>"
                      "• <b>50% of Creative Design Fee:</b> $1,750.00 USD (half of $3,500.00 USD)<br/>"
                      "<b>TOTAL INITIAL DEPOSIT TO COMMENCE: $4,050.00 USD</b> (Transferred upon signing)", td_style),
            Paragraph("<b>STAGE 2: FINAL BALANCE (DEADLINE: OCTOBER 22, 2026)</b><br/>"
                      "• <b>Remaining 50% Creative Design Fee:</b> $1,750.00 USD<br/>"
                      "<b>FINAL BALANCE DUE: $1,750.00 USD</b><br/>"
                      "Due upon physical prototype handover & approval on or before <b>October 22, 2026</b>", td_style),
        ]
    ]
    t_stages = Table(stages_data, colWidths=[274, 274])
    t_stages.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#F0FDF4")),
        ('BOX', (0,0), (0,0), 0.75, colors.HexColor("#22C55E")),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor("#F8FAFC")),
        ('BOX', (1,0), (1,0), 0.75, colors.HexColor("#94A3B8")),
        ('PADDING', (0,0), (-1,-1), 2.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_stages)
    story.append(Spacer(1, 1.5))

    # 6. Essential Terms (Short & Direct, with Remuneration Clause)
    story.append(Paragraph("4. ESSENTIAL OPERATIONAL & REMUNERATION TERMS", sec_title))
    terms_p = (
        "<b>a. Remuneration & Production Supplies:</b> Acknowledging Designer's correspondence regarding standard band compensation models, this agreement establishes a guaranteed, flat-fee commission structure without backend sales commissions, profit shares, or complimentary masquerader allocations. Materials and supplies are covered at <b>$2,300.00 USD</b> total and disbursed 100% upfront to mobilize immediate builds.<br/>"
        "<b>b. Submission Deadline (October 22, 2026):</b> Complete physical prototypes (5 costumes + 3 backpacks) and tech packs must be submitted on or before <b>October 22, 2026</b> for official campaign launch.<br/>"
        "<b>c. Exclusivity & Quality:</b> The Jaguar design is commissioned exclusively for Euphoria Mas for Guyana Carnival 2027 and will not be replicated for another band. Samples built for 8+ hour carnival road durability.<br/>"
        "<b>d. Designer Crediting:</b> Euphoria Mas will prominently credit Rhion Romany / ЯR (@rhionromany) as Official Section Designer on all campaign media, flyers, and website."
    )
    story.append(Paragraph(terms_p, p_body))
    story.append(Spacer(1, 2))

    # 7. Signatures
    story.append(Paragraph("5. EXECUTION & ACCEPTANCE", sec_title))
    sig_data = [
        [
            Paragraph("<b>FOR EUPHORIA MAS CARNIVAL BAND:</b><br/>"
                      "Guyana Carnival 2027 Executive Committee<br/><br/>"
                      "___________________________________________<br/>"
                      "Authorized Representative Signature<br/>"
                      "Name: ____________________________________<br/>"
                      "Date: October 1, 2026", td_style),
            Paragraph("<b>FOR RHION ROMANY DESIGNS (ЯR):</b><br/>"
                      "Lead Section Couturier & Designer<br/><br/>"
                      "___________________________________________<br/>"
                      "Rhion Romany (Designer Signature)<br/>"
                      "Name: Rhion Romany (@rhionromany)<br/>"
                      "Date: October 1, 2026", td_style),
        ]
    ]
    t_sig = Table(sig_data, colWidths=[274, 274])
    t_sig.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('PADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_sig)

    doc.build(story, canvasmaker=SimpleCanvas)
    print("1-Page Contract build finished.")

if __name__ == "__main__":
    build_simple_pdf()
