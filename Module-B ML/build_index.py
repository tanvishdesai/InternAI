#!/usr/bin/env python3
"""
Build Index Script for Internship Recommendation Engine

This script creates vector embeddings for internships and builds a FAISS index
for fast nearest-neighbor retrieval.
"""

import pandas as pd
import numpy as np
import pickle
import yaml
import os
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InternshipIndexer:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        """Initialize the indexer with a sentence transformer model."""
        self.model = SentenceTransformer(model_name)
        self.embeddings = None
        self.index = None
        self.internships_df = None

    def load_internships(self, csv_path: str) -> pd.DataFrame:
        """Load internships data from CSV."""
        logger.info(f"Loading internships from {csv_path}")
        df = pd.read_csv(csv_path)

        # Clean and preprocess data
        df = df.dropna(subset=['internship_id'])  # Remove rows without ID
        df = df[df['internship_id'].str.startswith('INT')]  # Only valid internship IDs

        logger.info(f"Loaded {len(df)} internships")
        return df

    def create_internship_text(self, row: pd.Series) -> str:
        """Create a comprehensive text representation for embedding."""
        text_parts = []

        # Title and organization
        text_parts.append(f"{row.get('title', '')} at {row.get('organization', '')}")

        # Preferred skills (most important for matching)
        if pd.notna(row.get('preferred_skills')):
            text_parts.append(f"Preferred skills: {row['preferred_skills']}")

        # Required qualifications
        if pd.notna(row.get('required_qualifications')):
            text_parts.append(f"Required qualifications: {row['required_qualifications']}")

        # Sector tags
        if pd.notna(row.get('sector_tags')):
            text_parts.append(f"Sectors: {row['sector_tags']}")

        # Core description (shortened)
        if pd.notna(row.get('description')):
            # Take first sentence or first 100 characters
            desc = row['description']
            if len(desc) > 100:
                desc = desc[:100] + "..."
            text_parts.append(desc)

        # Responsibilities (if different from description)
        if pd.notna(row.get('responsibilities')):
            resp = row['responsibilities']
            if len(resp) > 50:
                resp = resp[:50] + "..."
            text_parts.append(f"Responsibilities: {resp}")

        # Location information (prioritize city and state)
        location_parts = []
        if pd.notna(row.get('location_city')):
            location_parts.append(row['location_city'])
        if pd.notna(row.get('location_state')):
            location_parts.append(row['location_state'])
        if location_parts:
            text_parts.append(f"Location: {', '.join(location_parts)}")

        # Remote work info
        if row.get('remote_allowed') == 'yes':
            text_parts.append("Remote work allowed")

        # Duration and stipend
        duration_info = []
        if pd.notna(row.get('duration_weeks')):
            duration_info.append(f"Duration: {row['duration_weeks']} weeks")
        if pd.notna(row.get('stipend')) and row['stipend'] != '0':
            duration_info.append(f"Stipend: {row['stipend']}")
        if duration_info:
            text_parts.append('. '.join(duration_info))

        return '. '.join(text_parts)

    def create_embeddings(self, df: pd.DataFrame) -> np.ndarray:
        """Create embeddings for all internships."""
        logger.info("Creating embeddings for internships...")

        texts = []
        for _, row in df.iterrows():
            text = self.create_internship_text(row)
            texts.append(text)

        embeddings = self.model.encode(texts, show_progress_bar=True)
        logger.info(f"Created embeddings with shape: {embeddings.shape}")

        return embeddings

    def build_faiss_index(self, embeddings: np.ndarray, index_type: str = 'IndexIVFFlat'):
        """Build FAISS index for fast retrieval."""
        logger.info("Building FAISS index...")

        dimension = embeddings.shape[1]
        nlist = min(100, len(embeddings) // 39)  # Number of clusters

        if index_type == 'IndexIVFFlat':
            quantizer = faiss.IndexFlatIP(dimension)  # Inner product (cosine similarity)
            index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
        else:
            # Fallback to flat index for small datasets
            index = faiss.IndexFlatIP(dimension)

        # Train and add vectors
        if not index.is_trained:
            index.train(embeddings)
        index.add(embeddings)

        logger.info(f"Built FAISS index with {index.ntotal} vectors")
        return index

    def save_index(self, output_dir: str = 'models'):
        """Save the index and embeddings to disk."""
        os.makedirs(output_dir, exist_ok=True)

        # Save FAISS index
        faiss.write_index(self.index, os.path.join(output_dir, 'internship_index.faiss'))

        # Save embeddings
        with open(os.path.join(output_dir, 'internship_embeddings.pkl'), 'wb') as f:
            pickle.dump(self.embeddings, f)

        # Save internship data
        self.internships_df.to_pickle(os.path.join(output_dir, 'internships.pkl'))

        logger.info(f"Saved index and data to {output_dir}")

    def build_and_save(self, csv_path: str, output_dir: str = 'models'):
        """Main method to build and save the index."""
        # Load data
        self.internships_df = self.load_internships(csv_path)

        # Create embeddings
        self.embeddings = self.create_embeddings(self.internships_df)

        # Build FAISS index
        self.index = self.build_faiss_index(self.embeddings)

        # Save everything
        self.save_index(output_dir)

        return self.index, self.embeddings, self.internships_df

def main():
    """Main execution function."""
    indexer = InternshipIndexer()
    index, embeddings, df = indexer.build_and_save('internships.csv')

    print("Index built successfully!")
    print(f"Total internships indexed: {len(df)}")
    print(f"Embedding dimension: {embeddings.shape[1]}")

if __name__ == '__main__':
    main()
