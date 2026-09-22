import type { Credito } from "../types";

/** Créditos y planes (sueltos y mensuales) que tiene comprados una alumna. */
export async function fetchCreditosDeAlumno(userId: string): Promise<Credito[]> {
  const res = await fetch(`/api/admin/payments?userId=${userId}`);
  return res.json();
}
