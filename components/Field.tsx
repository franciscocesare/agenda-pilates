"use client";
import { ReactNode } from "react";
import { palette } from "./ui";

export function Label({ children }: { children: ReactNode }) {
  return <label style={{ fontSize: 13, fontWeight: 700, color: palette.inkSoft, display: "block", marginBottom: 6 }}>{children}</label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{ marginBottom: 16 }}><Label>{label}</Label>{children}</div>;
}
