import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPersonaPrompt } from '../../utils/personaPrompt';



// Initialize Google AI client (Gemini)
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Build enhanced persona prompt with step enforcement
function createEnhancedPersonaPrompt(basePrompt: string, userMessage: string): string {
  return `${basePrompt}

IMPORTANT: You MUST follow the step-by-step protocol internally: analyse → think → output → validate → result

User's question: "${userMessage}"

Please think through the steps internally but only respond with your final answer as plain text. Do NOT include any JSON, step labels, or technical formatting. Just provide your natural, conversational response directly as the persona would speak.

Internal process (do not show):
1. analyse - Analyze the user's question internally
2. think - Think about the approach internally
3. output - Plan your output internally
4. validate - Validate your approach internally
5. result - Provide ONLY your final answer as plain text

Respond naturally as the persona, without any JSON formatting or step indicators.`;
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
    const { message, persona, model = 'gemini', apiKey } = await request.json();

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
      
      // For GPT, check if API key is provided
      if (!apiKey && !process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'GPT API key is required' },
          { status: 400 }
        );
      }
      
      // Use provided API key or fallback to env variable
      const openaiWithKey = new OpenAI({ 
        apiKey: apiKey || process.env.OPENAI_API_KEY 
      });
      
      const personaPrompt = getPersonaPrompt(persona);
      if (!personaPrompt) throw new Error(`Invalid persona: ${persona}`);

      const enhancedPrompt = createEnhancedPersonaPrompt(personaPrompt, message);
      const completion = await openaiWithKey.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: enhancedPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1000,
      });

      rawResponse = completion.choices[0]?.message?.content || '';
    }

    console.log('[API] Raw response:', rawResponse);
    
    // Since we're now getting plain text responses, just return them directly
    if (rawResponse && rawResponse.trim()) {
      console.log('[API] Returning plain text response');
      return NextResponse.json({ step: 'result', content: rawResponse.trim() });
    }
    
    // Fallback if response is empty
    console.log('[API] Empty response, returning default message');
    return NextResponse.json({ 
      step: 'result', 
      content: 'Sorry, I could not generate a response. Please try again.' 
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
