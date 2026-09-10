import AdminReservas from "@/components/admin/AdminReservas";

// Si viene ?userId=... (ej. tocaste el nombre de una alumna en la
// Agenda), se lo pasamos a AdminReservas para que abra directo con
// los turnos de esa persona, sin tener que escribir nada en el buscador.
export default function Page({
  searchParams,
}: {
  searchParams: { userId?: string; nombre?: string };
}) {
  return <AdminReservas alumnoInicial={searchParams.userId ? { id: searchParams.userId, nombre: searchParams.nombre ?? "" } : undefined} />;
}