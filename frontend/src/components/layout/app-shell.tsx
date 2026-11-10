"use client";

import { BrandProvider } from "@/context/BrandContext";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BrandSelectorModal } from "@/components/brand/BrandSelectorModal";
import { RegisterBrandModal } from "@/components/brand/RegisterBrandModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BrandProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="pl-64 flex-1 flex flex-col min-w-0">
          <Header />
          <main className="p-8 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <BrandSelectorModal />
      <RegisterBrandModal />
    </BrandProvider>
  );
}
