"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "../components/Navigation";
import QuickAddFab from "../components/QuickAddFab";
import { useAuth } from "../components/AuthProvider";

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-400 text-sm">
        Memuat...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <Navigation />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      <QuickAddFab />
    </div>
  );
}
