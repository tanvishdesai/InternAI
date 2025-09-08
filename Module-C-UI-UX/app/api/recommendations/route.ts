import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ML API endpoint - change this to your actual ML API URL
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to get recommendations' },
        { status: 400 }
      );
    }

    // Fetch user profile from database
    const user = await prisma.userProfile.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found. Please create a profile first.' },
        { status: 404 }
      );
    }

    // Prepare data for ML API - ensure field names match ML backend expectations
    const mlRequestData = {
      education_level: user.educationLevel,
      skills: Array.isArray(JSON.parse(user.skills)) ? JSON.parse(user.skills) : [],
      major_field: user.majorField || undefined,
      preferred_sectors: user.preferredSectors ? (Array.isArray(JSON.parse(user.preferredSectors)) ? JSON.parse(user.preferredSectors) : []) : undefined,
      preferred_locations: user.preferredLocations ? (Array.isArray(JSON.parse(user.preferredLocations)) ? JSON.parse(user.preferredLocations) : []) : undefined,
      remote_ok: user.remoteOk || false,
      availability_start: user.availabilityStart?.toISOString().split('T')[0],
      duration_weeks_pref: user.durationWeeksPref ? (typeof user.durationWeeksPref === 'string' ? parseInt(user.durationWeeksPref) : user.durationWeeksPref) : undefined,
      stipend_pref: user.stipendPref || undefined,
      career_goal: user.careerGoal || undefined
    };

    // Call ML API
    const mlResponse = await fetch(`${ML_API_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mlRequestData)
    });

    if (!mlResponse.ok) {
      console.error('ML API error:', mlResponse.status, mlResponse.statusText);
      return NextResponse.json(
        { error: 'Failed to get recommendations from ML service' },
        { status: 500 }
      );
    }

    const mlData = await mlResponse.json();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      recommendations: mlData.recommendations || [],
      totalRecommendations: mlData.total_recommendations || 0
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
