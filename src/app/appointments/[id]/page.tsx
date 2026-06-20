"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";
import { checkPresionArterial, checkFrecuenciaCardiaca, checkFrecuenciaRespiratoria, checkTemperatura, checkSaturacion } from "@/lib/vitalRanges";

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const { isMedico, isEnfermeria, isAdministrativo, loadingRole } = useRole();

  const [cita, setCita] = useState<any>(null);
  const [preconsulta, setPreconsulta] = useState<any>(null);
  const [notaEnfermeria, setNotaEnfermeria] = useState<any>(null);
  const [notaMedica, setNotaMedica] = useState<any>(null);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seccion, setSeccion] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");

  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [presionSistolica, setPresionSistolica] = useState("");
  const [presionDiastolica, setPresionDiastolica] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [imc, setImc] = useState(0);

  const [notaEnfermeriaTexto, setNotaEnfermeriaTexto] = useState("");
  const [notaMedicaTexto, setNotaMedicaTexto] = useState("");

  const [nombreMed, setNombreMed] = useState("");
  const [dosisMed, setDosisMed] = useState("");
  const [frecuenciaMed, setFrecuenciaMed] = useState("");
  const [duracionMed, setDuracionMed] = useState("");

  // PERMISOS POR ROL
  // Medico: edita todo excepto nota de enfermeria
  // Enfermeria: edita preconsulta y nota de enfermeria; nota medica y medicamentos son solo lectura
  const puedeEditarPreconsulta = isMedico || isEnfermeria;
  const puedeEditarEnfermeria = isEnfermeria;
  const puedeEditarMedica = isMedico;
  const puedeEditarMedicamentos = isMedico;

  function calcularIMC(pesoValor: string, tallaValor: string) {
    const pesoNum = Number(pesoValor);
    const tallaNum = Number(tallaValor);
    if (pesoNum > 0 && tallaNum > 0) {
      const tallaMetros = tallaNum / 100;
      setImc(Number((pesoNum / (tallaMetros * tallaMetros)).toFixed(2)));
    }
  }

  async function getData() {
    setLoading(true);

    const { data: citaData } = await supabase
      .from("appointments")
      .select("*, patients(nombre_completo, identificacion, id)")
      .eq("id", appointmentId)
      .single();

    const { data: preData } = await supabase
      .from("preconsultas").select("*").eq("appointment_id", appointmentId).single();
    const { data: enfData } = await supabase
      .from("notas_enfermeria").select("*").eq("appointment_id", appointmentId).single();
    const { data: medData } = await supabase
      .from("notas_medicas").select("*").eq("appointment_id", appointmentId).single();
    const { data: medsData } = await supabase
      .from("medicamentos").select("*").eq("appointment_id", appointmentId).order("created_at", { ascending: false });

    setCita(citaData);
    setPreconsulta(preData || null);
    setNotaEnfermeria(enfData || null);
    setNotaMedica(medData || null);
    setMedicamentos(medsData || []);
    setLoading(false);
  }

  useEffect(() => {
    // Bloqueo: administrativo no puede ver el detalle clinico de una cita
    if (!loadingRole && isAdministrativo) {
      router.push("/appointments");
      return;
    }
    if (!loadingRole) {
      getData();
    }
  }, [loadingRole, isAdministrativo]);

  async function guardarPreconsulta() {
    const payload = {
      appointment_id: appointmentId,
      motivo_consulta: motivoConsulta,
      presion_arterial: `${presionSistolica}/${presionDiastolica}`,
      frecuencia_cardiaca: Number(frecuenciaCardiaca),
      frecuencia_respiratoria: Number(frecuenciaRespiratoria),
      temperatura: Number(temperatura),
      saturacion: Number(saturacion),
      peso: Number(peso),
      talla: Number(talla),
      imc,
    };

    const { error } = preconsulta
      ? await supabase.from("preconsultas").update(payload).eq("id", preconsulta.id)
      : await supabase.from("preconsultas").insert([payload]);

    if (error) { setMensaje("Error: " + error.message); }
    else { setMensaje("Preconsulta guardada correctamente"); setSeccion(null); getData(); }
  }

  async function guardarNotaEnfermeria() {
    const payload = { appointment_id: appointmentId, nota: notaEnfermeriaTexto };
    const { error } = notaEnfermeria
      ? await supabase.from("notas_enfermeria").update(payload).eq("id", notaEnfermeria.id)
      : await supabase.from("notas_enfermeria").insert([payload]);
    if (error) { setMensaje("Error: " + error.message); }
    else { setMensaje("Nota de enfermeria guardada"); setSeccion(null); getData(); }
  }

  async function guardarNotaMedica() {
    const payload = { appointment_id: appointmentId, nota: notaMedicaTexto };
    const { error } = notaMedica
      ? await supabase.from("notas_medicas").update(payload).eq("id", notaMedica.id)
      : await supabase.from("notas_medicas").insert([payload]);
    if (error) { setMensaje("Error: " + error.message); }
    else { setMensaje("Nota medica guardada"); setSeccion(null); getData(); }
  }

  async function guardarMedicamento() {
    if (!nombreMed) { setMensaje("El nombre del medicamento es obligatorio"); return; }
    const { error } = await supabase.from("medicamentos").insert([{
      patient_id: cita?.patients?.id,
      appointment_id: appointmentId,
      nombre: nombreMed,
      dosis: dosisMed,
      frecuencia: frecuenciaMed,
      duracion: duracionMed,
    }]);
    if (error) { setMensaje("Error: " + error.message); }
    else {
      setMensaje("Medicamento guardado correctamente");
      setNombreMed(""); setDosisMed(""); setFrecuenciaMed(""); setDuracionMed("");
      getData();
    }
  }

  async function eliminarMedicamento(id: string) {
    const { error } = await supabase.from("medicamentos").delete().eq("id", id);
    if (!error) getData();
  }

  function abrirSeccion(nombre: string) {
    setSeccion(nombre);
    setMensaje("");

    if (nombre === "preconsulta" && preconsulta) {
      const [sis, dia] = (preconsulta.presion_arterial || "/").split("/");
      setPresionSistolica(sis || "");
      setPresionDiastolica(dia || "");
      setMotivoConsulta(preconsulta.motivo_consulta || "");
      setFrecuenciaCardiaca(String(preconsulta.frecuencia_cardiaca || ""));
      setFrecuenciaRespiratoria(String(preconsulta.frecuencia_respiratoria || ""));
      setTemperatura(String(preconsulta.temperatura || ""));
      setSaturacion(String(preconsulta.saturacion || ""));
      setPeso(String(preconsulta.peso || ""));
      setTalla(String(preconsulta.talla || ""));
      setImc(preconsulta.imc || 0);
    }
    if (nombre === "enfermeria" && notaEnfermeria) setNotaEnfermeriaTexto(notaEnfermeria.nota || "");
    if (nombre === "medica" && notaMedica) setNotaMedicaTexto(notaMedica.nota || "");
  }

  if (loadingRole || loading) return <div className="p-8 text-xl font-bold">Cargando cita...</div>;
  if (isAdministrativo) return null;
  if (!cita) return <div className="p-8 text-red-600">Cita no encontrada</div>;

  return (
    <main className="min-h-screen bg-slate-100">
      <AppHeader title="Detalle de Cita" />

      <div className="p-8">

      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          Cita: {cita.patients?.nombre_completo}
        </h1>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><b>Identificacion:</b> {cita.patients?.identificacion}</p>
          <p><b>Fecha:</b> {cita.fecha}</p>
          <p><b>Hora:</b> {cita.hora}</p>
          <p><b>Motivo agendado:</b> {cita.motivo}</p>
          <p><b>Medico asignado:</b> {cita.medico_asignado}</p>
          <p>
            <b>Estado:</b>{" "}
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              cita.estado === "pendiente" ? "bg-yellow-100 text-yellow-700" :
              cita.estado === "en espera" ? "bg-orange-100 text-orange-700" :
              cita.estado === "completada" ? "bg-green-100 text-green-700" :
              "bg-red-100 text-red-700"
            }`}>
              {cita.estado}
            </span>
          </p>
        </div>
      </div>

      {mensaje && <p className="text-green-600 font-semibold mb-4">{mensaje}</p>}

      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => abrirSeccion("preconsulta")}
          className={`px-5 py-3 rounded-xl font-semibold shadow ${preconsulta ? "bg-green-500 text-white" : "bg-blue-600 text-white"} hover:opacity-90`}
        >
          Preconsulta
        </button>
        <button
          onClick={() => abrirSeccion("enfermeria")}
          className={`px-5 py-3 rounded-xl font-semibold shadow ${notaEnfermeria ? "bg-green-500 text-white" : "bg-blue-600 text-white"} hover:opacity-90`}
        >
          Nota de Enfermeria
        </button>
        <button
          onClick={() => abrirSeccion("medica")}
          className={`px-5 py-3 rounded-xl font-semibold shadow ${notaMedica ? "bg-green-500 text-white" : "bg-blue-600 text-white"} hover:opacity-90`}
        >
          Nota Medica
        </button>
        <button
          onClick={() => abrirSeccion("medicamentos")}
          className={`px-5 py-3 rounded-xl font-semibold shadow ${medicamentos.length > 0 ? "bg-green-500 text-white" : "bg-orange-500 text-white"} hover:opacity-90`}
        >
          Medicamentos
        </button>
      </div>

      {seccion === "preconsulta" && (
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Preconsulta</h2>

          {!puedeEditarPreconsulta && (
            <p className="text-sm text-gray-500 italic mb-3">Solo lectura para tu rol</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <textarea disabled={!puedeEditarPreconsulta} className="border p-2 rounded col-span-2 disabled:bg-gray-100" placeholder="Motivo de consulta" value={motivoConsulta} onChange={(e) => setMotivoConsulta(e.target.value)} />
            <div className="border p-3 rounded col-span-2 md:col-span-1">
              <label className="text-sm font-semibold">Presion Arterial (mmHg)</label>
              <div className="flex gap-2 mt-2">
                <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded w-full disabled:bg-gray-100" placeholder="Sistolica" value={presionSistolica} onChange={(e) => setPresionSistolica(e.target.value)} />
                <span className="self-center">/</span>
                <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded w-full disabled:bg-gray-100" placeholder="Diastolica" value={presionDiastolica} onChange={(e) => setPresionDiastolica(e.target.value)} />
              </div>
              {checkPresionArterial(presionSistolica, presionDiastolica) && (
                <p className="text-red-600 text-xs mt-1">{checkPresionArterial(presionSistolica, presionDiastolica)}</p>
              )}
            </div>
            <div>
              <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded w-full disabled:bg-gray-100" placeholder="Frecuencia Cardiaca (LPM)" value={frecuenciaCardiaca} onChange={(e) => setFrecuenciaCardiaca(e.target.value)} />
              {checkFrecuenciaCardiaca(frecuenciaCardiaca) && (
                <p className="text-red-600 text-xs mt-1">{checkFrecuenciaCardiaca(frecuenciaCardiaca)}</p>
              )}
            </div>
            <div>
              <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded w-full disabled:bg-gray-100" placeholder="Frecuencia Respiratoria (RPM)" value={frecuenciaRespiratoria} onChange={(e) => setFrecuenciaRespiratoria(e.target.value)} />
              {checkFrecuenciaRespiratoria(frecuenciaRespiratoria) && (
                <p className="text-red-600 text-xs mt-1">{checkFrecuenciaRespiratoria(frecuenciaRespiratoria)}</p>
              )}
            </div>
            <div>
              <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded w-full disabled:bg-gray-100" placeholder="Temperatura (C)" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
              {checkTemperatura(temperatura) && (
                <p className="text-red-600 text-xs mt-1">{checkTemperatura(temperatura)}</p>
              )}
            </div>
            <div>
              <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded w-full disabled:bg-gray-100" placeholder="Saturacion SpO2 (%)" value={saturacion} onChange={(e) => setSaturacion(e.target.value)} />
              {checkSaturacion(saturacion) && (
                <p className="text-red-600 text-xs mt-1">{checkSaturacion(saturacion)}</p>
              )}
            </div>
            <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded disabled:bg-gray-100" placeholder="Peso (kg)" value={peso} onChange={(e) => { setPeso(e.target.value); calcularIMC(e.target.value, talla); }} />
            <input disabled={!puedeEditarPreconsulta} className="border p-2 rounded disabled:bg-gray-100" placeholder="Talla (cm)" value={talla} onChange={(e) => { setTalla(e.target.value); calcularIMC(peso, e.target.value); }} />
            <input className="border p-2 rounded bg-gray-100" placeholder="IMC (calculado)" value={imc || ""} readOnly />
          </div>
          <div className="flex gap-3 mt-4">
            {puedeEditarPreconsulta && (
              <button onClick={guardarPreconsulta} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Guardar</button>
            )}
            <button onClick={() => setSeccion(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300">Cerrar</button>
          </div>
        </div>
      )}

      {seccion === "enfermeria" && (
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Nota de Enfermeria</h2>
          {!puedeEditarEnfermeria && (
            <p className="text-sm text-gray-500 italic mb-3">Solo lectura para tu rol</p>
          )}
          <textarea
            disabled={!puedeEditarEnfermeria}
            className="border p-3 rounded w-full h-48 disabled:bg-gray-100"
            placeholder="Escriba la nota de enfermeria..."
            value={notaEnfermeriaTexto}
            onChange={(e) => setNotaEnfermeriaTexto(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            {puedeEditarEnfermeria && (
              <button onClick={guardarNotaEnfermeria} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Guardar</button>
            )}
            <button onClick={() => setSeccion(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300">Cerrar</button>
          </div>
        </div>
      )}

      {seccion === "medica" && (
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700">Nota Medica</h2>
          {!puedeEditarMedica && (
            <p className="text-sm text-gray-500 italic mb-3">Solo lectura para tu rol</p>
          )}
          <textarea
            disabled={!puedeEditarMedica}
            className="border p-3 rounded w-full h-48 disabled:bg-gray-100"
            placeholder="Escriba la nota medica..."
            value={notaMedicaTexto}
            onChange={(e) => setNotaMedicaTexto(e.target.value)}
          />
          <div className="flex gap-3 mt-4">
            {puedeEditarMedica && (
              <button onClick={guardarNotaMedica} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Guardar</button>
            )}
            <button onClick={() => setSeccion(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300">Cerrar</button>
          </div>
        </div>
      )}

      {seccion === "medicamentos" && (
        <div className="bg-white p-6 rounded-2xl shadow mb-6">
          <h2 className="text-xl font-bold mb-4 text-orange-600">Medicamentos</h2>
          {!puedeEditarMedicamentos && (
            <p className="text-sm text-gray-500 italic mb-3">Solo lectura para tu rol</p>
          )}

          {puedeEditarMedicamentos && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input className="border p-2 rounded col-span-2" placeholder="Nombre del medicamento *" value={nombreMed} onChange={(e) => setNombreMed(e.target.value)} />
                <input className="border p-2 rounded" placeholder="Dosis (ej. 500mg)" value={dosisMed} onChange={(e) => setDosisMed(e.target.value)} />
                <input className="border p-2 rounded" placeholder="Frecuencia (ej. cada 8 horas)" value={frecuenciaMed} onChange={(e) => setFrecuenciaMed(e.target.value)} />
                <input className="border p-2 rounded col-span-2" placeholder="Duracion del tratamiento (ej. 7 dias)" value={duracionMed} onChange={(e) => setDuracionMed(e.target.value)} />
              </div>
              <div className="flex gap-3 mb-6">
                <button onClick={guardarMedicamento} className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">Agregar medicamento</button>
                <button onClick={() => setSeccion(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300">Cerrar</button>
              </div>
            </>
          )}

          {!puedeEditarMedicamentos && (
            <button onClick={() => setSeccion(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded hover:bg-gray-300 mb-6">Cerrar</button>
          )}

          {medicamentos.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-700 mb-2">Medicamentos de esta cita:</h3>
              {medicamentos.map((m) => (
                <div key={m.id} className="border p-3 rounded-xl bg-orange-50 flex justify-between items-start">
                  <div className="text-sm">
                    <p className="font-bold text-orange-700">{m.nombre}</p>
                    {m.dosis && <p><b>Dosis:</b> {m.dosis}</p>}
                    {m.frecuencia && <p><b>Frecuencia:</b> {m.frecuencia}</p>}
                    {m.duracion && <p><b>Duracion:</b> {m.duracion}</p>}
                  </div>
                  {puedeEditarMedicamentos && (
                    <button onClick={() => eliminarMedicamento(m.id)} className="text-red-500 hover:underline text-sm ml-4">Eliminar</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">

        {preconsulta && seccion !== "preconsulta" && (
          <div className="bg-white p-4 rounded-2xl shadow text-sm">
            <h3 className="font-bold text-green-700 mb-2">Preconsulta registrada</h3>
            <div className="grid grid-cols-2 gap-1">
              <p><b>Motivo:</b> {preconsulta.motivo_consulta}</p>
              <p><b>PA:</b> {preconsulta.presion_arterial} mmHg</p>
              <p><b>FC:</b> {preconsulta.frecuencia_cardiaca} LPM</p>
              <p><b>FR:</b> {preconsulta.frecuencia_respiratoria} RPM</p>
              <p><b>Temp:</b> {preconsulta.temperatura} C</p>
              <p><b>SpO2:</b> {preconsulta.saturacion} %</p>
              <p><b>Peso:</b> {preconsulta.peso} kg</p>
              <p><b>Talla:</b> {preconsulta.talla} cm</p>
              <p><b>IMC:</b> {preconsulta.imc}</p>
            </div>
          </div>
        )}

        {notaEnfermeria && seccion !== "enfermeria" && (
          <div className="bg-white p-4 rounded-2xl shadow text-sm">
            <h3 className="font-bold text-green-700 mb-2">Nota de Enfermeria registrada</h3>
            <p>{notaEnfermeria.nota}</p>
          </div>
        )}

        {notaMedica && seccion !== "medica" && (
          <div className="bg-white p-4 rounded-2xl shadow text-sm">
            <h3 className="font-bold text-green-700 mb-2">Nota Medica registrada</h3>
            <p>{notaMedica.nota}</p>
          </div>
        )}

        {medicamentos.length > 0 && seccion !== "medicamentos" && (
          <div className="bg-white p-4 rounded-2xl shadow text-sm">
            <h3 className="font-bold text-orange-600 mb-2">Medicamentos recetados</h3>
            <div className="space-y-2">
              {medicamentos.map((m) => (
                <div key={m.id} className="border p-3 rounded-xl bg-orange-50">
                  <p className="font-bold text-orange-700">{m.nombre}</p>
                  {m.dosis && <p><b>Dosis:</b> {m.dosis}</p>}
                  {m.frecuencia && <p><b>Frecuencia:</b> {m.frecuencia}</p>}
                  {m.duracion && <p><b>Duracion:</b> {m.duracion}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      </div>
    </main>
  );
}
