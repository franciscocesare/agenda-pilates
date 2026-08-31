export const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// El estudio atiende de 9 a 13 y de 15 a 21. Las clases son de 1 hora,
// así que el último turno de la mañana empieza a las 12:00 (termina
// 13:00) y el último de la tarde a las 20:00 (termina 21:00).
export const HORARIOS_BASE = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

// Lugares disponibles en cada horario (cada franja tiene sus propios
// CUPO_DEFAULT lugares, no se comparten con otras horas del mismo
// día). Único lugar de la app donde vive este número, para que la
// agenda pública y la lógica de reservas nunca queden desincronizadas.
export const CUPO_DEFAULT = 6;

// Número de WhatsApp del estudio, en formato internacional sin "+" ni
// espacios (el que se usa para armar los links wa.me/...).
export const WHATSAPP_NUMBER = "3546567378";
