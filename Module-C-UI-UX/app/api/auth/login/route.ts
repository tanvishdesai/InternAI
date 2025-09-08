import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.userProfile.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update authentication status
    const updatedUser = await prisma.userProfile.update({
      where: { email },
      data: { isAuthenticated: true }
    });

    // Parse JSON fields for response
    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAuthenticated: updatedUser.isAuthenticated,
      educationLevel: updatedUser.educationLevel,
      majorField: updatedUser.majorField,
      skills: JSON.parse(updatedUser.skills),
      preferredSectors: JSON.parse(updatedUser.preferredSectors),
      careerGoal: updatedUser.careerGoal,
      preferredLocations: JSON.parse(updatedUser.preferredLocations),
      remoteOk: updatedUser.remoteOk,
      availabilityStart: updatedUser.availabilityStart,
      durationWeeksPref: updatedUser.durationWeeksPref,
      stipendPref: updatedUser.stipendPref,
      yearsExperience: updatedUser.yearsOfExperience
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
      message: 'Login successful'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
