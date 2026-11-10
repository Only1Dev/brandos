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

interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
}

const ROLE_USERS: Record<BrandSlug, Record<UserRole, UserProfile>> = {
  aureon: {
    admin: { name: "Priya Sharma", email: "admin@aureon.internal", role: "admin" },
    reviewer: { name: "David Chen", email: "reviewer@aureon.internal", role: "reviewer" },
    creator: { name: "Alex Rivera", email: "creator@aureon.internal", role: "creator" },
    superadmin: { name: "Chief Governance Officer", email: "superadmin@brandos.internal", role: "superadmin" },
  },
  solaria: {
    admin: { name: "Maya Lin", email: "admin@solaria.internal", role: "admin" },
    reviewer: { name: "Marcus Vance", email: "reviewer@solaria.internal", role: "reviewer" },
    creator: { name: "Chloe Bennett", email: "creator@solaria.internal", role: "creator" },
    superadmin: { name: "Chief Governance Officer", email: "superadmin@brandos.internal", role: "superadmin" },
  },
};

interface BrandContextType {
  activeBrand: BrandSlug;
  brandConfig: BrandConfig;
  currentRole: UserRole;
  currentUser: UserProfile;
  switchBrand: (slug: BrandSlug, role?: UserRole) => void;
  switchRole: (role: UserRole) => void;
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
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedBrand = localStorage.getItem("brandos_active_brand") as BrandSlug;
    const savedRole = localStorage.getItem("brandos_user_role") as UserRole;
    const hasChosen = localStorage.getItem("brandos_has_chosen_brand");
    if (savedBrand && BRANDS[savedBrand]) {
      setActiveBrand(savedBrand);
    }
    if (savedRole) {
      setCurrentRole(savedRole);
    }
    if (!hasChosen) {
      setIsBrandModalOpen(true);
    }
  }, []);

  const switchBrand = (slug: BrandSlug, role: UserRole = "admin") => {
    setActiveBrand(slug);
    setCurrentRole(role);
    localStorage.setItem("brandos_active_brand", slug);
    localStorage.setItem("brandos_user_role", role);
    setIsBrandModalOpen(false);
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem("brandos_user_role", role);
  };

  const brandConfig = BRANDS[activeBrand];
  const currentUser = ROLE_USERS[activeBrand][currentRole];

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
        switchBrand,
        switchRole,
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
