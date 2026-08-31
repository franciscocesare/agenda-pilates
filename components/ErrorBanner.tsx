"use client";
import { AlertTriangle } from "lucide-react";
import { palette } from "./ui";

export default function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: palette.dangerSoft, color: palette.danger, padding: "12px 14px", borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
      <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}
