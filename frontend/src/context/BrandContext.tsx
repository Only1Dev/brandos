"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

export type BrandSlug = "aureon" | "solaria" | string;
export type UserRole = "admin" | "reviewer" | "creator" | "superadmin";
export type ThemeMode = "light" | "dark";

export interface BrandConfig {
  slug: BrandSlug;
  name: string;
  tagline: string;
  domain: string;
  primaryColor: string;
  accentColor: string;
  pdfFilename: string;
  pdfDownloadUrl: string;
  defaultAdminPassword: string;
  defaultReviewerPassword: string;
  defaultCreatorPassword: string;
}

export const BRANDS: Record<string, BrandConfig> = {
  aureon: {
    slug: "aureon",
    name: "Aureon Technologies",
    tagline: "Enterprise Fraud Prevention & Autonomous Cyber Defense",
    domain: "Enterprise banking security, autonomous transaction risk defense intelligence, Aureon Shield platform.",
    primaryColor: "#4F46E5", // Indigo
    accentColor: "#0EA5E9", // Sky
    pdfFilename: "Aureon_Official_Brand_Guidelines_2026.pdf",
    pdfDownloadUrl: "/Aureon_Official_Brand_Guidelines_2026.pdf",
    defaultAdminPassword: "aureon-admin",
    defaultReviewerPassword: "aureon-reviewer",
    defaultCreatorPassword: "aureon-creator",
  },
  solaria: {
    slug: "solaria",
    name: "Solaria Wellness",
    tagline: "Clinical Nutraceuticals & Cellular Adaptogenic Hydration",
    domain: "Clinical-grade preventative wellness, natural adaptogenic hydration, and plant-based cellular nutrition (Solaria PureHydrate, Solaria BioImmune).",
    primaryColor: "#10B981", // Emerald
    accentColor: "#059669", // Dark Green
    pdfFilename: "Solaria_Wellness_Official_Brand_Guidelines_2026.pdf",
    pdfDownloadUrl: "/Solaria_Wellness_Official_Brand_Guidelines_2026.pdf",
    defaultAdminPassword: "solaria-admin",
    defaultReviewerPassword: "solaria-reviewer",
    defaultCreatorPassword: "solaria-creator",
  },
};

export const getBrandConfig = (slug: string): BrandConfig => {
  if (slug === "aureon" || slug === "solaria") {
    return BRANDS[slug];
  }
  let savedTheme: any = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`brandos_theme_${slug}`);
      if (raw) savedTheme = JSON.parse(raw);
    } catch {}
  }
  const cleanName = savedTheme?.name || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return {
    slug,
    name: cleanName,
    tagline: savedTheme?.tagline || "Enterprise Autonomous Governance",
    domain: savedTheme?.domain || `${cleanName} enterprise operations and products`,
    primaryColor: savedTheme?.primaryColor || "#6366F1",
    accentColor: savedTheme?.accentColor || "#38BDF8",
    pdfFilename: `${cleanName.replace(/\s+/g, "_")}_Official_Brand_Guidelines_2026.pdf`,
    pdfDownloadUrl: "#",
    defaultAdminPassword: `${slug}-admin`,
    defaultReviewerPassword: `${slug}-reviewer`,
    defaultCreatorPassword: `${slug}-creator`,
  };
};

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export const BRAND_USERS: Record<string, UserProfile[]> = {
  aureon: [
    { name: "Priya Sharma", email: "admin@aureon.internal", role: "admin", title: "Enterprise Brand Admin" },
    { name: "David Chen", email: "reviewer@aureon.internal", role: "reviewer", title: "Lead Content Reviewer" },
    { name: "Aarav Patel", email: "aarav.patel@aureon.internal", role: "creator", title: "Senior FinTech Copywriter" },
    { name: "Riya Sen", email: "riya.sen@aureon.internal", role: "creator", title: "Growth Content Lead" },
  ],
  solaria: [
    { name: "Maya Lin", email: "admin@solaria.internal", role: "admin", title: "Chief Brand Director" },
    { name: "Marcus Vance", email: "reviewer@solaria.internal", role: "reviewer", title: "Compliance Lead" },
    { name: "Marcus Brody", email: "marcus.brody@solaria.internal", role: "creator", title: "Clinical Brand Specialist" },
    { name: "Sophia Lin", email: "sophia.lin@solaria.internal", role: "creator", title: "Lifecycle Campaigner" },
  ],
};

export function formatDynamicTitle(title: string, role?: UserRole): string {
  if (!title) return title;
  return title.replace(/\s*\((Creator \d+|Creator|Reviewer|Admin)\)/gi, "").trim();
}

export const getBrandUsers = (
  slug: string,
  customList: UserProfile[] = [],
  overrides: Record<string, UserRole> = {}
): UserProfile[] => {
  const staticUsers = BRAND_USERS[slug] || [];
  let base: UserProfile[];
  if (staticUsers.length + customList.length > 0) {
    base = [...staticUsers, ...customList];
  } else {
    const cleanName = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    base = [
      { name: `${cleanName} Administrator`, email: `admin@${slug}.internal`, role: "admin", title: "Enterprise Brand Admin" },
      { name: `${cleanName} Reviewer`, email: `reviewer@${slug}.internal`, role: "reviewer", title: "Compliance Lead" },
      { name: `${cleanName} Creator`, email: `creator@${slug}.internal`, role: "creator", title: "Content Strategist" },
    ];
  }
  return base.map(u => {
    // Primary org admin cannot be downgraded from admin
    const isPrimaryAdmin = u.email.startsWith("admin@") || u.role === "admin";
    const effectiveRole: UserRole = isPrimaryAdmin ? "admin" : (overrides[u.email] || u.role);
    return {
      ...u,
      role: effectiveRole,
      title: formatDynamicTitle(u.title, effectiveRole),
    };
  });
};

export interface RolePermissions {
  creator: {
    submitDrafts: boolean;
    autoRemediate: boolean;
    viewAllReviews: boolean;
    directPublish: boolean;
    editBrandBrain: boolean;
  };
  reviewer: {
    submitDrafts: boolean;
    autoRemediate: boolean;
    viewAllReviews: boolean;
    directPublish: boolean;
    overrideFindings: boolean;
    editBrandBrain: boolean;
  };
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  creator: {
    submitDrafts: true,
    autoRemediate: true,
    viewAllReviews: false,
    directPublish: false,
    editBrandBrain: false,
  },
  reviewer: {
    submitDrafts: true,
    autoRemediate: true,
    viewAllReviews: true,
    directPublish: true,
    overrideFindings: true,
    editBrandBrain: false,
  },
};

interface BrandContextType {
  activeBrand: BrandSlug;
  brandConfig: BrandConfig;
  currentRole: UserRole;
  currentUser: UserProfile;
  brandUsers: UserProfile[];
  roleOverrides: Record<string, UserRole>;
  isAuthenticated: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  rolePermissions: RolePermissions;
  updateRolePermissions: (perms: RolePermissions) => void;
  addTeamMember: (member: UserProfile) => void;
  updateUserRole: (email: string, role: UserRole) => void;
  login: (slug: BrandSlug, user: UserProfile) => void;
  logout: () => void;
  switchBrand: (slug: BrandSlug, role?: UserRole) => void;
  switchRole: (role: UserRole) => void;
  switchUser: (user: UserProfile) => void;
  isBrandModalOpen: boolean;
  setIsBrandModalOpen: (open: boolean) => void;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
  canEditBrandBrain: boolean;
  canApproveReviews: boolean;
  canSubmitReviews: boolean;
  canAutoRemediate: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrand, setActiveBrand] = useState<BrandSlug>("aureon");
  const [currentUser, setCurrentUser] = useState<UserProfile>(BRAND_USERS.aureon[0]);
  const [customUsers, setCustomUsers] = useState<Record<BrandSlug, UserProfile[]>>({
    aureon: [],
    solaria: [],
  });
  const [roleOverrides, setRoleOverrides] = useState<Record<string, UserRole>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);

  // Initialize from localStorage
  useEffect(() => {
    const savedBrand = (localStorage.getItem("brandos_active_brand") as BrandSlug) || "aureon";
    const savedEmail = localStorage.getItem("brandos_user_email");
    const authState = localStorage.getItem("brandos_is_authenticated");
    const savedTheme = (localStorage.getItem("brandos_theme_mode") as ThemeMode) || "light";
    const savedPerms = localStorage.getItem(`brandos_role_permissions_${savedBrand}`);
    const savedCustomUsers = localStorage.getItem(`brandos_custom_users_${savedBrand}`);
    const savedOverrides = localStorage.getItem(`brandos_user_role_overrides_${savedBrand}`);

    // Set Theme
    setThemeModeState(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (authState === "false") {
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }

    if (savedPerms) {
      try {
        setRolePermissions(JSON.parse(savedPerms));
      } catch {
        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
      }
    }

    let loadedOverrides: Record<string, UserRole> = {};
    if (savedOverrides) {
      try {
        loadedOverrides = JSON.parse(savedOverrides);
        setRoleOverrides(loadedOverrides);
      } catch {
        // ignore
      }
    }

    let loadedCustom: UserProfile[] = [];
    if (savedCustomUsers) {
      try {
        loadedCustom = JSON.parse(savedCustomUsers);
        setCustomUsers((prev) => ({ ...prev, [savedBrand]: loadedCustom }));
      } catch {
        // ignore
      }
    }

    if (savedBrand) {
      setActiveBrand(savedBrand);
      const allUsers = getBrandUsers(savedBrand, loadedCustom, loadedOverrides);
      const found = allUsers.find((u) => u.email === savedEmail) || allUsers[0];
      setCurrentUser(found);
      localStorage.setItem("brandos_user_email", found.email);
      localStorage.setItem("brandos_user_role", found.role);

      // Fetch live organization settings from database to synchronize across all users
      api.getOrgSettings(savedBrand)
        .then((data) => {
          if (data?.settings?.role_permissions) {
            setRolePermissions(data.settings.role_permissions);
            localStorage.setItem(`brandos_role_permissions_${savedBrand}`, JSON.stringify(data.settings.role_permissions));
          }
          if (data?.settings?.user_role_overrides) {
            const serverOverrides = data.settings.user_role_overrides;
            setRoleOverrides((prev) => {
              const merged = { ...prev, ...serverOverrides };
              localStorage.setItem(`brandos_user_role_overrides_${savedBrand}`, JSON.stringify(merged));
              return merged;
            });
            if (found && serverOverrides[found.email]) {
              const newRole = serverOverrides[found.email] as UserRole;
              setCurrentUser((prev) => ({
                ...prev,
                role: newRole,
                title: formatDynamicTitle(prev.title, newRole),
              }));
              localStorage.setItem("brandos_user_role", newRole);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("brandos_theme_mode", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const updateRolePermissions = (newPerms: RolePermissions) => {
    setRolePermissions(newPerms);
    localStorage.setItem(`brandos_role_permissions_${activeBrand}`, JSON.stringify(newPerms));
    api.updateOrgSettings(activeBrand, { role_permissions: newPerms }).catch(() => {});
  };

  const updateUserRole = (email: string, newRole: UserRole) => {
    const updated = { ...roleOverrides, [email]: newRole };
    setRoleOverrides(updated);
    localStorage.setItem(`brandos_user_role_overrides_${activeBrand}`, JSON.stringify(updated));

    if (currentUser.email === email) {
      setCurrentUser((prev) => {
        const updatedUser = {
          ...prev,
          role: newRole,
          title: formatDynamicTitle(prev.title, newRole),
        };
        localStorage.setItem("brandos_user_role", newRole);
        return updatedUser;
      });
    }

    // Persist to PostgreSQL database directly
    api.updateOrgSettings(activeBrand, { user_role_overrides: updated }).catch(() => {});
    api.updateOrgUserRole(activeBrand, email, newRole).catch(() => {});
  };

  const addTeamMember = (member: UserProfile) => {
    setCustomUsers((prev) => {
      const updated = [...(prev[activeBrand] || []), member];
      localStorage.setItem(`brandos_custom_users_${activeBrand}`, JSON.stringify(updated));
      return { ...prev, [activeBrand]: updated };
    });
  };

  const login = (slug: BrandSlug, user: UserProfile) => {
    setActiveBrand(slug);
    let effectiveOverrides: Record<string, UserRole> = { ...roleOverrides };
    try {
      const stored = localStorage.getItem(`brandos_user_role_overrides_${slug}`);
      if (stored) {
        effectiveOverrides = { ...effectiveOverrides, ...JSON.parse(stored) };
      }
    } catch {}

    const effectiveRole = effectiveOverrides[user.email] || user.role;
    const effectiveUser: UserProfile = {
      ...user,
      role: effectiveRole,
      title: formatDynamicTitle(user.title, effectiveRole),
    };

    setCurrentUser(effectiveUser);
    setIsAuthenticated(true);
    localStorage.setItem("brandos_active_brand", slug);
    localStorage.setItem("brandos_user_email", effectiveUser.email);
    localStorage.setItem("brandos_user_role", effectiveUser.role);
    localStorage.setItem("brandos_is_authenticated", "true");
    localStorage.setItem("brandos_has_chosen_brand", "true");
    setIsBrandModalOpen(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem("brandos_is_authenticated", "false");
    localStorage.removeItem("brandos_has_chosen_brand");
  };

  const switchBrand = (slug: BrandSlug, role: UserRole = "admin") => {
    setActiveBrand(slug);
    let brandOverrides: Record<string, UserRole> = {};
    try {
      const raw = localStorage.getItem(`brandos_user_role_overrides_${slug}`);
      if (raw) brandOverrides = JSON.parse(raw);
    } catch {}
    setRoleOverrides(brandOverrides);

    try {
      const rawPerms = localStorage.getItem(`brandos_role_permissions_${slug}`);
      if (rawPerms) setRolePermissions(JSON.parse(rawPerms));
      else setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    } catch {
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    }

    api.getOrgSettings(slug)
      .then((data) => {
        if (data?.settings?.role_permissions) {
          setRolePermissions(data.settings.role_permissions);
          localStorage.setItem(`brandos_role_permissions_${slug}`, JSON.stringify(data.settings.role_permissions));
        }
        if (data?.settings?.user_role_overrides) {
          const serverOverrides = data.settings.user_role_overrides;
          setRoleOverrides((prev) => {
            const merged = { ...prev, ...serverOverrides };
            localStorage.setItem(`brandos_user_role_overrides_${slug}`, JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});

    const userList = getBrandUsers(slug, customUsers[slug] || [], brandOverrides);
    const match = userList.find((u) => u.role === role) || userList[0];
    setCurrentUser(match);
    setIsAuthenticated(true);
    localStorage.setItem("brandos_active_brand", slug);
    localStorage.setItem("brandos_user_role", match.role);
    localStorage.setItem("brandos_user_email", match.email);
    localStorage.setItem("brandos_is_authenticated", "true");
    localStorage.setItem("brandos_has_chosen_brand", "true");
    setIsBrandModalOpen(false);
  };

  const switchRole = (role: UserRole) => {
    // Dynamically update the active persona's role
    if (currentUser?.email) {
      updateUserRole(currentUser.email, role);
    } else {
      const userList = getBrandUsers(activeBrand, customUsers[activeBrand] || [], roleOverrides);
      const match = userList.find((u) => u.role === role) || userList[0];
      switchUser(match);
    }
  };

  const switchUser = (user: UserProfile) => {
    const effectiveRole = roleOverrides[user.email] || user.role;
    const effectiveUser: UserProfile = {
      ...user,
      role: effectiveRole,
      title: formatDynamicTitle(user.title, effectiveRole),
    };
    setCurrentUser(effectiveUser);
    localStorage.setItem("brandos_user_role", effectiveRole);
    localStorage.setItem("brandos_user_email", user.email);
  };

  const brandConfig = getBrandConfig(activeBrand);
  const brandUsers = getBrandUsers(activeBrand, customUsers[activeBrand] || [], roleOverrides);

  // Synchronize effective role & title dynamically from roleOverrides
  const isPrimaryAdmin = currentUser?.email?.startsWith("admin@") || currentUser?.role === "admin";
  const effectiveRole: UserRole = isPrimaryAdmin
    ? "admin"
    : (currentUser?.email && roleOverrides[currentUser.email])
    ? roleOverrides[currentUser.email]
    : (currentUser?.role || "creator");

  const effectiveTitle = formatDynamicTitle(currentUser?.title || "Team Member", effectiveRole);

  const effectiveCurrentUser: UserProfile = {
    ...currentUser,
    role: effectiveRole,
    title: effectiveTitle,
  };

  const currentRole = effectiveRole;

  // Dynamic RBAC permissions calculated from active role permissions matrix
  const isAdmin = currentRole === "admin" || currentRole === "superadmin";
  const isReviewer = currentRole === "reviewer";

  const canEditBrandBrain = isAdmin
    ? true
    : isReviewer
    ? Boolean(rolePermissions.reviewer?.editBrandBrain)
    : Boolean(rolePermissions.creator?.editBrandBrain);

  const canApproveReviews = isAdmin
    ? true
    : isReviewer
    ? Boolean(rolePermissions.reviewer?.directPublish)
    : Boolean(rolePermissions.creator?.directPublish);

  const canSubmitReviews = isAdmin
    ? true
    : isReviewer
    ? Boolean(rolePermissions.reviewer?.submitDrafts)
    : Boolean(rolePermissions.creator?.submitDrafts);

  const canAutoRemediate = isAdmin
    ? true
    : isReviewer
    ? Boolean(rolePermissions.reviewer?.autoRemediate)
    : Boolean(rolePermissions.creator?.autoRemediate);

  return (
    <BrandContext.Provider
      value={{
        activeBrand,
        brandConfig,
        currentRole,
        currentUser: effectiveCurrentUser,
        brandUsers,
        roleOverrides,
        isAuthenticated,
        themeMode,
        setThemeMode,
        rolePermissions,
        updateRolePermissions,
        addTeamMember,
        updateUserRole,
        login,
        logout,
        switchBrand,
        switchRole,
        switchUser,
        isBrandModalOpen,
        setIsBrandModalOpen,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        canEditBrandBrain,
        canApproveReviews,
        canSubmitReviews,
        canAutoRemediate,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
