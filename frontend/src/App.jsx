import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";

<<<<<<< HEAD
=======



>>>>>>> feature/modulo-inventario
// Páginas (créelas después si no existen)
import Dashboard from "./pages/Dashboard";
import Inventario from "./pages/Inventario";
import Recetas from "./pages/Recetas";
<<<<<<< HEAD
import Produccion from "./pages/produccion";
=======
import Produccion from "./pages/Produccion";
>>>>>>> feature/modulo-inventario
import Pedidos from "./pages/pedidos";
import Proveedores from "./pages/Proveedores";
import Movimientos from "./pages/Movimientosj";
import Usuarios from "./pages/Usuarios";


function App() {
  return (
    <BrowserRouter>
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
