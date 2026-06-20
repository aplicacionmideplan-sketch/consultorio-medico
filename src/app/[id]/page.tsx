"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [vitalSigns, setVitalSigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  async function getData() {
    setLoading(true);

    const { data: patientData } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .single();

    const { data: vitalsData } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    setPatient(patientData);
    setVitalSigns(vitalsData || []);
    setLoading(false);
  }

  useEffect(() => {
    setMounted(true);
    getData();
  }, []);

  if (loading) {
    return <div className="p-8 text-xl font-bold">Cargando expediente...</div>;
  }

  if (!patient) {
    return <div className="p-8 text-red-600">Paciente no encontrado</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="bg-white p-6 rounded-2xl shadow">
        <h1 className="text-3xl font-bold text-blue-700">
          {patient.nombre_completo}
        </h1>
        <p><b>Identificacion:</b> {patient.identificacion}</p>
        <p><b>Telefono:</b> {patient.telefono}</p>
        <p><b>Correo:</b> {patient.correo}</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mt-6">
        <h2 className="text-2xl font-bold mb-4">Historial de Signos Vitales</h2>

        {vitalSigns.length === 0 ? (
          <p className="text-gray-500">No hay registros de signos vitales</p>
        ) : (
          <div className="space-y-4">
            {vitalSigns.map((v) => (
              <div key={v.id} className="border p-4 rounded-xl bg-slate-50">

                <p className="text-sm text-gray-500 mb-2">
                  {mounted ? (
                    <>
                      {new Date(v.created_at).toLocaleDateString()} -{" "}
                      {new Date(v.created_at).toLocaleTimeString()}
                    </>
                  ) : null}
                </p>

                <p><b>PA:</b> {v.presion_arterial} mmHg</p>
                <p><b>FC:</b> {v.frecuencia_cardiaca} LPM</p>
                <p><b>FR:</b> {v.frecuencia_respiratoria} RPM</p>
                <p><b>Temp:</b> {v.temperatura} °C</p>
                <p><b>SpO2:</b> {v.saturacion} %</p>
                <p><b>Peso:</b> {v.peso} kg</p>
                <p><b>Talla:</b> {v.talla} cm</p>
                <p><b>IMC:</b> {v.imc}</p>

              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}