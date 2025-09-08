#!/usr/bin/env python3
"""
Flask REST API for Internship Recommendation Engine

Provides endpoints for internship recommendations based on candidate profiles.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from recommendation_engine import InternshipRecommendationEngine
import traceback
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Initialize the recommendation engine
engine = None

def get_engine():
    """Lazy initialization of the recommendation engine."""
    global engine
    if engine is None:
        try:
            # Get the directory where app.py is located
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(current_dir, 'config.yml')
            logger.info(f"Current working directory: {os.getcwd()}")
            logger.info(f"App directory: {current_dir}")
            logger.info(f"Config path: {config_path}")
            logger.info(f"Config exists: {os.path.exists(config_path)}")
            engine = InternshipRecommendationEngine(config_path=config_path)
            logger.info("Recommendation engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize recommendation engine: {e}")
            raise
    return engine

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'Internship Recommendation API is running'
    })

@app.route('/recommend', methods=['POST'])
def recommend_internships():
    """
    Main recommendation endpoint.

    Expects JSON payload with candidate profile:
    {
        "education_level": "ug",
        "major_field": "Computer Science",
        "skills": ["python", "javascript"],
        "preferred_sectors": ["technology"],
        "preferred_locations": ["bangalore"],
        "remote_ok": true,
        "availability_start": "2025-01-01",
        "duration_weeks_pref": 12,
        "stipend_pref": "10000-20000",
        "career_goal": "Looking for tech internships"
    }
    """
    try:
        # Get candidate data from request
        candidate_data = request.get_json()

        if not candidate_data:
            return jsonify({
                'error': 'No candidate data provided',
                'message': 'Please provide candidate profile in JSON format'
            }), 400

        logger.info(f"Received recommendation request for candidate")

        # Validate required fields
        required_fields = ['education_level', 'skills']
        missing_fields = [field for field in required_fields if field not in candidate_data]

        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'message': f'Required fields: {missing_fields}'
            }), 400

        # Get recommendation engine
        rec_engine = get_engine()

        # Generate recommendations
        recommendations = rec_engine.recommend(candidate_data)

        # Prepare response
        response = {
            'success': True,
            'candidate_profile': {
                'education_level': candidate_data.get('education_level'),
                'skills_count': len(candidate_data.get('skills', [])),
                'preferred_sectors': candidate_data.get('preferred_sectors', []),
                'remote_ok': candidate_data.get('remote_ok', False)
            },
            'recommendations': recommendations,
            'total_recommendations': len(recommendations)
        }

        logger.info(f"Generated {len(recommendations)} recommendations")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error processing recommendation request: {e}")
        logger.error(traceback.format_exc())

        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/recommend/test', methods=['GET'])
def test_recommendations():
    """Test endpoint with a sample candidate profile."""
    sample_candidate = {
        'education_level': 'ug',
        'major_field': 'Computer Science',
        'skills': ['python', 'javascript', 'data analysis'],
        'preferred_sectors': ['technology', 'research'],
        'preferred_locations': ['bangalore', 'karnataka'],
        'remote_ok': True,
        'availability_start': '2025-01-01',
        'duration_weeks_pref': 12,
        'stipend_pref': '10000-20000',
        'career_goal': 'Looking for data analysis and software development opportunities'
    }

    try:
        rec_engine = get_engine()
        recommendations = rec_engine.recommend(sample_candidate)

        return jsonify({
            'success': True,
            'message': 'Test recommendations generated',
            'sample_candidate': sample_candidate,
            'recommendations': recommendations
        })

    except Exception as e:
        logger.error(f"Error in test recommendations: {e}")
        return jsonify({
            'error': 'Test failed',
            'message': str(e)
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get system statistics."""
    try:
        rec_engine = get_engine()
        total_internships = len(rec_engine.internships_df)

        return jsonify({
            'total_internships': total_internships,
            'embedding_model': rec_engine.config['embedding_model'],
            'index_size': rec_engine.index.ntotal if rec_engine.index else 0
        })

    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({
            'error': 'Failed to get statistics',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

def main():
    """Main function to run the Flask app."""
    import yaml

    # Load configuration
    try:
        with open('config.yml', 'r') as f:
            config = yaml.safe_load(f)
    except FileNotFoundError:
        logger.warning("config.yml not found, using default settings")
        config = {'api': {'host': '0.0.0.0', 'port': 8000, 'debug': True}}

    api_config = config.get('api', {})

    logger.info(f"Starting Flask app on {api_config.get('host', '0.0.0.0')}:{api_config.get('port', 8000)}")

    app.run(
        host=api_config.get('host', '0.0.0.0'),
        port=api_config.get('port', 8000),
        debug=api_config.get('debug', True)
    )

if __name__ == '__main__':
    main()
