export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold text-blue-700">
        Sistema de Expediente Clínico
      </h1>

      <p className="text-gray-500 mt-2">
        Medicina Laboral
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Pacientes</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Signos Vitales</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Notas de Enfermería</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Módulo Médico</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Laboratorio</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Citas</h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold">Administración</h2>
        </div>

      </div>

    </main>
  );
}