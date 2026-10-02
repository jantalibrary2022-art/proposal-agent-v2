"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      await createClient().auth.signOut();
    } catch {}
    router.replace("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={onClick} disabled={busy} className={className}>
      {busy ? "…" : "LOG OUT"}
    </button>
  );
}
