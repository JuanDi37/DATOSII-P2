//register.js

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("http://localhost:8000/register", {
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
        navigate("/login");
      })
      .catch((err) => setError(err.message));
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Registro</h1>
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
            Registrar
          </button>
        </form>
        <p>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;