// ============================================================
// BrandOS Type Definitions
// Matches backend API schemas
// ============================================================

// --- Enums ---

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ReviewStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export type ContentType = 'text' | 'html' | 'markdown' | 'image' | 'video' | 'pdf' | 'document';

export type Channel = 'web' | 'email' | 'social' | 'print' | 'advertising' | 'internal';

export type ClaimStatus = 'active' | 'expired' | 'pending_review' | 'revoked';

export type FactStatus = 'verified' | 'unverified' | 'expired' | 'disputed';

export type AssetStatus = 'approved' | 'pending' | 'deprecated' | 'rejected';

export type UserRole = 'owner' | 'admin' | 'manager' | 'reviewer' | 'viewer';

export type FindingType =
  | 'unsupported_claim'
  | 'outdated_fact'
  | 'terminology_violation'
  | 'guideline_violation'
  | 'asset_misuse'
  | 'accessibility_issue'
  | 'tone_mismatch'
  | 'legal_risk';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'review_started'
  | 'review_completed'
  | 'override'
  | 'login'
  | 'logout';

// --- Core Entities ---

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  org_id: string;
  created_at: string;
  updated_at: string;
}

// --- Knowledge Base ---

export interface Guideline {
  id: string;
  org_id: string;
  name: string;
  description: string;
  category: string;
  version: number;
  is_active: boolean;
  rules: GuidelineRule[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuidelineRule {
  id: string;
  guideline_id: string;
  title: string;
  description: string;
  severity: Severity;
  pattern?: string;
  examples?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Fact {
  id: string;
  org_id: string;
  name: string;
  value: string;
  source: string;
  status: FactStatus;
  valid_from: string;
  valid_until?: string;
  category?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  org_id: string;
  statement: string;
  supporting_evidence: string;
  status: ClaimStatus;
  valid_from: string;
  valid_until?: string;
  category?: string;
  regions?: string[];
  channels?: Channel[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TerminologyRule {
  id: string;
  org_id: string;
  preferred_term: string;
  deprecated_alternatives: string[];
  forbidden_terms: string[];
  context?: string;
  category?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  org_id: string;
  name: string;
  file_url: string;
  thumbnail_url?: string;
  mime_type: string;
  file_size: number;
  version: number;
  status: AssetStatus;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// --- Content & Reviews ---

export interface Content {
  id: string;
  org_id: string;
  name: string;
  content_type: ContentType;
  channel: Channel;
  body?: string;
  file_url?: string;
  current_version: number;
  status: 'draft' | 'in_review' | 'approved' | 'published';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  body?: string;
  file_url?: string;
  change_summary?: string;
  created_by: string;
  created_at: string;
}

export interface Review {
  id: string;
  org_id: string;
  content_id: string;
  content?: Content;
  version_id: string;
  version?: ContentVersion;
  name: string;
  status: ReviewStatus;
  governance_score?: number;
  channel: Channel;
  assigned_to?: string;
  assigned_user?: User;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  started_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  review_id: string;
  type: FindingType;
  severity: Severity;
  title: string;
  description: string;
  detected_text?: string;
  start_offset?: number;
  end_offset?: number;
  confidence: number;
  is_overridden: boolean;
  override_reason?: string;
  overridden_by?: string;
  evidence?: Evidence[];
  suggestion?: Suggestion;
  created_at: string;
  updated_at: string;
}

export interface Evidence {
  id: string;
  finding_id: string;
  source_type: 'fact' | 'claim' | 'guideline_rule' | 'terminology_rule' | 'asset';
  source_id: string;
  source_name: string;
  relevance_score: number;
  excerpt?: string;
  created_at: string;
}

export interface Suggestion {
  id: string;
  finding_id: string;
  original_text: string;
  suggested_text: string;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  edited_text?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  user?: User;
  parent_id?: string;
  body: string;
  replies?: ReviewComment[];
  created_at: string;
  updated_at: string;
}

// --- Audit ---

export interface AuditEvent {
  id: string;
  org_id: string;
  user_id: string;
  user?: User;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// --- Analytics ---

export interface GovernanceDashboard {
  governance_score: number;
  fact_integrity: number;
  asset_compliance: number;
  accessibility_score: number;
  guideline_clarity: number;
  recent_reviews: Review[];
  recurring_issues: RecurringIssue[];
  risk_trends: RiskTrendPoint[];
}

export interface RecurringIssue {
  type: FindingType;
  title: string;
  count: number;
  severity: Severity;
  trend: 'up' | 'down' | 'stable';
}

export interface RiskTrendPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  score: number;
}

export interface AnalyticsData {
  recurring_issues: RecurringIssue[];
  guideline_drift: GuidelineDriftItem[];
  expiring_claims: ExpiringClaim[];
  violation_breakdown: ViolationBreakdown[];
  violation_trend: RiskTrendPoint[];
}

export interface GuidelineDriftItem {
  rule_id: string;
  rule_title: string;
  guideline_name: string;
  violation_count: number;
  violation_rate: number;
  recommendation: string;
}

export interface ExpiringClaim {
  claim_id: string;
  statement: string;
  valid_until: string;
  days_remaining: number;
  affected_content_count: number;
}

export interface ViolationBreakdown {
  type: FindingType;
  label: string;
  count: number;
  percentage: number;
}

// --- API Response Types ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}
