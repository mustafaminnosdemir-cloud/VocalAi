
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { PrebuiltVoice, VoiceStyle, ScriptAnalysis } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeScript(text: string): Promise<ScriptAnalysis> {
    try {
        const systemPrompt = `You are “VocalForge AI” – a next-generation AI voiceover engine. 
        Your task is to transform any script into a studio-quality, human-grade, emotionally accurate voiceover.
        
        Analyze the script for errors, grammar, and pacing. Autocorrect or enhance meaning.
        Detect the purpose (ad, narration, etc.).
        
        Return a JSON object with:
        1. analysis: A summary of improvements, target audience, and tone fixes.
        2. finalScript: The fully optimized script with (acting cues) in parentheses.
        3. technicalSpecs: Suggested audio settings.
        
        Language: Turkish (unless the input is clearly English, then English).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: { type: Type.STRING },
                        finalScript: { type: Type.STRING },
                        technicalSpecs: {
                            type: Type.OBJECT,
                            properties: {
                                format: { type: Type.STRING },
                                pace: { type: Type.STRING },
                                emotionLevel: { type: Type.NUMBER },
                                suggestedStyle: { type: Type.STRING },
                                durationEstimate: { type: Type.STRING },
                            }
                        }
                    }
                }
            }
        });

        const resultText = response.text;
        if (!resultText) throw new Error("No analysis generated");
        
        return JSON.parse(resultText) as ScriptAnalysis;

    } catch (error) {
        console.error("Analysis failed:", error);
        throw new Error("Script analysis failed. Please try again.");
    }
}

export async function generateVoiceover(
  text: string,
  voice: PrebuiltVoice,
  style: VoiceStyle
): Promise<string> {
  try {
    // Remove acting cues in parentheses like (whisper) or (excited) for the actual TTS generation
    // so the model doesn't read them out loud, although sometimes it understands them.
    // For safety with the current model, we send the text as is, but we instruct the model 
    // via the prompt to perform it.
    
    const prompt = `Perform a voiceover with the following text. 
    The voice tone should be ${style}. 
    Speak clearly and professionally. 
    Do not read out loud any stage directions in parentheses like (pause) or (whisper), act them out instead if possible, or ignore them.
    
    Text: ${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('The AI could not generate audio for the provided text. This may be due to content safety filters.');
    }

    return base64Audio;
  } catch (error) {
    console.error('Error generating voiceover:', error);
    
    if (error instanceof Error) {
        const lowerCaseError = error.message.toLowerCase();
        if (lowerCaseError.includes('api key')) {
            throw new Error('Invalid API Key. Please ensure your API key is correctly configured.');
        }
        if (lowerCaseError.includes('quota') || lowerCaseError.includes('resource has been exhausted')) {
            throw new Error('API quota exceeded.');
        }
        if (lowerCaseError.includes('billing')) {
            throw new Error('Billing issue with your project.');
        }
        if (lowerCaseError.includes('timed out')) {
            throw new Error('Request timed out.');
        }
        throw new Error(`Generation failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during voiceover generation.');
  }
}
