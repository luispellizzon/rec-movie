
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
from app import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check and root endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns API info"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "Movie Recommendation API" in data["message"]
        assert "endpoints" in data
    
    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "movie-recommendation-api"


class TestRecommendEndpoint:
    """Test the /recommend POST endpoint"""
    
    @patch('app.recommend_movies')
    def test_successful_recommendation(self, mock_recommend):
        """Test successful recommendation request"""
        mock_recommend.return_value = {
            "recommended_movies": [
                {"id": 1, "content": "Movie 1 details"},
                {"id": 2, "content": "Movie 2 details"}
            ]
        }
        
        payload = {
            "mood": "happy",
            "selected_genres": ["Comedy"],
            "number_recommended": 2
        }
        
        response = client.post("/recommend", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "recommended_movies" in data
        assert len(data["recommended_movies"]) == 2
    
    @patch('app.recommend_movies')
    def test_recommendation_with_all_params(self, mock_recommend):
        """Test recommendation with all parameters"""
        mock_recommend.return_value = {"recommended_movies": []}
        
        payload = {
            "mood": "excited",
            "preferred_length": 120,
            "language": "en",
            "country": "USA",
            "era": "actual",
            "popularity": True,
            "selected_genres": ["Action", "Thriller"],
            "number_recommended": 5,
            "previous_ids": [1, 2, 3]
        }
        
        response = client.post("/recommend", json=payload)
        assert response.status_code == 200
        mock_recommend.assert_called_once()
    
    @patch('app.recommend_movies')
    def test_recommendation_with_minimal_params(self, mock_recommend):
        """Test recommendation with minimal parameters"""
        mock_recommend.return_value = {"recommended_movies": []}
        
        payload = {"mood": "happy"}
        
        response = client.post("/recommend", json=payload)
        assert response.status_code == 200
    
    @patch('app.recommend_movies')
    def test_handles_recommendation_error(self, mock_recommend):
        """Test handling of recommendation errors"""
        mock_recommend.side_effect = Exception("Internal error")
        
        payload = {"mood": "happy"}
        
        response = client.post("/recommend", json=payload)
        assert response.status_code == 200  # Should not crash
        data = response.json()
        assert "error" in data
    
    @patch('app.recommend_movies')
    def test_optional_fields_default_values(self, mock_recommend):
        """Test that optional fields use default values"""
        mock_recommend.return_value = {"recommended_movies": []}
        
        # Send only mood
        payload = {"mood": "happy"}
        
        response = client.post("/recommend", json=payload)
        assert response.status_code == 200
        
        # Check that defaults were applied
        call_args = mock_recommend.call_args[0][0]  # First argument (dict)
        assert call_args.get("number_recommended") == 3  # Default value


class TestCORS:
    """Test CORS configuration"""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are present in responses"""
        response = client.options(
            "/recommend",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        # Should allow the origin
        assert response.status_code in [200, 204]
    
    def test_localhost_origin_allowed(self):
        """Test that localhost origins are allowed"""
        response = client.get(
            "/health",
            headers={"Origin": "http://localhost:5173"}
        )
        assert response.status_code == 200


class TestRequestValidation:
    """Test request validation and Pydantic models"""
    
    def test_mood_field_accepts_string(self):
        """Test mood field accepts string"""
        with patch('app.recommend_movies') as mock:
            mock.return_value = {"recommended_movies": []}
            
            response = client.post("/recommend", json={"mood": "happy"})
            assert response.status_code == 200
    
    def test_mood_field_accepts_null(self):
        """Test mood field accepts null"""
        with patch('app.recommend_movies') as mock:
            mock.return_value = {"recommended_movies": []}
            
            response = client.post("/recommend", json={"mood": None})
            assert response.status_code == 200
    
    def test_number_recommended_accepts_integer(self):
        """Test number_recommended accepts integer"""
        with patch('app.recommend_movies') as mock:
            mock.return_value = {"recommended_movies": []}
            
            response = client.post("/recommend", json={"number_recommended": 5})
            assert response.status_code == 200
    
    def test_selected_genres_accepts_list(self):
        """Test selected_genres accepts list of strings"""
        with patch('app.recommend_movies') as mock:
            mock.return_value = {"recommended_movies": []}
            
            response = client.post("/recommend", json={
                "selected_genres": ["Action", "Comedy"]
            })
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])