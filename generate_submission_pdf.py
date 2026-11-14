import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfgen import canvas

pdf_path = r"C:\Users\Shivu\.gemini\antigravity\scratch\brandos\BrandOS_Round3_Product_Submission.pdf"

class NumberedCanvas(canvas.Canvas):
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
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 755, "BrandOS Enterprise — Round 3 Final Product Submission")
            self.drawRightString(612 - 54, 755, "Team We Code Coders")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 748, 612 - 54, 748)
        # Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)
        self.drawString(54, 32, "Confidential • Hackathon 2026 Evaluation Submission")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()

doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=54,
    rightMargin=54,
    topMargin=54,
    bottomMargin=54
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "DocTitle",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=24,
    textColor=colors.HexColor("#0F172A")
)

subtitle_style = ParagraphStyle(
    "DocSubTitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10,
    leading=14,
    textColor=colors.HexColor("#475569")
)

h1_style = ParagraphStyle(
    "Heading1_Custom",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=16,
    textColor=colors.HexColor("#1E293B"),
    spaceBefore=12,
    spaceAfter=5,
    keepWithNext=True
)

body_style = ParagraphStyle(
    "Body_Custom",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor("#334155"),
    spaceAfter=5
)

bullet_style = ParagraphStyle(
    "Bullet_Custom",
    parent=body_style,
    leftIndent=12,
    firstLineIndent=-12,
    spaceAfter=3
)

story = []

# Title & Metadata Card
story.append(Paragraph("BrandOS Enterprise", title_style))
story.append(Paragraph("Autonomous Pre-Publication Brand Governance Firewall • Round 3 Final Product Submission", subtitle_style))
story.append(Spacer(1, 8))

meta_data = [
    [Paragraph("<b>Team:</b> Team We Code Coders", body_style), Paragraph('<b>Live Application:</b> <font color="#4F46E5"><u>https://brandos-jet.vercel.app</u></font>', body_style)],
    [Paragraph('<b>Repository:</b> <font color="#4F46E5"><u>https://github.com/Only1Dev/brandos</u></font>', body_style), Paragraph('<b>Backend API Docs:</b> <font color="#4F46E5"><u>https://brandos-xwh1.onrender.com/docs</u></font>', body_style)]
]
t_meta = Table(meta_data, colWidths=[240, 264])
t_meta.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
    ("BOX", (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
    ("INNERGRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
]))
story.append(t_meta)
story.append(Spacer(1, 10))

# 1. Executive Summary
story.append(Paragraph("1. Executive Summary & Market Fit", h1_style))
story.append(Paragraph("Modern enterprises deploy Generative AI and distributed marketing teams to produce thousands of assets monthly across dozens of channels. Existing market solutions (Grammarly, Jasper, social listening) only check surface grammar or conduct post-publication audits after legal penalties or reputation damage have already occurred.", body_style))
story.append(Paragraph("<b>BrandOS is the first autonomous zero-tolerance pre-publication brand governance firewall.</b> It intercepts text copy, social posts, proposals, PDFs, visual assets, and videos <i>prior to publication</i>, evaluating them across a 5-axis governance compliance vector: Domain & Entity Alignment, Factual Ground Truth (TruthMark™), Brand Voice & Tone, Lexicon Control, and Multimodal Visual Standards.", body_style))

# 2. Three Round-2 Improvements Delivered
story.append(Paragraph("2. The Three Round-2 Improvements Delivered", h1_style))
story.append(Paragraph("At Round 2, Team We Code Coders committed to delivering three specific capabilities. All three are fully built, deployed, and operational on the production web platform:", body_style))

deliv_data = [
    [Paragraph("<b>Committed Improvement</b>", body_style), Paragraph("<b>Implementation & Verification Details</b>", body_style), Paragraph("<b>Status</b>", body_style)],
    [
        Paragraph("<b>1. Video Upload & Multimodal Analysis</b><br/><font size=\"7\" color=\"#64748B\">Check videos for consistency, errors, & visual violations</font>", body_style),
        Paragraph("Integrated multimodal pipeline supporting MP4/WebM uploads. Leverages Google Gemini 1.5 Pro to sample keyframes, transcribe spoken dialogue, inspect on-screen graphic overlays, and cross-reference spoken facts against Brand Brain.<br/><i>Verification: Test with samples/video/brand_campaign_sample.mp4 on /reviews/new</i>", body_style),
        Paragraph('<font color="#059669"><b>100% Delivered</b></font>', body_style)
    ],
    [
        Paragraph("<b>2. Content Inventory Management</b><br/><font size=\"7\" color=\"#64748B\">Organise all brand content in one place to search, manage & track</font>", body_style),
        Paragraph("Built dedicated enterprise Content Hub (/content). Centralizes all copy, campaigns, images, and videos in one searchable repository with channel/status filters, metadata tags, instant review detail drawer, and CSV audit export.<br/><i>Verification: Open Content Hub in navigation</i>", body_style),
        Paragraph('<font color="#059669"><b>100% Delivered</b></font>', body_style)
    ],
    [
        Paragraph("<b>3. AI Improvements & Auto-Remediation</b><br/><font size=\"7\" color=\"#64748B\">Improve checking & correction suggestions via user feedback</font>", body_style),
        Paragraph("Elevated 1-click Auto-Remediation engine. Uses reviewer feedback, administrative directives, and immutable audit logs to intelligently rewrite non-compliant copy into verified 100/100 publication-ready phrasing while aligning hallucinated numbers to TruthMark ground truth.<br/><i>Verification: Click Auto-Remediate on any flagged review</i>", body_style),
        Paragraph('<font color="#059669"><b>100% Delivered</b></font>', body_style)
    ]
]
t_deliv = Table(deliv_data, colWidths=[140, 304, 60])
t_deliv.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#EEF2FF")),
    ("TEXTCOLOR", (0,0), (-1,0), colors.HexColor("#1E1B4B")),
    ("BOX", (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
    ("INNERGRID", (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 5),
    ("RIGHTPADDING", (0,0), (-1,-1), 5),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
]))
story.append(t_deliv)
story.append(Spacer(1, 8))

# 3. Technical Architecture
story.append(Paragraph("3. Technical Architecture & Multi-Agent Swarm", h1_style))
story.append(Paragraph("BrandOS coordinates specialized autonomous agents orchestrated through an asynchronous evaluation pipeline:", body_style))
story.append(Paragraph("• <b>Brand Voice Agent (Llama 3.3 70B via Groq):</b> Sub-second evaluation of brand voice fingerprint, tone alignment, domain perimeter defense, and mandatory guideline statements.", bullet_style))
story.append(Paragraph("• <b>Fact Grounding Agent (TruthMark™ Engine):</b> Sentence-level topic isolation ensuring numerical propositions are strictly cross-checked against subject-specific approved facts, preventing cross-topic metric false positives.", bullet_style))
story.append(Paragraph("• <b>Multimodal Video & Vision Agent (Google Gemini 1.5 Pro):</b> High-fidelity keyframe extraction, audio speech transcription, visual logo integrity checks, and WCAG AA contrast ratio compliance.", bullet_style))
story.append(Paragraph("• <b>Devil's Advocate Agent:</b> Adversarially stress-tests potential findings against channel nuances to eliminate friction for creators.", bullet_style))
story.append(Paragraph("• <b>Deterministic Policy Engine & Audit Ledger:</b> Regex and token-level checks for deprecated terminology, paired with an immutable PostgreSQL audit trail.", bullet_style))

# 4. Reliability & Error Trapping
story.append(Paragraph("4. Reliability Under Normal & Adversarial Use", h1_style))
story.append(Paragraph("To ensure flawless judge evaluation without team intervention, BrandOS incorporates enterprise reliability safeguards:", body_style))
story.append(Paragraph("• <b>Double-Click & Concurrent Submission Protection:</b> Atomic state locks disable action buttons and reject duplicate API dispatches across content submission, analysis triggers, fact updates, rule creation, and auto-remediation.", bullet_style))
story.append(Paragraph("• <b>Graceful Client Error & 404 Boundaries:</b> Dedicated Next.js error.tsx and not-found.tsx boundaries catch unexpected client exceptions without breaking session state or dropping tenant boundaries.", bullet_style))
story.append(Paragraph("• <b>Multi-Tenant Perimeter Isolation:</b> Dynamic tenant scoping ensures complete data isolation. Self-registered brands from the homepage require SuperAdmin authorization before public listing.", bullet_style))
story.append(Paragraph("• <b>Destructive Action Safeguards:</b> SuperAdmin firm deletion requires typing CONFIRM in an Unstop-style verification modal to prevent accidental workspace destruction.", bullet_style))

# 5. Roadmap
story.append(Paragraph("5. Product Roadmap & Future Milestones", h1_style))
story.append(Paragraph("• <b>Q1 2027 — In-Tool Creative Extensions:</b> Canva & Figma pre-publication plugins, plus Microsoft 365 add-ins.", bullet_style))
story.append(Paragraph("• <b>Q2 2027 — Autonomous Publishing Webhooks:</b> Direct clearance syndication to LinkedIn Pages, Twitter/X, and CMS platforms.", bullet_style))
story.append(Paragraph("• <b>Q3 2027 — Enterprise Identity & SCIM:</b> SAML 2.0 / Okta / Azure AD integrations for automated organization provisioning.", bullet_style))

doc.build(story, canvasmaker=NumberedCanvas)
print("PDF successfully generated at:", pdf_path)
print("File size:", os.path.getsize(pdf_path), "bytes")
