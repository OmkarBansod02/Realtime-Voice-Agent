import { NextResponse } from 'next/server';
import { chatAgent } from '@/mastra/agents/chatAgent';

export async function GET() {
  try {
    const voices = await chatAgent.getSpeakers();
    
    return NextResponse.json({ voices });
  } catch (error) {
    console.error('Error fetching voices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
