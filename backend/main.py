# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, crud
from elasticsearch import Elasticsearch
from auth import router

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

origins = ["http://localhost:3000"]
es = Elasticsearch("http://localhost:9200")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/search")
def search_products(q: str, page: int = 0, size: int = 20):
    # Construimos consultas para ambos casos (dígitos o texto)
    should_clauses = []
    
    # 1. Búsqueda por código exacto (si es numérico)
    if q.isdigit():
        should_clauses.extend([
            {
                "term": {
                    "codigo": {
                        "value": q,
                        "boost": 3.0  # Prioridad alta para coincidencias exactas
                    }
                }
            },
            {
                "wildcard": {
                    "codigo": {
                        "value": f"*{q}*",
                        "boost": 1.5
                    }
                }
            }
        ])
    
    # 2. Búsqueda en nombre y código (para todos los casos)
    should_clauses.extend([
        {
            "match_phrase_prefix": {
                "nombre": {
                    "query": q,
                    "boost": 2.0,
                    "slop": 5  # Permite cierta flexibilidad en el orden
                }
            }
        },
        {
            "wildcard": {
                "nombre": {
                    "value": f"*{q}*",
                    "boost": 1.0
                }
            }
        },
        {
            "wildcard": {
                "codigo": {
                    "value": f"*{q}*",
                    "boost": 1.0
                }
            }
        }
    ])
    
    query = {
        "query": {
            "bool": {
                "should": should_clauses,
                "minimum_should_match": 1
            }
        },
        "highlight": {
            "fields": {
                "nombre": {},
                "codigo": {}
            }
        },
        "from": page * size,  # Desplazamiento para paginación
        "size": size          # Número de productos a devolver
    }
    
    res = es.search(index="productos_con_autocompletado", body=query)
    return {
        "results": [{
            **hit["_source"],
            "highlight": hit.get("highlight", {})
        } for hit in res["hits"]["hits"]],
        "total": res["hits"]["total"]["value"]  # Total de productos
    }


@app.get("/es-status")
def check_elasticsearch_connection():
    if es.ping():
        return {"status": "conectado a Elasticsearch"}
    else:
        return {"status": "no se pudo conectar a Elasticsearch"}


@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)

@app.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    return crud.get_categories(db)


@app.post("/checkout")
def checkout(cart: schemas.Cart, db: Session = Depends(get_db)):
    return crud.create_order(db, cart)

app.include_router(router)