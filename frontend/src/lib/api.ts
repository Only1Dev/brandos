/**
 * BrandOS Frontend API Client.
 * All backend API communications centralized here.
 */

const BASE_URL = typeof window !== "undefined"
  ? "" // Use same-origin relative URL in browser to route through Next.js proxy rewrite
  : (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000");

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(typeof window !== "undefined" && localStorage.getItem("brandos_user_role")
      ? { "X-User-Role": localStorage.getItem("brandos_user_role")! }
      : {}),
    ...(typeof window !== "undefined" && localStorage.getItem("brandos_active_brand")
      ? { "X-Brand-Slug": localStorage.getItem("brandos_active_brand")! }
      : {}),
    ...(options.headers as Record<string, string>),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    // If relative rewrite fails or server is offline, fallback to direct localhost:8000
    if (typeof window !== "undefined" && !url.startsWith("http")) {
      try {
        const directUrl = `http://localhost:8000${endpoint}`;
        response = await fetch(directUrl, {
          ...options,
          headers,
        });
      } catch (fallbackErr: any) {
        throw new Error("Backend server unreachable. Please verify BrandOS backend is running on port 8000.");
      }
    } else {
      throw new Error("Backend server unreachable. Please verify BrandOS backend is running on port 8000.");
    }
  }

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Reviews
  getReviews: (status?: string) =>
    request<any[]>(`/api/reviews${status ? `?status=${status}` : ""}`),
  getReviewDetails: (id: string) =>
    request<any>(`/api/reviews/${id}`),
  createReview: (contentId: string) =>
    request<{ id: string; status: string }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ content_id: contentId }),
    }),
  analyzeReview: (id: string) =>
    request<any>(`/api/reviews/${id}/analyze`, { method: "POST" }),
  approveReview: (id: string) =>
    request<any>(`/api/reviews/${id}/approve`, { method: "POST" }),
  rejectReview: (id: string, comment: string) =>
    request<any>(`/api/reviews/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),
  autoRemediateReview: (id: string) =>
    request<{
      original_text: string;
      remediated_text: string;
      changes_made: string[];
      predicted_score: number;
    }>(`/api/reviews/${id}/auto-remediate`, { method: "POST" }),
  applyRemediation: (id: string, remediated_text: string) =>
    request<any>(`/api/reviews/${id}/apply-remediation`, {
      method: "POST",
      body: JSON.stringify({ remediated_text }),
    }),

  // Findings
  acceptSuggestion: (findingId: string) =>
    request<any>(`/api/findings/${findingId}/accept-suggestion`, { method: "POST" }),
  overrideFinding: (findingId: string, reason: string) =>
    request<any>(`/api/findings/${findingId}/override`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getFindingEvidence: (findingId: string) =>
    request<any>(`/api/findings/${findingId}/evidence`),

  // Content
  getContentList: () =>
    request<any[]>("/api/content"),
  getContentDetails: (id: string) =>
    request<any>(`/api/content/${id}`),
  createContentText: (data: { title: string; raw_text: string; channel?: string; content_type?: string; organization_slug?: string }) =>
    request<any>("/api/content/text", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadContentFile: (formData: FormData) =>
    request<any>("/api/content/upload", {
      method: "POST",
      body: formData,
    }),

  // Guidelines & Rules
  getRules: (category?: string) =>
    request<any[]>(`/api/guidelines/rules${category ? `?category=${category}` : ""}`),
  createRule: (data: any) =>
    request<any>("/api/guidelines/rules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  uploadGuideline: (formData: FormData) =>
    request<any>("/api/guidelines/upload", {
      method: "POST",
      body: formData,
    }),
  loadDemoGuidelinePdf: (brand?: string) =>
    request<any>(`/api/guidelines/load-demo-pdf${brand ? `?brand=${brand}` : ""}`, {
      method: "POST",
    }),
  runStressTest: (data: { brand_slug: string; attack_type: string; custom_prompt?: string }) =>
    request<any>("/api/guidelines/stress-test", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Facts
  getFacts: (category?: string) =>
    request<any[]>(`/api/facts${category ? `?category=${category}` : ""}`),
  createFact: (data: any) =>
    request<any>("/api/facts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteFact: (id: string) =>
    request<any>(`/api/facts/${id}`, { method: "DELETE" }),

  // Claims
  getClaims: (status?: string) =>
    request<any[]>(`/api/claims${status ? `?status=${status}` : ""}`),
  createClaim: (data: any) =>
    request<any>("/api/claims", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Terminology
  getTerminology: (status?: string) =>
    request<any[]>(`/api/terminology${status ? `?status_filter=${status}` : ""}`),
  createTerminology: (data: any) =>
    request<any>("/api/terminology", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteTerminology: (id: string) =>
    request<any>(`/api/terminology/${id}`, { method: "DELETE" }),

  // Assets
  getAssets: (type?: string) =>
    request<any[]>(`/api/assets${type ? `?asset_type=${type}` : ""}`),

  // Analytics
  getDashboard: () =>
    request<any>("/api/analytics/dashboard"),
  getGuidelineDrift: () =>
    request<any[]>("/api/analytics/guideline-drift"),
  getExpiringClaims: (days?: number) =>
    request<any[]>(`/api/analytics/expiring-claims${days ? `?days=${days}` : ""}`),

  // Audit
  getAuditLogs: (entityType?: string, action?: string) => {
    const params = new URLSearchParams();
    if (entityType) params.append("entity_type", entityType);
    if (action) params.append("action", action);
    return request<any[]>(`/api/audit?${params.toString()}`);
  },
};
