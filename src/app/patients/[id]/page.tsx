"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";
import { checkPresionArterial, checkFrecuenciaCardiaca, checkFrecuenciaRespiratoria, checkTemperatura, checkSaturacion } from "@/lib/vitalRanges";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const { isMedico, isEnfermeria, isAdministrativo, loadingRole } = useRole();

  // PERMISOS: medico edita todo. Enfermeria edita signos vitales y vacunas, pero no medicamentos.
  const puedeEditarMedicamentos = isMedico;
  const puedeEditarVitalesYVacunas = isMedico || isEnfermeria;

  const [patient, setPatient] = useState<any>(null);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [citasPasadas, setCitasPasadas] = useState<any[]>([]);
  const [laboratorios, setLaboratorios] = useState<any[]>([]);
  const [complementarios, setComplementarios] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormMed, setMostrarFormMed] = useState(false);
  const [mostrarFormVac, setMostrarFormVac] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [citaAbierta, setCitaAbierta] = useState<string | null>(null);
  const [labAbierto, setLabAbierto] = useState<string | null>(null);
  const [compAbierto, setCompAbierto] = useState<string | null>(null);
  const [vacAbierta, setVacAbierta] = useState<string | null>(null);

  const [presionSistolica, setPresionSistolica] = useState("");
  const [presionDiastolica, setPresionDiastolica] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [imc, setImc] = useState(0);

  const [nombreMed, setNombreMed] = useState("");
  const [dosisMed, setDosisMed] = useState("");
  const [frecuenciaMed, setFrecuenciaMed] = useState("");
  const [duracionMed, setDuracionMed] = useState("");

  const [nombreVac, setNombreVac] = useState("");
  const [fechaVac, setFechaVac] = useState("");
  const [dosisVac, setDosisVac] = useState("");
  const [loteVac, setLoteVac] = useState("");
  const [aplicadoPorVac, setAplicadoPorVac] = useState("");

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

    const { data: patientData } = await supabase.from("patients").select("*").eq("id", patientId).single();
    const { data: vitalsData } = await supabase.from("vital_signs").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
    const { data: citasData } = await supabase.from("appointments").select("*").eq("patient_id", patientId).order("fecha", { ascending: false });
    const { data: labsData } = await supabase.from("laboratorios").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
    const { data: compsData } = await supabase.from("laboratorios_complementarios").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
    const { data: medsData } = await supabase.from("medicamentos").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
    const { data: vacsData } = await supabase.from("vacunas").select("*").eq("patient_id", patientId).order("fecha", { ascending: false });

    let citasCompletas: any[] = [];
    if (citasData && citasData.length > 0) {
      citasCompletas = await Promise.all(
        citasData.map(async (cita) => {
          const { data: preData } = await supabase.from("preconsultas").select("*").eq("appointment_id", cita.id).single();
          const { data: enfData } = await supabase.from("notas_enfermeria").select("*").eq("appointment_id", cita.id).single();
          const { data: medData } = await supabase.from("notas_medicas").select("*").eq("appointment_id", cita.id).single();
          const { data: medsC } = await supabase.from("medicamentos").select("*").eq("appointment_id", cita.id);
          return { ...cita, preconsulta: preData || null, notaEnfermeria: enfData || null, notaMedica: medData || null, medicamentosCita: medsC || [] };
        })
      );
    }

    setPatient(patientData);
    setVitalSigns(vitalsData || []);
    setCitasPasadas(citasCompletas);
    setLaboratorios(labsData || []);
    setComplementarios(compsData || []);
    setMedicamentos(medsData || []);
    setVacunas(vacsData || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!loadingRole && isAdministrativo) {
      router.push("/appointments");
      return;
    }
    if (!loadingRole) {
      setMounted(true);
      getData();
    }
  }, [loadingRole, isAdministrativo]);

  async function guardarSignosVitales() {
    const { error } = await supabase.from("vital_signs").insert([{
      patient_id: patientId,
      presion_arterial: `${presionSistolica}/${presionDiastolica}`,
      frecuencia_cardiaca: Number(frecuenciaCardiaca),
      frecuencia_respiratoria: Number(frecuenciaRespiratoria),
      temperatura: Number(temperatura),
      saturacion: Number(saturacion),
      peso: Number(peso),
      talla: Number(talla),
      imc: imc,
    }]);
    if (error) { setMensaje("Error: " + error.message); }
    else {
      setMensaje("Signos vitales guardados");
      setMostrarFormulario(false);
      setPresionSistolica(""); setPresionDiastolica(""); setFrecuenciaCardiaca("");
      setFrecuenciaRespiratoria(""); setTemperatura(""); setSaturacion("");
      setPeso(""); setTalla(""); setImc(0);
      getData();
    }
  }

  async function guardarMedicamento() {
    if (!nombreMed) { setMensaje("El nombre es obligatorio"); return; }
    const { error } = await supabase.from("medicamentos").insert([{
      patient_id: patientId, nombre: nombreMed, dosis: dosisMed, frecuencia: frecuenciaMed, duracion: duracionMed,
    }]);
    if (error) { setMensaje("Error: " + error.message); }
    else {
      setMensaje("Medicamento guardado");
      setNombreMed(""); setDosisMed(""); setFrecuenciaMed(""); setDuracionMed("");
      setMostrarFormMed(false);
      getData();
    }
  }

  async function guardarVacuna() {
    if (!nombreVac || !fechaVac) { setMensaje("Nombre y fecha son obligatorios"); return; }
    const { error } = await supabase.from("vacunas").insert([{
      patient_id: patientId, nombre: nombreVac, fecha: fechaVac, dosis: dosisVac, lote: loteVac, aplicado_por: aplicadoPorVac,
    }]);
    if (error) { setMensaje("Error: " + error.message); }
    else {
      setMensaje("Vacuna registrada correctamente");
      setNombreVac(""); setFechaVac(""); setDosisVac(""); setLoteVac(""); setAplicadoPorVac("");
      setMostrarFormVac(false);
      getData();
    }
  }

  async function eliminarMedicamento(id: string) {
    await supabase.from("medicamentos").delete().eq("id", id);
    getData();
  }

  async function eliminarVacuna(id: string) {
    await supabase.from("vacunas").delete().eq("id", id);
    getData();
  }

  function colorEstadoCita(estado: string) {
    if (estado === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (estado === "en espera") return "bg-orange-100 text-orange-700";
    if (estado === "completada") return "bg-green-100 text-green-700";
    if (estado === "cancelada") return "bg-red-100 text-red-700";
    return "";
  }

  function colorEstadoLab(estado: string) {
    if (estado === "pendiente") return "bg-yellow-100 text-yellow-700";
    if (estado === "en proceso") return "bg-blue-100 text-blue-700";
    if (estado === "completado") return "bg-green-100 text-green-700";
    return "";
  }

  if (loadingRole || loading) return <div className="p-8 text-xl font-bold">Cargando expediente...</div>;
  if (isAdministrativo) return null;
  if (!patient) return <div className="p-8 text-red-600">Paciente no encontrado</div>;

  return (
    <main className="min-h-screen bg-slate-100">
      <AppHeader title="Expediente del Paciente" />

      <div className="p-8">

      {/* DATOS PERSONALES */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">{patient.nombre_completo}</h1>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><b>Identificacion:</b> {patient.identificacion}</p>
          <p><b>Fecha de nacimiento:</b> {patient.fecha_nacimiento}</p>
          <p><b>Sexo:</b> {patient.sexo}</p>
          <p><b>Estado civil:</b> {patient.estado_civil}</p>
          <p><b>Telefono:</b> {patient.telefono}</p>
          <p><b>Correo:</b> {patient.correo}</p>
          <p><b>Direccion:</b> {patient.direccion}</p>
          <p><b>Departamento:</b> {patient.departamento}</p>
          <p><b>Contacto de emergencia:</b> {patient.contacto_emergencia}</p>
          <p><b>Parentesco:</b> {patient.parentesco_contacto}</p>
        </div>
      </div>

      {/* ANTECEDENTES */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Antecedentes</h2>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <p><b>Patologicos:</b> {patient.antecedentes_patologicos || "Ninguno"}</p>
          <p><b>Quirurgicos:</b> {patient.antecedentes_quirurgicos || "Ninguno"}</p>
          <p><b>Familiares:</b> {patient.antecedentes_familiares || "Ninguno"}</p>
          <p><b>Medicamentos actuales:</b> {patient.medicamentos_actuales || "Ninguno"}</p>
          <p><b>Alergias:</b> {patient.alergias || "Ninguna"}</p>
        </div>
      </div>

      {/* SIGNOS VITALES */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">Signos Vitales</h2>
          {puedeEditarVitalesYVacunas && (
            <button onClick={() => setMostrarFormulario(!mostrarFormulario)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {mostrarFormulario ? "Cancelar" : "+ Agregar"}
            </button>
          )}
        </div>
        {mensaje && <p className="text-green-600 font-semibold mb-4">{mensaje}</p>}
        {mostrarFormulario && (
          <div className="border p-4 rounded-xl bg-slate-50 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border p-3 rounded col-span-2 md:col-span-1">
                <label className="text-sm font-semibold">Presion Arterial (mmHg)</label>
                <div className="flex gap-2 mt-2">
                  <input className="border p-2 rounded w-full" placeholder="Sistolica" value={presionSistolica} onChange={(e) => setPresionSistolica(e.target.value)} />
                  <span className="self-center">/</span>
                  <input className="border p-2 rounded w-full" placeholder="Diastolica" value={presionDiastolica} onChange={(e) => setPresionDiastolica(e.target.value)} />
                </div>
                {checkPresionArterial(presionSistolica, presionDiastolica) && (
                  <p className="text-red-600 text-xs mt-1">{checkPresionArterial(presionSistolica, presionDiastolica)}</p>
                )}
              </div>
              <div>
                <input className="border p-2 rounded w-full" placeholder="Frecuencia Cardiaca (LPM)" value={frecuenciaCardiaca} onChange={(e) => setFrecuenciaCardiaca(e.target.value)} />
                {checkFrecuenciaCardiaca(frecuenciaCardiaca) && (
                  <p className="text-red-600 text-xs mt-1">{checkFrecuenciaCardiaca(frecuenciaCardiaca)}</p>
                )}
              </div>
              <div>
                <input className="border p-2 rounded w-full" placeholder="Frecuencia Respiratoria (RPM)" value={frecuenciaRespiratoria} onChange={(e) => setFrecuenciaRespiratoria(e.target.value)} />
                {checkFrecuenciaRespiratoria(frecuenciaRespiratoria) && (
                  <p className="text-red-600 text-xs mt-1">{checkFrecuenciaRespiratoria(frecuenciaRespiratoria)}</p>
                )}
              </div>
              <div>
                <input className="border p-2 rounded w-full" placeholder="Temperatura (C)" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
                {checkTemperatura(temperatura) && (
                  <p className="text-red-600 text-xs mt-1">{checkTemperatura(temperatura)}</p>
                )}
              </div>
              <div>
                <input className="border p-2 rounded w-full" placeholder="Saturacion SpO2 (%)" value={saturacion} onChange={(e) => setSaturacion(e.target.value)} />
                {checkSaturacion(saturacion) && (
                  <p className="text-red-600 text-xs mt-1">{checkSaturacion(saturacion)}</p>
                )}
              </div>
              <input className="border p-2 rounded" placeholder="Peso (kg)" value={peso} onChange={(e) => { setPeso(e.target.value); calcularIMC(e.target.value, talla); }} />
              <input className="border p-2 rounded" placeholder="Talla (cm)" value={talla} onChange={(e) => { setTalla(e.target.value); calcularIMC(peso, e.target.value); }} />
              <input className="border p-2 rounded bg-gray-100" placeholder="IMC (calculado)" value={imc || ""} readOnly />
            </div>
            <button onClick={guardarSignosVitales} className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Guardar</button>
          </div>
        )}
        {vitalSigns.length === 0 ? <p className="text-gray-500">No hay registros</p> : (
          <div className="space-y-4">
            {vitalSigns.map((v) => (
              <div key={v.id} className="border p-4 rounded-xl bg-slate-50">
                <p className="text-sm text-gray-500 mb-2">{mounted ? <>{new Date(v.created_at).toLocaleDateString()} - {new Date(v.created_at).toLocaleTimeString()}</> : null}</p>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <p><b>PA:</b> {v.presion_arterial} mmHg</p>
                  <p><b>FC:</b> {v.frecuencia_cardiaca} LPM</p>
                  <p><b>FR:</b> {v.frecuencia_respiratoria} RPM</p>
                  <p><b>Temp:</b> {v.temperatura} C</p>
                  <p><b>SpO2:</b> {v.saturacion} %</p>
                  <p><b>Peso:</b> {v.peso} kg</p>
                  <p><b>Talla:</b> {v.talla} cm</p>
                  <p><b>IMC:</b> {v.imc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MEDICAMENTOS */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-orange-600">Medicamentos</h2>
          {puedeEditarMedicamentos && (
            <button onClick={() => setMostrarFormMed(!mostrarFormMed)} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              {mostrarFormMed ? "Cancelar" : "+ Agregar"}
            </button>
          )}
        </div>
        {mostrarFormMed && (
          <div className="border p-4 rounded-xl bg-orange-50 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input className="border p-2 rounded col-span-2" placeholder="Nombre del medicamento *" value={nombreMed} onChange={(e) => setNombreMed(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Dosis (ej. 500mg)" value={dosisMed} onChange={(e) => setDosisMed(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Frecuencia (ej. cada 8 horas)" value={frecuenciaMed} onChange={(e) => setFrecuenciaMed(e.target.value)} />
              <input className="border p-2 rounded col-span-2" placeholder="Duracion (ej. 7 dias)" value={duracionMed} onChange={(e) => setDuracionMed(e.target.value)} />
            </div>
            <button onClick={guardarMedicamento} className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600">Guardar</button>
          </div>
        )}
        {medicamentos.length === 0 ? <p className="text-gray-500">No hay medicamentos registrados</p> : (
          <div className="space-y-2">
            {medicamentos.map((m) => (
              <div key={m.id} className="border p-3 rounded-xl bg-orange-50 flex justify-between items-start">
                <div className="text-sm">
                  <p className="font-bold text-orange-700">{m.nombre}</p>
                  {m.dosis && <p><b>Dosis:</b> {m.dosis}</p>}
                  {m.frecuencia && <p><b>Frecuencia:</b> {m.frecuencia}</p>}
                  {m.duracion && <p><b>Duracion:</b> {m.duracion}</p>}
                  <p className="text-gray-400 text-xs mt-1">{mounted ? new Date(m.created_at).toLocaleDateString() : ""}</p>
                </div>
                {puedeEditarMedicamentos && (
                  <button onClick={() => eliminarMedicamento(m.id)} className="text-red-500 hover:underline text-sm ml-4">Eliminar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VACUNAS - ACORDEON */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-700">Vacunas</h2>
          {puedeEditarVitalesYVacunas && (
            <button onClick={() => setMostrarFormVac(!mostrarFormVac)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {mostrarFormVac ? "Cancelar" : "+ Agregar"}
            </button>
          )}
        </div>

        {mostrarFormVac && (
          <div className="border p-4 rounded-xl bg-green-50 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input className="border p-2 rounded col-span-2" placeholder="Nombre de la vacuna *" value={nombreVac} onChange={(e) => setNombreVac(e.target.value)} />
              <div className="col-span-2 md:col-span-1">
                <label className="text-sm font-semibold block mb-1">Fecha de aplicacion *</label>
                <input className="border p-2 rounded w-full" type="date" value={fechaVac} onChange={(e) => setFechaVac(e.target.value)} />
              </div>
              <input className="border p-2 rounded" placeholder="Dosis (ej. 1ra dosis)" value={dosisVac} onChange={(e) => setDosisVac(e.target.value)} />
              <input className="border p-2 rounded" placeholder="Lote" value={loteVac} onChange={(e) => setLoteVac(e.target.value)} />
              <input className="border p-2 rounded col-span-2" placeholder="Aplicado por" value={aplicadoPorVac} onChange={(e) => setAplicadoPorVac(e.target.value)} />
            </div>
            <button onClick={guardarVacuna} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Guardar vacuna</button>
          </div>
        )}

        {vacunas.length === 0 ? <p className="text-gray-500">No hay vacunas registradas</p> : (
          <div className="space-y-3">
            {vacunas.map((v) => {
              const abierta = vacAbierta === v.id;
              return (
                <div key={v.id} className="border rounded-xl overflow-hidden">
                  <button onClick={() => setVacAbierta(abierta ? null : v.id)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-800">{v.nombre}</span>
                      <span className="text-sm text-gray-500">
                        {mounted ? new Date(v.fecha + "T00:00:00").toLocaleDateString() : v.fecha}
                      </span>
                      {v.dosis && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{v.dosis}</span>}
                    </div>
                    <span className={`text-green-600 text-xl transition-transform ${abierta ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {abierta && (
                    <div className="p-4 border-t bg-white text-sm space-y-1">
                      <p><b>Nombre:</b> {v.nombre}</p>
                      <p><b>Fecha de aplicacion:</b> {mounted ? new Date(v.fecha + "T00:00:00").toLocaleDateString() : v.fecha}</p>
                      {v.dosis && <p><b>Dosis:</b> {v.dosis}</p>}
                      {v.lote && <p><b>Lote:</b> {v.lote}</p>}
                      {v.aplicado_por && <p><b>Aplicado por:</b> {v.aplicado_por}</p>}
                      {puedeEditarVitalesYVacunas && (
                        <button onClick={() => eliminarVacuna(v.id)} className="text-red-500 hover:underline text-sm mt-2 block">Eliminar</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORIAL DE CITAS */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Historial de Citas</h2>
        {citasPasadas.length === 0 ? <p className="text-gray-500">No hay citas registradas</p> : (
          <div className="space-y-3">
            {citasPasadas.map((cita) => {
              const abierta = citaAbierta === cita.id;
              return (
                <div key={cita.id} className="border rounded-xl overflow-hidden">
                  <button onClick={() => setCitaAbierta(abierta ? null : cita.id)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-800">{mounted ? new Date(cita.fecha + "T00:00:00").toLocaleDateString() : cita.fecha}</span>
                      <span className="text-gray-500 text-sm">{cita.hora}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstadoCita(cita.estado)}`}>{cita.estado}</span>
                      {cita.motivo && <span className="text-sm text-gray-500 hidden md:inline">- {cita.motivo}</span>}
                    </div>
                    <span className={`text-blue-600 text-xl transition-transform ${abierta ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {abierta && (
                    <div className="p-4 border-t bg-white space-y-3">
                      <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                        <p><b>Motivo:</b> {cita.motivo || "-"}</p>
                        <p><b>Medico:</b> {cita.medico_asignado || "-"}</p>
                      </div>
                      {cita.preconsulta ? (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-sm">
                          <h4 className="font-bold text-blue-700 mb-2">Preconsulta</h4>
                          <p className="mb-2"><b>Motivo:</b> {cita.preconsulta.motivo_consulta || "-"}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <p><b>PA:</b> {cita.preconsulta.presion_arterial} mmHg</p>
                            <p><b>FC:</b> {cita.preconsulta.frecuencia_cardiaca} LPM</p>
                            <p><b>FR:</b> {cita.preconsulta.frecuencia_respiratoria} RPM</p>
                            <p><b>Temp:</b> {cita.preconsulta.temperatura} C</p>
                            <p><b>SpO2:</b> {cita.preconsulta.saturacion} %</p>
                            <p><b>Peso:</b> {cita.preconsulta.peso} kg</p>
                            <p><b>Talla:</b> {cita.preconsulta.talla} cm</p>
                            <p><b>IMC:</b> {cita.preconsulta.imc}</p>
                          </div>
                        </div>
                      ) : <div className="bg-gray-50 border p-3 rounded-xl text-sm text-gray-400 italic">Sin preconsulta</div>}
                      {cita.notaEnfermeria ? (
                        <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl text-sm">
                          <h4 className="font-bold text-teal-700 mb-2">Nota de Enfermeria</h4>
                          <p className="whitespace-pre-wrap">{cita.notaEnfermeria.nota}</p>
                        </div>
                      ) : <div className="bg-gray-50 border p-3 rounded-xl text-sm text-gray-400 italic">Sin nota de enfermeria</div>}
                      {cita.notaMedica ? (
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl text-sm">
                          <h4 className="font-bold text-purple-700 mb-2">Nota Medica</h4>
                          <p className="whitespace-pre-wrap">{cita.notaMedica.nota}</p>
                        </div>
                      ) : <div className="bg-gray-50 border p-3 rounded-xl text-sm text-gray-400 italic">Sin nota medica</div>}
                      {cita.medicamentosCita && cita.medicamentosCita.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-sm">
                          <h4 className="font-bold text-orange-600 mb-2">Medicamentos recetados</h4>
                          <div className="space-y-1">
                            {cita.medicamentosCita.map((m: any) => (
                              <div key={m.id}>
                                <p className="font-semibold">{m.nombre}</p>
                                {m.dosis && <p><b>Dosis:</b> {m.dosis}</p>}
                                {m.frecuencia && <p><b>Frecuencia:</b> {m.frecuencia}</p>}
                                {m.duracion && <p><b>Duracion:</b> {m.duracion}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXAMENES */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-bold mb-4 text-purple-700">Examenes</h2>
        {laboratorios.length === 0 ? <p className="text-gray-500">No hay solicitudes de examenes</p> : (
          <div className="space-y-3">
            {laboratorios.map((lab) => {
              const abierto = labAbierto === lab.id;
              return (
                <div key={lab.id} className="border rounded-xl overflow-hidden">
                  <button onClick={() => setLabAbierto(abierto ? null : lab.id)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-800">{mounted ? new Date(lab.created_at).toLocaleDateString() : ""}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstadoLab(lab.estado)}`}>{lab.estado}</span>
                      <span className="text-sm text-gray-500">{lab.examenes?.length || 0} examen(es)</span>
                    </div>
                    <span className={`text-purple-600 text-xl transition-transform ${abierto ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {abierto && (
                    <div className="p-4 border-t bg-white space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {lab.examenes?.map((e: string) => (
                          <span key={e} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">{e}</span>
                        ))}
                      </div>
                      {lab.observaciones && <p className="text-sm"><b>Observaciones:</b> {lab.observaciones}</p>}
                      {lab.archivo_url ? (
                        <a href={lab.archivo_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline text-sm font-semibold block">Ver PDF de resultados</a>
                      ) : <p className="text-sm text-gray-400 italic">Sin resultados adjuntos</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EXAMENES COMPLEMENTARIOS */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Examenes Complementarios</h2>
        {complementarios.length === 0 ? <p className="text-gray-500">No hay solicitudes de examenes complementarios</p> : (
          <div className="space-y-3">
            {complementarios.map((comp) => {
              const abierto = compAbierto === comp.id;
              return (
                <div key={comp.id} className="border rounded-xl overflow-hidden">
                  <button onClick={() => setCompAbierto(abierto ? null : comp.id)} className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-800">{mounted ? new Date(comp.created_at).toLocaleDateString() : ""}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorEstadoLab(comp.estado)}`}>{comp.estado}</span>
                      <span className="text-sm text-gray-500">{comp.examenes?.length || 0} examen(es)</span>
                    </div>
                    <span className={`text-indigo-600 text-xl transition-transform ${abierto ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {abierto && (
                    <div className="p-4 border-t bg-white space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {comp.examenes?.map((e: string) => (
                          <span key={e} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">{e}</span>
                        ))}
                      </div>
                      {comp.observaciones && <p className="text-sm"><b>Observaciones:</b> {comp.observaciones}</p>}
                      {comp.archivo_url ? (
                        <a href={comp.archivo_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm font-semibold block">Ver PDF de resultados</a>
                      ) : <p className="text-sm text-gray-400 italic">Sin resultados adjuntos</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      </div>
    </main>
  );
}
