// Todo error que el usuario puede llegar a ver pasa por acá.
// El mensaje técnico real se loguea aparte; esto es lo único que
// el frontend debe mostrar en pantalla.
export class AppError extends Error {
  userMessage: string;
  status: number;
  constructor(userMessage: string, status = 400) {
    super(userMessage);
    this.userMessage = userMessage;
    this.status = status;
  }
}

export const Errores = {
  diaBloqueado: () => new AppError("Este día no está disponible para reservar.", 409),
  diaCompleto: () => new AppError("Ese horario ya no tiene lugares disponibles.", 409),
  fueraDeHorario: () => new AppError("Ese horario no está dentro de la atención del estudio.", 400),
  fechaPasada: () => new AppError("No se puede reservar una fecha que ya pasó.", 400),
  turnoDuplicado: () => new AppError("Ya tenés un turno reservado en ese horario.", 409),
  sinCreditos: () => new AppError("No hay ningún plan de clase suelta activo configurado. Creá uno en Planes antes de asignar.", 402),
  planNoMensual: () => new AppError("Este plan no permite elegir días fijos del mes.", 400),
  diasFijosSuperados: () => new AppError("Ya elegiste todos los días fijos que incluye tu plan.", 400),
  turnoNoEncontrado: () => new AppError("No encontramos ese turno.", 404),
  cancelacionFueraDePlazo: (horas: number) =>
    new AppError(`Solo se puede cancelar hasta ${horas} horas antes del turno.`, 409),
};

export function logAndWrap(err: unknown, fallback: string) {
  if (err instanceof AppError) return err;
  // eslint-disable-next-line no-console
  console.error(err); // el detalle técnico va al log del servidor, nunca al usuario
  return new AppError(fallback, 500);
}
