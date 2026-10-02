"use client";

import { useDict } from "./LocaleProvider";

// The language the finished proposal is WRITTEN in. Deliberately separate from
// the interface language: a Hindi-speaking NGO often has to submit in English.
// The caller pre-sets it from the interface locale; the value travels in the
// generate payload as `output_language` ("English" | "Hindi").
export type OutputLanguage = "English" | "Hindi";

export function defaultOutputLanguage(locale: string): OutputLanguage {
  return locale === "hi" ? "Hindi" : "English";
}

export default function OutputLanguagePicker({
  value,
  onChange,
}: {
  value: OutputLanguage;
  onChange: (v: OutputLanguage) => void;
}) {
  const { t } = useDict();
  const fl = t.flows;
  const opts: { v: OutputLanguage; label: string }[] = [
    { v: "English", label: fl.outLangEnglish },
    { v: "Hindi", label: fl.outLangHindi },
  ];
  return (
    <div className="mt-8 bg-card border border-line rounded-lg px-5 py-4">
      <div className="text-[12px] tracking-wide text-muted font-semibold mb-2">{fl.outLangLabel}</div>
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={fl.outLangLabel}>
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={value === o.v}
            onClick={() => onChange(o.v)}
            className={
              "text-[15px] font-semibold px-5 py-2 rounded-[4px] border " +
              (value === o.v ? "bg-ink text-paper border-ink" : "bg-transparent text-ink border-line")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-[13.5px] text-muted leading-relaxed mt-3">{fl.outLangNote}</p>
    </div>
  );
}
