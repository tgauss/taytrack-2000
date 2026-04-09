import { NextRequest, NextResponse } from 'next/server';

const SLACK_TOKEN = (process.env.SLACK_BOT_TOKEN || process.env.NEXT_SLACK_TOKEN || '').trim();
const CHANNEL_ID = (process.env.SLACK_CHANNEL_ID || process.env.NEXT_SLACK_CHANNEL || '').trim();

async function uploadFileToSlack(fileBuffer: Buffer, filename: string, mimetype: string, comment: string) {
  // Step 1: Get upload URL
  const getUrlRes = await fetch('https://slack.com/api/files.getUploadURLExternal', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      filename,
      length: String(fileBuffer.length),
    }),
  });
  const urlData = await getUrlRes.json();
  if (!urlData.ok) return { ok: false, error: 'getUploadURL: ' + urlData.error };

  // Step 2: Upload the actual file bytes to the presigned URL
  const uploadRes = await fetch(urlData.upload_url, {
    method: 'POST',
    body: fileBuffer,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(fileBuffer.length),
    },
  });
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    return { ok: false, error: 'upload: ' + uploadRes.status + ' ' + errText.substring(0, 100) };
  }

  // Step 3: Complete the upload and share to channel
  const completeRes = await fetch('https://slack.com/api/files.completeUploadExternal', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [{ id: urlData.file_id, title: filename }],
      channel_id: CHANNEL_ID,
      initial_comment: comment,
    }),
  });
  const completeData = await completeRes.json();
  return { ok: completeData.ok, error: completeData.ok ? undefined : 'complete: ' + completeData.error };
}

export async function POST(request: NextRequest) {
  if (!SLACK_TOKEN || !CHANNEL_ID) {
    return NextResponse.json({ ok: false, error: 'Slack not configured' });
  }

  try {
    const body = await request.json();
    const { text, imageBase64, audioBase64, senderName } = body;
    const displayName = senderName || 'The Kids';

    // Photo upload
    if (imageBase64) {
      const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
      const result = await uploadFileToSlack(
        imageBuffer,
        `photo-${Date.now()}.jpg`,
        'image/jpeg',
        `📸 *${displayName}* sent a photo!${text ? `\n> ${text}` : ''}`
      );
      return NextResponse.json(result);
    }

    // Voice upload
    if (audioBase64) {
      const audioBuffer = Buffer.from(audioBase64.split(',')[1] || audioBase64, 'base64');
      const result = await uploadFileToSlack(
        audioBuffer,
        `voice-${Date.now()}.webm`,
        'audio/webm',
        `🎤 *${displayName}* sent a voice message!`
      );
      return NextResponse.json(result);
    }

    // Text message
    if (text) {
      const res = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SLACK_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: CHANNEL_ID,
          text: `💬 *${displayName}:* ${text}`,
        }),
      });
      const data = await res.json();
      return NextResponse.json({ ok: data.ok, error: data.error });
    }

    return NextResponse.json({ ok: false, error: 'No content' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
