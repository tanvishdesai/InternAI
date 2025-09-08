# Internship Recommendation System - Integration Guide

## Overview
This system consists of three main modules:
- **Module-A**: Data Collection (internships.csv, extracted_data.json)
- **Module-B**: ML Backend (Flask API for recommendations)
- **Module-C**: Frontend UI (Next.js React application)

## Recent Fixes Applied

### 1. ✅ Fixed Text Color Issue
- **Problem**: Text became white and unreadable during onboarding
- **Solution**: Updated `AccessibilityProvider.tsx` to properly handle high contrast mode
- **Files Modified**:
  - `Module-C-UI-UX/my-app/components/AccessibilityProvider.tsx`
  - `Module-C-UI-UX/my-app/app/globals.css`

### 2. ✅ Removed Unnecessary Fields
- **Problem**: Frontend asked for fields not used by ML backend (name, email, career_goal)
- **Solution**: Streamlined onboarding to only collect required fields
- **Fields Removed**: name, email, career_goal
- **Required Fields Only**: education_level, skills, major_field, preferred_sectors, preferred_locations, remote_ok, duration_weeks_pref, stipend_pref
- **Files Modified**:
  - `Module-C-UI-UX/my-app/components/SmartProfileBuilder.tsx`
  - `Module-C-UI-UX/my-app/components/UserProfileForm.tsx`
  - `Module-C-UI-UX/my-app/hooks/useVoiceRecognition.ts`

### 3. ✅ Fixed Voice Recognition
- **Problem**: Voice recognition was not working properly
- **Solution**: Improved error handling, browser compatibility, and language settings
- **Improvements**:
  - Better error messages for microphone permissions
  - Support for multiple browsers (Chrome, Edge, Safari)
  - Changed from Hindi to English prompts for better compatibility
  - Added proper error handling for speech recognition failures
- **Files Modified**:
  - `Module-C-UI-UX/my-app/hooks/useVoiceRecognition.ts`

### 4. ✅ Updated Field Mapping
- **Problem**: Frontend and ML backend field names didn't match
- **Solution**: Ensured proper data transformation between frontend and ML API
- **Files Modified**:
  - `Module-C-UI-UX/my-app/app/api/recommendations/route.ts`
  - `Module-C-UI-UX/my-app/app/api/users/route.ts`

### 5. ✅ Enhanced ML Integration
- **Problem**: Frontend showed mock recommendations instead of real ML data
- **Solution**: Improved API communication and error handling
- **Features**:
  - Real ML recommendations with fallback to mock data
  - Proper data validation and transformation
  - Better error handling and logging
- **Files Modified**:
  - `Module-C-UI-UX/my-app/app/page.tsx`
  - Created `Module-B ML/start_ml_backend.py`
  - Created `start_services.bat`

## System Requirements

### Backend (ML) Requirements
- Python 3.8+
- Required packages: Flask, sentence-transformers, torch, faiss-cpu, pandas, scikit-learn

### Frontend Requirements
- Node.js 18+
- npm or yarn
- SQLite (comes with Prisma)

## Installation & Setup

### Option 1: Automated Setup (Windows)
1. Run the startup script:
   ```bash
   start_services.bat
   ```
   This will:
   - Check for Python and Node.js
   - Install ML backend dependencies
   - Start ML backend on port 8000
   - Install frontend dependencies
   - Setup database
   - Start frontend on port 3000

### Option 2: Manual Setup

#### ML Backend Setup
```bash
cd Module-B\ ML
pip install -r requirements.txt
python start_ml_backend.py
```

#### Frontend Setup
```bash
cd Module-C-UI-UX\my-app
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## API Endpoints

### ML Backend (Port 8000)
- `GET /health` - Health check
- `POST /recommend` - Get internship recommendations
- `GET /stats` - Get system statistics

### Frontend API Routes
- `POST /api/users` - Save user profile
- `POST /api/recommendations` - Get recommendations (calls ML backend)
- `GET /api/suggestions` - Get autocomplete suggestions

## Data Flow

1. **User Onboarding**: Collect only essential information
   - Education level (required)
   - Skills (required)
   - Major field (optional)
   - Preferred sectors (optional)
   - Preferred locations (optional)
   - Remote work preference (optional)
   - Duration preference (optional)
   - Stipend preference (optional)

2. **Data Processing**: Transform and validate data
   - Convert arrays to JSON strings for database storage
   - Map frontend field names to ML backend expectations

3. **ML Recommendation**: Send processed data to ML engine
   - ML backend processes data using trained models
   - Returns personalized internship recommendations
   - Frontend transforms response for display

4. **Display Results**: Show recommendations with match scores
   - Real recommendations from ML engine
   - Fallback to mock data if ML fails
   - Interactive cards with apply/save options

## Key Features

- **Streamlined Onboarding**: Only asks for ML-required fields
- **Voice Recognition**: Improved browser compatibility and error handling
- **Real ML Integration**: Actual recommendations from trained models
- **Accessibility**: High contrast mode and responsive design
- **Progressive Enhancement**: Works with or without voice features
- **Error Handling**: Graceful fallbacks throughout the system

## Troubleshooting

### Common Issues

1. **ML Backend Not Starting**
   - Ensure Python 3.8+ is installed
   - Check if required ML packages are installed
   - Verify port 8000 is not in use

2. **Frontend Not Connecting to ML**
   - Ensure ML backend is running on port 8000
   - Check CORS settings in Flask app
   - Verify network connectivity

3. **Voice Recognition Not Working**
   - Ensure microphone permissions are granted
   - Try refreshing the page
   - Check browser compatibility (Chrome/Edge recommended)

4. **Database Issues**
   - Run `npx prisma db push` to reset database
   - Check if SQLite file has proper permissions

### Logs and Debugging

- **ML Backend**: Check console output in ML backend terminal
- **Frontend**: Check browser console for API errors
- **Database**: Use `npx prisma studio` to inspect data

## Development Notes

- The system uses a hybrid recommendation approach combining content-based and collaborative filtering
- Voice recognition works best in Chrome/Edge browsers
- The ML models are pre-trained and loaded from the `models/` directory
- Database schema supports both required and optional fields for flexibility

## Future Improvements

- Add more sophisticated ML models
- Implement user feedback loop for better recommendations
- Add support for more languages in voice recognition
- Implement real-time collaborative filtering
- Add A/B testing for recommendation algorithms
