import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/me", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error("No autenticado");
      })
      .then((data) => {
        // Si la sesión está activa, redirige a ProductList
        if (data.username) {
          navigate("/products");
        } else {
          setUsername(null);
        }
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    fetch("http://localhost:8000/logout", {
      method: "POST",
      credentials: "include",
    }).then((response) => {
      if (response.ok) {
        navigate("/login");
      }
    });
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Bienvenido, {username}</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default Home;