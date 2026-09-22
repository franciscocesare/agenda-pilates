"use client";
import { ReactNode } from "react";

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-bold text-ink-soft">{children}</label>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mb-4"><Label>{label}</Label>{children}</div>;
}
