# Just further processing the data, such as normalising numeric

import pandas as pd


def normalise_data(uncleaned_data):
    numerical_fields = [
        "vote_average",
        "vote_count",
        "revenue",
        "runtime",
        "budget",
        "popularity",
        "imdb_rating",
        "imdb_votes"
    ]

    for field in numerical_fields:
        current_column = uncleaned_data[field]

        field_min = current_column.min()
        field_max = current_column.max()

        if (field_max - field_min) != 0:
            uncleaned_data[field] = (current_column - field_min) / (field_max - field_min)
        else:
            uncleaned_data[field] = 0

    return uncleaned_data


def categorical_to_numerical(uncleaned_data):
    categorical_fields = [
        "status",
        "original_language",
        "genres"
    ]

    uncleaned_data["genres"] = (
        uncleaned_data["genres"]
        .fillna("")
        .astype(str)
        .str.split(",", n=1).str[0]  # Takes only the first genre listed
        .str.strip()  # Strips the genre of whitespace
    )

    numerical_data = pd.get_dummies(uncleaned_data, columns=categorical_fields, prefix=categorical_fields)

    return numerical_data


if __name__ == "__main__":
    loaded_data = pd.read_csv("datasets/uncleaned_movie_dataset.csv")

    normalised_data = normalise_data(loaded_data)
    encoded_data = categorical_to_numerical(normalised_data)

    print(encoded_data)
