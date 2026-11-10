"""
Generate official Solaria Wellness Brand Guidelines PDF for BrandOS Core ingestion demo.
"""
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    pdf_path_backend = r"C:\Users\Shivu\.gemini\antigravity\scratch\brandos\backend\uploads\Solaria_Wellness_Official_Brand_Guidelines_2026.pdf"
    pdf_path_frontend = r"C:\Users\Shivu\.gemini\antigravity\scratch\brandos\frontend\public\Solaria_Wellness_Official_Brand_Guidelines_2026.pdf"
    
    os.makedirs(os.path.dirname(pdf_path_backend), exist_ok=True)
    os.makedirs(os.path.dirname(pdf_path_frontend), exist_ok=True)

    for target_path in [pdf_path_backend, pdf_path_frontend]:
        doc = SimpleDocTemplate(target_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
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
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#1F2937')
        )

        story = []

        # Header
        story.append(Paragraph("SOLARIA WELLNESS & CLINICAL NUTRITION", subtitle_style))
        story.append(Paragraph("Official Brand Guidelines & Governance Policy (2026)", title_style))
        story.append(Paragraph("Confidential & Proprietary • Version 3.1 • Effective Q1 2026", body_style))
        story.append(Spacer(1, 15))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#10B981'), spaceAfter=15))

        # Brand Identity & Mission
        story.append(Paragraph("1. Brand Identity, Domain & Scope", h2_style))
        story.append(Paragraph(
            "Solaria Wellness is a clinical-grade preventative health and adaptogenic hydration company. "
            "Our primary offerings include <b>Solaria PureHydrate™</b> (cellular electrolyte recovery) and <b>Solaria BioImmune™</b> (clinical herbal adaptogens). "
            "All published content must strictly remain within the scope of preventative wellness, natural hydration, and evidence-based nutrition. "
            "Any content addressing unrelated domains (e.g. cybersecurity, software SaaS, home appliances, automotive) is strictly prohibited under this brand identity.",
            body_style
        ))
        story.append(Spacer(1, 12))

        # Brand Voice & Tone
        story.append(Paragraph("2. Voice, Tone & Regulatory Claim Boundaries", h2_style))
        story.append(Paragraph(
            "The Solaria tone is warm, scientifically grounded, transparent, and empathetic. "
            "Because Solaria products are nutritional supplements, all claims are subject to strict FDA/FSSAI regulatory scrutiny. "
            "<b>Prohibited Claims:</b> Absolute cure claims (e.g., 'cures diabetes', '100% disease prevention', 'miracle remedy', 'instant cure') are strictly forbidden. "
            "<b>Superlatives:</b> Unbacked claims such as '#1 supplement in the world' or 'India's best health drink' cannot be published without verified third-party clinical trial citations.",
            body_style
        ))
        story.append(Spacer(1, 12))

        # Approved Organizational Facts (TruthMark)
        story.append(Paragraph("3. Approved Organizational Facts (TruthMark™ Verification)", h2_style))
        story.append(Paragraph(
            "All quantitative metrics published by creators, agencies, or AI tools must be verified against the following approved facts repository:",
            body_style
        ))
        story.append(Spacer(1, 6))

        facts_data = [
            [Paragraph("Fact Code", table_header_style), Paragraph("Category", table_header_style), Paragraph("Approved Value", table_header_style), Paragraph("Audit Source & Status", table_header_style)],
            [Paragraph("FACT-SOL-01", table_cell_style), Paragraph("Hydration Efficacy", table_cell_style), Paragraph("3.0x cellular electrolyte absorption vs water", table_cell_style), Paragraph("Clinical Trial CT-2025-A (Active)", table_cell_style)],
            [Paragraph("FACT-SOL-02", table_cell_style), Paragraph("Purity Standard", table_cell_style), Paragraph("0% artificial sweeteners, 0g added sugar", table_cell_style), Paragraph("Eurofins Purity Certification (Active)", table_cell_style)],
            [Paragraph("FACT-SOL-03", table_cell_style), Paragraph("Adaptogen Potency", table_cell_style), Paragraph("85% organic sensoril ashwagandha extract", table_cell_style), Paragraph("Botanical Assay 2025 (Active)", table_cell_style)]
        ]
        t_facts = Table(facts_data, colWidths=[80, 100, 190, 150])
        t_facts.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#064E3B')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1FAE5')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F0FDF4')]),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_facts)
        story.append(Spacer(1, 14))

        # Visual Identity & Brand Assets (VisualGuard)
        story.append(Paragraph("4. Visual Identity & Logo Standards (VisualGuard™)", h2_style))
        story.append(Paragraph(
            "<b>Official Logo:</b> The official mark is <b>SOLARIA-LEAF-V2</b>. The older round droplet mark (V1) is officially deprecated and must never be used. "
            "<b>Primary Palette:</b> Emerald Leaf (#10B981) and Deep Forest Green (#064E3B). Supporting accent: Sunrise Gold (#F59E0B). "
            "<b>Visual Compliance:</b> Unapproved third-party screenshots (e.g. YouTube video players, meme formats, unrelated device mockups) with zero Solaria branding will be automatically flagged by VisualGuard as Missing Brand Identity.",
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
        print(f"Generated Solaria guidelines PDF: {target_path}")

if __name__ == "__main__":
    generate_pdf()
