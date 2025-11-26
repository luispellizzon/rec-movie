import ast

def filter_movies(data, mood=None, preferred_length=None, language=None, country=None, era=None, mainstream=True,
                  selected_genres=None):

    filtered = data.copy()

    filtered["genres"] = filtered["genres"].apply(  # Converts genre from string to a list
        lambda x: ast.literal_eval(x) if isinstance(x, str) else x
    )

    filtered["production_countries"] = filtered["production_countries"].apply(  # Converts countries to list
        lambda x: ast.literal_eval(x) if isinstance(x, str) else x
    )

    # Mood filter
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

    wanted_genres = set()  # Initialise an empty set of the genres that will be valid

    if mood:
        wanted_genres.update(genre for genre in mood_to_genres[mood])

    if selected_genres:
        wanted_genres.update(genre for genre in selected_genres)

    if wanted_genres:  # If the user has preferred genres, filters the dataset to only include them
        filtered = filtered[filtered["genres"].apply(lambda g: bool(set(g) & wanted_genres))]
        # Works by ensuring that "Genres" is a list, then checking if the list as a set has overlap with wanted_genres

    # Runtime filter
    if preferred_length:
        tolerance = 20
        min_time, max_time = max(0, preferred_length - tolerance), preferred_length + tolerance
        filtered = filtered[(filtered["runtime"] >= min_time) & (filtered["runtime"] <= max_time)]

    # Language filter
    if language:
        filtered = filtered[filtered["original_language"] == language]

    # Country filter
    if country:
        filtered = filtered[filtered["production_countries"].apply(lambda c: isinstance(c, list) and country in c)]
        # Works by ensuring that "production_countries" is a list, then checking if the chosen country is in the list

    # Era filter
    if "year" in filtered.columns:
        if era == "old":
            filtered = filtered[filtered["year"] <= 1990]
        elif era == "actual":
            filtered = filtered[(filtered["year"] > 1990) & (filtered["year"] <= 2020)]
        elif era == "new":
            filtered = filtered[filtered["year"] > 2020]

    # Popularity filter
    if "popularity" in filtered.columns:
        if mainstream:
            threshold = filtered["popularity"].quantile(0.7)  # top 30% most popular
            filtered = filtered[filtered["popularity"] >= threshold]
        else:
            threshold = filtered["popularity"].quantile(0.3)  # bottom 30% niche
            filtered = filtered[filtered["popularity"] <= threshold]

    return filtered
