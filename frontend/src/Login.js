// login.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Si ya hay sesión activa, redirige a Home
  useEffect(() => {
    fetch("http://localhost:8000/me", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          navigate("/");
        }
      })
      .catch(() => {});
  }, [navigate]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8000/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Error en la petición");
        return response.json();
      })
      .then(() => {
        navigate("/products");
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Iniciar sesión</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="text"
            name="username"
            placeholder="Usuario"
            value={form.username}
            onChange={handleInputChange}
            required
          />
          <input
            className="input-field"
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleInputChange}
            required
          />
          <button className="submit-btn" type="submit">
            Iniciar sesión
          </button>
        </form>
        <p>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;