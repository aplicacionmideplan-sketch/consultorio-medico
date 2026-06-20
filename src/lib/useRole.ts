"use client";

// Hook que lee el rol del usuario guardado en localStorage tras el login,
// y redirige automaticamente a /login si no hay sesion activa
// (por ejemplo si el usuario cerro sesion y luego usa el boton "Atras" del navegador).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useRole() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    function verificarSesion() {
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const parsed = JSON.parse(raw);
          setRole(parsed.role || null);
          setLoadingRole(false);
        } else {
          // No hay sesion: mandar al login
          setRole(null);
          setLoadingRole(false);
          router.replace("/");
        }
      } catch {
        setRole(null);
        setLoadingRole(false);
        router.replace("/");
      }
    }

    verificarSesion();

    // Si el usuario vuelve a la pagina usando el boton "Atras"/"Adelante"
    // del navegador, el evento pageshow se dispara y volvemos a verificar.
    function handlePageShow() {
      verificarSesion();
    }
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return {
    role,
    loadingRole,
    isMedico: role === "medico",
    isEnfermeria: role === "enfermeria",
    isAdministrativo: role === "administrativo",
  };
}
