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
  Building2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import logoCarsecon from "../assets/logo.png";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const user = JSON.parse(localStorage.getItem("casercon_user"));
  const token = localStorage.getItem("token");

  const isAdministrador = user?.nombre_rol === "Administrador";

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("casercon_user");
    localStorage.removeItem("sector");
    navigate("/");
  };

  const procesos = user.procesos || [];

  const navItems = isAdministrador
    ? [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/inventario", label: "Inventario", icon: Package },
        { path: "/recetas", label: "Recetas", icon: BookOpen },
        { path: "/produccion", label: "Producción", icon: Factory },
        { path: "/pedidos", label: "Pedidos", icon: ShoppingCart },
        { path: "/proveedores", label: "Proveedores", icon: Building2 },
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

  const cerrarSidebar = () => setSidebarAbierto(false);

  const SidebarContent = () => (
    <>
      <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={cerrarSidebar}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-yellow-400 text-gray-900 font-medium shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

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

      <div className="mt-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-sm border border-gray-700 p-4">
        <h3 className="font-medium text-yellow-400 mb-2">Permisos activos</h3>
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
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 backdropfilter">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-30 overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 min-w-0 gap-2">

            {/* IZQUIERDA */}
            <div className="flex items-center gap-2 min-w-0 flex-1">

              {/* Botón hamburguesa */}
              <button
                onClick={() => setSidebarAbierto(true)}
                className="lg:hidden p-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo */}
              <img
                src={logoCarsecon}
                alt="Casercon Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              />

              {/* Texto empresa */}
              <div className="min-w-0 overflow-hidden">
                <h1 className="font-bold text-white text-xs sm:text-sm truncate">
                  SIGIC
                </h1>

                <p className="text-[10px] text-yellow-400 hidden sm:block truncate">
                  Sistema integrado de gestion de inventario
                </p>
              </div>
            </div>

            {/* DERECHA */}
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0">

              {/* Usuario */}
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-700 rounded-lg border border-gray-600 min-w-0 max-w-[170px] sm:max-w-[240px]">

                <User className="w-4 h-4 text-yellow-400 flex-shrink-0" />

                <div className="min-w-0 overflow-hidden">
                  <p className="font-medium text-white text-xs sm:text-sm truncate">
                    {user?.nombre}
                  </p>

                  <p className="text-[10px] sm:text-xs text-gray-400 capitalize truncate">
                    {user?.nombre_rol}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 text-gray-300 hover:bg-yellow-500 hover:text-gray-900 rounded-lg transition-colors flex-shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay para sidebar móvil */}
      {sidebarAbierto && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={cerrarSidebar}
          style={{
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            backgroundColor: "rgba(15, 23, 42, 0.55)",
          }}
        />
      )}

      {/* Sidebar móvil — drawer deslizante */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-gray-50 z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto shadow-2xl ${
          sidebarAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Cabecera del drawer */}
        <div className="flex items-center justify-between px-4 py-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img src={logoCarsecon} alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-white text-sm">Casercon S.A.S</span>
          </div>
          <button
            onClick={cerrarSidebar}
            className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info del usuario en el drawer */}
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 min-w-0 max-w-[220px] sm:max-w-[280px]">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />

            <div className="text-sm hidden sm:block min-w-0 flex-1">
              <p className="font-medium text-white leading-tight truncate ">
                {user?.nombre}
              </p>

              <p className="text-xs text-gray-400 capitalize truncate">
                {user?.nombre_rol}
              </p>
            </div>

            <p className="font-medium text-white text-sm sm:hidden leading-tight truncate min-w-0 flex-1">
              {user?.nombre}
            </p>
          </div>
          <p className="text-xs text-gray-400 capitalize">{user?.nombre_rol}</p>
        </div>

        <div className="p-3">
          <SidebarContent />
        </div>
      </div>

      {/* Layout principal */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Sidebar desktop — visible solo en lg+ */}
          <aside className="hidden lg:block sticky top-[88px] h-fit w-64 flex-shrink-0">
            <SidebarContent />
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}