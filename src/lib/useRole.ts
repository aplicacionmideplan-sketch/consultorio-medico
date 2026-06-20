"use client";

// Hook simple para leer el rol del usuario guardado en localStorage tras el login.
// Uso: const { role, isMedico, isEnfermeria, isAdministrativo } = useRole();

import { useEffect, useState } from "react";

export function useRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setRole(parsed.role || null);
      }
    } catch {
      setRole(null);
    }
    setLoadingRole(false);
  }, []);

  return {
    role,
    loadingRole,
    isMedico: role === "medico",
    isEnfermeria: role === "enfermeria",
    isAdministrativo: role === "administrativo",
  };
}
