"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VitalSignsPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [presionSistolica, setPresionSistolica] = useState("");
  const [presionDiastolica, setPresionDiastolica] = useState("");

  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacion, setSaturacion] = useState("");

  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [imc, setImc] = useState(0);

  function calcularIMC(pesoValor: string, tallaValor: string) {
    const pesoNum = Number(pesoValor);
    const tallaNum = Number(tallaValor);

    if (pesoNum > 0 && tallaNum > 0) {
      const tallaMetros = tallaNum / 100;
      const resultado = pesoNum / (tallaMetros * tallaMetros);
      setImc(Number(resultado.toFixed(2)));
    }
  }

  async function guardarSignosVitales() {
    console.log("PATIENT ID:", patientId); // 🔥 IMPORTANTE DEBUG

    const { error } = await supabase.from("vital_signs").insert([
      {
        patient_id: patientId,
        presion_arterial: `${presionSistolica}/${presionDiastolica}`,
        frecuencia_cardiaca: Number(frecuenciaCardiaca),
        frecuencia_respiratoria: Number(frecuenciaRespiratoria),
        temperatura: Number(temperatura),
        saturacion: Number(saturacion),
        peso: Number(peso),
        talla: Number(talla),
        imc: imc,
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("Signos vitales guardados correctamente");

      setPresionSistolica("");
      setPresionDiastolica("");
      setFrecuenciaCardiaca("");
      setFrecuenciaRespiratoria("");
      setTemperatura("");
      setSaturacion("");
      setPeso("");
      setTalla("");
      setImc(0);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold text-blue-700">
        Signos Vitales
      </h1>

      <div className="bg-white rounded-2xl shadow p-6 mt-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* PA */}
          <div className="border p-3 rounded">
            <label>Presión Arterial (mmHg)</label>

            <div className="flex gap-2 mt-2">
              <input
                className="border p-2 rounded w-full"
                placeholder="Sistólica"
                value={presionSistolica}
                onChange={(e) => setPresionSistolica(e.target.value)}
              />

              <span className="self-center">/</span>

              <input
                className="border p-2 rounded w-full"
                placeholder="Diastólica"
                value={presionDiastolica}
                onChange={(e) => setPresionDiastolica(e.target.value)}
              />
            </div>
          </div>

          <input
            className="border p-2 rounded"
            placeholder="Frecuencia Cardíaca (LPM)"
            value={frecuenciaCardiaca}
            onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Frecuencia Respiratoria (RPM)"
            value={frecuenciaRespiratoria}
            onChange={(e) => setFrecuenciaRespiratoria(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Temperatura (°C)"
            value={temperatura}
            onChange={(e) => setTemperatura(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Saturación (SpO2 %)"
            value={saturacion}
            onChange={(e) => setSaturacion(e.target.value)}
          />

          <input
            className="border p-2 rounded"
            placeholder="Peso (kg)"
            value={peso}
            onChange={(e) => {
              setPeso(e.target.value);
              calcularIMC(e.target.value, talla);
            }}
          />

          <input
            className="border p-2 rounded"
            placeholder="Talla (cm)"
            value={talla}
            onChange={(e) => {
              setTalla(e.target.value);
              calcularIMC(peso, e.target.value);
            }}
          />

          <input
            className="border p-2 rounded bg-gray-100"
            value={imc}
            readOnly
          />

        </div>

        <button
          onClick={guardarSignosVitales}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl mt-6 hover:bg-blue-700"
        >
          Guardar Signos Vitales
        </button>

      </div>

    </main>
  );
}