import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { Toaster } from "sonner";
import { ForgotPassword } from "./pages/ForgotPassword";
import { SessionWarning } from "./components/SessionWarning";

import Dashboard   from "./pages/Dashboard";
import Inventario  from "./pages/Inventario";
import Recetas     from "./pages/Recetas";
import Produccion  from "./pages/Produccion";
import Pedidos     from "./pages/Pedidos";
import Proveedores from "./pages/Proveedores";
import Movimientos from "./pages/Movimientos";
import Usuarios    from "./pages/Usuarios";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionWarning />
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/"               element={<Login />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={<Layout />}>
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/inventario"  element={<Inventario />} />
            <Route path="/recetas"     element={<Recetas />} />
            <Route path="/produccion"  element={<Produccion />} />
            <Route path="/pedidos"     element={<Pedidos />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/movimientos" element={<Movimientos />} />
            <Route path="/usuarios"    element={<Usuarios />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;