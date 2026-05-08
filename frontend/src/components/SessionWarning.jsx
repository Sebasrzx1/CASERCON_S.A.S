import { useAuth } from "../context/AuthContext";

export function SessionWarning() {
  const { showWarning, setShowWarning, logout } = useAuth();

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            Tu sesión está por expirar
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            En{" "}
            <span className="font-semibold text-yellow-500">5 minutos</span> se
            cerrará tu sesión automáticamente por inactividad.
          </p>
          <div className="flex gap-3">
            <button
              onClick={logout}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm"
            >
              Cerrar sesión
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="flex-1 py-2 bg-yellow-400 rounded-lg font-bold hover:bg-yellow-500 transition text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}