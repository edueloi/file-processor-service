# run.py
import threading, time, webbrowser
from pathlib import Path
import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from starlette.staticfiles import StaticFiles

from app.main import app as api_app  # o app acima

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"
INDEX_HTML = TEMPLATES_DIR / "index.html"

app = FastAPI(title="File Processor Service — Shell")

# Monte a API inteira em /api (NÃO use include_router e NÃO use openapi_prefix)
app.mount("/api", api_app)

# Assets estáticos
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Página inicial
@app.get("/", include_in_schema=False)
async def root_index():
    return FileResponse(str(INDEX_HTML))

@app.get("/index.html", include_in_schema=False)
async def index_html():
    return FileResponse(str(INDEX_HTML))

# (Opcional) debug: liste rotas no startup
@app.on_event("startup")
async def _print_routes():
    print("=== ROTAS REGISTRADAS ===")
    for r in app.routes:
        methods = getattr(r, "methods", None)
        print(f"{r.path} {methods or ''}")

HOST, PORT = "127.0.0.1", 8000
URL = f"http://{HOST}:{PORT}"

def run_server():
    uvicorn.run("run:app", host=HOST, port=PORT, log_level="info", reload=False)

def open_browser():
    print(f"🚀 Servidor iniciado. Abrindo {URL} ...")
    time.sleep(1.5)
    webbrowser.open(URL)

if __name__ == "__main__":
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    open_browser()
    t.join()
