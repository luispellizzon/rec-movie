
import os
import json
import sqlite3
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from filter_utils import filter_dataframe
from sql_utils import build_sql_query

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set")

DB_PATH = "datasets/movie_dataset.db"
if not os.path.exists(DB_PATH):
    raise FileNotFoundError(f"Database not found at {DB_PATH}")

print("Connecting to database...")
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
print("✅ Database connected!")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-lite",
    temperature=0.3,
    api_key=GOOGLE_API_KEY
)


def get_ids(response: str):
    ids = []
    for line in response.split("\n"):
        line = line.strip()
        if line:
            try:
                ids.append(int(line))
            except ValueError:
                continue
    return ids


def ids_to_json(ids, filtered_data):
    results = []
    if 'id' not in filtered_data.columns:
        filtered_data = filtered_data.reset_index()

    data_dict = filtered_data.set_index('id').to_dict('index')

    for movie_id in ids:
        if movie_id not in data_dict:
            continue
        movie = data_dict[movie_id]
        combined = (
            f"Title: {movie['title']}. Overview: {movie['overview']} "
            f"Genres: {movie['genres']}. Year: {movie['year']}. "
            f"Runtime: {movie['runtime']} min. Director: {movie['director']}. "
            f"Countries: {movie['production_countries']}. "
            f"Language: {movie['original_language']}. "
            f"Popularity: {movie['popularity']:.2f}. "
            f"Rating: {movie['imdb_rating']:.2f}. "
            f"ID: {movie_id}. "
            f"Poster: https://image.tmdb.org/t/p/w500{movie['poster_path']}"
        )
        results.append({"content": combined, "id": movie_id})

    return {"recommended_movies": results}


# -------------------------------------------------------------------------
# MAIN RECOMMENDER LOGIC
# -------------------------------------------------------------------------
def recommend_movies(request_json, previous_ids=None):
    try:
        mood = request_json.get("mood")
        preferred_length = request_json.get("preferred_length")
        language = request_json.get("language")
        country = request_json.get("country")
        era = request_json.get("era")
        mainstream = request_json.get("popularity", True)
        selected_genres = request_json.get("selected_genres")
        number_recommended = request_json.get("number_recommended", 3)

        print(f"\n🎬 Request: mood={mood}, genres={selected_genres}, length={preferred_length}")

        query, params = build_sql_query(preferred_length, language, era, previous_ids)

        print(f"📊 SQL query...")
        data_chunk = pd.read_sql_query(query, conn, params=params)

        data_chunk["genres"] = data_chunk["genres"].astype(object)
        data_chunk["production_countries"] = data_chunk["production_countries"].astype(object)

        print(f"  Loaded: {len(data_chunk)} movies ({data_chunk.memory_usage(deep=True).sum() / 1024**2:.2f} MB)")

        if data_chunk.empty:
            return {"error": "No matching movies.", "recommended_movies": []}

        print(f"🎯 Python filtering...")
        filtered_data = filter_dataframe(data_chunk, mood, mainstream, selected_genres, country)

        if filtered_data.empty:
            return {"error": "No matching movies.", "recommended_movies": []}

        matching_movies = filtered_data.head(50)
        print(f"🤖 Sending top 50 to AI...")

        matching_text = (matching_movies['id'].astype(str) + " - " +
                         matching_movies["overview"]).str.cat(sep="\n")

            # AI ranking prompt
        ai_prompt = (
            f"It is your job to rank movies from most recommended to least. You will be supplied a list of movie "
            f"IDs and descriptions, you must choose the best matching {number_recommended} movies by ID for the "
            f"user and send them rank from most recommended to least.\n"
            f"to choose the best matching {number_recommended} of them to rank to the user.\n\n"
            f"STRICTLY NECESSARY, MUST FOLLOW THESE RULES:\n"
            f"Output exactly {number_recommended} movies\n"
            f"Output ONLY movie IDs\n"
            f"NO text. NO explanations\n"
            f"You MUST ONLY choose movie IDs from the list supplied below\n"
            f"You MUST format each line EXACTLY as just containing the movie ID, NOTHING else\n"
            f"You MUST send back the movie ID with the EXACT same as is specified.\n"
            f"\nUser Preferences:\n{json.dumps(request_json, indent=2)}"
            f"\nMovies List:\n{matching_text}"
        )
    
        print("Sending to AI for ranking...")

        result = llm.invoke(ai_prompt).content
        ids = get_ids(result)
        print(f"  AI returned: {ids}")

        result = ids_to_json(ids, matching_movies)
        print(f"✅ Returning {len(result['recommended_movies'])} recommendations\n")

        return result

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "recommended_movies": []}


# -------------------------------------------------------------------------
# Quick test
# -------------------------------------------------------------------------
if __name__ == "__main__":
    test_json = {
        "mood": "excited",
        "preferred_length": 90,
        "language": None,
        "era": None,
        "popularity": True,
        "selected_genres": ["Fantasy", "Romance"],
        "number_recommended": 5
    }

    result = recommend_movies(test_json, [25, 227])
    print("\n📋 Final result:")
    print(json.dumps(result, indent=2))
