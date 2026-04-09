import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasToken: !!process.env.SLACK_BOT_TOKEN,
    tokenPrefix: (process.env.SLACK_BOT_TOKEN || '').substring(0, 10),
    hasChannel: !!process.env.SLACK_CHANNEL_ID,
    channelId: process.env.SLACK_CHANNEL_ID || 'NOT SET',
    hasNextToken: !!process.env.NEXT_SLACK_TOKEN,
    nextTokenPrefix: (process.env.NEXT_SLACK_TOKEN || '').substring(0, 10),
    hasNextChannel: !!process.env.NEXT_SLACK_CHANNEL,
    nextChannelId: process.env.NEXT_SLACK_CHANNEL || 'NOT SET',
  });
}
