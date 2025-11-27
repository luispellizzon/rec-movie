
import os
import json
import sqlite3
import pandas as pd
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import ast

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


# -------------------------------------------------------------------------
# SAFE LIST PARSING (Guaranteed list[str])
# -------------------------------------------------------------------------
def safe_parse_list(x):
    """Ultra-safe parsing - guarantees the output is always a list of strings."""

    # Handle null / NaN / floats safely
    if x is None:
        return []
    if isinstance(x, float):
        if pd.isna(x):
            return []
        return []  # floats are always invalid in this dataset

    # Already a list
    if isinstance(x, list):
        return [str(item) for item in x if item is not None]

    # Parse JSON-like strings
    if isinstance(x, str):
        x = x.strip()
        if not x:
            return []
        try:
            result = ast.literal_eval(x)
            if isinstance(result, list):
                return [str(item) for item in result if item is not None]
            return []
        except:
            return []

    return []


# -------------------------------------------------------------------------
# FILTER DATAFRAME (now 100% float-proof)
# -------------------------------------------------------------------------
def filter_dataframe(df, mood=None, mainstream=True, selected_genres=None, country=None):
    if df.empty:
        return df

    filtered = df.copy()

    print(f"  Parsing {len(filtered)} movies...")

    # Parse and force lists
    filtered["genres"] = filtered["genres"].astype(object)
    filtered["genres"] = filtered["genres"].apply(safe_parse_list)

    filtered["production_countries"] = filtered["production_countries"].astype(object)
    filtered["production_countries"] = filtered["production_countries"].apply(safe_parse_list)

    # Remove any row where genres isn't a list
    filtered = filtered[filtered["genres"].apply(lambda g: isinstance(g, list))]

    # Remove empty lists
    filtered = filtered[filtered["genres"].apply(lambda g: len(g) > 0)]

    print(f"  After parsing: {len(filtered)} movies (valid lists)")

    # Mood → genres
    mood_to_genres = {
        "happy": ["Comedy", "Romance", "Family", "Adventure"],
        "sad": ["Drama", "Romance"],
        "excited": ["Action", "Adventure", "Thriller", "Science Fiction"],
        "relaxed": ["Romance", "Comedy", "Family", "Music"],
        "adventurous": ["Adventure", "Action", "Fantasy"],
        "romantic": ["Romance", "Drama"],
        "scared": ["Horror", "Thriller", "Mystery"],
        "thoughtful": ["Drama", "History", "Mystery"],
        "energetic": ["Action", "Adventure"],
        "melancholic": ["Drama", "Music", "Romance"]
    }

    wanted_genres = set()
    if mood and mood in mood_to_genres:
        wanted_genres.update(mood_to_genres[mood])
    if selected_genres:
        wanted_genres.update(selected_genres)

    # Genre filter
    if wanted_genres:
        print(f"  Filtering by genres: {wanted_genres}")

        def match_genres(g):
            if not isinstance(g, list):
                return False
            if not all(isinstance(item, str) for item in g):
                return False
            return bool(set(g) & wanted_genres)

        filtered = filtered[filtered["genres"].apply(match_genres)]
        print(f"  After genre filter: {len(filtered)} movies")

    # Country filter
    if country:
        filtered = filtered[filtered["production_countries"].apply(lambda c: country in c)]
        print(f"  After country filter: {len(filtered)} movies")

    # Popularity filter
    if "popularity" in filtered.columns and not filtered.empty:
        if mainstream:
            threshold = filtered["popularity"].quantile(0.7)
            filtered = filtered[filtered["popularity"] >= threshold]
        else:
            threshold = filtered["popularity"].quantile(0.3)
            filtered = filtered[filtered["popularity"] <= threshold]

        print(f"  After popularity filter: {len(filtered)} movies")

    return filtered


# -------------------------------------------------------------------------
# SUPPORT FUNCTIONS
# -------------------------------------------------------------------------
def build_sql_query(preferred_length=None, language=None, era=None, previous_ids=None):
    query = ("SELECT id, title, overview, genres, production_countries, popularity, "
             "imdb_rating, runtime, year, original_language, director, poster_path, release_date "
             "FROM movies WHERE 1=1")
    params = []

    if preferred_length:
        tolerance = 20
        min_time = max(0, preferred_length - tolerance)
        max_time = preferred_length + tolerance
        query += " AND runtime BETWEEN ? AND ?"
        params.extend([min_time, max_time])

    if language:
        query += " AND original_language = ?"
        params.append(language)

    if era == "old":
        query += " AND year <= 1990"
    elif era == "actual":
        query += " AND year > 1990 AND year <= 2020"
    elif era == "new":
        query += " AND year > 2020"

    if previous_ids and len(previous_ids) > 0:
        placeholders = ','.join('?' * len(previous_ids))
        query += f" AND id NOT IN ({placeholders})"
        params.extend(previous_ids)

    query += " ORDER BY popularity DESC, imdb_rating DESC"
    return query, params


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

        # FORCE pandas to stop upcasting genres/countries to float (important!)
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
