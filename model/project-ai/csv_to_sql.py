import pandas as pd
import sqlite3
import os

# Read the CSV with optimized dtypes
print("Reading CSV with optimized data types...")

dtype_spec = {
    'title': 'string',
    'overview': 'string',
    'release_date': 'string',
    'runtime': 'Int32',
    'original_language': 'string',
    'genres': 'string',
    'production_countries': 'string',
    'popularity': 'float32',  # Use float32 instead of float64
    'imdb_rating': 'float32',  # Use float32 instead of float64
    'director': 'string',
    'poster_path': 'string',
    'year': 'Int32',
    'combined': 'string'
}

data = pd.read_csv("datasets/movie_dataset.csv", dtype=dtype_spec)

print(f"CSV columns: {list(data.columns)}")
print(f"CSV shape: {data.shape}")
print(f"Memory usage: {data.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# Set id as index
if 'id' in data.columns:
    print("Setting 'id' as index...")
    data.set_index('id', inplace=True)

# Create SQLite database with optimizations
db_path = "datasets/movie_dataset.db"

print(f"\nCreating optimized SQLite database...")
conn = sqlite3.connect(db_path)

# Enable optimizations
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA synchronous=NORMAL")
conn.execute("PRAGMA page_size=4096")

# Write to SQLite - DON'T store 'combined' column (it's huge and redundant)
# We can reconstruct it when needed
print("Writing data to database (excluding 'combined' column)...")

# Drop 'combined' column to save space
data_without_combined = data.drop(columns=['combined'], errors='ignore')

data_without_combined.to_sql('movies', conn, if_exists='replace', index=True, index_label='id')

# Create indexes for faster queries
print("Creating indexes...")
conn.execute('CREATE INDEX IF NOT EXISTS idx_year ON movies(year)')
conn.execute('CREATE INDEX IF NOT EXISTS idx_language ON movies(original_language)')
conn.execute('CREATE INDEX IF NOT EXISTS idx_runtime ON movies(runtime)')
conn.execute('CREATE INDEX IF NOT EXISTS idx_popularity ON movies(popularity)')
conn.execute('CREATE INDEX IF NOT EXISTS idx_rating ON movies(imdb_rating)')

# Optimize database
print("Optimizing database...")
conn.execute("VACUUM")
conn.execute("ANALYZE")

# Verify the data
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM movies")
count = cursor.fetchone()[0]
print(f"\nTotal movies in database: {count}")

cursor.execute("PRAGMA table_info(movies)")
columns = cursor.fetchall()
print("\nDatabase columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

conn.close()

print(f"\n{'='*50}")
print(f"Conversion complete!")
print(f"{'='*50}")
print(f"CSV size:      {os.path.getsize('datasets/movie_dataset.csv') / 1024**2:.2f} MB")
print(f"Database size: {os.path.getsize(db_path) / 1024**2:.2f} MB")
print(f"Space saved:   {(os.path.getsize('datasets/movie_dataset.csv') - os.path.getsize(db_path)) / 1024**2:.2f} MB")
print(f"\nNote: 'combined' column excluded to save space.")
print(f"It will be reconstructed on-the-fly when needed.")