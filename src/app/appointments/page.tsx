"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";
import PatientPicker from "@/components/PatientPicker";

export default function AppointmentsPage() {
  const { isAdministrativo, loadingRole } = useRole();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mounted, setMounted] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [medicoAsignado, setMedicoAsignado] = useState("");
  const [estado, setEstado] = useState("pendiente");

  async function obtenerDatos() {
    const { data: citas } = await supabase
      .from("appointments")
      .select("*, patients(nombre_completo)")
      .order("fecha", { ascending: true });

    const { data: pacs } = await supabase
      .from("patients")
      .select("id, nombre_completo")
      .order("nombre_completo");

    setAppointments(citas || []);
    setPacientes(pacs || []);
  }

  useEffect(() => {
    setMounted(true);
    obtenerDatos();
  }, []);

  async function guardarCita() {
    if (!patientId || !fecha || !hora) {
      setMensaje("Paciente, fecha y hora son obligatorios");
      return;
    }

    const { error } = await supabase.from("appointments").insert([
      {
        patient_id: patientId,
        fecha,
        hora,
        motivo,
        medico_asignado: medicoAsignado,
        estado,
      },
    ]);

    if (error) {
      setMensaje("Error: " + error.message);
    } else {
      setMensaje("Cita agendada correctamente");
      setMostrarFormulario(false);
      setPatientId("");
      setFecha("");
      setHora("");
      setMotivo("");
      setMedicoAsignado("");
      setEstado("pendiente");
      obtenerDatos();
    }
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    const { error } = await supabase
      .from("appointments")
      .update({ estado: nuevoEstado })
      .eq("id", id);
    if (!error) obtenerDatos();
  }

  async function eliminarCita(id: string) {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);
    if (!error) {
      setMensaje("Cita eliminada");
      obtenerDatos();
    }
  }

  function colorEstado(estado: string) {
    if (estado === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (estado === "en espera") return "bg-orange-100 text-orange-700";
    if (estado === "completada") return "bg-green-100 text-green-700";
    if (estado === "cancelada") return "bg-red-100 text-red-700";
    return "";
  }

  if (loadingRole) {
    return <div className="p-8 text-xl font-bold">Cargando...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100">

      <AppHeader title="Citas" />

      <div className="p-8">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Citas</h1>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {mostrarFormulario ? "Cancelar" : "+ Nueva Cita"}
          </button>
        </div>

        {mensaje && (
          <p className="text-green-600 font-semibold mb-4">{mensaje}</p>
        )}

        {mostrarFormulario && (
          <div className="bg-white p-6 rounded-2xl shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Nueva Cita</h2>
            <div className="grid grid-cols-2 gap-4">

              <div className="col-span-2">
                <PatientPicker
                  pacientes={pacientes}
                  value={patientId}
                  onChange={setPatientId}
                />
              </div>

              <input
                className="border p-2 rounded"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />

              <input
                className="border p-2 rounded"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />

              <input
                className="border p-2 rounded col-span-2"
                placeholder="Motivo de la cita"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />

              <input
                className="border p-2 rounded"
                placeholder="Medico asignado"
                value={medicoAsignado}
                onChange={(e) => setMedicoAsignado(e.target.value)}
              />

              <select
                className="border p-2 rounded"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en espera">En espera</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>

            </div>

            <button
              onClick={guardarCita}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Guardar Cita
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4">Paciente</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Hora</th>
                <th className="p-4">Motivo</th>
                <th className="p-4">Medico</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No hay citas registradas
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="border-t hover:bg-slate-50">
                    <td className="p-4">{a.patients?.nombre_completo}</td>
                    <td className="p-4">
                      {mounted ? new Date(a.fecha + "T00:00:00").toLocaleDateString() : ""}
                    </td>
                    <td className="p-4">{a.hora}</td>
                    <td className="p-4">{a.motivo}</td>
                    <td className="p-4">{a.medico_asignado}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstado(a.estado)}`}>
                        {a.estado}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap items-center">

                        {/* ADMINISTRATIVO NO ENTRA AL DETALLE CLINICO DE LA CITA */}
                        {!isAdministrativo && (
                          <Link
                            href={`/appointments/${a.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Ver cita
                          </Link>
                        )}

                        {a.estado !== "en espera" && (
                          <button
                            onClick={() => cambiarEstado(a.id, "en espera")}
                            className="text-orange-600 text-sm hover:underline"
                          >
                            En espera
                          </button>
                        )}

                        {a.estado !== "completada" && (
                          <button
                            onClick={() => cambiarEstado(a.id, "completada")}
                            className="text-green-600 text-sm hover:underline"
                          >
                            Completar
                          </button>
                        )}

                        {a.estado !== "cancelada" && (
                          <button
                            onClick={() => cambiarEstado(a.id, "cancelada")}
                            className="text-yellow-600 text-sm hover:underline"
                          >
                            Cancelar
                          </button>
                        )}

                        <button
                          onClick={() => eliminarCita(a.id)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Eliminar
                        </button>

                      </div>
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
