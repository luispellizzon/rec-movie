
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
