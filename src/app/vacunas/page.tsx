"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";
import PatientPicker from "@/components/PatientPicker";

export default function VacunasPage() {
  const router = useRouter();
  const { isAdministrativo, loadingRole } = useRole();

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busquedaTabla, setBusquedaTabla] = useState("");

  const [patientId, setPatientId] = useState("");
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [dosis, setDosis] = useState("");
  const [lote, setLote] = useState("");
  const [aplicadoPor, setAplicadoPor] = useState("");

  async function obtenerDatos() {
    const { data: pacs } = await supabase
      .from("patients")
      .select("id, nombre_completo")
      .order("nombre_completo");

    const { data: vacs } = await supabase
      .from("vacunas")
      .select("*, patients(nombre_completo)")
      .order("fecha", { ascending: false });

    setPacientes(pacs || []);
    setVacunas(vacs || []);
  }

  useEffect(() => {
    if (!loadingRole && isAdministrativo) {
      router.push("/appointments");
      return;
    }
    if (!loadingRole) {
      setMounted(true);
      obtenerDatos();
    }
  }, [loadingRole, isAdministrativo]);

  async function guardarVacuna() {
    if (!patientId || !nombre || !fecha) {
      setMensaje("Paciente, nombre y fecha son obligatorios");
      return;
    }

    const { error } = await supabase.from("vacunas").insert([
      {
        patient_id: patientId,
        nombre,
        fecha,
        dosis,
        lote,
        aplicado_por: aplicadoPor,
      },
    ]);

    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setMensaje("Vacuna registrada correctamente");
      setPatientId("");
      setNombre("");
      setFecha("");
      setDosis("");
      setLote("");
      setAplicadoPor("");
      setMostrarFormulario(false);
      obtenerDatos();
    }
  }

  async function eliminarVacuna(id: string) {
    const { error } = await supabase.from("vacunas").delete().eq("id", id);
    if (!error) {
      setMensaje("Vacuna eliminada");
      obtenerDatos();
    }
  }

  const vacunasFiltradas = vacunas.filter((v) =>
    v.patients?.nombre_completo?.toLowerCase().includes(busquedaTabla.toLowerCase())
  );

  if (loadingRole) return <div className="p-8 text-xl font-bold">Cargando...</div>;
  if (isAdministrativo) return null;

  return (
    <main className="min-h-screen bg-slate-100">
      <AppHeader title="Vacunas" />

      <div className="p-8">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-700">Vacunas</h1>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {mostrarFormulario ? "Cancelar" : "+ Registrar Vacuna"}
        </button>
      </div>

      {mensaje && (
        <p className="text-green-600 font-semibold mb-4">{mensaje}</p>
      )}

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-bold mb-4 text-green-700">Nueva Vacuna</h2>

          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2">
              <PatientPicker
                pacientes={pacientes}
                value={patientId}
                onChange={setPatientId}
              />
            </div>

            <input
              className="border p-2 rounded col-span-2"
              placeholder="Nombre de la vacuna *"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-semibold block mb-1">Fecha de aplicacion *</label>
              <input
                className="border p-2 rounded w-full"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <input
              className="border p-2 rounded"
              placeholder="Dosis (ej. 1ra dosis, refuerzo)"
              value={dosis}
              onChange={(e) => setDosis(e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Lote"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Aplicado por"
              value={aplicadoPor}
              onChange={(e) => setAplicadoPor(e.target.value)}
            />

          </div>

          <button
            onClick={guardarVacuna}
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Guardar Vacuna
          </button>
        </div>
      )}

      <input
        className="border p-3 w-full rounded mb-4 bg-white"
        placeholder="Buscar por nombre de paciente..."
        value={busquedaTabla}
        onChange={(e) => setBusquedaTabla(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-4">Paciente</th>
              <th className="p-4">Vacuna</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Dosis</th>
              <th className="p-4">Lote</th>
              <th className="p-4">Aplicado por</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vacunasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No hay vacunas registradas
                </td>
              </tr>
            ) : (
              vacunasFiltradas.map((v) => (
                <tr key={v.id} className="border-t hover:bg-slate-50">
                  <td className="p-4">{v.patients?.nombre_completo}</td>
                  <td className="p-4 font-semibold">{v.nombre}</td>
                  <td className="p-4">
                    {mounted ? new Date(v.fecha + "T00:00:00").toLocaleDateString() : v.fecha}
                  </td>
                  <td className="p-4">{v.dosis || "-"}</td>
                  <td className="p-4">{v.lote || "-"}</td>
                  <td className="p-4">{v.aplicado_por || "-"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => eliminarVacuna(v.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      </div>
    </main>
  );
}
