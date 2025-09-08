import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ExtractedEntry { name: string; count: number }

const toTitle = (s: string): string => {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export async function GET() {
  try {
    const jsonPath = path.resolve(process.cwd(), '..', 'Module-B ML', 'extracted_data.json');
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw) as {
      skills: ExtractedEntry[];
      locations: ExtractedEntry[];
      sectors: ExtractedEntry[];
    };

    const sortDesc = (a: ExtractedEntry, b: ExtractedEntry) => b.count - a.count;

    const response = {
      skills: (data.skills || []).sort(sortDesc).map((x) => toTitle(x.name)),
      locations: (data.locations || []).sort(sortDesc).map((x) => toTitle(x.name)),
      sectors: (data.sectors || []).sort(sortDesc).map((x) => toTitle(x.name))
    };

    return NextResponse.json({ success: true, ...response });
  } catch (err: unknown) {
    console.error('Failed to read extracted_data.json', err);
    return NextResponse.json(
      { success: false, error: 'Unable to load metadata' },
      { status: 500 }
    );
  }
}


