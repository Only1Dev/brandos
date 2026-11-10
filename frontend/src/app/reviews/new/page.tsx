"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Send,
  FileText,
  Upload,
  File,
  Image as ImageIcon,
  CheckCircle2,
  X,
  FileCode,
  Shield,
  Leaf,
  AlertTriangle,
  Download,
  Flame,
  Check,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useBrand } from "@/context/BrandContext";
import { cn } from "@/lib/utils";
import { AgentPipelineVisualizer } from "@/components/governance/AgentPipelineVisualizer";

export default function NewReviewPage() {
  const router = useRouter();
  const { activeBrand, brandConfig, currentRole } = useBrand();

  const isSolaria = activeBrand === "solaria";

  // Mode: "text" | "file"
  const [inputMode, setInputMode] = useState<"text" | "file">("text");

  // Form fields
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("instagram");
  const [contentType, setContentType] = useState("social_post");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test fixtures for Aureon
  const loadAureonDiscrepancy = () => {
    setInputMode("text");
    setTitle("Summer Campaign — Fraud Prevention Launch");
    setChannel("instagram");
    setContentType("social_post");
    setRawText(
      "Aureon is India's #1 fraud protection platform, reducing enterprise fraud by 73% and guaranteeing 100% protection."
    );
  };

  const loadOutOfDomain = () => {
    setInputMode("text");
    setTitle("Kitchen Appliance Product Description");
    setChannel("instagram");
    setContentType("social_post");
    setRawText(
      "Sujata Powermatic Plus 900-Watt Juicer Mixer Grinder with 3 jars. Perfect for making smoothies, grinding turmeric, and daily Indian kitchen cooking. 1 year warranty."
    );
  };

  const loadCrossBrandCopy = () => {
    setInputMode("text");
    if (!isSolaria) {
      // Submitting Solaria copy to Aureon
      setTitle("Solaria Cellular Hydration Post");
      setChannel("instagram");
      setContentType("social_post");
      setRawText(
        "Solaria PureHydrate provides clinical-grade cellular hydration with 3.0x electrolyte absorption and 0% sugar. Formulated for everyday physiological endurance."
      );
    } else {
      // Submitting Aureon copy to Solaria
      setTitle("Aureon Banking Security Copy");
      setChannel("instagram");
      setContentType("social_post");
      setRawText(
        "Aureon Shield delivers autonomous banking fraud detection and core banking defense intelligence for real-time transaction protection."
      );
    }
  };

  // Demo helpers for Solaria
  const loadSolariaCompliant = () => {
    setInputMode("text");
    setTitle("PureHydrate Clinical Launch Post");
    setChannel("instagram");
    setContentType("social_post");
    setRawText(
      "Solaria PureHydrate provides clinical-grade cellular hydration with 3.0x electrolyte absorption and 0% sugar. Formulated for everyday physiological endurance."
    );
  };

  const loadSolariaViolation = () => {
    setInputMode("text");
    setTitle("PureHydrate Viral Promo Copy");
    setChannel("instagram");
    setContentType("social_post");
    setRawText(
      "Solaria PureHydrate is a miracle cure for dehydration that guarantees 100% detox and provides 10.0x electrolyte absorption."
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
        setContentType("image");
      } else if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".doc")) {
        setContentType("document");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please provide a campaign or content name.");
      return;
    }

    if (inputMode === "text" && !rawText.trim()) {
      setError("Please provide content copy to review.");
      return;
    }

    if (inputMode === "file" && !selectedFile) {
      setError("Please select a file to upload (PDF, DOCX, PNG, JPG, or TXT).");
      return;
    }

    setSubmitting(true);

    try {
      let contentId: string;

      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title);
        formData.append("content_type", contentType);
        formData.append("channel", channel);
        formData.append("organization_slug", activeBrand);

        const uploaded = await api.uploadContentFile(formData);
        contentId = uploaded.id;
      } else {
        const created = await api.createContentText({
          title,
          channel,
          content_type: contentType,
          raw_text: rawText,
          organization_slug: activeBrand,
        });
        contentId = created.id;
      }

      // 2. Create review
      const review = await api.createReview(contentId);

      // 3. Trigger multi-agent governance analysis
      await api.analyzeReview(review.id);

      // 4. Redirect to review audit detail page
      router.push(`/reviews/${review.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process content submission");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reviews</span>
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={brandConfig.pdfDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Download {brandConfig.name.split(" ")[0]} Identity PDF</span>
          </a>
        </div>
      </div>

      {/* Live Multi-Agent Execution Visualizer */}
      {submitting && (
        <AgentPipelineVisualizer
          isAnalyzing={submitting}
          brandName={brandConfig.name}
        />
      )}

      {/* Active Brand Card Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-11 w-11 rounded-xl text-white flex items-center justify-center shadow-md",
              isSolaria ? "bg-emerald-600 shadow-emerald-500/20" : "bg-indigo-600 shadow-indigo-500/20"
            )}
          >
            {isSolaria ? <Leaf className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                Submit Content to {brandConfig.name} Firewall
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-slate-100 text-slate-700">
                slug: {brandConfig.slug}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Domain: {brandConfig.domain}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Governance Test Fixtures */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Pre-Loaded Test Scenarios & Draft Copies:</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Zero-Tolerance Firewall Active</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {!isSolaria ? (
            <>
              <button
                type="button"
                onClick={loadAureonDiscrepancy}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1.5"
              >
                <span>🔍 Fact & Claim Discrepancy Test (73% vs 42%, #1, 100%)</span>
              </button>
              <button
                type="button"
                onClick={loadOutOfDomain}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5"
                title="Submits out-of-domain copy to evaluate zero-tolerance disqualification"
              >
                <Flame className="h-3 w-3 text-rose-600" />
                <span>🚫 Out-of-Domain Rejection Test (Kitchen Appliance Copy → Score 0/100)</span>
              </button>
              <button
                type="button"
                onClick={loadCrossBrandCopy}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors flex items-center gap-1.5"
                title="Submits cross-tenant copy to evaluate boundary enforcement"
              >
                <span>⚠️ Cross-Tenant Misalignment Test (Solaria Copy → Score 0/100)</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={loadSolariaCompliant}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <Check className="h-3 w-3 text-emerald-600" />
                <span>✅ PureHydrate Compliant Copy (High Score Pass)</span>
              </button>
              <button
                type="button"
                onClick={loadSolariaViolation}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-colors flex items-center gap-1.5"
              >
                <span>⚠️ Unverified Claims Test (Miracle Cure, 100% Detox)</span>
              </button>
              <button
                type="button"
                onClick={loadCrossBrandCopy}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5"
                title="Submits cross-tenant copy to evaluate boundary enforcement"
              >
                <Flame className="h-3 w-3 text-rose-600" />
                <span>🚫 Cross-Tenant Misalignment Test (Aureon Copy → Score 0/100)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Campaign Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign / Content Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Growth Campaign — Product Launch Ad"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">X / Twitter</option>
              <option value="website">Corporate Website</option>
              <option value="blog">Engineering Blog</option>
              <option value="email">Customer Newsletter</option>
              <option value="press_release">Press Release</option>
            </select>
          </div>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              inputMode === "text"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Direct Text / Copy</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("file")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              inputMode === "file"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload File (PDF / Image / DOCX)</span>
          </button>
        </div>

        {/* Text Input Mode */}
        {inputMode === "text" ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Marketing Copy or Article Body <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {rawText.length > 0 ? `${rawText.trim().split(/\s+/).length} words` : "0 words"}
              </span>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste draft copy, advertisement text, press release, or social media caption..."
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
            />
          </div>
        ) : (
          /* File Upload Mode */
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 bg-slate-50/50 transition-colors relative cursor-pointer">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="h-9 w-9 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : "Click or Drag File to Upload"}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Supports Visual Creatives (PNG, JPG, WEBP), Documents (PDF, DOCX) and Text files (Up to 25MB)
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold">{selectedFile.name}</span>
                  <span className="text-[10px] text-indigo-500 font-mono">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Audited by Fact, Brand, Terminology, Visual & Devil&apos;s Advocate Agents</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50",
              isSolaria
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            <span>{submitting ? "Running Governance Firewall..." : "Submit to Firewall"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
