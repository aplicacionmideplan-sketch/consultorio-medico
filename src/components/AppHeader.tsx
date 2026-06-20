"use client";

// Barra superior + menu hamburguesa reutilizable.
// Uso en cualquier pagina:
//   import AppHeader from "@/components/AppHeader";
//   <AppHeader title="Pacientes" />
//
// Si quieres el buscador de pacientes (como en /inicio), pasa showSearch={true}.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";

export default function AppHeader({
  title,
  showSearch = false,
}: {
  title?: string;
  showSearch?: boolean;
}) {
  const router = useRouter();
  const { isAdministrativo } = useRole();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [resultados, setResultados] = useState<any[]>([]);

  useEffect(() => {
    if (!showSearch) return;
    supabase
      .from("patients")
      .select("id, nombre_completo, identificacion")
      .order("nombre_completo")
      .then(({ data }) => setPacientes(data || []));
  }, [showSearch]);

  useEffect(() => {
    if (busqueda.trim() === "") {
      setResultados([]);
      return;
    }
    setResultados(
      pacientes.filter(
        (p) =>
          p.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.identificacion?.includes(busqueda)
      )
    );
  }, [busqueda, pacientes]);

  function cerrarSesion() {
    localStorage.removeItem("user");
    router.push("/");
  }

  return (
    <>
      <div className="bg-white shadow px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button
          onClick={() => setMenuAbierto(true)}
          className="text-2xl text-gray-700 hover:text-blue-600"
          aria-label="Abrir menu"
        >
          ☰
        </button>

        {showSearch ? (
          <div className="flex-1 relative">
            <input
              className="border p-3 w-full rounded-xl"
              placeholder="Buscar paciente por nombre o identificacion..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {resultados.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow mt-1 max-h-72 overflow-y-auto z-30">
                {resultados.map((p) => (
                  <Link
                    key={p.id}
                    href={`/patients/${p.id}`}
                    className="block px-4 py-3 hover:bg-slate-50 border-b last:border-0"
                    onClick={() => setBusqueda("")}
                  >
                    <p className="font-semibold text-gray-800">{p.nombre_completo}</p>
                    <p className="text-sm text-gray-500">{p.identificacion}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          title && <h1 className="text-xl font-bold text-blue-700">{title}</h1>
        )}
      </div>

      {menuAbierto && (
        <div className="fixed inset-0 z-40 flex">
          <div className="bg-black/40 flex-1" onClick={() => setMenuAbierto(false)} />
          <div className="bg-white w-64 h-full shadow-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-blue-700">Menu</h2>
              <button onClick={() => setMenuAbierto(false)} className="text-2xl text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <nav className="flex flex-col gap-2">
              {isAdministrativo ? (
                <Link href="/appointments" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                  Citas
                </Link>
              ) : (
                <>
                  <Link href="/inicio" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                    Inicio
                  </Link>
                  <Link href="/patients" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                    Pacientes
                  </Link>
                  <Link href="/appointments" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                    Citas
                  </Link>
                  <Link href="/laboratorios" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                    Examenes
                  </Link>
                  <Link href="/examenes-complementarios" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                    Examenes Complementarios
                  </Link>
                  <Link href="/vacunas" className="px-4 py-3 rounded-xl hover:bg-slate-100 font-semibold text-gray-700" onClick={() => setMenuAbierto(false)}>
                    Vacunas
                  </Link>
                </>
              )}
            </nav>

            <button onClick={cerrarSesion} className="mt-auto px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100">
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
