import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("casercon_user")) || null,
  );

  const login = async (email, contraseña) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, contraseña }),
      });

      const data = await res.json(); // 🔥 SIEMPRE JSON
      console.log("RESPUESTA BACKEND:", data); // 👈 AGREGA ESTO
      
      if (!res.ok) {
        return { 
          error: data.message || "Error en login" 
        }; // 🔥 CLAVE
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("casercon_user", JSON.stringify(data.data));

      setUser(data.data);

      return data.data;
    } catch (error) {
      console.error(error);
      return { error: "Error de conexión con el servidor" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("casercon_user");
    setUser(null);
  };

  // ✅ NUEVO
  const isAdministrador = user?.nombre_rol === "Administrador";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdministrador }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
