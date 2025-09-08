import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      educationLevel,
      majorField,
      skills,
      preferredSectors,
      careerGoal,
      preferredLocations,
      remoteOk,
      availabilityStart,
      durationWeeksPref,
      stipendPref
    } = body;

    // Validate required fields - only education level and skills are required now
    if (!educationLevel || !skills || skills.length === 0) {
      return NextResponse.json(
        { error: 'Education level and at least one skill are required' },
        { status: 400 }
      );
    }

    // Generate a temporary email if not provided (for anonymous users)
    const userEmail = email || `temp_${Date.now()}@internai.local`;

    // Check if user already exists
    const existingUser = await prisma.userProfile.findUnique({
      where: { email: userEmail }
    });

    const userData = {
      name: name || 'Anonymous User',
      email: userEmail,
      educationLevel,
      majorField: majorField || '',
      skills: JSON.stringify(skills || []),
      preferredSectors: JSON.stringify(preferredSectors || []),
      careerGoal: careerGoal || '',
      preferredLocations: JSON.stringify(preferredLocations || []),
      remoteOk: Boolean(remoteOk),
      availabilityStart: availabilityStart ? new Date(availabilityStart) : null,
      durationWeeksPref: durationWeeksPref ? parseInt(durationWeeksPref) : null,
      stipendPref
    };

    let user;
    if (existingUser) {
      // Update existing user
      user = await prisma.userProfile.update({
        where: { email: userEmail },
        data: userData
      });
    } else {
      // Create new user
      user = await prisma.userProfile.create({
        data: userData
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error saving user profile:', error);
    return NextResponse.json(
      { error: 'Failed to save user profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const user = await prisma.userProfile.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields back to arrays
    const userProfile = {
      ...user,
      skills: JSON.parse(user.skills),
      preferredSectors: JSON.parse(user.preferredSectors),
      preferredLocations: JSON.parse(user.preferredLocations),
      yearsExperience: user.yearsOfExperience
    };

    return NextResponse.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
