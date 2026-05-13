cat > /app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Atmosfer Stüdyo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Atmosfer Stüdyo API çalışıyor", "status": "active"}

@app.get("/health")
def health():
    return {"status": "ok"}
EOF
