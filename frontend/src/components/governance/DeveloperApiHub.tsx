"use client";

import { useState } from "react";
import {
  Terminal,
  Code2,
  Copy,
  Check,
  Play,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  GitBranch,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useBrand } from "@/context/BrandContext";

export function DeveloperApiHub() {
  const { activeBrand, brandConfig } = useBrand();
  const [activeTab, setActiveTab] = useState<"curl" | "github" | "precommit" | "cms" | "tester">("curl");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Tester State
  const [testMode, setTestMode] = useState<"compliant" | "violation">("compliant");
  const [testChannel, setTestChannel] = useState("press_release");
  const [testing, setTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);

  const brandSlug = activeBrand || "aureon";
  const apiBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://brandos-jet.vercel.app";

  const compliantSample =
    brandSlug === "aureon"
      ? "Aureon Shield delivers autonomous threat defense for core banking systems, achieving 42.0% enterprise fraud loss reduction with sub-15ms decision latency."
      : "Solaria PureHydrate provides clinical-grade cellular hydration with 3.0x electrolyte absorption and 0% sugar for metabolic performance.";

  const violationSample =
    brandSlug === "aureon"
      ? "Unlike our garbage competitors Stripe and Adyen who scam clients, Aureon is the only 100% unbreakable firewall guaranteeing 0 fraud ever! Master key: sk_live_9901."
      : "Solaria PureHydrate cures Stage 4 cancer, eliminates Type 2 diabetes within 24 hours, and is 100% clinically proven as a miracle medical cure.";

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runLiveTest = async () => {
    try {
      setTesting(true);
      setTestResponse(null);
      const content = testMode === "compliant" ? compliantSample : violationSample;
      const res = await fetch(`${apiBaseUrl}/api/v1/firewall/inspect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer brandos_live_${brandSlug}_demo_key`,
        },
        body: JSON.stringify({
          brand: brandSlug,
          content: content,
          channel: testChannel,
          strict_mode: true,
        }),
      });
      const data = await res.json();
      setTestResponse(data);
    } catch (e: any) {
      setTestResponse({
        error: true,
        message: e.message || "Failed to call headless inspect API",
      });
    } finally {
      setTesting(false);
    }
  };

  const curlSnippet = `curl -X POST "${apiBaseUrl}/api/v1/firewall/inspect" \\
  -H "Authorization: Bearer brandos_live_${brandSlug}_demo_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brand": "${brandSlug}",
    "channel": "press_release",
    "content": "${compliantSample}"
  }'`;

  const githubActionsSnippet = `name: BrandOS Governance Firewall
on:
  pull_request:
    paths: ['copy/**', 'marketing/**', 'content/**']
  push:
    branches: [main]

jobs:
  pre-publication-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Inspect Content against ${brandConfig.name} Brand Brain
        id: brandos_firewall
        run: |
          PAYLOAD=$(cat marketing/press_release.md | jq -s -R .)
          RESPONSE=$(curl -s -X POST "${apiBaseUrl}/api/v1/firewall/inspect" \\
            -H "Authorization: Bearer \${{ secrets.BRANDOS_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d "{\\"brand\\": \\"${brandSlug}\\", \\"content\\": $PAYLOAD}")
          
          echo "$RESPONSE" | jq .
          EXIT_CODE=$(echo "$RESPONSE" | jq -r .exit_code)
          if [ "$EXIT_CODE" != "0" ]; then
            echo "❌ BrandOS Firewall Blocked Publication: Violations detected!"
            exit 1
          fi
          echo "✅ BrandOS Firewall Approved: TruthMark cryptographic seal verified."`;

  const preCommitSnippet = `#!/usr/bin/env bash
# .git/hooks/pre-commit
# BrandOS Enterprise Pre-Commit Hook

echo "🛡️  Checking staged marketing collateral against ${brandConfig.name} Brand Brain..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(md|txt|json)$')
if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

STAGED_CONTENT=$(git diff --cached | jq -s -R .)

RESPONSE=$(curl -s -X POST "${apiBaseUrl}/api/v1/firewall/inspect" \\
  -H "Authorization: Bearer \${BRANDOS_API_KEY:-brandos_local_dev}" \\
  -H "Content-Type: application/json" \\
  -d "{\\"brand\\": \\"${brandSlug}\\", \\"content\\": $STAGED_CONTENT}")

EXIT_CODE=$(echo "$RESPONSE" | jq -r .exit_code)
if [ "$EXIT_CODE" != "0" ]; then
  echo "🚨 Commit rejected by BrandOS Governance Firewall!"
  echo "$RESPONSE" | jq '{decision, governance_score, critical_findings}'
  exit 1
fi

echo "✨ Passed BrandOS Pre-Commit Inspection."
exit 0`;

  const cmsSnippet = `// Contentful / Sanity / Strapi Pre-Publish Webhook Handler
// Triggered on 'publish' event before draft goes live

export default async function handler(req, res) {
  const { entry } = req.body;
  const copyText = entry.fields.bodyText?.['en-US'] || '';

  // Forward to BrandOS Headless Inspection Endpoint
  const brandosRes = await fetch('${apiBaseUrl}/api/v1/firewall/inspect', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.BRANDOS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      brand: '${brandSlug}',
      content: copyText,
      channel: entry.fields.channel || 'website',
      strict_mode: true
    }),
  });

  const inspection = await brandosRes.json();

  if (inspection.exit_code !== 0) {
    // Abort CMS publication and return detailed feedback to author
    return res.status(422).json({
      error: 'BrandOS Firewall Rejection',
      score: inspection.governance_score,
      critical_findings: inspection.critical_findings,
      findings: inspection.findings,
      truthmark_signature: inspection.truthmark_signature
    });
  }

  // Attach cryptographic seal metadata to CMS record
  return res.status(200).json({
    status: 'APPROVED_FOR_BROADCAST',
    truthmark_signature: inspection.truthmark_signature
  });
}`;

  return (
    <div id="developer-api" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-indigo-600" />
            <span>Headless API, CI/CD Pre-Commit Webhooks &amp; Developer Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Embed BrandOS directly into engineering pipelines, GitHub Actions, Figma plugins, and CMS pre-publish hooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>POST /api/v1/firewall/inspect</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("curl")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "curl"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>cURL CLI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("github")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "github"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span>GitHub Actions CI/CD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("precommit")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "precommit"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Git Pre-Commit Hook</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cms")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "cms"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>CMS Webhook (Contentful/Sanity)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tester")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "tester"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          }`}
        >
          <Play className="h-3.5 w-3.5" />
          <span>Live Webhook Sandbox Runner</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-200 font-bold">
            Interactive
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "curl" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Direct shell invocation for command line pipelines and Docker containers:</span>
            <button
              onClick={() => copyToClipboard(curlSnippet, "curl")}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "curl" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === "curl" ? "Copied!" : "Copy cURL"}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed shadow-inner">
            <code>{curlSnippet}</code>
          </pre>
        </div>
      )}

      {activeTab === "github" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Add this workflow to <code>.github/workflows/brandos.yml</code> to fail PRs on brand drift:</span>
            <button
              onClick={() => copyToClipboard(githubActionsSnippet, "github")}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "github" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === "github" ? "Copied!" : "Copy Workflow"}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-[380px] overflow-y-auto shadow-inner">
            <code>{githubActionsSnippet}</code>
          </pre>
        </div>
      )}

      {activeTab === "precommit" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Install locally in <code>.git/hooks/pre-commit</code> to prevent off-brand commits before they leave the developer machine:</span>
            <button
              onClick={() => copyToClipboard(preCommitSnippet, "precommit")}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "precommit" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === "precommit" ? "Copied!" : "Copy Hook"}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-sky-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-[380px] overflow-y-auto shadow-inner">
            <code>{preCommitSnippet}</code>
          </pre>
        </div>
      )}

      {activeTab === "cms" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Deploy as a serverless webhook in Next.js / AWS Lambda for Contentful or Sanity:</span>
            <button
              onClick={() => copyToClipboard(cmsSnippet, "cms")}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "cms" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === "cms" ? "Copied!" : "Copy Webhook"}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-[380px] overflow-y-auto shadow-inner">
            <code>{cmsSnippet}</code>
          </pre>
        </div>
      )}

      {activeTab === "tester" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Interactive CI/CD Pre-Commit Webhook Simulator
                </div>
                <div className="text-[11px] text-slate-500">
                  Execute a real HTTP POST request to <code>/api/v1/firewall/inspect</code> and inspect machine exit codes.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTestMode("compliant")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    testMode === "compliant"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  Compliant Copy (Exit 0)
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode("violation")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    testMode === "violation"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  Catastrophic Violation (Exit 1)
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-800">
              {testMode === "compliant" ? compliantSample : violationSample}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={testing}
                onClick={runLiveTest}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {testing ? <RotateCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>{testing ? "Inspecting via Headless Firewall..." : "Execute Headless Inspection"}</span>
              </button>
            </div>
          </div>

          {testResponse && (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 font-mono text-xs shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">HTTP 200 OK — Headless Payload</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      testResponse.exit_code === 0
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    CI/CD EXIT CODE: {testResponse.exit_code} ({testResponse.cicd_status})
                  </span>
                </div>
                <span className="text-slate-500 text-[11px]">{testResponse.latency_ms} ms</span>
              </div>

              <pre className="text-emerald-400 overflow-x-auto text-[11px] leading-relaxed max-h-[300px] overflow-y-auto">
                <code>{JSON.stringify(testResponse, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
