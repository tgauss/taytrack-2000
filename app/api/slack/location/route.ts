import { NextRequest, NextResponse } from 'next/server';

const SLACK_TOKEN = (process.env.SLACK_BOT_TOKEN || process.env.NEXT_SLACK_TOKEN || '').trim();
const CHANNEL_ID = (process.env.SLACK_CHANNEL_ID || process.env.NEXT_SLACK_CHANNEL || '').trim();

// Known locations Dad might be at
const LOCATIONS: Record<string, { lat: number; lon: number; city: string }> = {
  'vancouver': { lat: 45.64, lon: -122.66, city: 'Vancouver' },
  'portland': { lat: 45.52, lon: -122.68, city: 'Portland' },
  'seattle': { lat: 47.61, lon: -122.33, city: 'Seattle' },
  'tulsa': { lat: 36.15, lon: -95.99, city: 'Tulsa' },
  'wichita': { lat: 37.69, lon: -97.33, city: 'Wichita' },
  'lincoln': { lat: 40.81, lon: -96.70, city: 'Lincoln' },
  'roca': { lat: 40.65, lon: -96.67, city: 'Roca' },
  'omaha': { lat: 41.26, lon: -95.93, city: 'Omaha' },
  'home': { lat: 45.64, lon: -122.66, city: 'Home' },
};

// GET: Read Dad's current location from the latest !location message in the channel
export async function GET() {
  try {
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=50`,
      { headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }, next: { revalidate: 0 } }
    );
    const data = await res.json();
    if (!data.ok) return NextResponse.json({ ok: false, error: data.error });

    // Find the most recent !location message from Dad (not bot)
    for (const msg of data.messages || []) {
      const text = (msg.text || '').trim().toLowerCase();
      if (text.startsWith('!location ')) {
        const locationName = text.replace('!location ', '').trim();
        const loc = LOCATIONS[locationName];
        if (loc) {
          return NextResponse.json({ ok: true, ...loc, source: 'manual' });
        }
      }
    }

    // Fallback: use date-based location
    const today = new Date().toISOString().split('T')[0];
    let fallback = LOCATIONS['vancouver'];
    if (today >= '2026-04-12' && today <= '2026-04-15') fallback = LOCATIONS['tulsa'];
    else if (today >= '2026-04-16' && today <= '2026-04-18') fallback = LOCATIONS['lincoln'];
    else if (today === '2026-04-19') fallback = LOCATIONS['omaha'];

    return NextResponse.json({ ok: true, ...fallback, source: 'schedule' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// POST: Set location (for future use with slash commands)
export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json();
    const loc = LOCATIONS[location?.toLowerCase()];
    if (!loc) {
      return NextResponse.json({ ok: false, error: `Unknown location. Try: ${Object.keys(LOCATIONS).join(', ')}` });
    }

    // Post a !location message to the channel
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SLACK_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: CHANNEL_ID,
        text: `!location ${location.toLowerCase()}`,
      }),
    });

    return NextResponse.json({ ok: true, ...loc });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
