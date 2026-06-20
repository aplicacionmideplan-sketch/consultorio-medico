"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";
import PatientPicker from "@/components/PatientPicker";

const EXAMENES_COMPLEMENTARIOS = [
  "Radiografia de torax",
  "Radiografia de abdomen",
  "Radiografia de columna",
  "Radiografia de extremidades",
  "Ultrasonido abdominal",
  "Ultrasonido pelvico",
  "Ultrasonido obstetrico",
  "Ultrasonido tiroideo",
  "Ultrasonido renal",
  "Ultrasonido de mama",
  "Ecocardiograma",
  "Doppler vascular",
  "Tomografia computarizada (TAC)",
  "Resonancia magnetica (RM)",
  "Mamografia",
  "Densitometria osea",
  "Electrocardiograma (EKG)",
  "Prueba de esfuerzo",
  "Holter de presion",
  "Holter de ritmo (24h)",
  "Electroencefalograma (EEG)",
  "Electromiografia (EMG)",
  "Examen de agudeza visual",
  "Tonometria ocular",
  "Fondo de ojo",
  "Audiometria",
  "Timpanometria",
  "Endoscopia digestiva alta",
  "Colonoscopia",
  "Papanicolaou (PAP)",
  "Colposcopia",
  "Uroflujometria",
  "Espirometria",
  "Oximetria de pulso",
  "Biopsia",
  "Citologia",
  "Prueba de alergias",
  "Evaluacion nutricional",
  "Evaluacion psicologica",
  "Terapia fisica - evaluacion",
];

export default function ExamenesComplementariosPage() {
  const router = useRouter();
  const { isMedico, isAdministrativo, loadingRole } = useRole();

  // Solo medico puede crear solicitudes y eliminarlas. Enfermeria solo sube resultados y cambia estado.
  const puedeCrearYEliminar = isMedico;

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [examenesSeleccionados, setExamenesSeleccionados] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [busquedaExamen, setBusquedaExamen] = useState("");
  const [busquedaTabla, setBusquedaTabla] = useState("");
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);

  const [subiendoResultadoId, setSubiendoResultadoId] = useState<string | null>(null);
  const [archivoResultado, setArchivoResultado] = useState<File | null>(null);

  async function obtenerDatos() {
    const { data: pacs } = await supabase
      .from("patients")
      .select("id, nombre_completo")
      .order("nombre_completo");

    const { data: exs } = await supabase
      .from("laboratorios_complementarios")
      .select("*, patients(nombre_completo)")
      .order("created_at", { ascending: false });

    setPacientes(pacs || []);
    setSolicitudes(exs || []);
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

  function toggleExamen(examen: string) {
    setExamenesSeleccionados((prev) =>
      prev.includes(examen) ? prev.filter((e) => e !== examen) : [...prev, examen]
    );
  }

  async function subirPdf(file: File, prefijo: string) {
    const nombreArchivo = `${prefijo}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("complementarios")
      .upload(nombreArchivo, file, { contentType: "application/pdf" });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from("complementarios")
      .getPublicUrl(nombreArchivo);

    return urlData.publicUrl;
  }

  async function guardarSolicitud() {
    if (!patientId) { setMensaje("Selecciona un paciente"); return; }
    if (examenesSeleccionados.length === 0) { setMensaje("Selecciona al menos un examen"); return; }

    setSubiendoArchivo(true);
    let archivoUrl: string | null = null;

    try {
      if (archivoPdf) {
        archivoUrl = await subirPdf(archivoPdf, `${patientId}`);
      }

      const { error } = await supabase.from("laboratorios_complementarios").insert([
        {
          patient_id: patientId,
          examenes: examenesSeleccionados,
          observaciones,
          estado: "pendiente",
          archivo_url: archivoUrl,
        },
      ]);

      if (error) throw new Error(error.message);

      setMensaje("Solicitud de examenes complementarios enviada correctamente");
      setPatientId("");
      setExamenesSeleccionados([]);
      setObservaciones("");
      setBusquedaExamen("");
      setArchivoPdf(null);
      setMostrarFormulario(false);
      obtenerDatos();
    } catch (err: any) {
      setMensaje("Error: " + err.message);
    } finally {
      setSubiendoArchivo(false);
    }
  }

  async function subirResultado(id: string) {
    if (!archivoResultado) { setMensaje("Selecciona un PDF primero"); return; }

    setSubiendoArchivo(true);
    try {
      const archivoUrl = await subirPdf(archivoResultado, `resultado-${id}`);

      const { error } = await supabase
        .from("laboratorios_complementarios")
        .update({ archivo_url: archivoUrl, estado: "completado" })
        .eq("id", id);

      if (error) throw new Error(error.message);

      setMensaje("Resultado subido correctamente");
      setSubiendoResultadoId(null);
      setArchivoResultado(null);
      obtenerDatos();
    } catch (err: any) {
      setMensaje("Error: " + err.message);
    } finally {
      setSubiendoArchivo(false);
    }
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    const { error } = await supabase
      .from("laboratorios_complementarios")
      .update({ estado: nuevoEstado })
      .eq("id", id);
    if (!error) obtenerDatos();
  }

  async function eliminarSolicitud(id: string) {
    const { error } = await supabase
      .from("laboratorios_complementarios")
      .delete()
      .eq("id", id);
    if (!error) {
      setMensaje("Solicitud eliminada");
      obtenerDatos();
    }
  }

  function colorEstado(estado: string) {
    if (estado === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (estado === "en proceso") return "bg-blue-100 text-blue-700";
    if (estado === "completado") return "bg-green-100 text-green-700";
    return "";
  }

  const examenesFiltrados = EXAMENES_COMPLEMENTARIOS.filter((e) =>
    e.toLowerCase().includes(busquedaExamen.toLowerCase())
  );

  const solicitudesFiltradas = solicitudes.filter((s) =>
    s.patients?.nombre_completo?.toLowerCase().includes(busquedaTabla.toLowerCase())
  );

  if (loadingRole) return <div className="p-8 text-xl font-bold">Cargando...</div>;
  if (isAdministrativo) return null;

  return (
    <main className="min-h-screen bg-slate-100">
      <AppHeader title="Examenes Complementarios" />

      <div className="p-8">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Examenes Complementarios</h1>
        {puedeCrearYEliminar && (
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {mostrarFormulario ? "Cancelar" : "+ Nueva Solicitud"}
          </button>
        )}
      </div>

      {mensaje && <p className="text-green-600 font-semibold mb-4">{mensaje}</p>}

      {!puedeCrearYEliminar && (
        <p className="text-sm text-gray-500 italic mb-4">
          Tu rol solo permite subir resultados y actualizar el estado de las solicitudes existentes.
        </p>
      )}

      {mostrarFormulario && puedeCrearYEliminar && (
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-bold mb-4 text-indigo-700">Nueva Solicitud de Examenes Complementarios</h2>

          <div className="mb-4">
            <PatientPicker
              pacientes={pacientes}
              value={patientId}
              onChange={setPatientId}
            />
          </div>

          <input
            className="border p-2 rounded w-full mb-3"
            placeholder="Buscar examen..."
            value={busquedaExamen}
            onChange={(e) => setBusquedaExamen(e.target.value)}
          />

          {examenesSeleccionados.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {examenesSeleccionados.map((e) => (
                <span
                  key={e}
                  onClick={() => toggleExamen(e)}
                  className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-indigo-200"
                >
                  {e} x
                </span>
              ))}
            </div>
          )}

          <div className="border rounded-xl overflow-y-auto max-h-64 mb-4">
            {examenesFiltrados.map((examen) => (
              <label
                key={examen}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-slate-50 border-b last:border-0 ${
                  examenesSeleccionados.includes(examen) ? "bg-indigo-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={examenesSeleccionados.includes(examen)}
                  onChange={() => toggleExamen(examen)}
                  className="accent-indigo-600"
                />
                <span className="text-sm">{examen}</span>
              </label>
            ))}
          </div>

          <textarea
            className="border p-3 rounded w-full h-24 mb-4"
            placeholder="Observaciones o indicaciones adicionales..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />

          <div className="mb-4">
            <label className="text-sm font-semibold block mb-1">Adjuntar PDF (opcional, si ya hay resultados)</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setArchivoPdf(e.target.files?.[0] || null)}
              className="border p-2 rounded w-full"
            />
          </div>

          <button
            onClick={guardarSolicitud}
            disabled={subiendoArchivo}
            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {subiendoArchivo ? "Enviando..." : "Enviar Solicitud"}
          </button>
        </div>
      )}

      <input
        className="border p-3 w-full rounded mb-4 bg-white"
        placeholder="Buscar por nombre de paciente..."
        value={busquedaTabla}
        onChange={(e) => setBusquedaTabla(e.target.value)}
      />

      <div className="space-y-4">
        {solicitudesFiltradas.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-500">
            No hay solicitudes de examenes complementarios registradas
          </div>
        ) : (
          solicitudesFiltradas.map((s) => (
            <div key={s.id} className="bg-white p-5 rounded-2xl shadow">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{s.patients?.nombre_completo}</h3>
                  <p className="text-sm text-gray-500">
                    {mounted ? new Date(s.created_at).toLocaleDateString() : ""} -{" "}
                    {mounted ? new Date(s.created_at).toLocaleTimeString() : ""}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorEstado(s.estado)}`}>
                  {s.estado}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {s.examenes?.map((e: string) => (
                  <span key={e} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">
                    {e}
                  </span>
                ))}
              </div>

              {s.observaciones && (
                <p className="text-sm text-gray-600 mb-3"><b>Observaciones:</b> {s.observaciones}</p>
              )}

              {s.archivo_url && (
                <a
                  href={s.archivo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline text-sm mb-3 block font-semibold"
                >
                  Ver PDF de resultados
                </a>
              )}

              {subiendoResultadoId === s.id ? (
                <div className="border-t pt-3 mt-3 flex flex-col gap-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setArchivoResultado(e.target.files?.[0] || null)}
                    className="border p-2 rounded w-full text-sm"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => subirResultado(s.id)}
                      disabled={subiendoArchivo}
                      className="bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {subiendoArchivo ? "Subiendo..." : "Subir resultado"}
                    </button>
                    <button
                      onClick={() => { setSubiendoResultadoId(null); setArchivoResultado(null); }}
                      className="bg-gray-200 text-gray-700 px-4 py-1 rounded text-sm hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSubiendoResultadoId(s.id)}
                  className="text-indigo-600 hover:underline text-sm mb-3 block"
                >
                  {s.archivo_url ? "Reemplazar PDF de resultados" : "Subir PDF de resultados"}
                </button>
              )}

              <div className="flex gap-3 flex-wrap text-sm mt-3 border-t pt-3">
                {s.estado !== "pendiente" && (
                  <button onClick={() => cambiarEstado(s.id, "pendiente")} className="text-yellow-600 hover:underline">Marcar pendiente</button>
                )}
                {s.estado !== "en proceso" && (
                  <button onClick={() => cambiarEstado(s.id, "en proceso")} className="text-blue-600 hover:underline">Marcar en proceso</button>
                )}
                {s.estado !== "completado" && (
                  <button onClick={() => cambiarEstado(s.id, "completado")} className="text-green-600 hover:underline">Marcar completado</button>
                )}
                {puedeCrearYEliminar && (
                  <button onClick={() => eliminarSolicitud(s.id)} className="text-red-600 hover:underline">Eliminar</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      </div>
    </main>
  );
}
