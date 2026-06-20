"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";

export default function InicioPage() {
  const router = useRouter();
  const { isAdministrativo, loadingRole } = useRole();

  const [citasPendientes, setCitasPendientes] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [patientId, setPatientId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [medicoAsignado, setMedicoAsignado] = useState("");

  function formatoFecha(d: Date) {
    return d.toISOString().split("T")[0];
  }

  async function obtenerDatos() {
    setLoading(true);

    const hoy = new Date();
    const hoyStr = formatoFecha(hoy);
    const enUnaSemana = new Date();
    enUnaSemana.setDate(hoy.getDate() + 7);
    const enUnaSemanaStr = formatoFecha(enUnaSemana);

    const { data: citas } = await supabase
      .from("appointments")
      .select("*, patients(nombre_completo)")
      .gte("fecha", hoyStr)
      .lte("fecha", enUnaSemanaStr)
      .in("estado", ["pendiente", "en espera"])
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });

    const { data: pacs } = await supabase
      .from("patients")
      .select("id, nombre_completo, identificacion")
      .order("nombre_completo");

    setCitasPendientes(citas || []);
    setPacientes(pacs || []);
    setLoading(false);
  }

  useEffect(() => {
    // Administrativo no tiene pagina de inicio: se va directo a citas
    if (!loadingRole && isAdministrativo) {
      router.push("/appointments");
      return;
    }
    if (!loadingRole) {
      setMounted(true);
      obtenerDatos();
    }
  }, [loadingRole, isAdministrativo]);


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
        estado: "pendiente",
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
      obtenerDatos();
    }
  }

  function colorEstado(estado: string) {
    if (estado === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (estado === "en espera") return "bg-orange-100 text-orange-700";
    return "";
  }

  if (loadingRole || (loading && !isAdministrativo)) {
    return <div className="p-8 text-xl font-bold">Cargando...</div>;
  }

  if (isAdministrativo) return null;

  return (
    <main className="min-h-screen bg-slate-100">

      <AppHeader title="Inicio" showSearch={true} />

      <div className="p-8">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Citas pendientes</h1>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {mostrarFormulario ? "Cancelar" : "+ Nueva Cita"}
          </button>
        </div>

        {mensaje && <p className="text-green-600 font-semibold mb-4">{mensaje}</p>}

        {mostrarFormulario && (
          <div className="bg-white p-6 rounded-2xl shadow mb-8">
            <h2 className="text-xl font-bold mb-4">Nueva Cita</h2>
            <div className="grid grid-cols-2 gap-4">
              <select className="border p-2 rounded col-span-2" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Seleccionar paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                ))}
              </select>
              <input className="border p-2 rounded" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <input className="border p-2 rounded" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              <input className="border p-2 rounded col-span-2" placeholder="Motivo de la cita" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              <input className="border p-2 rounded col-span-2" placeholder="Medico asignado" value={medicoAsignado} onChange={(e) => setMedicoAsignado(e.target.value)} />
            </div>
            <button onClick={guardarCita} className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Guardar Cita</button>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500">Cargando citas...</p>
        ) : citasPendientes.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-500">
            No hay citas pendientes en los proximos 7 dias
          </div>
        ) : (
          <div className="space-y-3">
            {citasPendientes.map((cita) => (
              <Link key={cita.id} href={`/appointments/${cita.id}`} className="block bg-white p-4 rounded-2xl shadow hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-gray-800">{cita.patients?.nombre_completo}</p>
                    <p className="text-sm text-gray-500">
                      {mounted ? new Date(cita.fecha + "T00:00:00").toLocaleDateString() : cita.fecha} - {cita.hora}
                    </p>
                    {cita.motivo && <p className="text-sm text-gray-500">{cita.motivo}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(cita.estado)}`}>
                    {cita.estado}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
