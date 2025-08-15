import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPersonaPrompt } from '../../utils/personaPrompt';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Google AI client (Gemini)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Build enhanced persona prompt with step enforcement
function createEnhancedPersonaPrompt(basePrompt: string, userMessage: string): string {
  return `${basePrompt}

IMPORTANT: Follow step-by-step protocol: analyse → think → output → validate → result

User's question: "${userMessage}"

Respond in this exact JSON format:
{"step": "result", "content": "Your final answer here"}`;
}

// Extract only the final content from JSON response
function extractContentFromResponse(response: string): string {
  try {
    const parsed = JSON.parse(response);
    if (parsed.step === 'result' && parsed.content) {
      return parsed.content;
    }
    // If no result step, return the response as is
    return response;
  } catch (error) {
    // If JSON parsing fails, return the response as is
    return response;
  }
}

// OpenAI request
async function handleOpenAI(message: string, persona: string) {
  const personaPrompt = getPersonaPrompt(persona);
  if (!personaPrompt) throw new Error(`Invalid persona: ${persona}`);

  const enhancedPrompt = createEnhancedPersonaPrompt(personaPrompt, message);
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: enhancedPrompt },
      { role: 'user', content: message },
    ],
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  return completion.choices[0]?.message?.content || '';
}

// Gemini request
async function handleGemini(message: string, persona: string) {
  if (!genAI) throw new Error('Gemini API key not configured');

  const personaPrompt = getPersonaPrompt(persona);
  if (!personaPrompt) throw new Error(`Invalid persona: ${persona}`);

  const enhancedPrompt = createEnhancedPersonaPrompt(personaPrompt, message);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(enhancedPrompt);

  return result.response.text();
}

export async function POST(request: NextRequest) {
  try {
    const { message, persona, model = 'gemini' } = await request.json();

    if (!message || !persona) {
      return NextResponse.json(
        { error: 'Message and persona are required' },
        { status: 400 }
      );
    }

    let rawResponse = '';

    if (model === 'gemini') {
      console.log(`[API] Using Gemini - Persona: ${persona}`);
      rawResponse = await handleGemini(message, persona);
    } else {
      console.log(`[API] Using OpenAI - Persona: ${persona}`);
      rawResponse = await handleOpenAI(message, persona);
    }

         // Extract only the content from the result step
     console.log('[API] Raw response:', rawResponse);
     
     // Extract only the content from the result step
     const finalContent = extractContentFromResponse(rawResponse);
     console.log('[API] Extracted content:', finalContent);
     
     // If the extraction failed, try to parse the response manually
     if (finalContent === rawResponse) {
       try {
         const parsed = JSON.parse(rawResponse);
         console.log('[API] Parsed response:', parsed);
         if (parsed.step === 'result' && parsed.content) {
           console.log('[API] Found result step, returning content');
           return NextResponse.json({ step: 'result', content: parsed.content });
         }
         // If no result step found, return the raw content
         console.log('[API] No result step found, returning raw content');
         return NextResponse.json({ step: 'result', content: rawResponse });
       } catch (e) {
         // If parsing fails, return the raw response
         console.log('[API] JSON parsing failed, returning raw response');
         return NextResponse.json({ step: 'result', content: rawResponse });
       }
     }

     console.log('[API] Returning extracted content');
     return NextResponse.json({ step: 'result', content: finalContent });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
