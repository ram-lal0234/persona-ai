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

// Function to handle OpenAI streaming chat
async function handleOpenAIStream(message: string, persona: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const personaPrompt = getPersonaPrompt(persona);
  
  if (!personaPrompt) {
    throw new Error(`Invalid persona: ${persona}`);
  }
  
  console.log(`[OpenAI] Using persona prompt for: ${persona}`);

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
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
    max_tokens: 800,
    stream: true,
  });

  return stream;
}

// Function to handle Gemini streaming chat
async function handleGeminiStream(message: string, persona: string) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const personaPrompt = getPersonaPrompt(persona);
  
  if (!personaPrompt) {
    throw new Error(`Invalid persona: ${persona}`);
  }
  
  console.log(`[Gemini] Using persona prompt for: ${persona}`);
  
  const fullPrompt = `${personaPrompt}\n\nUser: ${message}`;
  
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await geminiModel.generateContentStream(fullPrompt);
  
  return result.stream;
}

// Function to evaluate response with the opposite model
async function evaluateResponseWithOppositeModel(
  originalResponse: string, 
  originalModel: string, 
  persona: string,
  userMessage: string
): Promise<{ isCorrect: boolean; evaluation: string; regeneratedResponse?: string }> {
  try {
    const evaluationPrompt = `You are an AI evaluator. Evaluate the following response for:
1. Accuracy and correctness of the information
2. Completeness of the answer
3. Clarity and helpfulness
4. Adherence to the persona's style and tone
5. Any factual errors or misleading information

Original Question: "${userMessage}"
Original Response: "${originalResponse}"
Original Model: ${originalModel}

Provide a brief evaluation (2-3 sentences) and determine if the response is correct and complete.
If the response has significant errors or is incomplete, provide a corrected version.

Format your response as:
EVALUATION: [Your evaluation here]
IS_CORRECT: [true/false]
CORRECTED_RESPONSE: [Only if IS_CORRECT is false, provide the corrected response]`;

    let evaluationResponse: string;
    
    if (originalModel === 'openai') {
      // Use Gemini for evaluation
      if (!genAI) {
        return { isCorrect: true, evaluation: "Evaluation not available" };
      }
      
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const result = await geminiModel.generateContent(evaluationPrompt);
      evaluationResponse = result.response.text();
    } else {
      // Use OpenAI for evaluation
      if (!process.env.OPENAI_API_KEY) {
        return { isCorrect: true, evaluation: "Evaluation not available" };
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: evaluationPrompt,
          },
        ],
        max_tokens: 300,
      });
      
      evaluationResponse = completion.choices[0]?.message?.content || '';
    }

    // Parse the evaluation response
    const isCorrect = evaluationResponse.toLowerCase().includes('is_correct: true');
    const evaluation = evaluationResponse.split('EVALUATION:')[1]?.split('IS_CORRECT:')[0]?.trim() || 'Evaluation completed';
    
    let regeneratedResponse: string | undefined;
    
    if (!isCorrect) {
      // Extract corrected response if available
      const correctedMatch = evaluationResponse.match(/CORRECTED_RESPONSE:\s*([\s\S]*?)(?:\n|$)/);
      if (correctedMatch) {
        regeneratedResponse = correctedMatch[1].trim();
      } else {
        // Generate a new response using the opposite model
        if (originalModel === 'openai' && genAI) {
          const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
          const personaPrompt = getPersonaPrompt(persona);
          const fullPrompt = `${personaPrompt}\n\nUser: ${userMessage}\n\nNote: Please provide a corrected and improved response.`;
          const result = await geminiModel.generateContent(fullPrompt);
          regeneratedResponse = result.response.text();
        } else if (originalModel === 'gemini' && process.env.OPENAI_API_KEY) {
          const personaPrompt = getPersonaPrompt(persona);
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: personaPrompt,
              },
              {
                role: 'user',
                content: `${userMessage}\n\nNote: Please provide a corrected and improved response.`,
              },
            ],
            max_tokens: 800,
          });
          regeneratedResponse = completion.choices[0]?.message?.content || '';
        }
      }
    }

    return { 
      isCorrect, 
      evaluation, 
      regeneratedResponse 
    };
  } catch (error) {
    console.error('Cross-model evaluation failed:', error);
    return { isCorrect: true, evaluation: "Evaluation failed" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, persona, model = 'gemini', useEvaluation = false } = await request.json();

    console.log(`[API] Received request - Persona: ${persona}, Model: ${model}, Message: ${message.substring(0, 100)}..., UseEvaluation: ${useEvaluation}`);

    if (!message || !persona) {
      console.log('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Message and persona are required' },
        { status: 400 }
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    
    if (model === 'gemini') {
      console.log('[API] Using Gemini streaming');
      const geminiStream = await handleGeminiStream(message, persona);
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = '';
            
            for await (const chunk of geminiStream) {
              const text = chunk.text();
              if (text) {
                fullResponse += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
              }
            }
            
            // If evaluation is enabled, evaluate the response
            if (useEvaluation && fullResponse) {
              console.log('[API] Evaluating Gemini response with OpenAI');
              const evaluation = await evaluateResponseWithOppositeModel(
                fullResponse, 'gemini', persona, message
              );
              
              if (!evaluation.isCorrect && evaluation.regeneratedResponse) {
                console.log('[API] Regenerating response due to evaluation failure');
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  content: '\n\n---\n**Response Regenerated by Evaluation:**\n\n' + evaluation.regeneratedResponse 
                })}\n\n`));
              } else if (!evaluation.isCorrect) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  content: '\n\n---\n**Evaluation Note:** ' + evaluation.evaluation 
                })}\n\n`));
              }
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          } catch (error) {
            console.error('Gemini streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      console.log('[API] Using OpenAI streaming');
      const openaiStream = await handleOpenAIStream(message, persona);
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = '';
            
            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            
            // If evaluation is enabled, evaluate the response
            if (useEvaluation && fullResponse) {
              console.log('[API] Evaluating OpenAI response with Gemini');
              const evaluation = await evaluateResponseWithOppositeModel(
                fullResponse, 'openai', persona, message
              );
              
              if (!evaluation.isCorrect && evaluation.regeneratedResponse) {
                console.log('[API] Regenerating response due to evaluation failure');
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  content: '\n\n---\n**Response Regenerated by Evaluation:**\n\n' + evaluation.regeneratedResponse 
                })}\n\n`));
              } else if (!evaluation.isCorrect) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  content: '\n\n---\n**Evaluation Note:** ' + evaluation.evaluation 
                })}\n\n`));
              }
            }
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          } catch (error) {
            console.error('OpenAI streaming error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
  } catch (error) {
    console.error('[API] Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
