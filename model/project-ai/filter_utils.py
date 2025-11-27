import pandas as pd
import ast


def safe_parse_list(x):
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

