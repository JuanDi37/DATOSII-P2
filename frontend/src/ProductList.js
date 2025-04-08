import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const productsPerPage = 20;
  const navigate = useNavigate();

  // Diccionario de categorías
  const categoryDictionary = {
    1: 'right',
    2: 'beyond',
    3: 'unit',
    4: 'may',
    5: 'would',
    6: 'oil',
    7: 'free',
    8: 'visit',
    9: 'business',
    10: 'Democrat',
    11: 'pick',
    12: 'measure',
    13: 'guy',
    14: 'front',
    15: 'memory',
    16: 'commercial',
    17: 'author',
    18: 'example',
    19: 'continue',
    20: 'need',
    21: 'during',
    22: 'manager',
    23: 'road',
    24: 'task',
    25: 'small',
    26: 'group',
    27: 'rich',
    28: 'fine',
    29: 'subject',
    30: 'water',
    31: 'hold',
    32: 'trade',
    33: 'ground',
    34: 'edge',
    35: 'computer',
    36: 'model',
    37: 'your',
    38: 'list',
    39: 'teach',
    40: 'give',
    41: 'in',
    42: 'production',
    43: 'drug',
    44: 'leg',
    45: 'political',
    46: 'child',
    47: 'nearly',
    48: 'off',
    49: 'rock',
    50: 'catch',
    51: 'spend',
    52: 'ten',
    53: 'carry',
    54: 'little',
    55: 'television',
    56: 'voice',
    57: 'son',
    58: 'federal',
    59: 'avoid',
    60: 'parent',
    61: 'pass',
    62: 'per',
    63: 'his',
    64: 'skin',
    65: 'share',
    66: 'life',
    67: 'idea',
    68: 'you',
    69: 'mission',
    70: 'nor',
    71: 'strategy',
    72: 'step',
    73: 'interest',
    74: 'watch',
    75: 'wonder',
    76: 'box',
    77: 'yourself',
    78: 'natural',
    79: 'notice',
    80: 'prepare',
    81: 'individual',
    82: 'later',
    83: 'their',
    84: 'sit',
    85: 'positive',
    86: 'discover',
    87: 'pay',
    88: 'several',
    89: 'collection',
    90: 'she',
    91: 'name',
    92: 'there',
    93: 'tell',
    94: 'dificult',
    95: 'school',
    96: 'he',
    97: 'size',
    98: 'eight',
    99: 'western',
    100: 'company',
  };

  // Función para obtener productos y carrito
  const fetchData = async () => {
    setLoading(true);
    try {
      // Obtener productos (asegúrate de contar con el endpoint /search en el backend)
      const response = await axios.get('http://localhost:8000/search', {
        params: {
          q: searchQuery,
          page: currentPage,
          size: productsPerPage,
        },
      });
      setProducts(response.data.results);
      setTotalProducts(response.data.total);

      // Obtener contenido del carrito
      const cartResponse = await axios.get("http://localhost:8000/cart", { withCredentials: true });
      setCartItems(cartResponse.data.cart);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el historial de compras
  const fetchPurchaseHistory = async () => {
    try {
      const response = await axios.get("http://localhost:8000/purchase-history", {
        withCredentials: true
      });
      setPurchasedItems(response.data.purchases);
    } catch (error) {
      console.error("Error al obtener el historial de compras:", error);
    }
  };

  // Cargar datos de productos, carrito e historial de compras
  useEffect(() => {
    fetchData();
    fetchPurchaseHistory();
  }, [searchQuery, currentPage]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  // Función para cerrar sesión
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

  // Función para agregar productos al carrito
  const addToCart = (product) => {
    const productId = product.codigo || product.nombre;
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => (item.codigo || item.nombre) === productId);
      let updatedCart;
      if (existingItem) {
        updatedCart = prevItems.map(item =>
          (item.codigo || item.nombre) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        updatedCart = [...prevItems, { ...product, quantity: 1 }];
      }
      // Enviar actualización del carrito al backend
      const addedItem = updatedCart.find(item => (item.codigo || item.nombre) === productId);
      axios.post("http://localhost:8000/add-to-cart", addedItem, {
        withCredentials: true
      }).catch(err => console.error("Error guardando en backend", err));
      return updatedCart;
    });
  };

  // Función para realizar la compra
  const handlePurchase = async () => {
    if (cartItems.length === 0) return;
    try {
      await axios.post("http://localhost:8000/purchase", {}, {
        withCredentials: true
      });
      // Actualiza el historial de compras y vacía el carrito
      fetchPurchaseHistory();
      setCartItems([]);
      alert("¡Compra realizada!");
    } catch (error) {
      console.error("Error al realizar la compra:", error);
    }
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="product-list-container">
      <div className="header">
        <div className="search-bar-container">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="header-buttons">
          <button className="logout-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader">Cargando...</div>
      ) : (
        <>
          <div className="products-grid">
            {products.length > 0 ? (
              products.map((product, index) => (
                <div key={product.codigo ? product.codigo : index} className="product-card">
                  <img
                    className="product-image"
                    src={product.imagen_url}
                    alt={product.nombre}
                  />
                  <div className="product-info">
                    <h3 className="product-name">{product.nombre}</h3>
                    <p className="product-code">
                      Categoría: {categoryDictionary[product.categoria_id] || 'Desconocida'}
                    </p>
                    <p className="product-price">Precio: ${product.precio}</p>
                  </div>
                  <button
                    className="add-to-cart-button"
                    onClick={() => addToCart(product)}
                  >
                    Agregar al carrito
                  </button>
                </div>
              ))
            ) : (
              <p className="no-results">No se encontraron productos.</p>
            )}
          </div>

          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
            >
              Anterior
            </button>
            <span className="pagination-info">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              className="pagination-button"
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < totalPages - 1 ? prev + 1 : prev
                )
              }
              disabled={currentPage >= totalPages - 1}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Sección de productos comprados previamente */}
      {purchasedItems.length > 0 && (
        <div className="purchased-section">
          <h3>Comprados Previamente</h3>
          <div className="purchased-items-container">
            {purchasedItems.map((item, index) => (
              <div key={index} className="purchased-item">
                <img
                  className="purchased-item-image"
                  src={item.imagen_url}
                  alt={item.nombre}
                />
                <div className="purchased-item-details">
                  <h4>{item.nombre}</h4>
                  <p>Precio: ${item.precio}</p>
                  <p>Cantidad: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección del carrito */}
      <div className="cart-section">
        <h3>Carrito ({cartItems.length})</h3>
        {cartItems.length > 0 ? (
          <div className="cart-items-container">
            {cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                <img
                  className="cart-item-image"
                  src={item.imagen_url}
                  alt={item.nombre}
                />
                <div className="cart-item-details">
                  <h4>{item.nombre}</h4>
                  <p>Precio: ${item.precio}</p>
                  <p>Cantidad: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-results">No hay productos en el carrito.</p>
        )}
        <button
          className="purchase-button"
          onClick={handlePurchase}
          disabled={cartItems.length === 0}
        >
          Comprar
        </button>
      </div>
    </div>
  );
};

export default ProductList;