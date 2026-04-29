import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { Toaster } from "sonner";



// Páginas (créelas después si no existen)
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Recetas from "./pages/Recetas";
import Produccion from "./pages/Produccion";
import Pedidos from "./pages/Pedidos";
import Proveedores from "./pages/Proveedores";
import Movimientos from "./pages/Movimientosj";
import Usuarios from "./pages/Usuarios";


function App() {
  return (
    <BrowserRouter>
    <Toaster position="top-right" richColors />
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Rutas del sistema */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/produccion" element={<Produccion />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
