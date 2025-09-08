import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the extracted data file
    const dataPath = path.join(process.cwd(), '../Module-B ML/extracted_data.json');

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Suggestions data not found. Please run the data extraction script first.' },
        { status: 404 }
      );
    }

    const data = fs.readFileSync(dataPath, 'utf-8');
    const suggestions = JSON.parse(data);

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Error reading suggestions data:', error);
    return NextResponse.json(
      { error: 'Failed to load suggestions data' },
      { status: 500 }
    );
  }
}
