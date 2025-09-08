#!/usr/bin/env python3
"""
Startup script for the ML Internship Recommendation Backend
"""

import os
import sys
import subprocess
import time

def check_requirements():
    """Check if required packages are installed"""
    try:
        import flask
        import sentence_transformers
        import torch
        import faiss
        print("✓ All required packages are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing required package: {e}")
        print("Installing requirements...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✓ Requirements installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("✗ Failed to install requirements")
            return False

def start_ml_backend():
    """Start the ML backend server"""
    print("Starting ML Internship Recommendation Backend...")

    # Set environment variables
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_ENV'] = 'development'

    try:
        # Import and run the Flask app
        from app import app, main

        print("✓ ML Backend initialized successfully")
        print("✓ Starting server on http://localhost:8000")

        # Use the main function from app.py
        main()

    except Exception as e:
        print(f"✗ Failed to start ML backend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("ML Internship Recommendation Backend Startup")
    print("=" * 50)

    if check_requirements():
        start_ml_backend()
    else:
        print("Please install the required packages and try again.")
        sys.exit(1)
