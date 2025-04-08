import psycopg2
from elasticsearch import Elasticsearch


es = Elasticsearch("http://localhost:9200")

try:
    conn = psycopg2.connect("dbname='postgres' user='user' host='localhost' password='password'")
except:
    print("I am unable to connect to the database")

# we use a context manager to scope the cursor session
with conn.cursor() as curs:

    try:
        # simple single row system query
        curs.execute("SELECT * FROM products LIMIT 1")

        # returns a single row as a tuple
        single_row = curs.fetchone()

        # use an f-string to print the single tuple returned
        print(f"{single_row}")

        # simple multi row system query
        curs.execute("SELECT id, name, price, category_id, image_url FROM products")

        # a default install should include this query and some backend workers
        productos = curs.fetchall()
        
        
        for producto in productos:
            doc = {
                "nombre": producto[1],
                "precio": producto[2],
                "categoria_id": producto[3],
                "imagen_url": producto[4],
            }
            try:
                
                es.index(index="productos", id=producto[0], document=doc)  # ← Cambiado 'body' a 'document'
            except Exception as e:
                print(f"Error indexando producto {producto[0]}: {e}")

        print("Datos indexados en Elasticsearch")           



    # a more robust way of handling errors
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)




   