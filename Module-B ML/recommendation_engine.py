#!/usr/bin/env python3
"""
Internship Recommendation Engine

This module provides content-based recommendations using embeddings and rule-based reranking.
"""

import pandas as pd
import numpy as np
import pickle
import yaml
import os
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import logging
import re
from difflib import SequenceMatcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InternshipRecommendationEngine:
    def __init__(self, config_path: str = 'config.yml', model_dir: str = 'models'):
        """Initialize the recommendation engine."""
        try:
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using default settings")
            self.config = self._get_default_config()

        self.model_dir = model_dir
        self.model = None
        self.index = None
        self.embeddings = None
        self.internships_df = None

        self._load_model_and_index()

    def _get_default_config(self):
        """Return default configuration settings."""
        return {
            'embedding_model': 'all-MiniLM-L6-v2',
            'top_k_retrieval': 50,
            'scoring_weights': {
                'embedding_similarity': 0.6,
                'skill_overlap': 0.15,
                'qualification_fit': 0.08,
                'location_match': 0.12,
                'sector_relevance': 0.05,
                'stipend_match': 0.02,
                'recency': 0.01
            },
            'skill_scoring': {
                'exact_match': 3.0,
                'partial_match': 1.0,
                'max_skills': 5
            },
            'qualification_levels': {
                '12th': 1,
                'diploma': 2,
                'ug': 3,
                'pg': 4
            },
            'qualification_compatibility': {
                'exact': 1.0,
                'higher': 0.8,
                'lower': 0.3
            },
            'location_scoring': {
                'exact_city': 1.0,
                'same_district': 0.9,
                'same_state': 0.7,
                'different_state': 0.2,
                'remote_allowed': 0.4,
                'no_match_remote_ok': 0.6
            },
            'stipend_scoring': {
                'exact_match': 1.0,
                'within_range': 0.8,
                'no_preference': 0.5
            },
            'recency_scoring': {
                'very_recent': 1.0,
                'recent': 0.8,
                'moderate': 0.6,
                'old': 0.3
            },
            'api': {
                'host': '0.0.0.0',
                'port': 8000,
                'debug': True
            },
            'recommendation': {
                'max_results': 10,
                'include_explanations': True,
                'min_score_threshold': 0.1
            }
        }

    def _load_model_and_index(self):
        """Load the sentence transformer model, FAISS index, and data."""
        logger.info("Loading model and index...")

        # Ensure model_dir is an absolute path
        if not os.path.isabs(self.model_dir):
            # Get the directory where this script is located
            script_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_dir = os.path.join(script_dir, self.model_dir)

        logger.info(f"Using model directory: {self.model_dir}")

        # Load sentence transformer model
        model_name = self.config['embedding_model']
        self.model = SentenceTransformer(model_name)

        # Load FAISS index
        index_path = os.path.join(self.model_dir, 'internship_index.faiss')
        logger.info(f"Loading FAISS index from: {index_path}")
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"FAISS index file not found: {index_path}")
        self.index = faiss.read_index(index_path)

        # Load embeddings
        embeddings_path = os.path.join(self.model_dir, 'internship_embeddings.pkl')
        logger.info(f"Loading embeddings from: {embeddings_path}")
        if not os.path.exists(embeddings_path):
            raise FileNotFoundError(f"Embeddings file not found: {embeddings_path}")
        with open(embeddings_path, 'rb') as f:
            self.embeddings = pickle.load(f)

        # Load internships data
        internships_path = os.path.join(self.model_dir, 'internships.pkl')
        logger.info(f"Loading internships data from: {internships_path}")
        if not os.path.exists(internships_path):
            raise FileNotFoundError(f"Internships data file not found: {internships_path}")
        self.internships_df = pd.read_pickle(internships_path)

        logger.info(f"Loaded index with {self.index.ntotal} internships")

    def create_candidate_profile_text(self, candidate: Dict[str, Any]) -> str:
        """Create a text representation of the candidate profile for embedding."""
        text_parts = []

        # Create a title-like summary
        title_parts = []
        if candidate.get('major_field'):
            title_parts.append(candidate['major_field'])
        if candidate.get('education_level'):
            title_parts.append(f"({candidate['education_level']})")
        if title_parts:
            text_parts.append(' '.join(title_parts))

        # Skills (format like internship preferred_skills)
        if candidate.get('skills'):
            skills_text = ', '.join(candidate['skills'])
            text_parts.append(f"Preferred skills: {skills_text}")

        # Education level (format like internship required_qualifications)
        if candidate.get('education_level'):
            text_parts.append(f"Required qualifications: {candidate['education_level']}")

        # Preferred sectors (format like internship sector_tags)
        if candidate.get('preferred_sectors'):
            sectors_text = ', '.join(candidate['preferred_sectors'])
            text_parts.append(f"Sectors: {sectors_text}")

        # Career goal as description
        if candidate.get('career_goal'):
            text_parts.append(f"{candidate['career_goal']}. Looking for internship opportunities in relevant field.")

        # Location information
        location_parts = []
        if candidate.get('preferred_locations'):
            location_parts.extend(candidate['preferred_locations'])
        if location_parts:
            text_parts.append(f"Location: {', '.join(location_parts)}")

        # Remote work preference
        if candidate.get('remote_ok'):
            text_parts.append("Remote work allowed")

        # Duration preference
        if candidate.get('duration_weeks_pref'):
            text_parts.append(f"Duration: {candidate['duration_weeks_pref']} weeks")

        # Stipend preference
        if candidate.get('stipend_pref'):
            text_parts.append(f"Stipend: {candidate['stipend_pref']}")

        return '. '.join(text_parts)

    def retrieve_similar_internships(self, candidate_embedding: np.ndarray, top_k: int = None) -> Tuple[np.ndarray, np.ndarray]:
        """Retrieve similar internships using FAISS."""
        if top_k is None:
            top_k = self.config['top_k_retrieval']

        # Search for similar internships
        scores, indices = self.index.search(candidate_embedding.reshape(1, -1), top_k)

        return scores[0], indices[0]

    def calculate_skill_overlap_score(self, candidate_skills: List[str], internship_skills: str) -> float:
        """Calculate skill overlap score between candidate and internship."""
        if not candidate_skills or pd.isna(internship_skills):
            return 0.0

        # Parse internship skills (comma-separated)
        internship_skill_list = [skill.strip().lower() for skill in internship_skills.split(',')]

        total_score = 0.0
        max_skills = min(len(candidate_skills), self.config['skill_scoring']['max_skills'])

        for candidate_skill in candidate_skills[:max_skills]:
            candidate_skill_lower = candidate_skill.lower()
            best_match_score = 0.0

            for internship_skill in internship_skill_list:
                # Exact match
                if candidate_skill_lower == internship_skill:
                    best_match_score = self.config['skill_scoring']['exact_match']
                    break
                # Fuzzy match with improved thresholds
                else:
                    similarity = SequenceMatcher(None, candidate_skill_lower, internship_skill).ratio()
                    # Lower threshold for better matching, especially for design tools
                    if similarity > 0.7:  # Reduced from 0.8
                        best_match_score = max(best_match_score, self.config['skill_scoring']['partial_match'] * similarity)
                    # Special handling for design tools
                    elif self._is_design_tool_match(candidate_skill_lower, internship_skill):
                        best_match_score = max(best_match_score, self.config['skill_scoring']['partial_match'] * 0.8)

            total_score += best_match_score

        # Normalize by number of candidate skills considered to get a score between 0 and exact_match
        if max_skills > 0:
            total_score /= max_skills

        return min(total_score, self.config['skill_scoring']['exact_match'])  # Cap at max score

    def _is_design_tool_match(self, candidate_skill: str, internship_skill: str) -> bool:
        """Check for design tool matches using semantic similarity."""
        design_tools = {
            'photoshop': ['photoshop', 'adobe photoshop', 'ps', 'photoshop cc'],
            'figma': ['figma', 'figma design', 'ui design'],
            'illustrator': ['illustrator', 'adobe illustrator', 'ai'],
            'premiere': ['premiere', 'premiere pro', 'adobe premiere'],
            'after effects': ['after effects', 'ae', 'motion graphics'],
            'indesign': ['indesign', 'adobe indesign'],
            'sketch': ['sketch', 'sketch app'],
            'xd': ['xd', 'adobe xd', 'experience design'],
            'canva': ['canva', 'canva design'],
            'video editing': ['video editing', 'video production', 'editing', 'post production']
        }

        candidate_lower = candidate_skill.lower()
        internship_lower = internship_skill.lower()

        # Check if candidate skill maps to any design tool category
        for tool, variations in design_tools.items():
            if candidate_lower in variations:
                # Check if internship skill is related to any variation
                if any(var in internship_lower for var in variations):
                    return True
                # Also check for general design terms
                if any(term in internship_lower for term in ['design', 'creative', 'graphic', 'ui', 'ux']):
                    return True

        return False

    def get_skill_domain(self, skill: str) -> str:
        """Get the domain category for a given skill."""
        skill_lower = skill.lower()
        taxonomy = self.config['skill_taxonomy']

        for domain, skills in taxonomy['domains'].items():
            if skill_lower in [s.lower() for s in skills]:
                return domain

        return 'unknown'

    def are_domains_compatible(self, candidate_domain: str, internship_domain: str) -> float:
        """Check if two skill domains are compatible and return compatibility score."""
        if candidate_domain == internship_domain:
            return 1.0  # Same domain - perfect match

        taxonomy = self.config['skill_taxonomy']
        domain_compat = taxonomy.get('domain_compatibility', {})

        compatible_domains = domain_compat.get(candidate_domain, [])
        if internship_domain in compatible_domains:
            return 0.7  # Cross-domain but compatible

        return 0.0  # Not compatible

    def calculate_domain_aligned_skill_score(self, candidate_skills: List[str], internship_skills: str) -> Tuple[float, Dict[str, Any]]:
        """Calculate skill score with domain alignment and taxonomy awareness."""
        if not candidate_skills or pd.isna(internship_skills):
            return 0.0, {"matched_skills": [], "domain_matches": [], "skill_gaps": []}

        skill_config = self.config['skill_scoring']
        internship_skill_list = [skill.strip().lower() for skill in internship_skills.split(',')]

        total_score = 0.0
        matched_skills = []
        domain_matches = []
        skill_gaps = []

        # Analyze candidate skills by domain
        candidate_domains = {}
        for skill in candidate_skills:
            domain = self.get_skill_domain(skill)
            if domain not in candidate_domains:
                candidate_domains[domain] = []
            candidate_domains[domain].append(skill.lower())

        # Analyze internship requirements by domain
        internship_domains = {}
        for skill in internship_skill_list:
            domain = self.get_skill_domain(skill)
            if domain not in internship_domains:
                internship_domains[domain] = []
            internship_domains[domain].append(skill)

        # Calculate domain-aligned scores
        max_skills = min(len(candidate_skills), skill_config['max_skills'])

        for candidate_skill in candidate_skills[:max_skills]:
            candidate_skill_lower = candidate_skill.lower()
            candidate_domain = self.get_skill_domain(candidate_skill)
            best_score = 0.0
            best_match = None

            for internship_skill in internship_skill_list:
                internship_domain = self.get_skill_domain(internship_skill)

                # Exact match gets highest score
                if candidate_skill_lower == internship_skill:
                    best_score = skill_config['exact_match']
                    best_match = internship_skill
                    matched_skills.append(candidate_skill)
                    domain_matches.append({
                        'skill': candidate_skill,
                        'match_type': 'exact',
                        'domain': candidate_domain
                    })
                    break

                # Domain-aligned match
                elif candidate_domain == internship_domain:
                    if candidate_skill_lower in internship_skill or internship_skill in candidate_skill_lower:
                        best_score = skill_config['domain_match']
                        best_match = internship_skill
                        matched_skills.append(candidate_skill)
                        domain_matches.append({
                            'skill': candidate_skill,
                            'match_type': 'domain_match',
                            'domain': candidate_domain
                        })
                        break

                # Cross-domain compatible match
                elif self.are_domains_compatible(candidate_domain, internship_domain) > 0:
                    if candidate_skill_lower in internship_skill or internship_skill in candidate_skill_lower:
                        compatibility_score = self.are_domains_compatible(candidate_domain, internship_domain)
                        best_score = skill_config['cross_domain'] * compatibility_score
                        best_match = internship_skill
                        matched_skills.append(candidate_skill)
                        domain_matches.append({
                            'skill': candidate_skill,
                            'match_type': 'cross_domain',
                            'domain': candidate_domain,
                            'target_domain': internship_domain
                        })
                        break

            if best_score < skill_config['min_skill_threshold']:
                skill_gaps.append({
                    'skill': candidate_skill,
                    'domain': candidate_domain,
                    'suggested_matches': [s for s in internship_skill_list if self.get_skill_domain(s) == candidate_domain]
                })

            total_score += best_score

        # Normalize by number of skills considered
        if max_skills > 0:
            total_score /= max_skills

        return min(total_score, skill_config['exact_match']), {
            "matched_skills": matched_skills,
            "domain_matches": domain_matches,
            "skill_gaps": skill_gaps
        }

    def _get_matched_skills(self, candidate_skills: List[str], internship_skills: str) -> List[str]:
        """Get list of skills that matched between candidate and internship."""
        if not candidate_skills or pd.isna(internship_skills):
            return []

        internship_skill_list = [skill.strip().lower() for skill in internship_skills.split(',')]
        matched_skills = []

        for candidate_skill in candidate_skills:
            candidate_skill_lower = candidate_skill.lower()

            # Check for exact match first
            if candidate_skill_lower in internship_skill_list:
                matched_skills.append(candidate_skill)
                continue

            # Check for partial matches
            for internship_skill in internship_skill_list:
                similarity = SequenceMatcher(None, candidate_skill_lower, internship_skill).ratio()
                if similarity > 0.7:
                    matched_skills.append(candidate_skill)
                    break

                # Check design tool matches
                if self._is_design_tool_match(candidate_skill_lower, internship_skill):
                    matched_skills.append(candidate_skill)
                    break

        return matched_skills[:5]  # Limit to top 5 matches

    def _get_matched_sectors(self, candidate_sectors: List[str], internship_sectors: str) -> List[str]:
        """Get list of sectors that matched between candidate and internship."""
        if not candidate_sectors or pd.isna(internship_sectors):
            return []

        internship_sector_list = [sector.strip().lower() for sector in internship_sectors.split(',')]
        matched_sectors = []

        for candidate_sector in candidate_sectors:
            candidate_sector_lower = candidate_sector.lower()

            for internship_sector in internship_sector_list:
                if (candidate_sector_lower in internship_sector or
                    internship_sector in candidate_sector_lower):
                    matched_sectors.append(candidate_sector)
                    break

        return matched_sectors

    def calculate_qualification_fit_score(self, candidate_education: str, required_qualification: str,
                                         candidate_experience: int = 0) -> Tuple[float, str]:
        """Calculate qualification fit score with strict filtering and experience consideration."""
        if not candidate_education or pd.isna(required_qualification):
            return 0.5, "qualification_unknown"

        qual_levels = self.config['qualification_levels']
        qual_compat = self.config['qualification_compatibility']
        qual_filter = self.config['qualification_filtering']

        candidate_level = qual_levels.get(candidate_education.lower(), 0)
        required_level = qual_levels.get(required_qualification.lower(), 0)

        # Strict qualification filtering
        if qual_filter['strict_mode']:
            level_diff = candidate_level - required_level

            # Don't recommend higher positions to underqualified candidates
            if level_diff < 0 and not qual_filter['allow_lower_qual']:
                return 0.0, "underqualified"

            # Don't recommend lower positions to overqualified candidates (unless experience override)
            if level_diff > 0 and not qual_filter['allow_higher_qual']:
                if not (qual_filter['experience_override'] and candidate_experience >= 2):
                    return 0.0, "overqualified"

        # Calculate compatibility score
        if candidate_level == required_level:
            score = qual_compat['exact'] * qual_filter['exact_match_bonus']
            reason = "exact_match"
        elif candidate_level > required_level:
            score = qual_compat['higher']
            reason = "higher_qualification"
        else:
            score = qual_compat['lower']
            reason = "lower_qualification"

        # Experience compensation for qualification gaps
        if qual_filter['experience_override'] and abs(candidate_level - required_level) > 0:
            experience_bonus = min(candidate_experience * 0.1, 0.3)  # Max 30% bonus
            score = min(score + experience_bonus, 1.0)

        return score, reason

    def calculate_experience_compatibility_score(self, candidate_experience: int,
                                                internship_experience_req: str = None) -> Tuple[float, str]:
        """Calculate experience compatibility score."""
        if candidate_experience is None:
            candidate_experience = 0

        exp_levels = self.config['experience_levels']
        exp_compat = self.config['experience_compatibility']

        # Map years of experience to experience level
        if candidate_experience <= 1:
            candidate_level = exp_levels['beginner']
        elif candidate_experience <= 3:
            candidate_level = exp_levels['intermediate']
        elif candidate_experience <= 5:
            candidate_level = exp_levels['advanced']
        else:
            candidate_level = exp_levels['expert']

        # Parse internship experience requirements
        if pd.isna(internship_experience_req) or not internship_experience_req:
            # No specific experience requirement - assume beginner friendly
            required_level = exp_levels['beginner']
            score = exp_compat['exact'] * exp_compat['beginner_boost']
            reason = "beginner_friendly"
        else:
            exp_req_lower = internship_experience_req.lower()

            # Map text requirements to levels
            if any(word in exp_req_lower for word in ['fresher', 'beginner', 'entry', 'no experience']):
                required_level = exp_levels['beginner']
            elif any(word in exp_req_lower for word in ['1-3', 'intermediate', 'some experience']):
                required_level = exp_levels['intermediate']
            elif any(word in exp_req_lower for word in ['3-5', 'advanced', 'experienced']):
                required_level = exp_levels['advanced']
            else:
                required_level = exp_levels['expert']

            # Calculate compatibility
            level_diff = candidate_level - required_level

            if level_diff == 0:
                score = exp_compat['exact']
                reason = "experience_match"
            elif level_diff > 0:
                score = exp_compat['higher']
                reason = "more_experienced"
            else:
                score = exp_compat['lower']
                reason = "less_experienced"

        return score, reason

    def calculate_diversity_score(self, internship: pd.Series, current_recommendations: List[Dict[str, Any]]) -> float:
        """Calculate diversity score based on current recommendations."""
        diversity_config = self.config['diversity']
        scoring_weights = self.config['scoring_weights']

        if not current_recommendations:
            return scoring_weights['diversity_bonus']  # Full bonus for first recommendation

        # Count current recommendations by different dimensions
        sector_counts = {}
        location_counts = {}
        organization_counts = {}
        stipend_ranges = []

        for rec in current_recommendations:
            sector = rec.get('sector_tags', '').lower()
            location = rec.get('location', {}).get('city', '').lower()
            org = rec.get('organization', '').lower()
            stipend = rec.get('stipend', '')

            sector_counts[sector] = sector_counts.get(sector, 0) + 1
            location_counts[location] = location_counts.get(location, 0) + 1
            organization_counts[org] = organization_counts.get(org, 0) + 1

            if stipend:
                stipend_ranges.append(self._parse_stipend_range(stipend))

        # Calculate diversity penalties
        diversity_penalty = 0.0

        # Sector diversity
        current_sector = internship.get('sector_tags', '').lower()
        sector_count = sector_counts.get(current_sector, 0)
        if sector_count >= diversity_config['max_same_sector']:
            diversity_penalty += diversity_config['sector_diversity_weight']

        # Location diversity
        current_location = internship.get('location_city', '').lower()
        location_count = location_counts.get(current_location, 0)
        if location_count >= diversity_config['max_same_location']:
            diversity_penalty += diversity_config['location_diversity_weight']

        # Organization diversity
        current_org = internship.get('organization', '').lower()
        org_count = organization_counts.get(current_org, 0)
        if org_count >= diversity_config['max_same_org']:
            diversity_penalty += diversity_config['organization_diversity_weight']

        # Stipend range diversity (encourage variety in compensation)
        current_stipend = self._parse_stipend_range(internship.get('stipend', ''))
        if current_stipend and stipend_ranges:
            stipend_similarity = 0
            for stipend_range in stipend_ranges:
                if stipend_range and current_stipend:
                    # Check for overlap
                    if (current_stipend[0] <= stipend_range[1] and current_stipend[1] >= stipend_range[0]):
                        stipend_similarity += 1

            if stipend_similarity / len(stipend_ranges) > 0.7:  # Too similar stipends
                diversity_penalty += diversity_config['stipend_range_diversity']

        # Return diversity bonus (inverse of penalty)
        return max(0, scoring_weights['diversity_bonus'] - diversity_penalty)

    def apply_fairness_constraints(self, recommendations: List[Dict[str, Any]], candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Apply fairness constraints to ensure equitable recommendations."""
        if not recommendations:
            return recommendations

        # Ensure representation across different dimensions
        filtered_recs = []

        # Group by key dimensions
        by_sector = {}
        by_location = {}
        by_qualification_level = {}

        for rec in recommendations:
            sector = rec.get('sector_tags', '').lower()
            location = rec.get('location', {}).get('city', '').lower()
            qual_req = rec.get('eligibility_min_qualification', '').lower()

            if sector not in by_sector:
                by_sector[sector] = []
            if location not in by_location:
                by_location[location] = []
            if qual_req not in by_qualification_level:
                by_qualification_level[qual_req] = []

            by_sector[sector].append(rec)
            by_location[location].append(rec)
            by_qualification_level[qual_req].append(rec)

        # Select diverse recommendations
        diversity_config = self.config['diversity']
        selected = []

        # Ensure maximum diversity by taking top from each category
        for sector_recs in by_sector.values():
            sector_recs.sort(key=lambda x: x.get('final_score', 0), reverse=True)
            selected.extend(sector_recs[:diversity_config['max_same_sector']])

        # Remove duplicates and ensure we don't exceed limits
        seen_ids = set()
        final_recs = []

        for rec in selected:
            rec_id = rec.get('internship_id', '')
            if rec_id not in seen_ids:
                final_recs.append(rec)
                seen_ids.add(rec_id)

        return final_recs[:len(recommendations)]  # Maintain original count

    def assess_profile_completeness(self, candidate: Dict[str, Any]) -> float:
        """Assess how complete a candidate profile is for personalized recommendations."""
        required_fields = ['skills', 'education_level', 'preferred_sectors']
        optional_fields = ['preferred_locations', 'years_of_experience', 'stipend_pref', 'career_goal']

        completeness_score = 0.0
        total_weight = 0.0

        # Check required fields (higher weight)
        for field in required_fields:
            if candidate.get(field):
                if field == 'skills' and len(candidate[field]) > 0:
                    completeness_score += 1.0
                elif field in ['education_level', 'preferred_sectors'] and candidate[field]:
                    completeness_score += 1.0
            total_weight += 1.0

        # Check optional fields (lower weight)
        for field in optional_fields:
            if candidate.get(field):
                completeness_score += 0.5
            total_weight += 0.5

        return completeness_score / total_weight if total_weight > 0 else 0.0

    def get_content_based_bootstrap_recommendations(self, candidate: Dict[str, Any], top_k: int = 10) -> List[Dict[str, Any]]:
        """Provide content-based recommendations for cold start scenarios."""
        logger.info("Using content-based bootstrap for cold start scenario")

        # Filter internships based on basic criteria
        filtered_internships = []

        for idx, internship in self.internships_df.iterrows():
            # Basic qualification check (relaxed for cold start)
            qual_filter = self.config['qualification_filtering']
            candidate_education = candidate.get('education_level', '')
            required_qual = internship.get('eligibility_min_qualification', '')

            if candidate_education and required_qual:
                qual_levels = self.config['qualification_levels']
                candidate_level = qual_levels.get(candidate_education.lower(), 0)
                required_level = qual_levels.get(required_qual.lower(), 0)

                # Allow some flexibility for cold start
                if candidate_level < required_level - 1:  # Only skip if significantly underqualified
                    continue

            # Basic skill matching (relaxed)
            candidate_skills = candidate.get('skills', [])
            internship_skills = internship.get('preferred_skills', '')

            if candidate_skills and internship_skills:
                skill_match = False
                for skill in candidate_skills:
                    if skill.lower() in internship_skills.lower():
                        skill_match = True
                        break
                if not skill_match:
                    continue

            filtered_internships.append((idx, internship))

        # Score and rank filtered internships
        scored_recommendations = []
        for idx, internship in filtered_internships[:50]:  # Limit for performance
            # Simple scoring for cold start
            score = 0.5  # Base score

            # Boost for preferred sectors
            candidate_sectors = candidate.get('preferred_sectors', [])
            internship_sectors = internship.get('sector_tags', '')
            if candidate_sectors and internship_sectors:
                for sector in candidate_sectors:
                    if sector.lower() in internship_sectors.lower():
                        score += 0.2
                        break

            # Boost for location match
            candidate_locations = candidate.get('preferred_locations', [])
            internship_city = internship.get('location_city', '')
            if candidate_locations and internship_city:
                for location in candidate_locations:
                    if location.lower() in internship_city.lower():
                        score += 0.2
                        break

            scored_recommendations.append((score, idx, internship))

        # Sort by score and return top recommendations
        scored_recommendations.sort(key=lambda x: x[0], reverse=True)

        recommendations = []
        for score, idx, internship in scored_recommendations[:top_k]:
            recommendation = self._create_recommendation_dict(internship, score, candidate, {})
            recommendations.append(recommendation)

        return recommendations

    def _create_recommendation_dict(self, internship: pd.Series, score: float,
                                   candidate: Dict[str, Any], components: Dict[str, Any]) -> Dict[str, Any]:
        """Create a standardized recommendation dictionary."""
        return {
            'internship_id': str(internship.get('internship_id', '')),
            'title': str(internship.get('title', '')),
            'organization': str(internship.get('organization', '')),
            'score': float(round(score, 3)),
            'match_reasons': self.generate_match_reasons(components, internship, candidate),
            'explain_text': self.generate_explanation_text(internship, components, candidate),
            'scoring_breakdown': self.generate_detailed_scoring_breakdown(components),
            'location': {
                'city': str(internship.get('location_city', '')),
                'district': str(internship.get('location_district', '')),
                'state': str(internship.get('location_state', ''))
            },
            'stipend': str(internship.get('stipend', '')),
            'duration_weeks': int(internship.get('duration_weeks', 0)),
            'remote_allowed': str(internship.get('remote_allowed', '')) == 'yes',
            'application_deadline': str(internship.get('application_deadline', '')),
            'url': str(internship.get('url', '')),
            'posted_date': str(internship.get('posted_date', '')),
            'sector_tags': str(internship.get('sector_tags', '')),
            'description': str(internship.get('description', '')),
            'final_score': float(score)
        }

    def calculate_location_match_score(self, candidate: Dict[str, Any], internship: pd.Series) -> float:
        """Calculate location match score with remote preference filtering."""
        location_scores = self.config['location_scoring']

        candidate_locations = candidate.get('preferred_locations', [])
        candidate_remote_ok = candidate.get('remote_ok', False)

        internship_city = internship.get('location_city', '').lower()
        internship_district = internship.get('location_district', '').lower()
        internship_state = internship.get('location_state', '').lower()
        internship_remote = internship.get('remote_allowed') == 'yes'

        # If candidate doesn't want remote work, only consider location matches
        if not candidate_remote_ok:
            # If no location preferences specified, give very low score
            if not candidate_locations:
                return 0.1  # Very low score since they don't want remote and didn't specify locations

            best_score = 0.0
            found_location_match = False

            # Check for location matches only (no remote fallback)
            for candidate_location in candidate_locations:
                candidate_loc_lower = candidate_location.lower()

                # Exact city match
                if candidate_loc_lower == internship_city:
                    best_score = max(best_score, location_scores['exact_city'])
                    found_location_match = True
                # District match
                elif candidate_loc_lower == internship_district:
                    best_score = max(best_score, location_scores['same_district'])
                    found_location_match = True
                # State match
                elif candidate_loc_lower == internship_state:
                    best_score = max(best_score, location_scores['same_state'])
                    found_location_match = True

            # If no location match found, give very low score (don't recommend)
            if not found_location_match:
                best_score = 0.1  # Very low score to discourage recommendation

            return best_score

        # Candidate is OK with remote work
        # If no location preferences specified, remote is always OK
        if not candidate_locations:
            if internship_remote:
                return location_scores['remote_allowed']
            return 0.5  # Neutral score - not remote but they didn't specify locations

        best_score = 0.0
        found_location_match = False

        # Check for location matches first
        for candidate_location in candidate_locations:
            candidate_loc_lower = candidate_location.lower()

            # Exact city match
            if candidate_loc_lower == internship_city:
                best_score = max(best_score, location_scores['exact_city'])
                found_location_match = True
            # District match
            elif candidate_loc_lower == internship_district:
                best_score = max(best_score, location_scores['same_district'])
                found_location_match = True
            # State match
            elif candidate_loc_lower == internship_state:
                best_score = max(best_score, location_scores['same_state'])
                found_location_match = True

        # If no location match found, check remote option
        if not found_location_match and internship_remote:
            best_score = location_scores['no_match_remote_ok']

        # If still no match and remote not available
        if best_score == 0.0:
            best_score = location_scores['different_state']

        return best_score

    def calculate_sector_relevance_score(self, candidate_sectors: List[str], internship_sectors: str) -> float:
        """Calculate sector relevance score."""
        if not candidate_sectors or pd.isna(internship_sectors):
            return 0.5  # Neutral score

        # Parse internship sectors (comma-separated)
        internship_sector_list = [sector.strip().lower() for sector in internship_sectors.split(',')]

        matches = 0
        for candidate_sector in candidate_sectors:
            candidate_sector_lower = candidate_sector.lower()

            # Check for exact or partial matches
            for internship_sector in internship_sector_list:
                if (candidate_sector_lower in internship_sector or
                    internship_sector in candidate_sector_lower):
                    matches += 1
                    break

        # Return score based on match ratio
        if len(candidate_sectors) > 0:
            match_ratio = matches / len(candidate_sectors)
            return match_ratio  # 0.0 to 1.0

        return 0.5

    def calculate_stipend_match_score(self, candidate_stipend_pref: str, internship_stipend: str) -> float:
        """Calculate stipend match score."""
        if not candidate_stipend_pref or pd.isna(internship_stipend) or internship_stipend == '0':
            return self.config['stipend_scoring']['no_preference']

        stipend_scores = self.config['stipend_scoring']

        # Parse stipend ranges
        candidate_range = self._parse_stipend_range(candidate_stipend_pref)
        internship_range = self._parse_stipend_range(internship_stipend)

        if not candidate_range or not internship_range:
            return stipend_scores['no_preference']

        # Check for overlap
        if (candidate_range[0] <= internship_range[1] and candidate_range[1] >= internship_range[0]):
            return stipend_scores['within_range']

        return 0.3  # Partial match

    def _parse_stipend_range(self, stipend_str) -> Optional[Tuple[int, int]]:
        """Parse stipend string into a range (min, max)."""
        # Convert to string if it's a numpy type or other numeric type
        if hasattr(stipend_str, 'item'):  # numpy types have .item() method
            stipend_str = str(stipend_str.item())
        else:
            stipend_str = str(stipend_str)

        if pd.isna(stipend_str) or stipend_str == '0' or stipend_str.strip() == '':
            return None

        # Handle ranges like "5000-8000"
        if '-' in stipend_str:
            parts = stipend_str.split('-')
            try:
                min_val = int(parts[0].strip())
                max_val = int(parts[1].strip())
                return (min_val, max_val)
            except ValueError:
                return None

        # Handle single values
        try:
            value = int(stipend_str.strip())
            return (value, value)
        except ValueError:
            return None

    def calculate_recency_score(self, posted_date: str) -> float:
        """Calculate recency score based on posting date."""
        if pd.isna(posted_date):
            return 0.5  # Neutral score

        try:
            posted = datetime.strptime(posted_date, '%Y-%m-%d')
            days_since = (datetime.now() - posted).days

            recency_config = self.config['recency_scoring']

            if days_since <= 7:
                return recency_config['very_recent']
            elif days_since <= 30:
                return recency_config['recent']
            elif days_since <= 90:
                return recency_config['moderate']
            else:
                return recency_config['old']
        except ValueError:
            return 0.5

    def calculate_combined_score(self, embedding_score: float, internship: pd.Series,
                                candidate: Dict[str, Any], current_recommendations: List[Dict[str, Any]] = None) -> Tuple[float, Dict[str, Any]]:
        """Calculate combined score with enhanced rule-based features."""
        weights = self.config['scoring_weights'].copy()  # Create a copy to modify

        # Adjust location weight based on remote preference
        candidate_remote_ok = candidate.get('remote_ok', False)
        candidate_locations = candidate.get('preferred_locations', [])

        if not candidate_remote_ok and candidate_locations:
            # If user doesn't want remote and has location preferences, boost location importance
            weights['location_match'] = min(weights['location_match'] * 2.0, 0.8)  # Double weight, max 80%
            # Reduce other weights proportionally to keep total around 1.0
            other_weights_total = sum(v for k, v in weights.items() if k != 'location_match')
            reduction_factor = (1.0 - weights['location_match']) / other_weights_total
            for k in weights:
                if k != 'location_match':
                    weights[k] *= reduction_factor

        # Normalize embedding score (FAISS returns inner product, higher is better)
        # Use a more appropriate normalization based on observed score ranges
        # Scores typically range from ~0.8 to 1.1 for this dataset
        normalized_embedding = (embedding_score - 0.8) / 0.3  # Normalize to 0-1 range
        normalized_embedding = max(0.0, min(1.0, normalized_embedding))  # Clamp to [0,1]

        # Calculate individual component scores with enhanced methods
        # Use domain-aligned skill scoring
        skill_score, skill_details = self.calculate_domain_aligned_skill_score(
            candidate.get('skills', []),
            internship.get('preferred_skills', '')
        )

        # Use enhanced qualification fit with experience consideration
        candidate_experience = candidate.get('years_of_experience', 0)
        qual_score, qual_reason = self.calculate_qualification_fit_score(
            candidate.get('education_level', ''),
            internship.get('eligibility_min_qualification', ''),
            candidate_experience
        )

        # Calculate experience compatibility
        exp_score, exp_reason = self.calculate_experience_compatibility_score(
            candidate_experience,
            internship.get('experience_required', None)
        )

        location_score = self.calculate_location_match_score(candidate, internship)

        sector_score = self.calculate_sector_relevance_score(
            candidate.get('preferred_sectors', []),
            internship.get('sector_tags', '')
        )

        stipend_score = self.calculate_stipend_match_score(
            candidate.get('stipend_pref', ''),
            internship.get('stipend', '')
        )

        recency_score = self.calculate_recency_score(internship.get('posted_date', ''))

        # Calculate diversity score
        diversity_score = self.calculate_diversity_score(internship, current_recommendations or [])

        # Calculate weighted sum with new components
        final_score = (
            weights['embedding_similarity'] * normalized_embedding +
            weights['skill_overlap'] * (skill_score / self.config['skill_scoring']['exact_match']) +
            weights['qualification_fit'] * qual_score +
            weights['experience_compatibility'] * exp_score +
            weights['location_match'] * location_score +
            weights['sector_relevance'] * sector_score +
            weights['stipend_match'] * stipend_score +
            weights['recency'] * recency_score +
            weights['diversity_bonus'] * diversity_score
        )

        # Enhanced component details for explanations
        components = {
            'embedding_similarity': normalized_embedding,
            'skill_overlap': skill_score,
            'qualification_fit': qual_score,
            'experience_compatibility': exp_score,
            'location_match': location_score,
            'sector_relevance': sector_score,
            'stipend_match': stipend_score,
            'recency': recency_score,
            'diversity_bonus': diversity_score,
            'skill_details': skill_details,
            'qualification_reason': qual_reason,
            'experience_reason': exp_reason
        }

        return final_score, components

    def generate_match_reasons(self, components: Dict[str, Any], internship: pd.Series, candidate: Dict[str, Any]) -> List[str]:
        """Generate enhanced human-readable match reasons with domain awareness."""
        reasons = []

        # Skills - Always show matched skills if there are any matches
        skill_details = components.get('skill_details', {})
        matched_skills = skill_details.get('matched_skills', [])
        domain_matches = skill_details.get('domain_matches', [])

        if matched_skills:
            reasons.append(f"Skills matched: {', '.join(matched_skills[:3])}")

        # Add domain alignment information if available
        if domain_matches:
            domain_info = []
            for match in domain_matches[:2]:
                match_type = match.get('match_type', 'match')
                domain = match.get('domain', 'general')
                if match_type == 'cross_domain':
                    target_domain = match.get('target_domain', 'other')
                    domain_info.append(f"{domain} → {target_domain}")
                else:
                    domain_info.append(f"{domain} skills")

            if domain_info:
                reasons.append(f"Domain alignment: {', '.join(domain_info)}")

        # Show skill compatibility score if there's any skill overlap
        if components.get('skill_overlap', 0) > 0:
            reasons.append(f"Skill compatibility: {components['skill_overlap']:.1f}/3.0")

        # Qualification - Always show education match information
        qual_reason = components.get('qualification_reason', 'qualification_fit')
        qual_mapping = {
            0.3: 'basic fit',
            0.8: 'good fit',
            1.0: 'perfect fit',
            'exact_match': 'exact match',
            'higher_qualification': 'higher qualification',
            'lower_qualification': 'lower qualification',
            'underqualified': 'underqualified',
            'overqualified': 'overqualified'
        }

        fit_level = qual_mapping.get(qual_reason, qual_mapping.get(components['qualification_fit'], 'partial fit'))
        candidate_qual = candidate.get('education_level', 'unknown')
        required_qual = internship.get('eligibility_min_qualification', 'unknown')

        if qual_reason in ['underqualified', 'overqualified']:
            reasons.append(f"⚠️ Qualification: {fit_level} ({candidate_qual} vs required {required_qual})")
        else:
            reasons.append(f"Education: {fit_level} ({candidate_qual} → {required_qual})")

        # Experience compatibility
        if components.get('experience_compatibility', 0) > 0:
            exp_reason = components.get('experience_reason', 'experience_match')
            exp_mapping = {
                'beginner_friendly': 'beginner friendly',
                'experience_match': 'experience level matches',
                'more_experienced': 'more experienced than required',
                'less_experienced': 'less experienced (learning opportunity)'
            }
            exp_level = exp_mapping.get(exp_reason, 'experience compatible')
            reasons.append(f"Experience: {exp_level}")

        # Location - Only show if there's a meaningful match
        location_score = components.get('location_match', 0)
        if location_score > 0.5:  # Only show for good matches
            location_mapping = {
                0.3: 'different state',
                0.7: 'same state', 
                0.9: 'same district',
                1.0: 'same city',
                0.8: 'remote available',
                0.6: 'remote option available',
                0.4: 'flexible remote work'
            }
            location_match = location_mapping.get(location_score, 'location match')
            reasons.append(f"Location: {location_match}")
        elif location_score > 0 and location_score <= 0.5:
            # For low scores, show a warning that location doesn't match well
            reasons.append(f"⚠️ Location: Not in preferred area")

        # Sector Relevance
        if components.get('sector_relevance', 0) > 0:
            candidate_sectors = candidate.get('preferred_sectors', [])
            internship_sectors = internship.get('sector_tags', '')
            if candidate_sectors and internship_sectors:
                matched_sectors = self._get_matched_sectors(candidate_sectors, internship_sectors)
                if matched_sectors:
                    reasons.append(f"Sectors: {', '.join(matched_sectors[:2])}")

        # Diversity bonus
        if components.get('diversity_bonus', 0) > 0:
            reasons.append(f"Diversity: Provides variety in opportunities")

        # Stipend
        if components.get('stipend_match', 0) > 0.5:
            candidate_stipend = candidate.get('stipend_pref', 'any')
            internship_stipend = internship.get('stipend', 'not specified')
            reasons.append(f"Compensation: {candidate_stipend} (offered: {internship_stipend})")

        return reasons

    def generate_explanation_text(self, internship: pd.Series, components: Dict[str, float], candidate: Dict[str, Any]) -> str:
        """Generate a human-readable explanation."""
        explanations = []

        title = internship.get('title', 'Internship')
        org = internship.get('organization', 'Organization')

        explanations.append(f"This {title} position at {org} is recommended because:")

        # Skills explanation - Always show if there are matched skills
        matched_skills = self._get_matched_skills(candidate.get('skills', []), internship.get('preferred_skills', ''))
        if matched_skills:
            skill_text = ', '.join(matched_skills[:3])
            explanations.append(f"- Your skills ({skill_text}) match the job requirements")
        elif components.get('skill_overlap', 0) > 0:
            explanations.append(f"- Your technical skills align well with the role requirements")

        # Qualification explanation - Always show education information
        candidate_qual = candidate.get('education_level', 'your education')
        required_qual = internship.get('eligibility_min_qualification', 'unknown')
        qual_fit = components.get('qualification_fit', 0)
        
        if qual_fit >= 0.8:
            explanations.append(f"- Your {candidate_qual} qualification is an excellent match for this position")
        elif qual_fit >= 0.3:
            explanations.append(f"- Your {candidate_qual} qualification meets the requirements (position requires {required_qual})")
        else:
            explanations.append(f"- Your {candidate_qual} qualification is compatible with this {required_qual} position")

        # Location explanation
        if components['location_match'] >= 0.9:
            city = internship.get('location_city', '')
            explanations.append(f"- The location ({city}) perfectly matches your preferences")
        elif components['location_match'] >= 0.7:
            state = internship.get('location_state', '')
            explanations.append(f"- The location is in {state}, which aligns with your preferences")
        elif components['location_match'] >= 0.4:
            explanations.append(f"- Remote work options make this accessible from your location")

        # Sector explanation
        if components['sector_relevance'] > 0:
            matched_sectors = self._get_matched_sectors(candidate.get('preferred_sectors', []), internship.get('sector_tags', ''))
            if matched_sectors:
                sector_text = ', '.join(matched_sectors[:2])
                explanations.append(f"- The role is in {sector_text}, matching your career interests")

        # Overall profile match
        if components['embedding_similarity'] > 0.7:
            explanations.append(f"- Your overall profile and career goals align exceptionally well with this opportunity")

        if not explanations[1:]:  # Only the title
            explanations.append("- It matches your general profile characteristics and interests")

        return " ".join(explanations)

    def generate_detailed_scoring_breakdown(self, components: Dict[str, Any]) -> Dict[str, Any]:
        """Generate detailed scoring breakdown for transparency."""
        weights = self.config['scoring_weights']

        # Only use components that have corresponding weights
        weighted_components = {k: v for k, v in components.items()
                             if k in weights and isinstance(v, (int, float))}

        overall_score = float(sum(weighted_components[comp] * weights[comp]
                                 for comp in weighted_components.keys()))
        breakdown = {
            'overall_score': overall_score,
            'component_scores': {},
            'weights_used': {k: float(v) for k, v in weights.items()},
            'recommendation_strength': 'Low'
        }

        # Calculate weighted contribution of each component
        for component, score in weighted_components.items():
            weight = float(weights[component])
            contribution = float(score * weight)
            percentage = float((contribution / breakdown['overall_score']) * 100 if breakdown['overall_score'] > 0 else 0)

            breakdown['component_scores'][component] = {
                'raw_score': float(score),
                'weight': weight,
                'contribution': contribution,
                'percentage': float(round(percentage, 1))
            }

        # Determine recommendation strength
        overall_score = breakdown['overall_score']
        if overall_score >= 0.8:
            breakdown['recommendation_strength'] = 'Excellent'
        elif overall_score >= 0.6:
            breakdown['recommendation_strength'] = 'Very Good'
        elif overall_score >= 0.4:
            breakdown['recommendation_strength'] = 'Good'
        elif overall_score >= 0.2:
            breakdown['recommendation_strength'] = 'Fair'
        else:
            breakdown['recommendation_strength'] = 'Low'

        return breakdown

    def recommend(self, candidate: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Enhanced main recommendation method with cold start handling and diversity."""
        logger.info("Generating enhanced recommendations for candidate...")

        # Assess profile completeness for cold start decision
        profile_completeness = self.assess_profile_completeness(candidate)
        cold_start_config = self.config['cold_start']

        # Cold start handling
        if profile_completeness < cold_start_config['profile_bootstrap_threshold']:
            logger.info(f"Profile completeness: {profile_completeness:.2f} - Using cold start approach")
            return self.get_content_based_bootstrap_recommendations(
                candidate, cold_start_config['default_recommendations']
            )

        # Standard recommendation pipeline for complete profiles
        # Create candidate profile text and embedding
        profile_text = self.create_candidate_profile_text(candidate)
        candidate_embedding = self.model.encode([profile_text])[0]

        # Retrieve similar internships (increased retrieval for better diversity)
        scores, indices = self.retrieve_similar_internships(candidate_embedding, self.config['top_k_final'])

        # Calculate combined scores with diversity consideration
        recommendations = []
        current_recommendations = []  # Track current recommendations for diversity scoring

        for score, idx in zip(scores, indices):
            if idx >= len(self.internships_df):
                continue

            internship = self.internships_df.iloc[idx]

            # Calculate combined score with diversity awareness
            final_score, components = self.calculate_combined_score(
                score, internship, candidate, current_recommendations
            )

            # Skip if qualification filtering eliminated this candidate
            if components.get('qualification_fit', 1.0) == 0.0:
                continue

            # Skip if location doesn't match and user doesn't want remote work
            candidate_remote_ok = candidate.get('remote_ok', False)
            candidate_locations = candidate.get('preferred_locations', [])
            location_score = components.get('location_match', 0)
            
            if not candidate_remote_ok and candidate_locations and location_score < 0.3:
                # User doesn't want remote and location doesn't match well - skip this recommendation
                continue

            recommendation = self._create_recommendation_dict(internship, final_score, candidate, components)
            recommendations.append(recommendation)
            current_recommendations.append(recommendation)

        # Sort by enhanced score
        recommendations.sort(key=lambda x: x['final_score'], reverse=True)

        # Apply diversity and fairness constraints
        diverse_recommendations = self.apply_fairness_constraints(recommendations, candidate)

        # Apply minimum threshold and limit results
        max_results = self.config['recommendation']['max_results']
        min_threshold = self.config['recommendation']['min_score_threshold']

        filtered_recommendations = [
            rec for rec in diverse_recommendations
            if rec['final_score'] >= min_threshold
        ][:max_results]

        # Add skill gap analysis for top recommendations
        if cold_start_config['skill_gap_analysis']:
            for rec in filtered_recommendations[:3]:  # Analyze top 3
                skill_details = rec.get('scoring_breakdown', {}).get('component_scores', {}).get('skill_details', {})
                skill_gaps = skill_details.get('skill_gaps', [])
                if skill_gaps:
                    rec['skill_development_opportunities'] = skill_gaps

        logger.info(f"Generated {len(filtered_recommendations)} enhanced recommendations")
        return filtered_recommendations

def main():
    """Test the enhanced recommendation engine."""
    engine = InternshipRecommendationEngine()

    # Enhanced sample candidate profile with new fields
    sample_candidate = {
        'education_level': 'ug',
        'major_field': 'Computer Science',
        'skills': ['python', 'javascript', 'data analysis'],
        'preferred_sectors': ['technology', 'research'],
        'preferred_locations': ['bangalore', 'karnataka'],
        'remote_ok': True,
        'years_of_experience': 1,  # New field for experience-aware scoring
        'availability_start': '2025-01-01',
        'duration_weeks_pref': 12,
        'stipend_pref': '10000-20000',
        'career_goal': 'Looking for data analysis and software development opportunities'
    }

    print("=== Enhanced Internship Recommendation Engine Test ===")
    print(f"Candidate Profile: {sample_candidate['education_level']} in {sample_candidate['major_field']}")
    print(f"Skills: {', '.join(sample_candidate['skills'])}")
    print(f"Experience: {sample_candidate['years_of_experience']} years")
    print(f"Sectors: {', '.join(sample_candidate['preferred_sectors'])}")
    print()

    recommendations = engine.recommend(sample_candidate)

    print(f"📊 Generated {len(recommendations)} recommendations")
    print()

    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. 🎯 {rec['title']}")
        print(f"   🏢 Organization: {rec['organization']}")
        print(f"   📍 Location: {rec['location']['city']}, {rec['location']['state']}")
        print(f"   💰 Stipend: {rec['stipend']}")
        print(f"   ⭐ Score: {rec['score']:.3f}")

        # Show scoring breakdown
        breakdown = rec.get('scoring_breakdown', {})
        if breakdown:
            strength = breakdown.get('recommendation_strength', 'Unknown')
            print(f"   📈 Recommendation Strength: {strength}")

        # Show match reasons
        reasons = rec.get('match_reasons', [])
        if reasons:
            print("   ✅ Match Reasons:")
            for reason in reasons[:4]:  # Show top 4 reasons
                print(f"      • {reason}")

        # Show skill development opportunities
        skill_gaps = rec.get('skill_development_opportunities', [])
        if skill_gaps:
            print("   🚀 Skill Development Opportunities:")
            for gap in skill_gaps[:2]:
                print(f"      • Learn {gap.get('skill', 'new skills')} ({gap.get('domain', 'general')} domain)")

        print(f"   🔗 Remote: {'Yes' if rec['remote_allowed'] else 'No'}")
        print()

if __name__ == '__main__':
    main()
