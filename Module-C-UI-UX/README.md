# Internship Recommendation System - UI

A modern Next.js application for internship recommendations powered by AI/ML.

## Features

- 🧠 AI-powered internship matching
- 📝 User profile creation with validation
- 🎯 Personalized recommendations
- 💾 SQLite database integration
- 🔄 Real-time recommendation updates
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Database**: Prisma with SQLite
- **Icons**: Lucide React
- **ML Integration**: REST API calls to Python ML service

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Python 3.8+ (for ML service)

### Quick Start (Recommended)

#### Option 1: Windows Batch File
```bash
# From the project root directory
./start-all.bat
```

#### Option 2: npm Script (Cross-platform)
```bash
cd Module-C-UI-UX/my-app
npm run start-all
```

#### Option 3: Manual Setup

1. **Install dependencies and setup database:**
   ```bash
   cd Module-C-UI-UX/my-app
   npm run setup
   ```

2. **Configure environment variables:**

   Create a `.env.local` file in the my-app directory:

   ```env
   # ML API Configuration
   ML_API_URL=http://localhost:8000

   # Optional: If using PostgreSQL instead of SQLite
   # DATABASE_URL="postgresql://username:password@localhost:5432/internship_db?schema=public"
   ```

3. **Start all services:**

   **Terminal 1 - ML Service:**
   ```bash
   cd Module-B ML
   python app.py
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd Module-C-UI-UX/my-app
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── users/           # User profile CRUD API
│   │   └── recommendations/ # ML recommendation API
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main application page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── UserProfileForm.tsx  # User information form
│   └── RecommendationsDisplay.tsx # Recommendations display
├── lib/
│   ├── prisma.ts            # Database client
│   └── utils.ts             # Utility functions
├── prisma/
│   └── schema.prisma        # Database schema
└── public/                  # Static assets
```

## API Endpoints

### User Management
- `POST /api/users` - Create/update user profile
- `GET /api/users?email=user@example.com` - Get user profile

### Recommendations
- `POST /api/recommendations` - Get personalized recommendations

## Database Schema

The application uses SQLite with the following user profile structure:

- `id` - Unique identifier
- `email` - User email (unique)
- `name` - Full name
- `educationLevel` - Education level (12th, diploma, ug, pg)
- `majorField` - Field of study
- `skills` - JSON array of skills
- `preferredSectors` - JSON array of preferred sectors
- `preferredLocations` - JSON array of preferred locations
- `remoteOk` - Boolean for remote work preference
- `stipendPref` - Preferred stipend range
- `availabilityStart` - Available start date
- `durationWeeksPref` - Preferred duration
- `careerGoal` - Career aspirations text

## Usage

1. **Create Profile**: Fill out the user information form with your education, skills, and preferences
2. **Get Recommendations**: The system automatically saves your profile and fetches AI-powered recommendations
3. **View Results**: Browse through personalized internship matches with detailed information
4. **Apply**: Click on "Apply Now" links to apply directly to internships

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management

```bash
# View database
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate client after schema changes
npx prisma generate
```

## Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm run start
   ```

3. **Environment variables for production:**
   - Set `ML_API_URL` to your deployed ML service URL
   - Configure database URL if using PostgreSQL

## Troubleshooting

### Common Issues

1. **ML API Connection Error**
   - Ensure the ML service is running on the correct port
   - Check `ML_API_URL` in environment variables

2. **Database Connection Issues**
   - Run `npx prisma generate` after schema changes
   - Check database file permissions

3. **Build Errors**
   - Clear Next.js cache: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Add proper error handling
4. Test API endpoints thoroughly
5. Update documentation for new features

## License

This project is part of the SIH 2025 submission.
