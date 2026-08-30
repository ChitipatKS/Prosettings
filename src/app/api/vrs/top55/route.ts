import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Country name to ISO 2-letter country code map
const countryToCode: Record<string, string> = {
  'Russia': 'RU', 'Russian Federation': 'RU',
  'Ukraine': 'UA',
  'Belarus': 'BY',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Poland': 'PL',
  'Germany': 'DE',
  'France': 'FR',
  'United States': 'US', 'USA': 'US',
  'Canada': 'CA',
  'Brazil': 'BR',
  'Mongolia': 'MN',
  'Turkey': 'TR',
  'Israel': 'IL',
  'Bosnia and Herzegovina': 'BA',
  'Serbia': 'RS',
  'Slovakia': 'SK',
  'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'United Kingdom': 'GB', 'Great Britain': 'GB',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Uruguay': 'UY',
  'Spain': 'ES',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Kazakhstan': 'KZ',
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR', 'Korea': 'KR',
  'Thailand': 'TH',
  'Singapore': 'SG',
  'Indonesia': 'ID',
  'Malaysia': 'MY',
  'Philippines': 'PH',
  'Jordan': 'JO',
  'South Africa': 'ZA',
  'Kosovo': 'XK',
  'Montenegro': 'ME',
  'North Macedonia': 'MK',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Guatemala': 'GT'
};

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'vrs-top55-cs2.json');
    
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Data file not found. Please run fetch_vrs_top55 script.' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
