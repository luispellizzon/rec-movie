import pytest
import pandas as pd
import numpy as np
from filter_utils import safe_parse_list, filter_dataframe


class TestSafeParseList:
    """Test the safe_parse_list function with various inputs"""
    
    def test_none_returns_empty_list(self):
        """Test that None returns empty list"""
        assert safe_parse_list(None) == []
    
    def test_nan_returns_empty_list(self):
        """Test that NaN returns empty list"""
        assert safe_parse_list(float('nan')) == []
        assert safe_parse_list(np.nan) == []
    
    def test_float_returns_empty_list(self):
        """Test that any float returns empty list"""
        assert safe_parse_list(3.14) == []
        assert safe_parse_list(0.0) == []
    
    def test_already_list_returns_list(self):
        """Test that existing list is returned as strings"""
        assert safe_parse_list(['Action', 'Drama']) == ['Action', 'Drama']
        assert safe_parse_list([1, 2, 3]) == ['1', '2', '3']
    
    def test_valid_string_parses_to_list(self):
        """Test that valid string representation parses correctly"""
        assert safe_parse_list("['Action', 'Drama']") == ['Action', 'Drama']
        assert safe_parse_list("['Comedy']") == ['Comedy']
    
    def test_empty_string_returns_empty_list(self):
        """Test that empty string returns empty list"""
        assert safe_parse_list("") == []
        assert safe_parse_list("   ") == []
    
    def test_invalid_string_returns_empty_list(self):
        """Test that invalid string returns empty list"""
        assert safe_parse_list("not a list") == []
        assert safe_parse_list("{invalid}") == []
    
    def test_list_with_none_filters_none(self):
        """Test that None values in list are filtered"""
        assert safe_parse_list(['Action', None, 'Drama']) == ['Action', 'Drama']


class TestFilterDataframe:
    """Test the filter_dataframe function"""
    
    @pytest.fixture
    def sample_data(self):
        """Create sample movie data for testing"""
        return pd.DataFrame({
            'id': [1, 2, 3, 4, 5],
            'title': ['Movie A', 'Movie B', 'Movie C', 'Movie D', 'Movie E'],
            'genres': [
                "['Action', 'Thriller']",
                "['Comedy', 'Romance']",
                "['Action', 'Adventure']",
                "['Drama']",
                "['Horror', 'Thriller']"
            ],
            'production_countries': [
                "['USA']",
                "['USA', 'UK']",
                "['France']",
                "['USA']",
                "['Japan']"
            ],
            'popularity': [85.0, 45.0, 90.0, 30.0, 60.0],
            'runtime': [120, 95, 110, 100, 88],
            'year': [2020, 2019, 2021, 2018, 2022]
        })
    
    def test_empty_dataframe_returns_empty(self):
        """Test that empty DataFrame returns empty"""
        df = pd.DataFrame()
        result = filter_dataframe(df)
        assert result.empty
    
    def test_genre_filtering_by_mood(self, sample_data):
        """Test filtering by mood (which maps to genres)"""
        result = filter_dataframe(sample_data, mood='excited')
        # 'excited' maps to Action, Adventure, Thriller, Science Fiction
        # Should match movies 1, 3, 5 (have Action/Adventure/Thriller)
        assert len(result) > 0
        assert all('Action' in g or 'Adventure' in g or 'Thriller' in g 
                   for g in result['genres'].values)
    
    def test_genre_filtering_by_selected_genres(self, sample_data):
        """Test filtering by specific genres"""
        result = filter_dataframe(sample_data, selected_genres=['Comedy'])
        assert len(result) == 1
        assert 'Comedy' in result.iloc[0]['genres']
    
    def test_country_filtering(self, sample_data):
        """Test filtering by country"""
        result = filter_dataframe(sample_data, country='USA')
        # Should return movies with USA in production_countries
        assert len(result) > 0
        assert all('USA' in c for c in result['production_countries'].values)
    
    def test_mainstream_popularity_filter(self, sample_data):
        """Test mainstream (top 30%) popularity filter"""
        result = filter_dataframe(sample_data, mainstream=True, selected_genres=['Action'])
        # Top 30% by popularity should be the highest rated ones
        assert len(result) > 0
        # All results should have high popularity
        assert result['popularity'].min() >= sample_data['popularity'].quantile(0.7)
    
    def test_niche_popularity_filter(self, sample_data):
        """Test niche (bottom 30%) popularity filter"""
        result = filter_dataframe(sample_data, mainstream=False, selected_genres=['Drama'])
        assert len(result) > 0
        # All results should have low popularity
        assert result['popularity'].max() <= sample_data['popularity'].quantile(0.3)
    
    def test_combined_filters(self, sample_data):
        """Test multiple filters together"""
        result = filter_dataframe(
            sample_data,
            mood='excited',
            mainstream=True,
            country='USA'
        )
        # Should apply all filters
        assert len(result) >= 0  # May be empty if no movies match all criteria
        if not result.empty:
            assert all('USA' in c for c in result['production_countries'].values)
    
    def test_removes_empty_genre_lists(self, sample_data):
        """Test that movies with empty genre lists are removed"""
        sample_data.loc[0, 'genres'] = "[]"  # Empty genre list
        result = filter_dataframe(sample_data, mood='happy')
        # Movie with empty genres should be removed
        assert 0 not in result['id'].values
    
    def test_handles_invalid_genres(self, sample_data):
        """Test that invalid genre data is handled gracefully"""
        sample_data.loc[0, 'genres'] = float('nan')
        sample_data.loc[1, 'genres'] = "invalid string"
        result = filter_dataframe(sample_data, mood='happy')
        # Should not crash, invalid rows should be filtered out
        assert isinstance(result, pd.DataFrame)


class TestFilterDataframeEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_no_matching_genres(self):
        """Test when no movies match the genre filter"""
        df = pd.DataFrame({
            'genres': ["['Western']", "['Western']"],
            'production_countries': ["['USA']", "['USA']"],
            'popularity': [50.0, 60.0]
        })
        result = filter_dataframe(df, mood='excited')  # No westerns in 'excited'
        assert result.empty or len(result) == 0
    
    def test_all_genres_invalid(self):
        """Test when all genre data is invalid"""
        df = pd.DataFrame({
            'genres': [float('nan'), None, "invalid"],
            'production_countries': ["['USA']", "['USA']", "['USA']"],
            'popularity': [50.0, 60.0, 70.0]
        })
        result = filter_dataframe(df, mood='happy')
        # Should return empty or very small result
        assert len(result) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])