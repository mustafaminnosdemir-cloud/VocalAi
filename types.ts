
export const PREBUILT_VOICES = [
    { name: 'Kadın - Soft Premium (Kore)', value: 'Kore', description: 'Soft Premium, Calm Storyteller, Luxury Commercial' },
    { name: 'Kadın - High Energy (Zephyr)', value: 'Zephyr', description: 'Social Media, High-Energy, Confident' },
    { name: 'Erkek - Warm Corporate (Puck)', value: 'Puck', description: 'Warm Corporate, Conversational, Friendly' },
    { name: 'Erkek - Deep Cinematic (Fenrir)', value: 'Fenrir', description: 'Deep Cinematic, Movie Trailer, Epic' },
] as const;

export type PrebuiltVoice = typeof PREBUILT_VOICES[number]['value'];

export const VOICE_STYLES = [
    'Profesyonel & Net', 
    'Duygusal & Vurgulu', 
    'Heyecanlı & Hızlı', 
    'Sakin & Güven Verici',
    'Sinematik & Epik'
] as const;

export type VoiceStyle = typeof VOICE_STYLES[number];

export interface ScriptAnalysis {
    analysis: string;
    finalScript: string;
    technicalSpecs: {
        format: string;
        pace: string;
        emotionLevel: number;
        suggestedStyle: string;
        durationEstimate: string;
    };
}
