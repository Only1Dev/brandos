/**
 * BrandOS Frontend API Client.
 * All backend API communications centralized here.
 */

function getBaseUrl(): string {
  // 1. Explicit production backend URL set in Vercel / environment
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, "");
  }
  // 2. In browser local development, talk directly to FastAPI port 8000
  // to avoid Next.js internal rewrite proxy timeouts on heavy multi-agent PDF audits
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    // Deployed production environment (e.g. Vercel) fallback to Render backend
    return "https://brandos-xwh1.onrender.com";
  }
  return "https://brandos-xwh1.onrender.com";
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(typeof window !== "undefined" && localStorage.getItem("brandos_user_role")
      ? { "X-User-Role": localStorage.getItem("brandos_user_role")! }
      : {}),
    ...(typeof window !== "undefined" && localStorage.getItem("brandos_active_brand")
      ? { "X-Brand-Slug": localStorage.getItem("brandos_active_brand")! }
      : {}),
    ...(typeof window !== "undefined" && localStorage.getItem("brandos_user_email")
      ? { "X-User-Email": localStorage.getItem("brandos_user_email")! }
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
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    if (isLocal) {
      throw new Error("Backend server unreachable. Please verify BrandOS backend is running locally on port 8000.");
    } else {
      throw new Error(`Unable to connect to BrandOS API service (${baseUrl}). Please check backend status.`);
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
  getReviews: (status?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<any[]>(`/api/reviews${qs ? `?${qs}` : ""}`);
  },
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
  saveReviewerNote: (id: string, note: string) =>
    request<{ status: string; reviewer_comment: string }>(`/api/reviews/${id}/reviewer-notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
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
  deleteReview: (reviewId: string) =>
    request<any>(`/api/reviews/${reviewId}`, { method: "DELETE" }),

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
  getContentList: (brand?: string) => {
    const qs = brand ? `?brand=${brand}` : "";
    return request<any[]>(`/api/content${qs}`);
  },
  getContentDetails: (id: string) =>
    request<any>(`/api/content/${id}`),
  deleteContent: (id: string) =>
    request<any>(`/api/content/${id}`, { method: "DELETE" }),
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
  getRules: (category?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<any[]>(`/api/guidelines/rules${qs ? `?${qs}` : ""}`);
  },
  createRule: (data: any, brand?: string) => {
    const qs = brand ? `?brand=${brand}` : "";
    return request<any>(`/api/guidelines/rules${qs}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteRule: (id: string) =>
    request<any>(`/api/guidelines/rules/${id}`, { method: "DELETE" }),
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
  getFacts: (category?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<any[]>(`/api/facts${qs ? `?${qs}` : ""}`);
  },
  createFact: (data: any, brand?: string) => {
    const qs = brand ? `?brand=${brand}` : "";
    return request<any>(`/api/facts${qs}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateFact: (id: string, data: any) =>
    request<any>(`/api/facts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteFact: (id: string) =>
    request<any>(`/api/facts/${id}`, { method: "DELETE" }),

  // Claims
  getClaims: (status?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<any[]>(`/api/claims${qs ? `?${qs}` : ""}`);
  },
  createClaim: (data: any, brand?: string) =>
    request<any>("/api/claims", {
      method: "POST",
      body: JSON.stringify(data),
      headers: brand ? { "X-Brand-Slug": brand } : undefined,
    }),
  verifyClaim: (id: string) =>
    request<any>(`/api/claims/${id}/verify`, { method: "POST" }),
  transitionClaim: (id: string, new_status: string) =>
    request<any>(`/api/claims/${id}/transition?new_status=${new_status}`, { method: "PATCH" }),
  deleteClaim: (id: string) =>
    request<any>(`/api/claims/${id}`, { method: "DELETE" }),

  // Terminology
  getTerminology: (status?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status_filter", status);
    if (brand) params.set("brand", brand);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<any[]>(`/api/terminology${qs}`);
  },
  createTerminology: (data: any, brand?: string) => {
    const qs = brand ? `?brand=${encodeURIComponent(brand)}` : "";
    return request<any>(`/api/terminology${qs}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  deleteTerminology: (id: string) =>
    request<any>(`/api/terminology/${id}`, { method: "DELETE" }),

  // Assets
  getAssets: (type?: string) =>
    request<any[]>(`/api/assets${type ? `?asset_type=${type}` : ""}`),

  // Analytics
  getDashboard: (brand?: string) =>
    request<any>(`/api/analytics/dashboard${brand ? `?brand=${brand}` : ""}`),
  getGuidelineDrift: (brand?: string) =>
    request<any[]>(`/api/analytics/guideline-drift${brand ? `?brand=${brand}` : ""}`),
  getExpiringClaims: (days?: number, brand?: string) => {
    const params = new URLSearchParams();
    if (days) params.set("days", String(days));
    if (brand) params.set("brand", brand);
    const qs = params.toString();
    return request<any[]>(`/api/analytics/expiring-claims${qs ? `?${qs}` : ""}`);
  },

  // Organizations & Superadmin
  getSuperAdminOverview: () =>
    request<any>("/api/organizations/superadmin/overview"),
  getOrganizations: () =>
    request<any[]>("/api/organizations"),
  createOrganization: (data: { name: string; slug?: string; description?: string; domain?: string; primary_color?: string }) =>
    request<any>("/api/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteOrganization: (slugOrId: string) =>
    request<any>(`/api/organizations/${encodeURIComponent(slugOrId)}`, {
      method: "DELETE",
    }),

  // Audit
  getAuditLogs: (entityType?: string, action?: string, brand?: string) => {
    const params = new URLSearchParams();
    if (entityType) params.append("entity_type", entityType);
    if (action) params.append("action", action);
    if (brand) params.append("brand", brand);
    const qs = params.toString();
    return request<any[]>(`/api/audit${qs ? `?${qs}` : ""}`);
  },

  // Helpers
  getBaseUrl,
  getFileUrl: (path: string | null | undefined): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const base = getBaseUrl();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  },
};
