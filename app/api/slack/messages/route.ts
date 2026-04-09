import { NextResponse } from 'next/server';

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID || 'C0ARVCZ2EBE';
const BOT_USER_ID = 'U0ARVCF8CUC'; // TayTrack bot

// Replace Slack user mentions <@UXXXX> with "Dad"
function cleanText(text: string): string {
  return text
    .replace(/<@[A-Z0-9]+>/g, 'Dad')
    .replace(/<#[A-Z0-9|]+>/g, '')
    .replace(/<(https?:\/\/[^|>]+)\|?[^>]*>/g, '$1') // clean link formatting
    .trim();
}

// Subtypes to filter out (system messages, not real chat)
const SYSTEM_SUBTYPES = new Set([
  'channel_join', 'channel_leave', 'channel_topic', 'channel_purpose',
  'channel_name', 'channel_archive', 'channel_unarchive', 'group_join',
  'group_leave', 'group_topic', 'group_purpose', 'group_name',
  'bot_message', 'bot_add', 'bot_remove', 'file_share',
]);

export async function GET() {
  try {
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=20`,
      { headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }, next: { revalidate: 0 } }
    );
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.error });
    }

    // Only show real messages from humans (not bot, not system)
    const messages = (data.messages || [])
      .filter((msg: { user?: string; bot_id?: string; subtype?: string }) => {
        if (!msg.user) return false;
        if (msg.user === BOT_USER_ID) return false;
        if (msg.bot_id) return false;
        if (msg.subtype && SYSTEM_SUBTYPES.has(msg.subtype)) return false;
        return true;
      })
      .map((msg: { text?: string; ts?: string; files?: { url_private?: string; mimetype?: string; thumb_360?: string }[] }) => ({
        text: cleanText(msg.text || ''),
        timestamp: msg.ts,
        time: new Date(Number(msg.ts) * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        hasImage: msg.files?.some((f: { mimetype?: string }) => f.mimetype?.startsWith('image/')),
        imageUrl: (() => {
          const imgFile = msg.files?.find((f: { mimetype?: string }) => f.mimetype?.startsWith('image/'));
          const slackUrl = imgFile?.thumb_360 || imgFile?.url_private;
          return slackUrl ? `/api/slack/image?url=${encodeURIComponent(slackUrl)}` : undefined;
        })(),
        hasAudio: msg.files?.some((f: { mimetype?: string }) => f.mimetype?.startsWith('audio/')),
      }))
      .filter((msg: { text: string; hasImage: boolean; hasAudio: boolean }) =>
        msg.text.length > 0 || msg.hasImage || msg.hasAudio
      )
      .slice(0, 10);

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
