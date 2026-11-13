"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Check,
  Lock,
  Sliders,
  CheckCircle2,
  Server,
  Save,
  Sparkles,
  Sun,
  Moon,
  UserPlus,
  X,
  Mail,
  User,
  Building,
  CheckSquare,
  Square,
  ShieldAlert,
  RotateCw,
} from "lucide-react";
import { useBrand, UserProfile, UserRole, RolePermissions } from "@/context/BrandContext";

export default function SettingsPage() {
  const {
    activeBrand,
    brandConfig,
    currentRole,
    currentUser,
    brandUsers,
    themeMode,
    setThemeMode,
    rolePermissions,
    updateRolePermissions,
    addTeamMember,
  } = useBrand();

  const isSuperAdmin = currentRole === "superadmin";
  const isAdmin = currentRole === "admin" || isSuperAdmin;

  // Local state for interactive role permission editing
  const [localPerms, setLocalPerms] = useState<RolePermissions>(rolePermissions);
  const [savedPermsBaseline, setSavedPermsBaseline] = useState<RolePermissions>(rolePermissions);
  const [permsSaved, setPermsSaved] = useState(false);

  // Sync baseline when brand or rolePermissions change
  useEffect(() => {
    setLocalPerms(rolePermissions);
    setSavedPermsBaseline(rolePermissions);
  }, [rolePermissions, activeBrand]);

  // Dynamic dirty check: true only if current localPerms differs from saved baseline
  const isRoleDirty = JSON.stringify(localPerms) !== JSON.stringify(savedPermsBaseline);

  // Local state for approval thresholds
  const [minScoreThreshold, setMinScoreThreshold] = useState<number>(85);
  const [requireDualApproval, setRequireDualApproval] = useState<boolean>(true);
  const [baselineScore, setBaselineScore] = useState<number>(85);
  const [baselineDualApproval, setBaselineDualApproval] = useState<boolean>(true);
  const [thresholdsSaved, setThresholdsSaved] = useState(false);

  // Load saved thresholds on brand change
  useEffect(() => {
    const savedThresholds = localStorage.getItem(`brandos_thresholds_${activeBrand}`);
    if (savedThresholds) {
      try {
        const parsed = JSON.parse(savedThresholds);
        const score = parsed.minScoreThreshold !== undefined ? Number(parsed.minScoreThreshold) : 85;
        const dual = parsed.requireDualApproval !== undefined ? Boolean(parsed.requireDualApproval) : true;
        setMinScoreThreshold(score);
        setBaselineScore(score);
        setRequireDualApproval(dual);
        setBaselineDualApproval(dual);
      } catch {
        // ignore
      }
    } else {
      setMinScoreThreshold(85);
      setBaselineScore(85);
      setRequireDualApproval(true);
      setBaselineDualApproval(true);
    }
  }, [activeBrand]);

  // Dynamic dirty check: true only if current threshold differs from saved baseline
  const isThresholdDirty =
    minScoreThreshold !== baselineScore || requireDualApproval !== baselineDualApproval;

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<UserRole>("creator");
  const [newMemberTitle, setNewMemberTitle] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const toggleCreatorPerm = (key: keyof RolePermissions["creator"]) => {
    if (!isAdmin) return;
    setLocalPerms((prev) => ({
      ...prev,
      creator: {
        ...prev.creator,
        [key]: !prev.creator[key],
      },
    }));
  };

  const toggleReviewerPerm = (key: keyof RolePermissions["reviewer"]) => {
    if (!isAdmin) return;
    setLocalPerms((prev) => ({
      ...prev,
      reviewer: {
        ...prev.reviewer,
        [key]: !prev.reviewer[key],
      },
    }));
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    updateRolePermissions(localPerms);
    setSavedPermsBaseline(localPerms); // Reverts back to white since localPerms matches baseline
    setPermsSaved(true);
    setTimeout(() => setPermsSaved(false), 3500);
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    localStorage.setItem(
      `brandos_thresholds_${activeBrand}`,
      JSON.stringify({ minScoreThreshold, requireDualApproval })
    );
    setBaselineScore(minScoreThreshold);
    setBaselineDualApproval(requireDualApproval);
    setThresholdsSaved(true);
    // Refresh page to apply governance parameters across the platform
    setTimeout(() => {
      window.location.reload();
    }, 450);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    const newMember: UserProfile = {
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      title:
        newMemberTitle.trim() ||
        (newMemberRole === "admin"
          ? "Brand Administrator"
          : newMemberRole === "reviewer"
          ? "Content Compliance Reviewer"
          : "Marketing Content Creator"),
    };

    addTeamMember(newMember);
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setIsInviteOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberTitle("");
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Title & Scope */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            System Administration
          </span>
          <span className="text-xs text-slate-400">• {brandConfig.name}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Governance & Access Control Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage organizational permissions, approval thresholds, interface appearance, and user authority.
        </p>
      </div>

      {/* Interface Appearance / Dark Mode Toggle Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Interface Appearance & Theme Mode</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Switch between Light Mode and Dark Mode for the entire BrandOS workspace.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            Current: {themeMode === "dark" ? "🌙 Dark Obsidian" : "☀️ Light Mode"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Light Theme Button */}
          <button
            type="button"
            onClick={() => setThemeMode("light")}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
              themeMode === "light"
                ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
            }`}
          >
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-amber-600 shadow-2xs">
              <Sun className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <span>Light Mode</span>
                {themeMode === "light" && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Crisp enterprise white slate designed for daylight campaign drafting and executive presentations.
              </p>
            </div>
          </button>

          {/* Dark Theme Button */}
          <button
            type="button"
            onClick={() => setThemeMode("dark")}
            className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
              themeMode === "dark"
                ? "border-indigo-500 bg-slate-900 text-white ring-2 ring-indigo-500/30"
                : "border-slate-200 bg-slate-900 text-slate-200 hover:border-slate-400"
            }`}
          >
            <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 shadow-2xs">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs flex items-center gap-2">
                <span className="text-white">Dark Mode (Obsidian Cyber)</span>
                {themeMode === "dark" && (
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 border border-indigo-700 px-1.5 py-0.2 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Ultra high-contrast dark palette with glassmorphism glow for night-shift compliance auditing.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Admin Access Control: Interactive Role-Based Access Governance Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Role-Based Access Governance Matrix (RBAC)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators have full authority to toggle capabilities per organizational role.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Admin Permissions Active
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-600" /> Read-Only (Admin Restricted)
              </span>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsInviteOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Access Policy Governance Locked:</strong> Only Administrator profiles (e.g. Priya Sharma / Maya Lin) can alter permissions and invite team members. Current active identity: <strong>{currentUser.name} ({currentRole.toUpperCase()})</strong>.
            </span>
          </div>
        )}

        <form onSubmit={handleSavePermissions} className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Role & Scope</th>
                  <th className="py-3 px-3 text-center">Submit Drafts</th>
                  <th className="py-3 px-3 text-center">AI Auto-Remediate</th>
                  <th className="py-3 px-3 text-center">View All Org Reviews</th>
                  <th className="py-3 px-3 text-center">Approve &amp; Publish</th>
                  <th className="py-3 px-3 text-center">Override Findings</th>
                  <th className="py-3 px-3 text-center">Edit Brand Brain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Content Creators */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">Content Creators</div>
                    <div className="text-[11px] text-slate-400">
                      Creator 1 &amp; Creator 2 (Draft Authors)
                    </div>
                  </td>

                  {/* Submit */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleCreatorPerm("submitDrafts")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.creator.submitDrafts
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.creator.submitDrafts ? "✓ Enabled" : "✗ Disabled"}
                    </button>
                  </td>

                  {/* Auto-remediate */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleCreatorPerm("autoRemediate")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.creator.autoRemediate
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.creator.autoRemediate ? "✓ Enabled" : "✗ Disabled"}
                    </button>
                  </td>

                  {/* View All */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleCreatorPerm("viewAllReviews")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.creator.viewAllReviews
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.creator.viewAllReviews ? "✓ Enabled" : "✗ Own Only"}
                    </button>
                  </td>

                  {/* Direct Publish */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleCreatorPerm("directPublish")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.creator.directPublish
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.creator.directPublish ? "✓ Enabled" : "✗ Restricted"}
                    </button>
                  </td>

                  {/* Override (Creators never override) */}
                  <td className="py-3.5 px-3 text-center text-slate-400 font-medium">
                    ✗ Locked
                  </td>

                  {/* Edit Brand Brain */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleCreatorPerm("editBrandBrain")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.creator.editBrandBrain
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.creator.editBrandBrain ? "✓ Enabled" : "✗ Restricted"}
                    </button>
                  </td>
                </tr>

                {/* Brand Reviewer & Manager */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-900">Brand Reviewer / Content Manager</div>
                    <div className="text-[11px] text-slate-400">
                      Compliance Approval Lead
                    </div>
                  </td>

                  {/* Submit */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleReviewerPerm("submitDrafts")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.reviewer.submitDrafts
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.reviewer.submitDrafts ? "✓ Enabled" : "✗ Disabled"}
                    </button>
                  </td>

                  {/* Auto-remediate */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleReviewerPerm("autoRemediate")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.reviewer.autoRemediate
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.reviewer.autoRemediate ? "✓ Enabled" : "✗ Disabled"}
                    </button>
                  </td>

                  {/* View All */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleReviewerPerm("viewAllReviews")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.reviewer.viewAllReviews
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.reviewer.viewAllReviews ? "✓ All Org" : "✗ Restricted"}
                    </button>
                  </td>

                  {/* Direct Publish */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleReviewerPerm("directPublish")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.reviewer.directPublish
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.reviewer.directPublish ? "✓ Authority" : "✗ Read-Only"}
                    </button>
                  </td>

                  {/* Override */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleReviewerPerm("overrideFindings")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.reviewer.overrideFindings
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.reviewer.overrideFindings ? "✓ Allowed" : "✗ Disabled"}
                    </button>
                  </td>

                  {/* Edit Brand Brain */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => toggleReviewerPerm("editBrandBrain")}
                      className={`p-1.5 rounded-lg transition-all ${
                        localPerms.reviewer.editBrandBrain
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-400"
                      } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
                    >
                      {localPerms.reviewer.editBrandBrain ? "✓ Enabled" : "✗ Read-Only"}
                    </button>
                  </td>
                </tr>

                {/* Brand Administrator */}
                <tr className="bg-indigo-50/30">
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Brand Administrator</span>
                    </div>
                    <div className="text-[11px] text-indigo-600/70">
                      Workspace Owner &amp; Governance Controller
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full Master</td>
                </tr>
              </tbody>
            </table>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {permsSaved ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" /> Role Access Policies Saved and Active!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {isRoleDirty
                    ? "Unsaved role permission modifications detected."
                    : "Click any cell button above to toggle role capabilities, then save."}
                </span>
              )}

              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  isRoleDirty
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Role Permissions</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Team Member Roster Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span>Active Organizational Roster ({brandUsers.length} Members)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identities authorized to authenticate and submit work inside {brandConfig.name}.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite Person</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {brandUsers.map((u, i) => (
            <div
              key={`${u.email}-${i}`}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{u.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === "admin"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : u.role === "reviewer"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {u.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
              <div className="text-[10px] text-slate-400 font-medium truncate pt-1 border-t border-slate-200/60">
                {u.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Governance & Approval Thresholds */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>Automated Firewall & Approval Governance Thresholds</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the minimum governance score and policy strictness required for auto-approval.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active Policy Engine
          </span>
        </div>

        <form onSubmit={handleSaveThresholds} className="space-y-4 text-xs">
          {/* Score Threshold Slider */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">
                  Minimum Automated Publication Pass Threshold
                </div>
                <div className="text-[11px] text-slate-500">
                  Submissions scoring below this mark are automatically held for Human Reviewer sign-off.
                </div>
              </div>
              <span className="text-base font-extrabold text-indigo-600 font-mono">
                {minScoreThreshold} / 100
              </span>
            </div>
            <input
              type="range"
              min="70"
              max="95"
              step="1"
              value={minScoreThreshold}
              disabled={!isAdmin}
              onChange={(e) => setMinScoreThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>70 (Permissive)</span>
              <span>85 (Enterprise Default)</span>
              <span>95 (Zero-Tolerance)</span>
            </div>
          </div>

          {/* Dual Reviewer Toggle */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">
                Require Dual-Reviewer Sign-off for Borderline Submissions
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Submissions with warnings in multiple pillars require approval from both Reviewer and Admin.
              </div>
            </div>
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => isAdmin && setRequireDualApproval(!requireDualApproval)}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                requireDualApproval
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200 text-slate-600"
              } ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              {requireDualApproval ? "Enabled" : "Disabled"}
            </button>
          </div>

          {/* Permanent TruthMark Grounding Status (No toggle switch, always active!) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>TruthMark™ Topic-Isolated Fact Verification</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Always Active
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Permanently enforced core firewall defense. Evaluates factual claims strictly against identical topic domains to prevent cross-fact contamination.
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
              <Check className="h-3.5 w-3.5" />
              <span>Core Shield Enforced</span>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-between pt-2">
              {thresholdsSaved ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4" /> Changes Applied! Refreshing...
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {isThresholdDirty
                    ? "Threshold adjustments pending. Click Save Changes to apply and reload."
                    : "Adjust minimum firewall publication score or review requirements."}
                </span>
              )}

              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  isThresholdDirty
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs"
                }`}
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Invite Member Modal Dialog */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Add New Team Member to {brandConfig.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {newMemberName} Added Successfully!
                </div>
                <p className="text-xs text-slate-500">
                  Role: <strong>{newMemberRole.toUpperCase()}</strong>. This profile is now active and can sign in.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Rohan Verma"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="e.g. rohan.verma@aureon.internal"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Role Assignment</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="creator">Content Creator (Draft Author)</option>
                    <option value="reviewer">Brand Reviewer / Content Manager</option>
                    <option value="admin">Enterprise Brand Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Job Title / Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={newMemberTitle}
                    onChange={(e) => setNewMemberTitle(e.target.value)}
                    placeholder="e.g. Senior Copywriter — Social Channels"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Confirm &amp; Add Member</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
