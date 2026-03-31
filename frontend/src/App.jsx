import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from './pages/Login';

// Páginas (créelas después si no existen)
import Dashboard from './pages/Dashboard';
import Pedidos from './pages/pedidos';
import Produccion from './pages/produccion';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Rutas del sistema */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/produccion" element={<Produccion />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;