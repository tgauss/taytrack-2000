import { NextResponse } from 'next/server';

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN!;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID!;
const BOT_USER_ID = 'U0ARVCF8CUC'; // TayTrack bot — filter out bot messages

export async function GET() {
  try {
    // Fetch recent messages from the channel
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=20`,
      { headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }, next: { revalidate: 0 } }
    );
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.error });
    }

    // Filter and format messages — only show messages from Dad (non-bot)
    const messages = (data.messages || [])
      .filter((msg: { user?: string; bot_id?: string; subtype?: string }) =>
        msg.user && msg.user !== BOT_USER_ID && !msg.bot_id && msg.subtype !== 'bot_message'
      )
      .map((msg: { text?: string; ts?: string; files?: { url_private?: string; mimetype?: string; thumb_360?: string }[] }) => ({
        text: msg.text || '',
        timestamp: msg.ts,
        time: new Date(Number(msg.ts) * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        hasImage: msg.files?.some((f: { mimetype?: string }) => f.mimetype?.startsWith('image/')),
        imageUrl: msg.files?.find((f: { mimetype?: string }) => f.mimetype?.startsWith('image/'))?.thumb_360,
        hasAudio: msg.files?.some((f: { mimetype?: string }) => f.mimetype?.startsWith('audio/')),
      }))
      .slice(0, 10);

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
