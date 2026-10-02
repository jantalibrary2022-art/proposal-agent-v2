"use client";

export default function PrintButton({ className, label }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label || "Download / Print"}
    </button>
  );
}
