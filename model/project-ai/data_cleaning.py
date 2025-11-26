import pandas as pd
import csv

if __name__ == "__main__":
    # Read the uncleaned data in from the old CSV file
    unfiltered_data = pd.read_csv("datasets/uncleaned_movie_dataset.csv")

    # Remove non-released films
    released_filter = unfiltered_data["status"] == "Released"
    filtered_data = unfiltered_data[released_filter]

    # Define the columns which aren't necessary
    removed_columns = [
        "id",  # Can remove IDs as filtering will leave gaps, new IDs will be formed later on
        "vote_average",  # imdb_rating serves the same function, but weighted
        "vote_count",  # imdb_votes serves the same function
        "status",  # All non-released films have been filtered out, so this column has become redundant
        "revenue",  # Not relevant towards the project and too many 0 values to use
        "budget",  # Not relevant towards the project
        "imdb_id",  # Not relevant towards the project, can just use default csv IDs
        "original_title",  # Could possibly keep, but I personally feel that translated titles alone are enough
        "tagline",  # Could possibly keep, but I feel that keeping overview is enough
        "production_companies",  # Could possibly keep, but as is we aren't looking at a user's preferred companies
        "spoken_languages",  # Should use the original_language field to filter by language instead
        "cast",  # Not important to the project
        "director_of_photography",  # Not important to the project
        "writers",  # Not important to the project
        "producers",  # Not important to the project
        "music_composer",  # Not important to the project
        "imdb_votes"  # Could possibly keep, but current tasks don't use it
    ]

    # Dropping the unnecessary columns
    filtered_data = filtered_data.drop(columns=removed_columns)

    # Remove films with null fields in the necessary columns
    necessary_columns = [
        "title",
        "overview",
        "release_date",
        "runtime",
        "original_language",
        "genres",
        "production_countries",
        "popularity",
        "imdb_rating",
        "director",
        "poster_path"
    ]

    filtered_data = filtered_data.dropna(subset=necessary_columns)

    # Remove any duplicate values (Checking date as some films may share names)
    filtered_data = filtered_data.drop_duplicates(subset=["title", "release_date"])

    # Clean genres (already strings → split)
    filtered_data["genres"] = (filtered_data["genres"].fillna("")
                               .apply(lambda x: [genre.strip() for genre in x.split(",") if genre.strip()]))

    # Clean countries (already strings → split)
    filtered_data["production_countries"] = (filtered_data["production_countries"].fillna("")
                               .apply(lambda x: [country.strip() for country in x.split(",") if country.strip()]))

    # Extract year
    filtered_data["year"] = pd.to_datetime(filtered_data["release_date"], errors="coerce").dt.year

    # Combined column for embeddings
    filtered_data["combined"] = filtered_data.apply(
        lambda row: f"Title: {row['title']}. Overview: {row['overview']} Genres: {', '.join(row['genres'])}. Year: "
                    f"{row['year']}. Runtime: {row['runtime']} min. Director: {row['director']}. Countries: "
                    f"{', '.join(row['production_countries'])}. Language: {row['original_language']}. Popularity: "
                    f"{row['popularity']:.2f}. Rating: {row['imdb_rating']:.2f}. ID: {row.name}. Poster: "
                    f"https://image.tmdb.org/t/p/w500{row['poster_path']}",
        axis=1
    )

    # Write the cleaned data to the new CSV file
    filtered_data.to_csv(
        "datasets/movie_dataset.csv",
        index=True,
        index_label="id",
        quoting=csv.QUOTE_ALL,
        escapechar="\\"
    )
