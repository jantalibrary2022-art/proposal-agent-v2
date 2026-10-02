"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { useDict } from "./LocaleProvider";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { t } = useDict();
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
      {busy ? "…" : t.common.logOut}
    </button>
  );
}
