"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type BrandSlug = "aureon" | "solaria";
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

export const BRANDS: Record<BrandSlug, BrandConfig> = {
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

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  title: string;
}

export const BRAND_USERS: Record<BrandSlug, UserProfile[]> = {
  aureon: [
    { name: "Priya Sharma", email: "admin@aureon.internal", role: "admin", title: "Enterprise Brand Admin" },
    { name: "David Chen", email: "reviewer@aureon.internal", role: "reviewer", title: "Lead Content Reviewer" },
    { name: "Aarav Patel", email: "aarav.patel@aureon.internal", role: "creator", title: "Senior FinTech Copywriter (Creator 1)" },
    { name: "Riya Sen", email: "riya.sen@aureon.internal", role: "creator", title: "Growth Content Lead (Creator 2)" },
  ],
  solaria: [
    { name: "Maya Lin", email: "admin@solaria.internal", role: "admin", title: "Chief Brand Director" },
    { name: "Marcus Vance", email: "reviewer@solaria.internal", role: "reviewer", title: "Compliance Lead" },
    { name: "Marcus Brody", email: "marcus.brody@solaria.internal", role: "creator", title: "Clinical Brand Specialist (Creator 1)" },
    { name: "Sophia Lin", email: "sophia.lin@solaria.internal", role: "creator", title: "Lifecycle Campaigner (Creator 2)" },
  ],
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
  isAuthenticated: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  rolePermissions: RolePermissions;
  updateRolePermissions: (perms: RolePermissions) => void;
  addTeamMember: (member: UserProfile) => void;
  login: (slug: BrandSlug, user: UserProfile) => void;
  logout: () => void;
  switchBrand: (slug: BrandSlug, role?: UserRole) => void;
  switchRole: (role: UserRole) => void;
  switchUser: (user: UserProfile) => void;
  isBrandModalOpen: boolean;
  setIsBrandModalOpen: (open: boolean) => void;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
  isJudgeModalOpen: boolean;
  setIsJudgeModalOpen: (open: boolean) => void;
  canEditBrandBrain: boolean;
  canApproveReviews: boolean;
  canSubmitReviews: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrand, setActiveBrand] = useState<BrandSlug>("aureon");
  const [currentUser, setCurrentUser] = useState<UserProfile>(BRAND_USERS.aureon[0]);
  const [customUsers, setCustomUsers] = useState<Record<BrandSlug, UserProfile[]>>({
    aureon: [],
    solaria: [],
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);

  // Global keydown listener for 'J' to toggle Judge Quickstart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "j" || e.key === "J") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        setIsJudgeModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    const savedBrand = (localStorage.getItem("brandos_active_brand") as BrandSlug) || "aureon";
    const savedEmail = localStorage.getItem("brandos_user_email");
    const authState = localStorage.getItem("brandos_is_authenticated");
    const savedTheme = (localStorage.getItem("brandos_theme_mode") as ThemeMode) || "light";
    const savedPerms = localStorage.getItem(`brandos_role_permissions_${savedBrand}`);
    const savedCustomUsers = localStorage.getItem(`brandos_custom_users_${savedBrand}`);

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

    let loadedCustom: UserProfile[] = [];
    if (savedCustomUsers) {
      try {
        loadedCustom = JSON.parse(savedCustomUsers);
        setCustomUsers((prev) => ({ ...prev, [savedBrand]: loadedCustom }));
      } catch {
        // ignore
      }
    }

    if (savedBrand && BRANDS[savedBrand]) {
      setActiveBrand(savedBrand);
      const allUsers = [...BRAND_USERS[savedBrand], ...loadedCustom];
      const found = allUsers.find((u) => u.email === savedEmail) || allUsers[0];
      setCurrentUser(found);
      localStorage.setItem("brandos_user_email", found.email);
      localStorage.setItem("brandos_user_role", found.role);
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
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem("brandos_active_brand", slug);
    localStorage.setItem("brandos_user_email", user.email);
    localStorage.setItem("brandos_user_role", user.role);
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
    const userList = [...BRAND_USERS[slug], ...(customUsers[slug] || [])];
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
    const userList = [...BRAND_USERS[activeBrand], ...(customUsers[activeBrand] || [])];
    const match = userList.find((u) => u.role === role) || userList[0];
    setCurrentUser(match);
    localStorage.setItem("brandos_user_role", match.role);
    localStorage.setItem("brandos_user_email", match.email);
  };

  const switchUser = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("brandos_user_role", user.role);
    localStorage.setItem("brandos_user_email", user.email);
  };

  const brandConfig = BRANDS[activeBrand];
  const brandUsers = [...BRAND_USERS[activeBrand], ...(customUsers[activeBrand] || [])];
  const currentRole = currentUser.role;

  // Dynamic RBAC permissions calculated from active role permissions matrix
  const isAdmin = currentRole === "admin" || currentRole === "superadmin";
  const isReviewer = currentRole === "reviewer";

  const canEditBrandBrain = isAdmin
    ? true
    : isReviewer
    ? rolePermissions.reviewer.editBrandBrain
    : rolePermissions.creator.editBrandBrain;

  const canApproveReviews = isAdmin
    ? true
    : isReviewer
    ? rolePermissions.reviewer.directPublish
    : rolePermissions.creator.directPublish;

  const canSubmitReviews = isAdmin
    ? true
    : isReviewer
    ? rolePermissions.reviewer.submitDrafts
    : rolePermissions.creator.submitDrafts;

  return (
    <BrandContext.Provider
      value={{
        activeBrand,
        brandConfig,
        currentRole,
        currentUser,
        brandUsers,
        isAuthenticated,
        themeMode,
        setThemeMode,
        rolePermissions,
        updateRolePermissions,
        addTeamMember,
        login,
        logout,
        switchBrand,
        switchRole,
        switchUser,
        isBrandModalOpen,
        setIsBrandModalOpen,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        isJudgeModalOpen,
        setIsJudgeModalOpen,
        canEditBrandBrain,
        canApproveReviews,
        canSubmitReviews,
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
