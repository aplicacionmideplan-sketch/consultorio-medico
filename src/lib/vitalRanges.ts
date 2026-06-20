// Rangos normales de signos vitales para adultos, usados para mostrar advertencias
// visuales sin bloquear el guardado del formulario.

export function checkPresionArterial(sistolica: string, diastolica: string): string | null {
  const sis = Number(sistolica);
  const dia = Number(diastolica);
  if (!sistolica || !diastolica || isNaN(sis) || isNaN(dia)) return null;

  if (sis < 90 || sis > 120 || dia < 60 || dia > 80) {
    return "Fuera de rango normal (90/60 a 120/80 mmHg)";
  }
  return null;
}

export function checkFrecuenciaCardiaca(valor: string): string | null {
  const v = Number(valor);
  if (!valor || isNaN(v)) return null;
  if (v < 60 || v > 100) return "Fuera de rango normal (60 a 100 LPM)";
  return null;
}

export function checkFrecuenciaRespiratoria(valor: string): string | null {
  const v = Number(valor);
  if (!valor || isNaN(v)) return null;
  if (v < 12 || v > 20) return "Fuera de rango normal (12 a 20 RPM)";
  return null;
}

export function checkTemperatura(valor: string): string | null {
  const v = Number(valor);
  if (!valor || isNaN(v)) return null;
  if (v < 36.0 || v > 37.5) return "Fuera de rango normal (36.0 a 37.5 °C)";
  return null;
}

export function checkSaturacion(valor: string): string | null {
  const v = Number(valor);
  if (!valor || isNaN(v)) return null;
  if (v < 95 || v > 100) return "Fuera de rango normal (95 a 100 %)";
  return null;
}

export function checkGlucemia(valor: string): string | null {
  const v = Number(valor);
  if (!valor || isNaN(v)) return null;
  if (v < 70 || v > 100) return "Fuera de rango normal (70 a 100 mg/dL, en ayunas)";
  return null;
}
