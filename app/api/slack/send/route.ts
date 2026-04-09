import { NextRequest, NextResponse } from 'next/server';

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN || process.env.NEXT_SLACK_TOKEN || '';
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID || process.env.NEXT_SLACK_CHANNEL || '';

export async function POST(request: NextRequest) {
  if (!SLACK_TOKEN || !CHANNEL_ID) {
    return NextResponse.json({ ok: false, error: 'Slack not configured', debug: { hasToken: !!SLACK_TOKEN, hasChannel: !!CHANNEL_ID } });
  }

  try {
    const body = await request.json();
    const { text, imageBase64, audioBase64, senderName } = body;
    const displayName = senderName || 'The Kids';

    if (imageBase64) {
      const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
      const formData = new FormData();
      formData.append('channels', CHANNEL_ID);
      formData.append('initial_comment', '📸 *' + displayName + '* sent a photo!' + (text ? '\n> ' + text : ''));
      formData.append('filename', 'photo-' + Date.now() + '.jpg');
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'photo.jpg');
      const res = await fetch('https://slack.com/api/files.upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + SLACK_TOKEN }, body: formData });
      const data = await res.json();
      return NextResponse.json({ ok: data.ok, error: data.error });
    }

    if (audioBase64) {
      const audioBuffer = Buffer.from(audioBase64.split(',')[1] || audioBase64, 'base64');
      const formData = new FormData();
      formData.append('channels', CHANNEL_ID);
      formData.append('initial_comment', '🎤 *' + displayName + '* sent a voice message!');
      formData.append('filename', 'voice-' + Date.now() + '.webm');
      formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'voice.webm');
      const res = await fetch('https://slack.com/api/files.upload', { method: 'POST', headers: { 'Authorization': 'Bearer ' + SLACK_TOKEN }, body: formData });
      const data = await res.json();
      return NextResponse.json({ ok: data.ok, error: data.error });
    }

    if (text) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + SLACK_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: CHANNEL_ID, text: '💬 *' + displayName + ':* ' + text }),
      });
      const data = await res.json();
      return NextResponse.json({ ok: data.ok, error: data.error });
    }

    return NextResponse.json({ ok: false, error: 'No content' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
