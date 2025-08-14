import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPersonaPrompt } from '../../utils/personaPrompt';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Google AI client (Gemini)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Function to handle OpenAI chat
async function handleOpenAIChat(message: string, persona: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const personaPrompt = getPersonaPrompt(persona);
  
  if (!personaPrompt) {
    throw new Error(`Invalid persona: ${persona}`);
  }
  
  console.log(`[OpenAI] Using persona prompt for: ${persona}`);

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content: personaPrompt,
      },
      {
        role: 'user',
        content: message,
      },
    ],
    max_completion_tokens: 500,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('OpenAI returned empty response');
  }

  return response;
}

// Function to handle Gemini chat
async function handleGeminiChat(message: string, persona: string): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const personaPrompt = getPersonaPrompt(persona);
  
  if (!personaPrompt) {
    throw new Error(`Invalid persona: ${persona}`);
  }
  
  console.log(`[Gemini] Using persona prompt for: ${persona}`);
  
  const fullPrompt = `${personaPrompt}\n\nUser: ${message}`;
  
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  const result = await geminiModel.generateContent(fullPrompt);
  
  const response = result.response.text();
  if (!response) {
    throw new Error('Gemini returned empty response');
  }

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const { message, persona, model = 'openai' } = await request.json();

    console.log(`[API] Received request - Persona: ${persona}, Model: ${model}, Message: ${message.substring(0, 100)}...`);

    if (!message || !persona) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Message and persona are required' },
        { status: 400 }
      );
    }

    let response: string;

    try {
      if (model === 'gemini') {
        console.log('[API] Using Gemini model');
        response = await handleGeminiChat(message, persona);
      } else {
        console.log('[API] Using OpenAI model');
        response = await handleOpenAIChat(message, persona);
      }
      
      console.log(`[API] Successfully generated response (${response.length} characters)`);
    } catch (error) {
      console.error(`[API] Error with ${model} model:`, error);
      
      let errorMessage = `Failed to get response from ${model} model.`;
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = `${model} API key not configured. Please check your environment variables.`;
        } else if (error.message.includes('rate limit')) {
          errorMessage = `${model} rate limit exceeded. Please try again later.`;
        } else {
          errorMessage = `${model} error: ${error.message}`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('[API] Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 