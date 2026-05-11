import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import API_URL from "../service/api";

const AuthContext = createContext();

const INACTIVIDAD_LIMITE = 2 * 60 * 60 * 1000; // 2 horas
const INACTIVIDAD_AVISO = 5 * 60 * 1000; // aviso 5 min antes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("casercon_user")) || null,
  );
  const [showWarning, setShowWarning] = useState(false);

  const navigate = useNavigate();
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);

  // ─── Limpiar timers ──────────────────────────────────────────────
  const clearTimers = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  };

  // ─── Logout ──────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearTimers();
    localStorage.removeItem("token");
    localStorage.removeItem("casercon_user");
    setUser(null);
    setShowWarning(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  // ─── Reiniciar timers por actividad ──────────────────────────────
  const resetTimers = useCallback(() => {
    if (!localStorage.getItem("token")) return;

    clearTimers();
    setShowWarning(false);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVIDAD_LIMITE - INACTIVIDAD_AVISO);

    logoutTimer.current = setTimeout(() => {
      logout();
    }, INACTIVIDAD_LIMITE);
  }, [logout]);

  // ─── Escuchar actividad del usuario ──────────────────────────────
  useEffect(() => {
    if (!user) return;

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    let lastReset = Date.now();

    const handleActividad = () => {
      const now = Date.now();
      if (now - lastReset > 30_000) {
        lastReset = now;
        resetTimers();
      }
    };

    eventos.forEach((e) => window.addEventListener(e, handleActividad));
    resetTimers();

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, handleActividad));
      clearTimers();
    };
  }, [user, resetTimers]);

  // ─── Al montar: verificar si el token ya expiró ──────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) logout();
    } catch {
      logout();
    }
  }, [logout]);
  
  // ─── Fetch autenticado ───────────────────────────────────────────
  const fetchConAuth = useCallback(
    async (url, options = {}) => {
      const token = localStorage.getItem("token");

      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.code === "USER_DISABLED") {
          logout();
          return null;
        }
      }

      return res;
    },
    [logout],
  );

  const isAdministrador = user?.nombre_rol === "Administrador";

  // ─── Login ───────────────────────────────────────────────────────
  const login = async (email, contraseña) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, contraseña }),
      });

      const data = await res.json();

      if (!res.ok) return { error: data.message || "Error en login" };

      localStorage.setItem("token", data.token);
      localStorage.setItem("casercon_user", JSON.stringify(data.data));
      setUser(data.data);

      return data.data;
    } catch (error) {
      console.error(error);
      return { error: "Error de conexión con el servidor" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdministrador,
        showWarning,
        setShowWarning,
        fetchConAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
