"use client";
import { AlertTriangle } from "lucide-react";

export default function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg2 bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger">
      <AlertTriangle size={17} className="mt-px shrink-0" />
      <span>{message}</span>
    </div>
  );
}
