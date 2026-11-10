"""
Generate official Aureon Brand Guidelines PDF for BrandOS Core ingestion demo.
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
    pdf_path = os.path.join(target_dir, "Aureon_Official_Brand_Guidelines_2026.pdf")
    
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0EA5E9'),
        fontName='Helvetica-Bold'
    )
    
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )
    
    story = []
    
    # Header
    story.append(Paragraph("AUREON TECHNOLOGIES", subtitle_style))
    story.append(Paragraph("Official Brand Guidelines & Governance Policy (2026)", title_style))
    story.append(Paragraph("Confidential & Proprietary • Version 2.4 • Effective Q1 2026", body_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0EA5E9'), spaceAfter=15))
    
    # 1. Mission & Voice
    story.append(Paragraph("1. Brand Voice & Editorial Tone", h2_style))
    story.append(Paragraph(
        "Aureon's voice is authoritative, precise, confident, and evidence-grounded. We communicate complex AI and fraud security architecture with clarity. We never use aggressive, predatory, or hyper-sensationalist language. All performance assertions must cite verified benchmarks.",
        body_style
    ))
    story.append(Spacer(1, 8))
    
    # 2. Strict Policy Restrictions
    story.append(Paragraph("2. Prohibited Guarantees & Superlatives (RULE-031 & RULE-017)", h2_style))
    story.append(Paragraph(
        "• PROHIBITED ABSOLUTES: Content creators, agencies, and partners must NEVER promise '100% protection', 'guaranteed safety', 'zero risk', or 'bulletproof security'. Security is probabilistic.<br/>"
        "• PROHIBITED SUPERLATIVES: Claims such as 'India's #1 fraud platform', 'world's best', or 'market leader' are strictly forbidden unless verified by third-party analyst audit (Gartner/Forrester) with formal attribution.",
        body_style
    ))
    story.append(Spacer(1, 8))
    
    # 3. Controlled Vocabulary
    story.append(Paragraph("3. Controlled Terminology (TERM-001 - TERM-005)", h2_style))
    story.append(Paragraph(
        "• Use 'Fraud Prevention Platform' instead of 'Fraud Protection Platform'.<br/>"
        "• Refer to our core intelligence engine as 'Aureon Shield™', never 'the Aureon software' or 'the bot'.<br/>"
        "• Use 'Autonomous Threat Defense' instead of 'Automated Blocking'.",
        body_style
    ))
    story.append(Spacer(1, 8))
    
    # 4. Verified Numerical Benchmarks
    story.append(Paragraph("4. Approved Organizational Facts (FACT-042 & FACT-089)", h2_style))
    story.append(Paragraph(
        "• Fraud Reduction Benchmark: Aureon Shield achieves up to 42.0% enterprise fraud loss reduction (measured across 18 enterprise banking partners in 2025). Do not state 73% or 80%.<br/>"
        "• Latency Benchmark: Sub-12ms decision response time.<br/>"
        "• Transaction Coverage: Audited across 500M+ real-time transactions in APAC region.",
        body_style
    ))
    story.append(Spacer(1, 8))
    
    # 5. Visual Identity & Color Palette
    story.append(Paragraph("5. Visual Identity, Color System & Logos", h2_style))
    story.append(Paragraph(
        "• Primary Brand Color: Aureon Deep Navy (#0F172A).<br/>"
        "• Accent Signal Color: Aureon Cyan (#0EA5E9).<br/>"
        "• Background Contrast: Ensure minimum 4.5:1 WCAG AA contrast ratio for all textual overlays on visual assets.<br/>"
        "• Logo Isolation: Maintain 24px clear space around the Aureon wordmark on all social and banner creatives.",
        body_style
    ))
    
    doc.build(story)
    print("Generated:", pdf_path)
    return pdf_path

if __name__ == "__main__":
    generate_pdf()
