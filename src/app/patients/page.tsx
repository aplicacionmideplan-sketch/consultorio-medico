"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/lib/useRole";
import AppHeader from "@/components/AppHeader";

export default function PatientsPage() {
  const router = useRouter();
  const { isAdministrativo, loadingRole } = useRole();

  const [identificacion, setIdentificacion] = useState("");
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState(0);
  const [sexo, setSexo] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [direccion, setDireccion] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [contactoEmergencia, setContactoEmergencia] = useState("");
  const [parentescoContacto, setParentescoContacto] = useState("");
  const [antecedentesPatologicos, setAntecedentesPatologicos] = useState("");
  const [antecedentesQuirurgicos, setAntecedentesQuirurgicos] = useState("");
  const [antecedentesFamiliares, setAntecedentesFamiliares] = useState("");
  const [medicamentosActuales, setMedicamentosActuales] = useState("");
  const [alergias, setAlergias] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null);

  function calcularEdad(fecha: string) {
    const nacimiento = new Date(fecha);
    const hoy = new Date();
    let anos = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      anos--;
    }
    setEdad(anos);
  }

  async function obtenerPacientes() {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("nombre_completo");
    if (!error && data) {
      setPacientes(data);
    }
  }

  useEffect(() => {
    if (!loadingRole && isAdministrativo) {
      router.push("/appointments");
      return;
    }
    if (!loadingRole) {
      obtenerPacientes();
    }
  }, [loadingRole, isAdministrativo]);

  async function guardarPaciente() {
    const { error } = await supabase.from("patients").insert([
      {
        identificacion,
        nombre_completo: nombre,
        fecha_nacimiento: fechaNacimiento,
        sexo,
        estado_civil: estadoCivil,
        direccion,
        departamento,
        telefono,
        correo,
        contacto_emergencia: contactoEmergencia,
        parentesco_contacto: parentescoContacto,
        antecedentes_patologicos: antecedentesPatologicos,
        antecedentes_quirurgicos: antecedentesQuirurgicos,
        antecedentes_familiares: antecedentesFamiliares,
        medicamentos_actuales: medicamentosActuales,
        alergias,
      },
    ]);

    if (error) {
      setMensaje("Error al guardar: " + error.message);
    } else {
      setMensaje("Paciente guardado correctamente");
      setMostrarFormulario(false);
      obtenerPacientes();
      setIdentificacion("");
      setNombre("");
      setFechaNacimiento("");
      setEdad(0);
      setSexo("");
      setEstadoCivil("");
      setDireccion("");
      setDepartamento("");
      setTelefono("");
      setCorreo("");
      setContactoEmergencia("");
      setParentescoContacto("");
      setAntecedentesPatologicos("");
      setAntecedentesQuirurgicos("");
      setAntecedentesFamiliares("");
      setMedicamentosActuales("");
      setAlergias("");
    }
  }

  async function eliminarPaciente(id: string) {
    const { error: errorVitales } = await supabase
      .from("vital_signs")
      .delete()
      .eq("patient_id", id);

    if (errorVitales) {
      setMensaje("Error al eliminar signos vitales: " + errorVitales.message);
      return;
    }

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) {
      setMensaje("Error al eliminar paciente: " + error.message);
    } else {
      setMensaje("Paciente eliminado correctamente");
      setConfirmarEliminar(null);
      obtenerPacientes();
    }
  }

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.identificacion?.includes(busqueda)
  );

  if (loadingRole) return <div className="p-8 text-xl font-bold">Cargando...</div>;
  if (isAdministrativo) return null;

  return (
    <main className="min-h-screen bg-slate-100">
      <AppHeader title="Pacientes" />

      <div className="p-8">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Pacientes</h1>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {mostrarFormulario ? "Cancelar" : "+ Nuevo Paciente"}
        </button>
      </div>

      {mensaje && (
        <p className="text-green-600 font-semibold mb-4">{mensaje}</p>
      )}

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Nuevo Paciente</h2>
          <div className="grid grid-cols-2 gap-4">
            <input className="border p-2 rounded" placeholder="Identificacion" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <input className="border p-2 rounded" type="date" value={fechaNacimiento} onChange={(e) => { setFechaNacimiento(e.target.value); calcularEdad(e.target.value); }} />
            <input className="border p-2 rounded bg-gray-100" placeholder="Edad calculada" value={edad || ""} readOnly />
            <select className="border p-2 rounded" value={sexo} onChange={(e) => setSexo(e.target.value)}>
              <option value="">Sexo</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
            <select className="border p-2 rounded" value={estadoCivil} onChange={(e) => setEstadoCivil(e.target.value)}>
              <option value="">Estado civil</option>
              <option value="Soltero">Soltero</option>
              <option value="Casado">Casado</option>
              <option value="Divorciado">Divorciado</option>
              <option value="Viudo">Viudo</option>
            </select>
            <input className="border p-2 rounded" placeholder="Direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Departamento" value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Contacto de emergencia" value={contactoEmergencia} onChange={(e) => setContactoEmergencia(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Parentesco" value={parentescoContacto} onChange={(e) => setParentescoContacto(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <textarea className="border p-2 rounded" placeholder="Antecedentes patologicos" value={antecedentesPatologicos} onChange={(e) => setAntecedentesPatologicos(e.target.value)} />
            <textarea className="border p-2 rounded" placeholder="Antecedentes quirurgicos" value={antecedentesQuirurgicos} onChange={(e) => setAntecedentesQuirurgicos(e.target.value)} />
            <textarea className="border p-2 rounded" placeholder="Antecedentes familiares" value={antecedentesFamiliares} onChange={(e) => setAntecedentesFamiliares(e.target.value)} />
            <textarea className="border p-2 rounded" placeholder="Medicamentos actuales" value={medicamentosActuales} onChange={(e) => setMedicamentosActuales(e.target.value)} />
            <textarea className="border p-2 rounded" placeholder="Alergias" value={alergias} onChange={(e) => setAlergias(e.target.value)} />
          </div>
          <button
            onClick={guardarPaciente}
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Guardar Paciente
          </button>
        </div>
      )}

      <input
        className="border p-3 w-full rounded mb-4 bg-white"
        placeholder="Buscar por nombre o identificacion..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-4">Identificacion</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Telefono</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pacientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No hay pacientes registrados
                </td>
              </tr>
            ) : (
              pacientesFiltrados.map((p) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="p-4">{p.identificacion}</td>
                  <td className="p-4">{p.nombre_completo}</td>
                  <td className="p-4">{p.telefono}</td>
                  <td className="p-4 flex gap-2 items-center">
                    <Link
                      href={`/patients/${p.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ver expediente
                    </Link>

                    {confirmarEliminar === p.id ? (
                      <>
                        <span className="text-red-600 text-sm">¿Seguro?</span>
                        <button
                          onClick={() => eliminarPaciente(p.id)}
                          className="text-white bg-red-600 px-2 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Si, eliminar
                        </button>
                        <button
                          onClick={() => setConfirmarEliminar(null)}
                          className="text-gray-600 bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmarEliminar(p.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Eliminar
                      </button>
                    )}
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
