import pytest
from sql_utils import build_sql_query


class TestBuildSqlQuery:
    """Test the build_sql_query function"""
    
    def test_no_filters_returns_base_query(self):
        """Test query with no filters"""
        query, params = build_sql_query()
        assert "SELECT id, title" in query
        assert "FROM movies WHERE 1=1" in query
        assert "ORDER BY popularity DESC" in query
        assert params == []
    
    def test_runtime_filter(self):
        """Test runtime filter with tolerance"""
        query, params = build_sql_query(preferred_length=90)
        assert "runtime BETWEEN ? AND ?" in query
        assert params == [70, 110]  # 90 ± 20
    
    def test_runtime_filter_min_zero(self):
        """Test runtime filter doesn't go below zero"""
        query, params = build_sql_query(preferred_length=10)
        assert params == [0, 30]  # max(0, 10-20) = 0
    
    def test_language_filter(self):
        """Test language filter"""
        query, params = build_sql_query(language='en')
        assert "original_language = ?" in query
        assert 'en' in params
    
    def test_era_old_filter(self):
        """Test era filter for old movies"""
        query, params = build_sql_query(era='old')
        assert "year <= 1990" in query
    
    def test_era_actual_filter(self):
        """Test era filter for actual/modern movies"""
        query, params = build_sql_query(era='actual')
        assert "year > 1990 AND year <= 2020" in query
    
    def test_era_new_filter(self):
        """Test era filter for new movies"""
        query, params = build_sql_query(era='new')
        assert "year > 2020" in query
    
    def test_previous_ids_single(self):
        """Test excluding a single previous ID"""
        query, params = build_sql_query(previous_ids=[123])
        assert "id NOT IN (?)" in query
        assert 123 in params
    
    def test_previous_ids_multiple(self):
        """Test excluding multiple previous IDs"""
        query, params = build_sql_query(previous_ids=[123, 456, 789])
        assert "id NOT IN (?,?,?)" in query
        assert params == [123, 456, 789]
    
    def test_previous_ids_empty_list(self):
        """Test that empty previous_ids list doesn't add filter"""
        query, params = build_sql_query(previous_ids=[])
        assert "NOT IN" not in query
    
    def test_combined_filters(self):
        """Test multiple filters together"""
        query, params = build_sql_query(
            preferred_length=120,
            language='fr',
            era='actual',
            previous_ids=[10, 20]
        )
        assert "runtime BETWEEN ? AND ?" in query
        assert "original_language = ?" in query
        assert "year > 1990 AND year <= 2020" in query
        assert "id NOT IN (?,?)" in query
        assert params == [100, 140, 'fr', 10, 20]
    
    def test_query_always_ends_with_order_by(self):
        """Test that query always has ORDER BY clause"""
        query, params = build_sql_query()
        assert query.endswith("ORDER BY popularity DESC, imdb_rating DESC")
    
    def test_query_selects_required_columns(self):
        """Test that query selects all required columns"""
        query, params = build_sql_query()
        required_columns = [
            'id', 'title', 'overview', 'genres', 'production_countries',
            'popularity', 'imdb_rating', 'runtime', 'year', 'original_language',
            'director', 'poster_path', 'release_date'
        ]
        for col in required_columns:
            assert col in query


class TestBuildSqlQueryEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_invalid_era_value(self):
        """Test that invalid era value doesn't add filter"""
        query, params = build_sql_query(era='invalid')
        assert "year <" not in query
        assert "year >" not in query
    
    def test_very_large_runtime(self):
        """Test handling of very large runtime values"""
        query, params = build_sql_query(preferred_length=500)
        assert params == [480, 520]  # 500 ± 20



if __name__ == "__main__":
    pytest.main([__file__, "-v"])