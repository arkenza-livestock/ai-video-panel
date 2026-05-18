import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

app = FastAPI(title="Atmosfer Studio API", version="1.0.0")

# CORS AYARLARI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "message": "Atmosfer Studio API v1.0.0 is ready"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "ready": True}

# Varsa diğer endpoint'lerin bu satırdan itibaren aynen devam etmeli...
