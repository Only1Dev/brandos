"use client";

import { usePathname } from "next/navigation";
import { BrandProvider } from "@/context/BrandContext";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RegisterBrandModal } from "@/components/brand/RegisterBrandModal";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/";

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {children}
        <RegisterBrandModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
      <RegisterBrandModal />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BrandProvider>
      <AppShellContent>{children}</AppShellContent>
    </BrandProvider>
  );
}
