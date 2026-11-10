"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type BrandSlug = "aureon" | "solaria";
export type UserRole = "admin" | "reviewer" | "creator" | "superadmin";

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

interface BrandContextType {
  activeBrand: BrandSlug;
  brandConfig: BrandConfig;
  currentRole: UserRole;
  currentUser: UserProfile;
  brandUsers: UserProfile[];
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
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrand, setActiveBrand] = useState<BrandSlug>("aureon");
  const [currentUser, setCurrentUser] = useState<UserProfile>(BRAND_USERS.aureon[0]);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedBrand = (localStorage.getItem("brandos_active_brand") as BrandSlug) || "aureon";
    const savedEmail = localStorage.getItem("brandos_user_email");
    const hasChosen = localStorage.getItem("brandos_has_chosen_brand");

    if (savedBrand && BRANDS[savedBrand]) {
      setActiveBrand(savedBrand);
      const userList = BRAND_USERS[savedBrand];
      const found = userList.find((u) => u.email === savedEmail) || userList[0];
      setCurrentUser(found);
      localStorage.setItem("brandos_user_email", found.email);
      localStorage.setItem("brandos_user_role", found.role);
    }
    if (!hasChosen) {
      setIsBrandModalOpen(true);
    }
  }, []);

  const switchBrand = (slug: BrandSlug, role: UserRole = "admin") => {
    setActiveBrand(slug);
    const userList = BRAND_USERS[slug];
    const match = userList.find((u) => u.role === role) || userList[0];
    setCurrentUser(match);
    localStorage.setItem("brandos_active_brand", slug);
    localStorage.setItem("brandos_user_role", match.role);
    localStorage.setItem("brandos_user_email", match.email);
    setIsBrandModalOpen(false);
  };

  const switchRole = (role: UserRole) => {
    const userList = BRAND_USERS[activeBrand];
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
  const brandUsers = BRAND_USERS[activeBrand];
  const currentRole = currentUser.role;

  // RBAC permissions
  const canEditBrandBrain = currentRole === "admin" || currentRole === "superadmin";
  const canApproveReviews = currentRole === "admin" || currentRole === "reviewer" || currentRole === "superadmin";
  const canSubmitReviews = true; // all roles can submit

  return (
    <BrandContext.Provider
      value={{
        activeBrand,
        brandConfig,
        currentRole,
        currentUser,
        brandUsers,
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
