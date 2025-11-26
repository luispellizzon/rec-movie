import os
import json
import pandas as pd
from filter import filter_movies
from langchain_google_genai import ChatGoogleGenerativeAI

GOOGLE_API_KEY = "AIzaSyDp6iEAp7lbAj_SS8FvYy76F3heQ9eNW3g"

if not os.path.exists("datasets/movie_dataset.csv"):
    raise FileNotFoundError("Dataset not found, please run data_cleaning first.")

data = pd.read_csv("datasets/movie_dataset.csv")
data.set_index("id", inplace=True)

# AI Model (Gemini Chat)
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


def ids_to_json(ids: list[int], filtered_data: pd.DataFrame):
    results = []

    for movie_id in ids:
        try:
            matching_movie = filtered_data.loc[movie_id]
        except IndexError:
            continue

        results.append({"content": matching_movie["combined"], "id": movie_id})

    return {"recommended_movies": results}


def recommend_movies(request_json, previous_ids: list[int] = None):
    mood = request_json.get("mood")
    preferred_length = request_json.get("preferred_length")
    language = request_json.get("language")
    country = request_json.get("country")
    era = request_json.get("era")
    mainstream = request_json.get("popularity")
    selected_genres = request_json.get("selected_genres")
    number_recommended = request_json.get("number_recommended")

    if not number_recommended:
        number_recommended = 3

    filtered_data = filter_movies(data, mood, preferred_length, language, country, era, mainstream, selected_genres)

    if previous_ids:
        filtered_data = filtered_data.drop(index=previous_ids, errors="ignore")
        # Removes films that were previously recommended

    if filtered_data.empty:
        return {"error": "No matching movies.", "recommended_movies": []}

    matching_movies = filtered_data.head(50)
    matching_text = (matching_movies.index.astype(str) + " - " + matching_movies["overview"]).str.cat(sep="\n")
    print(matching_text)
    ai_prompt = (f"It is your job to rank movies from most recommended to least. You will be supplied a list of movie "
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
                 f"\nMovies List:\n{matching_text}")

    ai_result = llm.invoke(ai_prompt).content
    ids = get_ids(ai_result)

    print(ids)

    return ids_to_json(ids, filtered_data)


if __name__ == "__main__":
    test_json = {
        "mood": "happy",
        "preferred_length": 90,
        "language": "en",
        "era": "actual",
        "popularity": True,
        "selected_genres": ["Drama", "Romance", "Horror"],
        "number_recommended": 2
    }

    print(recommend_movies(test_json, [25, 227]))
