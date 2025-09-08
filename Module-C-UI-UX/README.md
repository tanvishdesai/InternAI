# Internship Platform - UI/UX Module

A modern Next.js application for internship recommendations with voice-powered profile building.

## 🚀 Deployment to Vercel

### Prerequisites

1. **Database Setup**: You need a PostgreSQL database. Choose one of these options:
   - **Vercel Postgres** (Recommended for Vercel deployment)
   - **Supabase** (Free tier available)
   - **PlanetScale** (MySQL)
   - **Neon** (Serverless PostgreSQL)

### Step 1: Set up Database

#### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project → Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` from the connection details

#### Option B: Supabase

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string (URI)

### Step 2: Environment Variables

In your Vercel project settings, add these environment variables:

```env
DATABASE_URL=your_postgresql_connection_string_here
NEXTAUTH_SECRET=your_random_secret_key_here
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### Step 3: Database Migration

After setting up the database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Create migration
npx prisma migrate dev --name init
```

### Step 4: Deploy to Vercel

1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Vercel will automatically:
   - Install dependencies
   - Generate Prisma client
   - Run database migrations
   - Build and deploy your app

### Troubleshooting

**Build Error: "Failed to collect page data"**
- Check your `DATABASE_URL` is correct
- Ensure database is accessible from Vercel
- Verify Prisma schema matches your database

**Database Connection Issues**
- Use SSL connection string for production
- Check firewall settings allow Vercel's IP ranges
- Ensure database credentials are correct

**Prisma Client Issues**
- Make sure `postinstall` script runs: `prisma generate`
- Check Prisma version compatibility

## 🛠 Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── login/          # Login page
│   └── signup/         # Signup page
├── components/         # React components
├── lib/               # Utility libraries
├── prisma/            # Database schema and migrations
└── utils/             # Helper functions
```