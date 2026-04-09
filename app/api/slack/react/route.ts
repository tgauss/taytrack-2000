import { NextRequest, NextResponse } from 'next/server';

const SLACK_TOKEN = (process.env.SLACK_BOT_TOKEN || process.env.NEXT_SLACK_TOKEN || '').trim();
const CHANNEL_ID = (process.env.SLACK_CHANNEL_ID || process.env.NEXT_SLACK_CHANNEL || '').trim();

// Map emoji to Slack reaction names
const EMOJI_TO_SLACK: Record<string, string> = {
  '❤️': 'heart',
  '👍': '+1',
  '😂': 'joy',
  '🎉': 'tada',
  '😍': 'heart_eyes',
};

export async function POST(request: NextRequest) {
  if (!SLACK_TOKEN || !CHANNEL_ID) {
    return NextResponse.json({ ok: false, error: 'Slack not configured' });
  }

  try {
    const { emoji, messageTimestamp } = await request.json();
    const slackEmoji = EMOJI_TO_SLACK[emoji] || 'heart';

    const res = await fetch('https://slack.com/api/reactions.add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: CHANNEL_ID,
        timestamp: messageTimestamp,
        name: slackEmoji,
      }),
    });
    const data = await res.json();
    return NextResponse.json({ ok: data.ok, error: data.error });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
