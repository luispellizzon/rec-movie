import pytest
import pandas as pd
from unittest.mock import Mock, patch, MagicMock
from main import get_ids, ids_to_json, recommend_movies


class TestGetIds:
    """Test the get_ids function that parses AI responses"""
    
    def test_single_id(self):
        """Test parsing single ID"""
        response = "12345"
        assert get_ids(response) == [12345]
    
    def test_multiple_ids(self):
        """Test parsing multiple IDs"""
        response = "123\n456\n789"
        assert get_ids(response) == [123, 456, 789]
    
    def test_ids_with_whitespace(self):
        """Test parsing IDs with whitespace"""
        response = "  123  \n  456  \n  789  "
        assert get_ids(response) == [123, 456, 789]
    
    def test_mixed_content_filters_non_ids(self):
        """Test that non-numeric lines are filtered out"""
        response = "123\nsome text\n456\nmore text\n789"
        assert get_ids(response) == [123, 456, 789]
    
    def test_empty_response(self):
        """Test empty response returns empty list"""
        assert get_ids("") == []
        assert get_ids("\n\n\n") == []
    
    def test_only_text_returns_empty(self):
        """Test response with only text returns empty list"""
        response = "No numbers here\nJust text"
        assert get_ids(response) == []


class TestIdsToJson:
    """Test the ids_to_json function"""
    
    @pytest.fixture
    def sample_movies(self):
        """Create sample movie DataFrame"""
        return pd.DataFrame({
            'id': [1, 2, 3],
            'title': ['Movie A', 'Movie B', 'Movie C'],
            'overview': ['Overview A', 'Overview B', 'Overview C'],
            'genres': [['Action'], ['Comedy'], ['Drama']],
            'year': [2020, 2021, 2022],
            'runtime': [120, 95, 110],
            'director': ['Director A', 'Director B', 'Director C'],
            'production_countries': [['USA'], ['UK'], ['France']],
            'original_language': ['en', 'en', 'fr'],
            'popularity': [85.5, 70.3, 60.1],
            'imdb_rating': [7.5, 6.8, 8.2],
            'poster_path': ['/path1.jpg', '/path2.jpg', '/path3.jpg']
        })
    
    def test_single_id_conversion(self, sample_movies):
        """Test converting single ID to JSON"""
        result = ids_to_json([1], sample_movies)
        assert 'recommended_movies' in result
        assert len(result['recommended_movies']) == 1
        assert result['recommended_movies'][0]['id'] == 1
    
    def test_multiple_ids_conversion(self, sample_movies):
        """Test converting multiple IDs to JSON"""
        result = ids_to_json([1, 2, 3], sample_movies)
        assert len(result['recommended_movies']) == 3
        assert [m['id'] for m in result['recommended_movies']] == [1, 2, 3]
    
    def test_json_contains_content_field(self, sample_movies):
        """Test that JSON contains combined content field"""
        result = ids_to_json([1], sample_movies)
        movie = result['recommended_movies'][0]
        assert 'content' in movie
        assert 'Title: Movie A' in movie['content']
        assert 'Overview: Overview A' in movie['content']
        assert 'Genres:' in movie['content']
    
    def test_missing_id_skipped(self, sample_movies):
        """Test that missing IDs are skipped"""
        result = ids_to_json([1, 999, 3], sample_movies)
        # Should only include IDs 1 and 3
        assert len(result['recommended_movies']) == 2
        assert 999 not in [m['id'] for m in result['recommended_movies']]
    
    def test_empty_ids_list(self, sample_movies):
        """Test empty IDs list returns empty recommendations"""
        result = ids_to_json([], sample_movies)
        assert result['recommended_movies'] == []
    
    def test_poster_url_format(self, sample_movies):
        """Test poster URL is correctly formatted"""
        result = ids_to_json([1], sample_movies)
        content = result['recommended_movies'][0]['content']
        assert 'Poster: https://image.tmdb.org/t/p/w500/path1.jpg' in content


class TestRecommendMovies:
    """Integration tests for the main recommend_movies function"""
    
    @pytest.fixture
    def mock_db_data(self):
        """Mock database query result"""
        return pd.DataFrame({
            'id': [1, 2, 3, 4, 5],
            'title': ['Action Movie', 'Comedy Movie', 'Drama Movie', 'Horror Movie', 'Sci-Fi Movie'],
            'overview': ['Action overview'] * 5,
            'genres': ["['Action']", "['Comedy']", "['Drama']", "['Horror']", "['Science Fiction']"],
            'production_countries': ["['USA']"] * 5,
            'popularity': [85.0, 75.0, 65.0, 55.0, 95.0],
            'imdb_rating': [7.5, 7.0, 8.0, 6.5, 8.5],
            'runtime': [120, 95, 110, 88, 130],
            'year': [2020] * 5,
            'original_language': ['en'] * 5,
            'director': ['Director'] * 5,
            'poster_path': ['/poster.jpg'] * 5,
            'release_date': ['2020-01-01'] * 5
        })
    
    @patch('main.pd.read_sql_query')
    @patch('main.llm')
    def test_basic_recommendation_flow(self, mock_llm, mock_sql, mock_db_data):
        """Test basic recommendation flow"""
        # Mock database query
        mock_sql.return_value = mock_db_data
        
        # Mock AI response
        mock_llm.invoke.return_value = Mock(content="1\n2\n3")
        
        request = {
            "mood": "excited",
            "selected_genres": ["Action"],
            "number_recommended": 3
        }
        
        result = recommend_movies(request)
        
        assert 'recommended_movies' in result
        assert len(result['recommended_movies']) <= 3
    
    @patch('main.pd.read_sql_query')
    def test_empty_database_result(self, mock_sql):
        """Test handling of empty database result"""
        mock_sql.return_value = pd.DataFrame()
        
        request = {"mood": "happy"}
        result = recommend_movies(request)
        
        assert 'error' in result
        assert result['recommended_movies'] == []
    
    @patch('main.pd.read_sql_query')
    @patch('main.filter_dataframe')
    def test_no_matching_movies_after_filter(self, mock_filter, mock_sql):
        """Test when no movies match after filtering"""
        mock_sql.return_value = pd.DataFrame({'id': [1]})
        mock_filter.return_value = pd.DataFrame()  # Empty after filtering
        
        request = {"mood": "happy"}
        result = recommend_movies(request)
        
        assert 'error' in result
        assert result['recommended_movies'] == []
    
    @patch('main.pd.read_sql_query')
    @patch('main.llm')
    def test_handles_ai_error_gracefully(self, mock_llm, mock_sql, mock_db_data):
        """Test graceful handling of AI errors"""
        mock_sql.return_value = mock_db_data
        mock_llm.invoke.side_effect = Exception("AI Error")
        
        request = {"mood": "happy"}
        result = recommend_movies(request)
        
        assert 'error' in result
    
    @patch('main.pd.read_sql_query')
    @patch('main.llm')
    def test_previous_ids_excluded(self, mock_llm, mock_sql, mock_db_data):
        """Test that previous IDs are excluded from recommendations"""
        mock_sql.return_value = mock_db_data
        mock_llm.invoke.return_value = Mock(content="4\n5")
        
        request = {"mood": "excited", "selected_genres": ["Action"]}
        result = recommend_movies(request, previous_ids=[1, 2, 3])
        
        # Should not include IDs 1, 2, 3
        returned_ids = [m['id'] for m in result['recommended_movies']]
        assert 1 not in returned_ids
        assert 2 not in returned_ids
        assert 3 not in returned_ids
    
    @patch('main.pd.read_sql_query')
    @patch('main.llm')
    def test_number_recommended_respected(self, mock_llm, mock_sql, mock_db_data):
        """Test that number_recommended parameter is respected"""
        mock_sql.return_value = mock_db_data
        mock_llm.invoke.return_value = Mock(content="1\n2")
        
        request = {"mood": "happy", "number_recommended": 2}
        result = recommend_movies(request)
        
        assert len(result['recommended_movies']) <= 2


class TestRecommendMoviesEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_handles_missing_optional_params(self):
        """Test that missing optional parameters don't cause errors"""
        with patch('main.pd.read_sql_query') as mock_sql:
            mock_sql.return_value = pd.DataFrame()
            
            # Minimal request
            request = {}
            result = recommend_movies(request)
            
            # Should handle gracefully, not crash
            assert isinstance(result, dict)
    
    @patch('main.pd.read_sql_query')
    def test_handles_database_connection_error(self, mock_sql):
        """Test handling of database connection errors"""
        mock_sql.side_effect = Exception("Database connection failed")
        
        request = {"mood": "happy"}
        result = recommend_movies(request)
        
        assert 'error' in result
        assert 'Database connection failed' in result['error']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])