# Ruaidhrí
# Script for removing incomplete entries, repeat entries and unnecessary columns from the CSV

import pandas as pd

if __name__ == "__main__":
    # Read the uncleaned data in from the old CSV file
    unfiltered_data = pd.read_csv("datasets/uncleaned_movie_dataset.csv")

    # Remove non-released films
    released_filter = unfiltered_data["status"] == "Released"
    filtered_data = unfiltered_data[released_filter]

    # Define the columns which aren't necessary
    removed_columns = [
        "id",  # Can remove IDs as filtering will leave gaps, and new ones can be formed at the end of this file
        "vote_average",  # imdb_rating serves the same function, but weighted
        "vote_count",  # imdb_votes serves the same function
        "status",  # All non-released films have been filtered out so this column has become redundant
        "revenue",  # Not relevant towards project and too many 0 values to use
        "budget",  # Not relevant towards project
        "imdb_id",  # Not relevant towards project, can just use default csv IDs
        "original_title",  # Could possibly keep, but I personally feel that translated titles alone is enough
        "tagline",  # Could possibly keep, but I feel that keeping overview is enough
        "production_companies",  # Could possibly keep, but as is we aren't looking at a user's preferred companies
        "spoken_languages",  # Should use the original_language field to filter by language instead
        "cast",  # Not important to project
        "director",  # Not important to project
        "director_of_photography",  # Not important to project
        "writers",  # Not important to project
        "producers",  # Not important to project
        "music_composer",  # Not important to project
        "imdb_votes"  # Could possibly keep, but current tasks don't use it
    ]

    # Dropping the unnecessary columns
    filtered_data = filtered_data.drop(columns=removed_columns)

    # Remove films with null fields in the necessary columns
    necessary_columns = [
        "title",
        "release_date",
        "runtime",
        "original_language",
        "genres",
        "production_countries",
        "popularity",
        "imdb_rating"
    ]  # Could potentially also include overview, poster_path in here

    filtered_data = filtered_data.dropna(subset=necessary_columns)

    # Remove any duplicate values (Checking date as some films may share names)
    filtered_data = filtered_data.drop_duplicates(subset=["title", "release_date"])

    # Write the cleaned data to the new CSV file
    filtered_data.to_csv("datasets/movie_dataset.csv")
