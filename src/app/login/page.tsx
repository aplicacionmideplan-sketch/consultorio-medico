"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function login() {
    alert("BOTON PRESIONADO"); // 👈 solo para confirmar que ejecuta
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", usuario)
      .single();

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      setErrorMsg("Error Supabase: " + error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setErrorMsg("Usuario no encontrado");
      setLoading(false);
      return;
    }

    if (data.password !== password) {
      setErrorMsg("Contraseña incorrecta. DB: " + data.password + " | Ingresaste: " + password);
      setLoading(false);
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));

    if (data.role === "medico" || data.role === "enfermeria") {
      router.push("/patients");
    } else {
      setErrorMsg("Rol desconocido: " + data.role);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>

        <input
          className="border p-3 w-full mb-4 rounded"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />

        <input
          type="password"
          className="border p-3 w-full mb-4 rounded"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && (
          <p className="text-red-500 text-sm mb-4 break-all">{errorMsg}</p>
        )}

        <button
          onClick={login}
          disabled={loading}
          className="bg-blue-600 text-white w-full p-3 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
} 