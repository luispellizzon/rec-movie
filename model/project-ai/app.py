import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from main import recommend_movies

app = FastAPI(title="Movie Recommendation API", version="1.0.0")

# CORS configuration - allow your frontend
allowed_origins = [
    "http://localhost:5173",  # Local development
    "http://localhost:4173",  # Local preview
    "https://luispellizzon.github.io",
    "https://ruaidhric.github.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Preferences(BaseModel):
    mood: Optional[str] = None
    preferred_length: Optional[int] = None
    language: Optional[str] = None
    country: Optional[str] = None
    era: Optional[str] = None
    popularity: Optional[bool] = None
    selected_genres: Optional[List[str]] = None
    number_recommended: Optional[int] = 3
    previous_ids: Optional[List[int]] = None

@app.get("/")
def read_root():
    """Root endpoint - API info"""
    return {
        "status": "healthy",
        "message": "Movie Recommendation API",
        "version": "1.0.0",
        "endpoints": {
            "/": "API information",
            "/health": "Health check",
            "/recommend": "Get movie recommendations (POST)"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "movie-recommendation-api"}

@app.post("/recommend")
def recommend_movies_api(payload: Preferences):
    """
    Get movie recommendations based on user preferences
    
    Returns:
        JSON with recommended movies
    """
    print(f"Received request: {payload}")
    payload_dict = payload.dict()
    previous_ids = payload_dict.pop("previous_ids", None)
    
    try:
        result = recommend_movies(payload_dict, previous_ids)
        return result
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e), "recommended_movies": []}