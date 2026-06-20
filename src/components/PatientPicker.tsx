"use client";

// Selector de paciente con cuadro de texto que filtra en vivo + lista desplegable con scroll.
// Reemplaza a los <select> simples en formularios donde se elige un paciente.
//
// Uso:
//   <PatientPicker
//     pacientes={pacientes}
//     value={patientId}
//     onChange={(id) => setPatientId(id)}
//   />

import { useEffect, useRef, useState } from "react";

type Paciente = {
  id: string;
  nombre_completo: string;
  identificacion?: string;
};

export default function PatientPicker({
  pacientes,
  value,
  onChange,
  placeholder = "Buscar o seleccionar paciente...",
}: {
  pacientes: Paciente[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const seleccionado = pacientes.find((p) => p.id === value);

  useEffect(() => {
    setTexto(seleccionado ? seleccionado.nombre_completo : "");
  }, [value, pacientes]);

  useEffect(() => {
    function handleClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setTexto(seleccionado ? seleccionado.nombre_completo : "");
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [seleccionado]);

  const filtrados = pacientes.filter(
    (p) =>
      p.nombre_completo?.toLowerCase().includes(texto.toLowerCase()) ||
      p.identificacion?.includes(texto)
  );

  function seleccionar(p: Paciente) {
    onChange(p.id);
    setTexto(p.nombre_completo);
    setAbierto(false);
  }

  function limpiar() {
    onChange("");
    setTexto("");
    setAbierto(true);
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <div className="relative">
        <input
          className="border p-2 rounded w-full pr-8"
          placeholder={placeholder}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAbierto(true);
            if (value) onChange("");
          }}
          onFocus={() => setAbierto(true)}
        />
        {texto && (
          <button
            type="button"
            onClick={limpiar}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {abierto && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-xl shadow mt-1 max-h-60 overflow-y-auto z-30">
          {filtrados.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
          ) : (
            filtrados.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => seleccionar(p)}
                className={`w-full text-left px-4 py-2 hover:bg-slate-50 border-b last:border-0 ${
                  p.id === value ? "bg-blue-50" : ""
                }`}
              >
                <p className="font-semibold text-gray-800 text-sm">{p.nombre_completo}</p>
                {p.identificacion && (
                  <p className="text-xs text-gray-500">{p.identificacion}</p>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
