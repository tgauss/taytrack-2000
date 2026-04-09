import { NextResponse } from 'next/server';

const SLACK_TOKEN = (process.env.SLACK_BOT_TOKEN || process.env.NEXT_SLACK_TOKEN || '').trim();
const CHANNEL_ID = (process.env.SLACK_CHANNEL_ID || process.env.NEXT_SLACK_CHANNEL || '').trim();
const BOT_USER_ID = 'U0ARVCF8CUC'; // TayTrack bot
const DAD_USER_ID = 'U075LME42KS'; // Dad's Slack user ID

function cleanText(text: string): string {
  return text
    .replace(/<@[A-Z0-9]+>/g, 'Dad')
    .replace(/<#[A-Z0-9|]+>/g, '')
    .replace(/<(https?:\/\/[^|>]+)\|?[^>]*>/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1') // remove bold markdown
    .trim();
}

const SYSTEM_SUBTYPES = new Set([
  'channel_join', 'channel_leave', 'channel_topic', 'channel_purpose',
  'channel_name', 'channel_archive', 'channel_unarchive', 'group_join',
  'group_leave', 'group_topic', 'group_purpose', 'group_name',
  'bot_add', 'bot_remove',
]);

export async function GET() {
  try {
    const res = await fetch(
      `https://slack.com/api/conversations.history?channel=${CHANNEL_ID}&limit=30`,
      { headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` }, next: { revalidate: 0 } }
    );
    const data = await res.json();
    if (!data.ok) return NextResponse.json({ ok: false, error: data.error });

    const messages = (data.messages || [])
      .filter((msg: { subtype?: string }) => {
        if (msg.subtype && SYSTEM_SUBTYPES.has(msg.subtype)) return false;
        return true;
      })
      .map((msg: { text?: string; ts?: string; user?: string; bot_id?: string; reactions?: { name: string; count: number }[]; files?: { url_private?: string; mimetype?: string; thumb_360?: string }[] }) => {
        const isDad = msg.user === DAD_USER_ID && !msg.bot_id;
        const isBot = msg.user === BOT_USER_ID || !!msg.bot_id;
        const text = cleanText(msg.text || '');

        const imgFile = msg.files?.find((f: { mimetype?: string }) => f.mimetype?.startsWith('image/'));
        const slackImgUrl = imgFile?.thumb_360 || imgFile?.url_private;
        const audioFile = msg.files?.find((f: { mimetype?: string }) => f.mimetype?.startsWith('audio/'));

        // Convert Slack emoji names to actual emoji
        const emojiMap: Record<string, string> = {
          heart: '❤️', '+1': '👍', thumbsup: '👍', joy: '😂', fire: '🔥',
          tada: '🎉', pray: '🙏', eyes: '👀', rocket: '🚀', star: '⭐',
          wave: '👋', hugging_face: '🤗', kissing_heart: '😘', sob: '😭',
          laughing: '😆', heart_eyes: '😍', clap: '👏', raised_hands: '🙌',
        };
        const reactions = (msg.reactions || []).map((r: { name: string; count: number }) => ({
          emoji: emojiMap[r.name] || `:${r.name}:`,
          count: r.count,
        }));

        return {
          text,
          timestamp: msg.ts,
          time: new Date(Number(msg.ts) * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          fromDad: isDad,
          fromKids: isBot,
          hasImage: !!imgFile,
          imageUrl: slackImgUrl ? `/api/slack/image?url=${encodeURIComponent(slackImgUrl)}` : undefined,
          hasAudio: !!audioFile,
          reactions,
        };
      })
      .filter((msg: { text: string; hasImage: boolean; hasAudio: boolean }) =>
        msg.text.length > 0 || msg.hasImage || msg.hasAudio
      )
      .slice(0, 20)
      .reverse(); // Oldest first for chat view

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
