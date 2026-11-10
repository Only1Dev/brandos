"""
Generate official Solaria Wellness Brand Guidelines PDF for BrandOS Core ingestion demo.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf(target_dir: str | None = None) -> str:
    if not target_dir:
        target_dir = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(target_dir, exist_ok=True)
    pdf_path = os.path.join(target_dir, "Solaria_Wellness_Official_Brand_Guidelines_2026.pdf")

    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#064E3B'),
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#10B981'),
        fontName='Helvetica-Bold'
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#047857'),
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1F2937')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.white,
        fontName='Helvetica-Bold'
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1F2937')
    )

    story = []

    # Title Banner
    story.append(Paragraph("SOLARIA WELLNESS & CLINICAL NUTRITION", subtitle_style))
    story.append(Paragraph("Official Brand Guidelines & Scientific Communication Standard", title_style))
    story.append(Paragraph("Global Edition • Regulatory Compliance Version 3.1 • Effective 2026", body_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#10B981'), spaceAfter=15))

    # Core Mission & Positioning
    story.append(Paragraph("1. Brand Identity & Clinical Mission", h2_style))
    story.append(Paragraph(
        "Solaria develops clinical-grade, bio-adaptive hydration and metabolic wellness formulations. "
        "Our core product, <b>Solaria PureHydrate</b>, is engineered for everyday physiological endurance and cellular vitality. "
        "Our editorial voice is <b>warm, scientifically grounded, transparent, and empowering</b>. "
        "We never resort to fearmongering, sensationalism, or pseudo-scientific health fads.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Regulatory & Health Claim Boundaries
    story.append(Paragraph("2. Prohibited Claims & Regulatory Boundaries (Strict Enforcement)", h2_style))
    story.append(Paragraph(
        "• <b>PROHIBITED MEDICAL CURE CLAIMS</b>: Creators, marketing partners, and affiliates must NEVER claim PureHydrate 'cures dehydration', 'reverses diabetes', 'cures hangovers', or serves as an 'instant medical treatment'. PureHydrate supports physiological hydration; it is not a prescription pharmaceutical.<br/>"
        "• <b>PROHIBITED ABSOLUTES & SUPERLATIVES</b>: Phrases such as '100% detox', 'world's #1 supplement', or 'miracle cure' are strictly prohibited under FDA and FSSAI guidelines.<br/>"
        "• <b>MANDATORY SCIENTIFIC ACCURACY</b>: All electrolyte ratios and clinical absorption benchmarks must cite verified in-vivo clinical trial data.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # Approved Truth Facts & Metrics
    story.append(Paragraph("3. Approved Organizational Facts (Grounding Knowledge)", h2_style))
    facts_data = [
        [Paragraph("Metric / Claim Key", table_header_style), Paragraph("Approved Numerical Benchmark", table_header_style), Paragraph("Approved Attribution Source", table_header_style)],
        [Paragraph("Cellular Electrolyte Absorption", table_cell_style), Paragraph("3.0x faster than standard water (verified)", table_cell_style), Paragraph("Solaria Clinical In-Vivo Study 2025 (n=240)", table_cell_style)],
        [Paragraph("Sugar Content", table_cell_style), Paragraph("0% added sugar (monk fruit sweetened)", table_cell_style), Paragraph("Certified Lab Analysis Q4 2025", table_cell_style)],
        [Paragraph("Core Minerals", table_cell_style), Paragraph("6 essential bio-available electrolytes", table_cell_style), Paragraph("PureHydrate Formulation Patent #9921", table_cell_style)],
        [Paragraph("Daily Endurance Improvement", table_cell_style), Paragraph("28% reduction in perceived physiological fatigue", table_cell_style), Paragraph("Clinical Exercise Performance Trial 2025", table_cell_style)]
    ]
    t_facts = Table(facts_data, colWidths=[160, 180, 180])
    t_facts.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#064E3B')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1FAE5')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0FDF4')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_facts)
    story.append(Spacer(1, 12))

    # Visual Identity & Color System
    story.append(Paragraph("4. Visual Identity & Color Palette", h2_style))
    story.append(Paragraph(
        "• <b>Primary Forest Emerald</b>: #064E3B (Used for headers, authority badges, and packaging borders).<br/>"
        "• <b>Accent Vitality Mint</b>: #10B981 (Used for call-to-action buttons, verified badges, and highlights).<br/>"
        "• <b>Background Tint</b>: Pure white (#FFFFFF) or soft botanical mint (#F0FDF4).<br/>"
        "• <b>Typography</b>: Clean sans-serif with high legibility. Minimum body text contrast ratio: 4.5:1 (WCAG AA).",
        body_style
    ))
    story.append(Spacer(1, 12))

    # Terminology Rules
    story.append(Paragraph("5. Terminology & Phrasing Governance", h2_style))
    terms_data = [
        [Paragraph("Forbidden / Deprecated Term", table_header_style), Paragraph("Preferred Brand Term", table_header_style), Paragraph("Governance Rule", table_header_style)],
        [Paragraph("miracle cure / magic drink", table_cell_style), Paragraph("clinical electrolyte hydration", table_cell_style), Paragraph("Forbidden (Regulatory compliance)", table_cell_style)],
        [Paragraph("100% detox", table_cell_style), Paragraph("natural cellular hydration support", table_cell_style), Paragraph("Forbidden (Misleading health claim)", table_cell_style)],
        [Paragraph("energy booster", table_cell_style), Paragraph("sustained bio-adaptive vitality", table_cell_style), Paragraph("Preferred terminology", table_cell_style)]
    ]
    t_terms = Table(terms_data, colWidths=[160, 180, 180])
    t_terms.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#047857')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1FAE5')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0FDF4')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_terms)

    doc.build(story)
    print(f"Generated Solaria guidelines PDF: {pdf_path}")
    return pdf_path

if __name__ == "__main__":
    generate_pdf()
