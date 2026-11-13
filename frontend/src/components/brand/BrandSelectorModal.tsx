"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useBrand,
  BRANDS,
  BRAND_USERS,
  UserProfile,
} from "@/context/BrandContext";
import {
  Shield,
  Leaf,
  Globe,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Users,
  X,
  Lock,
  LogOut,
  Zap,
} from "lucide-react";

export function BrandSelectorModal() {
  const router = useRouter();
  const {
    activeBrand,
    currentRole,
    currentUser,
    switchRole,
    switchUser,
    logout,
    isBrandModalOpen,
    setIsBrandModalOpen,
  } = useBrand();

  const brandCfg = BRANDS[activeBrand];
  const userList = BRAND_USERS[activeBrand];

  const [selectedUser, setSelectedUser] = useState<UserProfile>(currentUser);
  const [password, setPassword] = useState(`${activeBrand}-${currentUser.role}`);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isBrandModalOpen) return null;

  const handleSelectUser = (u: UserProfile) => {
    setSelectedUser(u);
    setPassword(`${activeBrand}-${u.role}`);
    setErrorMsg("");
  };

  const handleSwitchPersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPass = `${activeBrand}-${selectedUser.role}`;
    if (password.trim() === expectedPass || password.trim().length > 0) {
      switchRole(selectedUser.role);
      switchUser(selectedUser);
      setIsBrandModalOpen(false);
    } else {
      setErrorMsg(`Invalid credentials for ${selectedUser.name}. Demo key: ${expectedPass}`);
    }
  };

  const handleLogoutToSwitchBrand = () => {
    setIsBrandModalOpen(false);
    logout();
    router.push("/login");
  };

  const isSolaria = activeBrand === "solaria";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                isSolaria ? "bg-emerald-600" : "bg-indigo-600"
              }`}
            >
              {isSolaria ? <Leaf className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {brandCfg.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
                  Switch Persona
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active Tenant: {brandCfg.domain}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBrandModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSwitchPersonaSubmit} className="p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                Select Role Persona in {brandCfg.name}:
              </label>
              <span className="text-[11px] text-slate-500">RBAC Enforced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {userList.map((u) => {
                const isSelected = selectedUser.email === u.email;
                return (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? isSolaria
                          ? "bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/30 text-emerald-950 shadow-sm"
                          : "bg-indigo-50/70 border-indigo-600 ring-1 ring-indigo-600/30 text-indigo-950 shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate pr-1">{u.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-indigo-100 text-indigo-800"
                            : u.role === "reviewer"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {u.role === "admin" ? "Admin" : u.role === "reviewer" ? "Manager" : "Creator"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{u.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password confirmation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                Confirm Workspace Credentials
              </label>
              <button
                type="button"
                onClick={() => setPassword(`${activeBrand}-${selectedUser.role}`)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                <span>Default Key: {activeBrand}-{selectedUser.role}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Enter ${activeBrand}-${selectedUser.role}`}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className={`px-4 py-2 text-xs font-bold rounded-lg text-white shadow-sm transition-all flex items-center gap-1.5 ${
                  isSolaria ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <span>Switch Role</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            {errorMsg && (
              <div className="text-[11px] text-rose-600 font-semibold">{errorMsg}</div>
            )}
          </div>

          {/* Log Out To Switch Brand Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Need to load another company?
            </span>
            <button
              type="button"
              onClick={handleLogoutToSwitchBrand}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out & Select Organisation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
