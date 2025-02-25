import { NextResponse } from 'next/server';
import { chatAgent } from '@/mastra/agents/chatAgent';

export async function POST(req: Request) {
  try {
    const { message, voiceId } = await req.json();

    if (!message) {
      return new NextResponse(JSON.stringify({ error: 'No message provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get response from Mastra agent
    let generateResult;
    try {
      generateResult = await chatAgent.generate(message);
    } catch (agentError) {
      console.error('Agent Generation Error:', agentError);
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to generate response from agent',
        details: agentError instanceof Error ? agentError.message : String(agentError)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = generateResult.text; // Extract text from the result
    // Get audio stream from TTS
    let audioStream;
    try {
      audioStream = await chatAgent.speak(response);
    } catch (ttsError) {
      console.error('TTS Streaming Error:', ttsError);
      return new NextResponse(JSON.stringify({ 
        text: response,
        error: 'Failed to generate audio stream',
        details: ttsError instanceof Error ? ttsError.message : String(ttsError)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert stream to buffer for response
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(JSON.stringify({
      text: response,
      audio: audioBuffer.toString('base64')
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Unexpected Chat API Error:', error);
    return new NextResponse(JSON.stringify({ 
      error: 'Unexpected error processing request',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
