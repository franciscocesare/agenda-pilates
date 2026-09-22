/** Cambia el estado de una reserva (confirmar pago, cancelar, completado, ausente…). */
export async function patchReservationEstado(id: string, estado: string) {
  await fetch(`/api/admin/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado }),
  });
}
