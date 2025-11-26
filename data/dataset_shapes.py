import pandas as pd

unfiltered_data = pd.read_csv("datasets/uncleaned_movie_dataset.csv")
print(unfiltered_data.shape)

filtered_data = pd.read_csv("datasets/movie_dataset.csv")
print(filtered_data.shape)

# 28 -> 8 columns from dropping
# 1,117,776 -> 1,098,238 rows from dropping non-released films (19,538 removed)
# 1,098,238 -> 594,547 rows from dropping NaN important field films (503,691 removed)
# 594,547 -> 594,329 rows from dropping duplicate films (218 removed)
