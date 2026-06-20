"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VitalSignsPage() {
  const params = useParams();
  const patientId = params.id as string;

  // 🩸 Presión arterial
  const [presionSistolica, setPresionSistolica] = useState("");
  const [presionDiastolica, setPresionDiastolica] = useState("");

  // ❤️ Respiratorio / Cardiaco
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");

  // 🌡️ Otros signos
  const [temperatura, setTemperatura] = useState("");
  const [saturacion, setSaturacion] = useState("");

  // ⚖️ Antropometría
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [imc, setImc] = useState(0);

  // 📊 IMC
  function calcularIMC(pesoValor: string, tallaValor: string) {
    const pesoNum = Number(pesoValor);
    const tallaNum = Number(tallaValor);

    if (pesoNum > 0 && tallaNum > 0) {
      const tallaMetros = tallaNum / 100;
      const resultado = pesoNum / (tallaMetros * tallaMetros);

      setImc(Number(resultado.toFixed(2)));
    }
  }

  // 💾 Guardar
  async function guardarSignosVitales() {
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

      // 🧹 limpiar
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
        Registrar Signos Vitales
      </h1>

      <div className="bg-white rounded-2xl shadow p-6 mt-8">

        {/* 🧾 FORMATO CLÍNICO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* 🩸 PRESIÓN ARTERIAL */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Presión Arterial (mmHg)
            </label>

            <div className="flex gap-2 mt-2">
              <input
                className="border p-2 rounded w-full"
                placeholder="Sistólica"
                value={presionSistolica}
                onChange={(e) => setPresionSistolica(e.target.value)}
              />

              <span className="self-center font-bold">/</span>

              <input
                className="border p-2 rounded w-full"
                placeholder="Diastólica"
                value={presionDiastolica}
                onChange={(e) => setPresionDiastolica(e.target.value)}
              />
            </div>
          </div>

          {/* ❤️ FC */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Frecuencia Cardíaca (LPM)
            </label>

            <input
              className="border p-2 rounded w-full mt-2"
              placeholder="LPM"
              value={frecuenciaCardiaca}
              onChange={(e) => setFrecuenciaCardiaca(e.target.value)}
            />
          </div>

          {/* 🌬️ FR */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Frecuencia Respiratoria (RPM)
            </label>

            <input
              className="border p-2 rounded w-full mt-2"
              placeholder="RPM"
              value={frecuenciaRespiratoria}
              onChange={(e) => setFrecuenciaRespiratoria(e.target.value)}
            />
          </div>

          {/* 🌡️ TEMP */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Temperatura (°C)
            </label>

            <input
              className="border p-2 rounded w-full mt-2"
              placeholder="°C"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
            />
          </div>

          {/* 🫁 SPO2 */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Saturación de Oxígeno (SpO2 %)
            </label>

            <input
              className="border p-2 rounded w-full mt-2"
              placeholder="%"
              value={saturacion}
              onChange={(e) => setSaturacion(e.target.value)}
            />
          </div>

          {/* ⚖️ PESO */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Peso (kg)
            </label>

            <input
              className="border p-2 rounded w-full mt-2"
              value={peso}
              onChange={(e) => {
                setPeso(e.target.value);
                calcularIMC(e.target.value, talla);
              }}
            />
          </div>

          {/* 📏 TALLA */}
          <div className="border p-3 rounded">
            <label className="font-semibold">
              Talla (cm)
            </label>

            <input
              className="border p-2 rounded w-full mt-2"
              value={talla}
              onChange={(e) => {
                setTalla(e.target.value);
                calcularIMC(peso, e.target.value);
              }}
            />
          </div>

          {/* 📊 IMC */}
          <div className="border p-3 rounded bg-gray-100">
            <label className="font-semibold">
              IMC
            </label>

            <input
              className="p-2 w-full bg-gray-100"
              value={imc}
              readOnly
            />
          </div>

        </div>

        {/* 💾 BOTÓN */}
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