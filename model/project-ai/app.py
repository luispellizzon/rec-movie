from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from main import recommend_movies

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.post("/recommend")
def recommend_movies_api(payload: Preferences):
    print(payload)
    payload_dict = payload.dict()
    previous_ids = payload_dict.pop("previous_ids", None)
    result = recommend_movies(payload_dict, previous_ids)
    return result
