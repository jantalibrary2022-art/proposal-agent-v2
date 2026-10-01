"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type Thematic = { theme: string; years: string };
type Project = { title: string; funder: string; funder_type: string; location: string; scale: string; outcomes: string };

const emptyForm = () => ({
  type: "organisation",
  name: "",
  legal_status: "",
  registration_year: "",
  states_present: "",
  annual_revenue: "",
  board_members: "",
  permanent_staff: "",
  donor_concentration: "",
  affiliations: "",
  values: "",
  experience_summary: "",
  address: "",
  email: "",
  thematic: [] as Thematic[],
  projects: [] as Project[],
});

const inputCls = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-3 h-[46px] text-[15px] bg-card outline-none focus:border-ink";
const taCls = "w-full box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] p-3 text-[15px] leading-relaxed bg-card outline-none focus:border-ink resize-y";
const lab = "block text-[13px] font-semibold text-muted mb-1.5";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [f, setF] = useState<any>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase.from("org_profiles").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: true });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const startNew = () => { setSelectedId(null); setF(emptyForm()); setError(""); setUploadMsg(""); };

  const edit = (p: any) => {
    setSelectedId(p.id);
    setError(""); setUploadMsg("");
    const d = p.data || {};
    setF({
      type: p.type || "organisation",
      name: p.name || "",
      legal_status: d.legal_status || "",
      registration_year: d.registration_year != null ? String(d.registration_year) : "",
      states_present: Array.isArray(d.states_present) ? d.states_present.join(", ") : "",
      annual_revenue: d.annual_revenue || "",
      board_members: d.board_members != null ? String(d.board_members) : "",
      permanent_staff: d.permanent_staff != null ? String(d.permanent_staff) : "",
      donor_concentration: d.donor_concentration || "",
      affiliations: d.affiliations || "",
      values: d.values || "",
      experience_summary: d.experience_summary || "",
      address: (d.contact && d.contact.address) || "",
      email: (d.contact && d.contact.email) || "",
      thematic: Array.isArray(d.thematic_experience) ? d.thematic_experience.map((t: any) => ({ theme: t.theme || "", years: t.years != null ? String(t.years) : "" })) : [],
      projects: Array.isArray(d.past_projects) ? d.past_projects.map((x: any) => ({ title: x.title || "", funder: x.funder || "", funder_type: x.funder_type || "", location: x.location || "", scale: x.scale || "", outcomes: x.outcomes || "" })) : [],
    });
  };

  const onUpload = async (file: any) => {
    if (!file) return;
    setUploading(true); setUploadMsg(""); setError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/profiles/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.ok) { setUploadMsg("Could not read that file: " + (data.error || "error")); setUploading(false); return; }
      const p = data.profile || {};
      setSelectedId(null);
      setF({
        type: p.type === "individual" ? "individual" : "organisation",
        name: p.name || "",
        legal_status: p.legal_status || "",
        registration_year: p.registration_year != null ? String(p.registration_year) : "",
        states_present: Array.isArray(p.states_present) ? p.states_present.join(", ") : "",
        annual_revenue: p.annual_revenue || "",
        board_members: p.board_members != null ? String(p.board_members) : "",
        permanent_staff: p.permanent_staff != null ? String(p.permanent_staff) : "",
        donor_concentration: "",
        affiliations: p.affiliations || "",
        values: p.values || "",
        experience_summary: p.experience_summary || "",
        address: (p.contact && p.contact.address) || "",
        email: (p.contact && p.contact.email) || "",
        thematic: Array.isArray(p.thematic_experience) ? p.thematic_experience.map((t: any) => ({ theme: t.theme || "", years: t.years != null ? String(t.years) : "" })) : [],
        projects: Array.isArray(p.past_projects) ? p.past_projects.map((x: any) => ({ title: x.title || "", funder: x.funder || "", funder_type: x.funder_type || "", location: x.location || "", scale: x.scale || "", outcomes: x.outcomes || "" })) : [],
      });
      setUploadMsg("Filled from your document. Check the fields and save.");
    } catch { setUploadMsg("Upload failed, please try again."); }
    setUploading(false);
  };

  const buildData = () => ({
    legal_status: f.legal_status,
    registration_year: f.registration_year ? Number(f.registration_year) : null,
    states_present: f.states_present.split(",").map((s: string) => s.trim()).filter(Boolean),
    annual_revenue: f.annual_revenue,
    board_members: f.board_members ? Number(f.board_members) : null,
    permanent_staff: f.permanent_staff ? Number(f.permanent_staff) : null,
    donor_concentration: f.donor_concentration,
    affiliations: f.affiliations,
    values: f.values,
    experience_summary: f.experience_summary,
    contact: { address: f.address, email: f.email },
    thematic_experience: f.thematic.filter((t: Thematic) => t.theme.trim()).map((t: Thematic) => ({ theme: t.theme, years: t.years ? Number(t.years) : null })),
    past_projects: f.projects.filter((x: Project) => x.title.trim()),
  });

  const save = async () => {
    setError("");
    if (!f.name.trim()) { setError("Give the profile a name."); return; }
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const payload: any = { type: f.type, name: f.name.trim(), data: buildData(), updated_at: new Date().toISOString() };
    let err;
    if (selectedId) {
      const r = await supabase.from("org_profiles").update(payload).eq("id", selectedId);
      err = r.error;
    } else {
      payload.user_id = user.id;
      if (profiles.length === 0) payload.is_default = true;
      const r = await supabase.from("org_profiles").insert(payload).select("id").single();
      err = r.error;
      if (!err && r.data) setSelectedId(r.data.id);
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setUploadMsg("");
    await load();
  };

  const makeDefault = async (id: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("org_profiles").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("org_profiles").update({ is_default: true }).eq("id", id);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    const supabase = createClient();
    await supabase.from("org_profiles").delete().eq("id", id);
    if (selectedId === id) startNew();
    await load();
  };

  const addThematic = () => set("thematic", [...f.thematic, { theme: "", years: "" }]);
  const addProject = () => set("projects", [...f.projects, { title: "", funder: "", funder_type: "", location: "", scale: "", outcomes: "" }]);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-16 shrink-0 px-6 sm:px-11 flex items-center justify-between border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="w-[26px] h-[26px] bg-ink rounded-[3px] flex items-center justify-center text-paper font-extrabold text-[15px]">प्र</span>
          <span className="font-extrabold text-[19px] tracking-tight">Prastav</span>
        </Link>
        <Link href="/dashboard" className="text-[14.5px] text-muted">&larr; Dashboard</Link>
      </header>

      <main className="flex-grow px-6 sm:px-11 py-10 flex justify-center">
        <div className="w-full max-w-[1000px] flex flex-col lg:flex-row gap-8">

          <aside className="lg:w-[280px] shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-extrabold text-[22px] tracking-tight">Profiles</h1>
              <button type="button" onClick={startNew} className="text-[13px] font-semibold text-ink underline">+ New</button>
            </div>
            {loading ? (
              <div className="text-[14px] text-muted">Loading…</div>
            ) : profiles.length === 0 ? (
              <div className="text-[14px] text-muted leading-relaxed">No profiles yet. Create your first one on the right, it is used to ground every proposal in your real experience.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {profiles.map((p) => (
                  <button key={p.id} type="button" onClick={() => edit(p)} className={`text-left rounded-lg border p-3 ${selectedId === p.id ? "border-ink bg-card" : "border-line bg-card"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold">{p.name || "Untitled"}</span>
                      {p.is_default && <span className="text-[10px] tracking-wide font-semibold bg-ink text-paper px-1.5 py-0.5 rounded">DEFAULT</span>}
                    </div>
                    <div className="text-[12.5px] text-muted mt-0.5 capitalize">{p.type}</div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="flex-grow min-w-0">
            <h2 className="font-extrabold text-[24px] tracking-tight mb-1">{selectedId ? "Edit profile" : "New profile"}</h2>
            <p className="text-[14px] text-muted leading-relaxed mb-6">This is what the engine uses to ground a proposal in who you are and what you have done. The fuller it is, the stronger the proposals.</p>

            <div className="mb-6 rounded-lg border border-dashed border-[#BEBCB2] bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-grow">
                <div className="text-[15px] font-bold mb-1">Have a profile document?</div>
                <div className="text-[13.5px] text-muted leading-snug">Upload a PDF or Word profile or capability statement, and we will read it and fill this form for you to check.</div>
              </div>
              <label className={`shrink-0 inline-flex items-center justify-center bg-ink text-paper text-[14px] font-semibold px-5 h-[44px] rounded-[4px] ${uploading ? "opacity-60" : "cursor-pointer"}`}>
                {uploading ? "Reading…" : "Upload document"}
                <input type="file" accept=".pdf,.docx,.txt" className="hidden" disabled={uploading} onChange={(e) => onUpload(e.target.files && e.target.files[0])} />
              </label>
            </div>
            {uploadMsg && <div className="mb-5 text-[13.5px] text-muted">{uploadMsg}</div>}

            <div className="flex flex-col gap-5">
              <div>
                <label className={lab}>This profile is</label>
                <div className="flex gap-1 bg-[#DEDDD6] rounded-[5px] p-1 w-full max-w-[360px]">
                  {["organisation", "individual"].map((t) => (
                    <button key={t} type="button" onClick={() => set("type", t)} className={`flex-1 text-center py-2 rounded-[3px] text-[14px] font-semibold capitalize ${f.type === t ? "bg-ink text-paper" : "text-muted"}`}>{t === "organisation" ? "An organisation" : "An individual"}</button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lab}>{f.type === "individual" ? "Your name" : "Organisation name"}</label><input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
                <div><label className={lab}>Primary contact email</label><input className={inputCls} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
              </div>

              {f.type === "organisation" && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className={lab}>Legal type</label><input className={inputCls} value={f.legal_status} onChange={(e) => set("legal_status", e.target.value)} placeholder="e.g. Section 8 company" /></div>
                  <div><label className={lab}>Registered in (year)</label><input className={inputCls} value={f.registration_year} onChange={(e) => set("registration_year", e.target.value)} placeholder="2016" /></div>
                  <div><label className={lab}>Annual revenue</label><input className={inputCls} value={f.annual_revenue} onChange={(e) => set("annual_revenue", e.target.value)} placeholder="e.g. Rs 2.4 crore" /></div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lab}>States you work in</label><input className={inputCls} value={f.states_present} onChange={(e) => set("states_present", e.target.value)} placeholder="Jharkhand, Chhattisgarh" /></div>
                <div><label className={lab}>Address</label><input className={inputCls} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Ranchi, Jharkhand" /></div>
              </div>

              {f.type === "organisation" && (
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className={lab}>Board members</label><input className={inputCls} value={f.board_members} onChange={(e) => set("board_members", e.target.value)} /></div>
                  <div><label className={lab}>Permanent staff</label><input className={inputCls} value={f.permanent_staff} onChange={(e) => set("permanent_staff", e.target.value)} /></div>
                  <div><label className={lab}>Affiliations</label><input className={inputCls} value={f.affiliations} onChange={(e) => set("affiliations", e.target.value)} placeholder="None" /></div>
                </div>
              )}

              <div><label className={lab}>Experience summary</label><textarea rows={2} className={taCls} value={f.experience_summary} onChange={(e) => set("experience_summary", e.target.value)} placeholder="One or two lines on what you do and where." /></div>
              <div><label className={lab}>Values</label><textarea rows={2} className={taCls} value={f.values} onChange={(e) => set("values", e.target.value)} placeholder="e.g. community ownership, women's agency, convergence with public systems" /></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={lab} style={{ marginBottom: 0 }}>Thematic experience</label>
                  <button type="button" onClick={addThematic} className="text-[13px] font-semibold text-ink underline">+ Add</button>
                </div>
                <div className="flex flex-col gap-2">
                  {f.thematic.map((t: Thematic, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input className={inputCls} value={t.theme} onChange={(e) => { const a = [...f.thematic]; a[i] = { ...a[i], theme: e.target.value }; set("thematic", a); }} placeholder="Theme, e.g. Maternal and child nutrition" />
                      <input className="w-[110px] box-border border-[1.5px] border-[#C9C7BF] rounded-[5px] px-3 h-[46px] text-[15px] bg-card outline-none focus:border-ink" value={t.years} onChange={(e) => { const a = [...f.thematic]; a[i] = { ...a[i], years: e.target.value }; set("thematic", a); }} placeholder="Years" />
                      <button type="button" onClick={() => set("thematic", f.thematic.filter((_: any, j: number) => j !== i))} className="shrink-0 w-[46px] h-[46px] rounded-[5px] border border-line text-muted">&times;</button>
                    </div>
                  ))}
                  {f.thematic.length === 0 && <div className="text-[13px] text-muted">None added.</div>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={lab} style={{ marginBottom: 0 }}>Past projects</label>
                  <button type="button" onClick={addProject} className="text-[13px] font-semibold text-ink underline">+ Add</button>
                </div>
                <div className="flex flex-col gap-4">
                  {f.projects.map((x: Project, i: number) => (
                    <div key={i} className="border border-line rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[12px] tracking-wide font-semibold text-muted">PROJECT {i + 1}</div>
                        <button type="button" onClick={() => set("projects", f.projects.filter((_: any, j: number) => j !== i))} className="text-[13px] font-semibold text-muted">Remove</button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input className={inputCls} value={x.title} onChange={(e) => { const a = [...f.projects]; a[i] = { ...a[i], title: e.target.value }; set("projects", a); }} placeholder="Project title" />
                        <input className={inputCls} value={x.funder} onChange={(e) => { const a = [...f.projects]; a[i] = { ...a[i], funder: e.target.value }; set("projects", a); }} placeholder="Funder" />
                        <input className={inputCls} value={x.funder_type} onChange={(e) => { const a = [...f.projects]; a[i] = { ...a[i], funder_type: e.target.value }; set("projects", a); }} placeholder="Funder type (government, foundation, CSR)" />
                        <input className={inputCls} value={x.location} onChange={(e) => { const a = [...f.projects]; a[i] = { ...a[i], location: e.target.value }; set("projects", a); }} placeholder="Location" />
                        <input className={inputCls} value={x.scale} onChange={(e) => { const a = [...f.projects]; a[i] = { ...a[i], scale: e.target.value }; set("projects", a); }} placeholder="Scale, e.g. 1,200 women" />
                        <input className={inputCls} value={x.outcomes} onChange={(e) => { const a = [...f.projects]; a[i] = { ...a[i], outcomes: e.target.value }; set("projects", a); }} placeholder="Key outcomes" />
                      </div>
                    </div>
                  ))}
                  {f.projects.length === 0 && <div className="text-[13px] text-muted">None added.</div>}
                </div>
              </div>

              {error && <div className="text-[14px] text-[#B4442F]">{error}</div>}

              <div className="flex items-center gap-4 pt-2">
                <button type="button" onClick={save} disabled={saving} className="bg-ink text-paper text-[15px] font-semibold px-7 py-[13px] rounded-[4px] disabled:opacity-40">{saving ? "Saving…" : selectedId ? "Save changes" : "Create profile"}</button>
                {selectedId && (
                  <>
                    <button type="button" onClick={() => makeDefault(selectedId)} className="text-[14px] font-semibold text-ink">Set as default</button>
                    <button type="button" onClick={() => remove(selectedId)} className="text-[14px] font-semibold text-[#B4442F]">Delete</button>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}