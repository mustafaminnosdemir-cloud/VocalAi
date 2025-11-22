
import React, { useState, useCallback, useRef } from 'react';
import { PREBUILT_VOICES, PrebuiltVoice, VOICE_STYLES, VoiceStyle, ScriptAnalysis } from './types';
import { generateVoiceover, analyzeScript } from './services/geminiService';
import { decode, decodeAudioData, bufferToWave } from './utils/audioUtils';
import Spinner from './components/Spinner';

const initialText = `Ida Vision ile tanışın. Hayallerinizdeki reklam filmleri için en net, en profesyonel sesler.`;

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-2">
        <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
        <path d="M5.5 9.5a.5.5 0 00-1 0v1a5 5 0 005 5v2.5a.5.5 0 001 0V15a5 5 0 005-5v-1a.5.5 0 00-1 0v1a4 4 0 01-4 4h-2a4 4 0 01-4-4v-1z" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z" clipRule="evenodd" />
    </svg>
);

function App() {
  // Drafting State
  const [draftText, setDraftText] = useState<string>(initialText);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // Production State
  const [analysisData, setAnalysisData] = useState<ScriptAnalysis | null>(null);
  const [finalText, setFinalText] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<PrebuiltVoice>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<VoiceStyle>('Profesyonel & Net');
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioContext = useRef<AudioContext | null>(null);
  if (!audioContext.current) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
        audioContext.current = new AudioContext({ sampleRate: 24000 });
    }
  }

  const handleAnalyze = async () => {
    if (!draftText.trim()) {
        setError('Lütfen analiz için bir metin girin.');
        return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null);
    setAudioUrl(null);

    try {
        const result = await analyzeScript(draftText);
        setAnalysisData(result);
        setFinalText(result.finalScript);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Analiz sırasında bir hata oluştu.');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!finalText.trim()) {
      setError('Lütfen seslendirilecek bir metin girin.');
      return;
    }
    if (!audioContext.current) {
      setError('Web Audio API is not supported in this browser.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);

    try {
      const base64Audio = await generateVoiceover(finalText, selectedVoice, selectedStyle);
      
      try {
        const rawAudioData = decode(base64Audio);
        const audioBuffer = await decodeAudioData(rawAudioData, audioContext.current, 24000, 1);
        const wavBlob = bufferToWave(audioBuffer);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
      } catch (processingError) {
        console.error('Audio processing failed:', processingError);
        throw new Error('Ses işlenirken hata oluştu.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmedik bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  }, [finalText, selectedVoice, selectedStyle]);
  
  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col items-center justify-start p-4 selection:bg-indigo-500/30 font-sans">
      <div className="w-full max-w-4xl mx-auto mt-8">
        
        {/* Header */}
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-4 tracking-tight">
              VocalForge AI
            </h1>
            <p className="text-gray-400 text-lg">Ida Vision Ultra Profesyonel Ses Oluşturucu</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Input & Analysis */}
            <div className="space-y-6">
                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <span className="bg-gray-800 p-2 rounded-lg mr-3">1</span> 
                        Metin Girişi
                    </h2>
                    <textarea
                        rows={6}
                        className="w-full p-4 border border-gray-700 rounded-xl bg-gray-950 text-gray-200 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        placeholder="Ham metninizi buraya yapıştırın..."
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? <Spinner className="mr-2" /> : <SparklesIcon />}
                        {isAnalyzing ? 'Analiz Ediliyor...' : 'Analiz Et ve İyileştir'}
                    </button>
                </div>

                {analysisData && (
                    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 animate-fade-in">
                         <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                            🔍 Senaryo Analizi
                        </h2>
                        <div className="bg-gray-950/50 rounded-xl p-4 border border-gray-800 mb-4">
                            <p className="text-sm text-gray-300 italic leading-relaxed">{analysisData.analysis}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                                <span className="block text-gray-500 uppercase text-[10px] font-bold tracking-wider">Tempo</span>
                                <span className="text-indigo-300">{analysisData.technicalSpecs.pace}</span>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                                <span className="block text-gray-500 uppercase text-[10px] font-bold tracking-wider">Duygu Seviyesi</span>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-1">
                                    <div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${analysisData.technicalSpecs.emotionLevel * 10}%`}}></div>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                                <span className="block text-gray-500 uppercase text-[10px] font-bold tracking-wider">Stil Önerisi</span>
                                <span className="text-indigo-300">{analysisData.technicalSpecs.suggestedStyle}</span>
                            </div>
                            <div className="bg-gray-800/50 p-2 rounded-lg border border-gray-700">
                                <span className="block text-gray-500 uppercase text-[10px] font-bold tracking-wider">Süre</span>
                                <span className="text-indigo-300">{analysisData.technicalSpecs.durationEstimate}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Production */}
            <div className="space-y-6">
                <div className={`bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl overflow-hidden p-6 transition-all duration-500 ${analysisData ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white flex items-center">
                            <span className="bg-gray-800 p-2 rounded-lg mr-3">2</span> 
                            Stüdyo Ayarları
                        </h2>
                        {analysisData && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-800">Optimize Edildi</span>}
                    </div>
                    
                    <div className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Final Script (Düzenlenebilir)</label>
                            <textarea
                                rows={8}
                                className="w-full p-4 border border-gray-600 rounded-xl bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm leading-relaxed"
                                value={finalText}
                                onChange={(e) => setFinalText(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sanatçı Sesi</label>
                                <select
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value as PrebuiltVoice)}
                                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-pink-500"
                                >
                                    {PREBUILT_VOICES.map((voice) => (
                                    <option key={voice.value} value={voice.value}>
                                        {voice.name}
                                    </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 truncate">
                                    {PREBUILT_VOICES.find(v => v.value === selectedVoice)?.description}
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tonlama</label>
                                <select
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value as VoiceStyle)}
                                    className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-pink-500"
                                >
                                    {VOICE_STYLES.map((style) => (
                                    <option key={style} value={style}>
                                        {style}
                                    </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full mt-6 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all transform hover:scale-[1.02] flex items-center justify-center disabled:opacity-50"
                        >
                            {isGenerating ? (
                            <>
                                <Spinner className="w-5 h-5 mr-3 text-black" />
                                Ses Oluşturuluyor...
                            </>
                            ) : (
                            <>
                                <MicrophoneIcon />
                                Sesi Oluştur
                            </>
                            )}
                        </button>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start animate-pulse">
                    <div className="mr-3 text-xl">⚠️</div>
                    <div>
                        <p className="font-bold text-sm">Hata</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
                )}

                {/* AUDIO PLAYER */}
                {audioUrl && (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-6 rounded-2xl shadow-2xl animate-fade-in-up">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            Seslendirmeniz Hazır
                        </h3>
                        <a href={audioUrl} download="vocalforge-output.wav" className="text-xs text-indigo-400 hover:text-indigo-300 underline">
                            İndir (WAV)
                        </a>
                    </div>
                    <audio controls src={audioUrl} className="w-full custom-audio" />
                </div>
                )}
            </div>
        </div>

        <footer className="text-center mt-12 pb-8 text-xs text-gray-600">
            <p>POWERED BY GEMINI 2.5 FLASH & TTS • IDA VISION</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
