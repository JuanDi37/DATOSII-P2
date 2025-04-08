from dotenv import load_dotenv
load_dotenv()
from fastapi import APIRouter, Request, Response, HTTPException, Cookie, Depends, FastAPI
from pydantic import BaseModel
from redis import Redis
from utils import hash_password, verify_password, create_access_token
import os
from jose import jwt, JWTError
import json

router = APIRouter()

# Conexión a Redis usando variables de entorno
redis_client = Redis(
    host=os.getenv("REDIS_HOST"),
    port=int(os.getenv("REDIS_PORT")),
    decode_responses=True
)

# Modelo para el registro y login
class RegisterForm(BaseModel):
    username: str
    password: str

# Dependencia para obtener el usuario actual a partir del token en la cookie
def get_current_user(session_token: str = Cookie(None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(
            session_token,
            os.getenv("SECRET_KEY"),
            algorithms=[os.getenv("ALGORITHM")]
        )
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    stored_token = redis_client.get(f"session:{username}")
    if stored_token != session_token:
        raise HTTPException(status_code=401, detail="Token mismatch")
    return username

# Endpoint para registrar usuarios
@router.post("/register")
def register(user: RegisterForm):
    user_key = f"user:{user.username}"
    if redis_client.exists(user_key):
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = hash_password(user.password)
    redis_client.hset(user_key, mapping={"username": user.username, "password": hashed})
    return {"message": "User registered"}

# Endpoint para realizar login
@router.post("/login")
def login(response: Response, user: RegisterForm):
    user_key = f"user:{user.username}"
    user_data = redis_client.hgetall(user_key)
    if not user_data:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(user.password, user_data.get("password", "")):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    redis_client.set(f"session:{user.username}", token, ex=60*60*24*30)
    response.set_cookie("session_token", token, httponly=True, max_age=60*60*24*30)
    return {"message": "Login successful"}

# Endpoint para obtener los datos del usuario autenticado
@router.get("/me")
def get_me(username: str = Depends(get_current_user)):
    return {"username": username}

# Endpoint para cerrar sesión
@router.post("/logout")
def logout(response: Response, session_token: str = Cookie(None)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(
            session_token,
            os.getenv("SECRET_KEY"),
            algorithms=[os.getenv("ALGORITHM")]
        )
        username = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Not authenticated")
    redis_client.delete(f"session:{username}")
    response.delete_cookie("session_token")
    return {"message": "Logged out"}

# Endpoint para obtener el contenido del carrito
@router.get("/cart")
def get_cart(username: str = Depends(get_current_user)):
    cart_key = f"cart:{username}"
    cart_data = redis_client.hgetall(cart_key)
    cart = []
    for item in cart_data.values():
        try:
            cart.append(json.loads(item))
        except json.JSONDecodeError as e:
            print(f"Error al decodificar JSON: {e}")
    return {"cart": cart}

# Endpoint para agregar productos al carrito
@router.post("/add-to-cart")
def add_to_cart(product: dict, username: str = Depends(get_current_user)):
    cart_key = f"cart:{username}"
    # Se usa 'codigo' o 'nombre' para identificar el producto de forma única
    product_id = product.get("codigo") or product.get("nombre")
    existing = redis_client.hget(cart_key, product_id)
    if existing:
        item_data = json.loads(existing)
        add_quantity = product.get("quantity", 1)
        item_data["quantity"] = item_data.get("quantity", 1) + add_quantity
    else:
        product["quantity"] = product.get("quantity", 1)
        item_data = product
    redis_client.hset(cart_key, product_id, json.dumps(item_data))
    return {"message": "Producto agregado/actualizado en el carrito"}

# Endpoint para realizar la compra:
# Se guarda cada producto en el historial de compras y se vacía el carrito.
@router.post("/purchase")
def purchase(username: str = Depends(get_current_user)):
    cart_key = f"cart:{username}"
    purchases_key = f"purchases:{username}"
    # Se recupera el contenido actual del carrito
    cart_data = redis_client.hgetall(cart_key)
    if not cart_data:
        raise HTTPException(status_code=400, detail="No hay productos en el carrito")
    # Se guarda cada producto en el historial (lista) de compras
    for item in cart_data.values():
        redis_client.rpush(purchases_key, item)
    # Se vacía el carrito
    redis_client.delete(cart_key)
    return {"message": "Compra realizada y carrito vacío"}

# Endpoint para obtener el historial de compras del usuario
@router.get("/purchase-history")
def purchase_history(username: str = Depends(get_current_user)):
    purchases_key = f"purchases:{username}"
    purchased_items = redis_client.lrange(purchases_key, 0, -1)
    purchase_history = []
    for item in purchased_items:
        try:
            purchase_history.append(json.loads(item))
        except json.JSONDecodeError as e:
            print(f"Error al decodificar JSON: {e}")
    return {"purchases": purchase_history}

