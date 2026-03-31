const login = async (email, password) => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      return false;
    }

    // Guardar token y usuario
    localStorage.setItem('token', data.token);
    localStorage.setItem('casercon_user', JSON.stringify(data.user));

    setUser(data.user);

    return true;

  } catch (error) {
    console.error(error);
    return false;
  }
};