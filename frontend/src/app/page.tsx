"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "./login/page";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("brandos_is_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      router.replace("/dashboard");
    } else {
      setIsAuthenticated(false);
      setChecking(false);
    }
  }, [router]);

  if (checking && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
          <span>Loading BrandOS Workspace...</span>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}
