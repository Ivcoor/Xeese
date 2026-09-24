"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/(auth)/actions";

export function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="border-border focus:border-foreground w-full rounded border px-3 py-2 text-base outline-none"
      />
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-foreground text-background w-full cursor-pointer rounded px-4 py-2 disabled:opacity-50"
    >
      {pending ? "Un momento…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p role="alert" className="text-sm text-red-700">
        {state.error}
      </p>
    );
  if (state?.success)
    return (
      <p role="status" className="text-sm text-green-800">
        {state.success}
      </p>
    );
  return null;
}
