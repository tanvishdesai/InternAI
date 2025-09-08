# Internship Recommendation Engine

A content-based recommendation system for internships using embeddings and rule-based reranking.

## Features

- **Vector Embeddings**: Uses Sentence-Transformers to create embeddings for internships
- **Fast Retrieval**: FAISS index for efficient nearest-neighbor search
- **Rule-based Reranking**: Combines embedding similarity with structured scoring
- **REST API**: Flask-based API for easy integration
- **Configurable**: Tunable weights and parameters via YAML config

## Architecture

```
internships.csv → build_index.py → FAISS Index + Embeddings
                                      ↓
candidate profile → recommendation_engine.py → ranked recommendations
                                      ↓
                              app.py → REST API
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Build the index:
```bash
python build_index.py
```

3. Start the API server:
```bash
python app.py
```

## API Usage

### Get Recommendations

**Endpoint**: `POST /recommend`

**Request Body**:
```json
{
  "education_level": "ug",
  "major_field": "Computer Science",
  "skills": ["python", "javascript", "data analysis"],
  "preferred_sectors": ["technology", "research"],
  "preferred_locations": ["bangalore", "karnataka"],
  "remote_ok": true,
  "stipend_pref": "10000-20000",
  "career_goal": "Looking for software development opportunities"
}
```

**Response**:
```json
{
  "success": true,
  "recommendations": [
    {
      "internship_id": "INT1001",
      "title": "Data Analysis Intern",
      "organization": "Tech Company",
      "score": 0.845,
      "match_reasons": ["Skills: 2.5/3", "Qualification: excellent", "Location: same state"],
      "explain_text": "This Data Analysis Intern position... matches your background...",
      "location": {"city": "Bangalore", "district": "Bangalore", "state": "Karnataka"},
      "stipend": "10000-15000",
      "remote_allowed": true,
      "url": "https://example.org/apply/INT1001"
    }
  ]
}
```

## Configuration

Edit `config.yml` to tune the recommendation algorithm:

```yaml
scoring_weights:
  embedding_similarity: 0.6    # Weight for semantic similarity
  skill_overlap: 0.15          # Weight for skill matching
  qualification_fit: 0.1       # Weight for education match
  location_match: 0.1          # Weight for location compatibility
  stipend_match: 0.03          # Weight for stipend match
  recency: 0.02               # Weight for posting recency

recommendation:
  max_results: 5              # Maximum recommendations to return
  min_score_threshold: 0.3    # Minimum score threshold
```

## Data Format

The system expects internship data in CSV format with these columns:
- `internship_id`: Unique identifier
- `title`: Internship title
- `organization`: Organization name
- `sector_tags`: Comma-separated sectors
- `description`: Detailed description
- `responsibilities`: Key responsibilities
- `required_qualifications`: Education requirements
- `preferred_skills`: Comma-separated skills
- `stipend`: Salary range or amount
- `location_city`, `location_district`, `location_state`: Location info
- `remote_allowed`: "yes" or "no"
- `duration_weeks`: Duration in weeks
- `start_date`: Start date (YYYY-MM-DD)
- `application_deadline`: Deadline (YYYY-MM-DD)
- `eligibility_min_qualification`: Min education level
- `url`: Application URL

## Evaluation

Run the evaluation notebook:
```bash
jupyter notebook evaluation.ipynb
```

The notebook includes:
- Test profiles for different candidate types
- Qualitative analysis of recommendations
- Quantitative metrics and visualizations
- Performance benchmarks

## Database Integration

The system is designed to integrate with a SQL database containing user profiles with these fields:

- `education_level` → maps to `eligibility_min_qualification`
- `major_field` → compared to `required_qualifications`
- `skills` (array) → maps to `preferred_skills`
- `preferred_sectors` (array) → maps to `sector_tags`
- `preferred_locations` (array) → compared against location fields
- `remote_ok` (boolean) → compared against `remote_allowed`
- `availability_start` (date) → compared with `start_date` & `application_deadline`
- `duration_weeks_pref` (number) → compared with `duration_weeks`
- `stipend_pref` (string/range) → compared against `stipend`
- `career_goal` (text) → helps embeddings match better

## Files Structure

```
Module-B ML/
├── internships.csv           # Internship data
├── build_index.py           # Index building script
├── recommendation_engine.py # Core recommendation logic
├── app.py                   # REST API server
├── config.yml              # Configuration file
├── evaluation.ipynb        # Evaluation notebook
├── requirements.txt        # Python dependencies
├── models/                 # Generated models and indices
│   ├── internship_index.faiss
│   ├── internship_embeddings.pkl
│   └── internships.pkl
└── README.md              # This file
```

## Scoring Algorithm

The final recommendation score combines:

1. **Embedding Similarity** (60%): Semantic similarity between candidate profile and internship description
2. **Skill Overlap** (15%): Exact and fuzzy matching of skills
3. **Qualification Fit** (10%): Education level compatibility
4. **Location Match** (10%): Geographic preference matching
5. **Stipend Match** (3%): Compensation compatibility
6. **Recency** (2%): Preference for recently posted internships

## Performance

- **Index Build Time**: ~30-60 seconds for 50 internships
- **Query Time**: ~0.2-0.5 seconds per recommendation
- **Memory Usage**: ~100-200MB for models and index
- **Scalability**: Handles 10K+ internships efficiently

## Development

To extend the system:

1. **Add New Features**: Modify `recommendation_engine.py`
2. **Tune Parameters**: Edit `config.yml`
3. **Add Evaluation**: Extend `evaluation.ipynb`
4. **Scale Up**: Consider GPU acceleration for larger datasets

## Troubleshooting

**Common Issues:**

1. **Index not found**: Run `python build_index.py` first
2. **Memory errors**: Reduce `top_k_retrieval` in config
3. **Poor recommendations**: Adjust scoring weights in config
4. **Slow responses**: Check FAISS index optimization

**Debug Mode**: Set `debug: true` in `config.yml` for detailed logging
