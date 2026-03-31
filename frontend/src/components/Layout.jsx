import {
  Link,
  useLocation,
  Outlet,
  useNavigate,
  Navigate,
} from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Package,
  BookOpen,
  FileText,
  User,
  ShoppingCart,
  Factory,
} from "lucide-react";
import logoCarsecon from "../assets/logo.png";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("casercon_user"));
  const token = localStorage.getItem("token");

  const isAdministrador = user?.nombre_rol === "Administrador"; // ajusta según tu backend

  // 🔐 protección básica
  if (!token) {
    return <Navigate to="/" replace />;
  }
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("casercon_user");
    localStorage.removeItem("sector");
    navigate("/");
  };
  //Traemos los procesos de los usuarios (operarios)
  const procesos = user.procesos || [];

  const navItems = isAdministrador
    ? [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/inventario", label: "Inventario", icon: Package },
        { path: "/recetas", label: "Recetas", icon: BookOpen },
        { path: "/produccion", label: "Producción", icon: Factory },
        { path: "/pedidos", label: "Pedidos", icon: ShoppingCart },
        { path: "/movimientos", label: "Movimientos", icon: FileText },
        { path: "/usuarios", label: "Usuarios", icon: User },
      ]
    : [
        ...(procesos.includes("recepcion")
          ? [{ path: "/pedidos", label: "Pedidos", icon: ShoppingCart }]
          : []),

        ...(procesos.includes("produccion")
          ? [{ path: "/produccion", label: "Producción", icon: Factory }]
          : []),
      ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src={logoCarsecon}
                alt="Carsecon Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="font-bold text-white">Carsecon S.A.S</h1>
                <p className="text-xs text-yellow-400">
                  Sistema de Gestión de Inventario
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Alertas - Solo para gerente
              {isAdministrador && alertasActivas.length > 0 && (
                <Link
                  to="/dashboard"
                  className="relative p-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-5 h-5 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                    {alertasActivas.length}
                  </span>
                </Link>
              )} */}

              {/* Usuario */}
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600">
                <User className="w-5 h-5 text-yellow-400" />
                <div className="text-sm">
                  <p className="font-medium text-white">{user?.nombre}</p>
                  <p className="text-xs text-gray-400 capitalize">
                    {user?.nombre_rol}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-gray-300 hover:bg-yellow-500 hover:text-gray-900 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1800px]">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-yellow-400 text-gray-900 font-medium shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Sectores del operario (si aplica) */}
            {!isAdministrador && user?.procesos && user.procesos.length > 0 && (
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Mis Sectores</h3>
                <div className="space-y-2">
                  {user.procesos.includes("recepcion") && (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      <ShoppingCart className="w-4 h-4" />
                      <span className="text-sm font-medium">Recepción</span>
                    </div>
                  )}
                  {user.procesos.includes("produccion") && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                      <Factory className="w-4 h-4" />
                      <span className="text-sm font-medium">Producción</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info del rol */}
            <div className="mt-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm border border-gray-700 p-4">
              <h3 className="font-medium text-yellow-400 mb-2">
                Permisos activos
              </h3>
              <ul className="text-sm text-gray-300 space-y-1">
                {isAdministrador ? (
                  <>
                    <li>✓ Crear y editar materias primas</li>
                    <li>✓ Gestionar recetas</li>
                    <li>✓ Crear órdenes de producción</li>
                    <li>✓ Gestionar pedidos</li>
                    <li>✓ Ver todos los movimientos</li>
                  </>
                ) : (
                  <>
                    {user?.procesos?.includes("recepcion") && (
                      <>
                        <li>✓ Ver pedidos pendientes</li>
                        <li>✓ Recibir pedidos</li>
                        <li>✓ Hacer devoluciones</li>
                      </>
                    )}
                    {user?.procesos?.includes("produccion") && (
                      <>
                        <li>✓ Ver órdenes pendientes</li>
                        <li>✓ Aceptar órdenes</li>
                        <li>✓ Completar producción</li>
                        <li>✓ Modificar recetas</li>
                      </>
                    )}
                  </>
                )}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
