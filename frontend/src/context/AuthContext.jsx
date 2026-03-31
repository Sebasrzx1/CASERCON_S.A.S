import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("casercon_user")) || null
  );

  const login = async (email, contraseña) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, contraseña }), // ✅ CORRECTO
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error en login");
      }

      const data = await res.json();

      // Guardar sesión
      localStorage.setItem("token", data.token);
      localStorage.setItem("casercon_user", JSON.stringify(data.data));

      setUser(data.data);

      return data.data; // 🔥 devolvemos el usuario
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("casercon_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);