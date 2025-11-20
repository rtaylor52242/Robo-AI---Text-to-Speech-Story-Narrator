
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Settings, Mic, Upload, Download, Play, RefreshCw, 
  Music, Sliders, User, Save, CheckCircle, Trash2, AlertCircle, CircleHelp 
} from 'lucide-react';
import { ScriptSegment, SpeakerMap, VoiceConfig, ClonedVoice, GenerationStatus } from './types';
import { PREBUILT_VOICES, DEFAULT_SCRIPT, SAMPLE_RATES } from './constants';
import { generateSpeech } from './services/geminiService';
import { audioBufferToBlob, mergeAudioBuffers, rawPcmToAudioBuffer } from './utils/audioUtils';
import VoiceCloneModal from './components/VoiceCloneModal';
import AudioPlayer from './components/AudioPlayer';
import HelpModal from './components/HelpModal';

function App() {
  const [scriptText, setScriptText] = useState(DEFAULT_SCRIPT);
  const [segments, setSegments] = useState<ScriptSegment[]>([]);
  const [speakerMap, setSpeakerMap] = useState<SpeakerMap>({});
  const [clonedVoices, setClonedVoices] = useState<ClonedVoice[]>([]);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [bgMusic, setBgMusic] = useState<File | null>(null);
  const [bgMusicUrl, setBgMusicUrl] = useState<string | null>(null);
  
  // Playback state
  const [fullAudioBuffer, setFullAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);

  // API Key
  const apiKey = process.env.API_KEY || '';

  // --- Parsing Logic ---
  const parseScript = useCallback((text: string) => {
    const lines = text.split('\n');
    const newSegments: ScriptSegment[] = [];
    const newSpeakerMap: SpeakerMap = { ...speakerMap };
    const speakersFound = new Set<string>();

    // Regex looks for [Name]: Text OR Name: Text
    const regex = /^(?:\[)?([^:\]]+)(?:\])?:?\s+(.*)$/;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(regex);
      if (match) {
        const speakerName = match[1].trim();
        const content = match[2].trim();
        
        if (!content) return;

        newSegments.push({
          id: `seg_${index}`,
          speaker: speakerName,
          text: content,
        });

        speakersFound.add(speakerName);
      }
    });

    // Initialize map for new speakers
    speakersFound.forEach(speaker => {
      if (!newSpeakerMap[speaker]) {
        // Auto assign a voice round-robin
        const voiceIndex = Object.keys(newSpeakerMap).length % PREBUILT_VOICES.length;
        newSpeakerMap[speaker] = {
          voiceName: PREBUILT_VOICES[voiceIndex].name,
          pitch: 1.0,
          speed: 1.0,
          volume: 1.0
        };
      }
    });

    setSegments(newSegments);
    setSpeakerMap(newSpeakerMap);
  }, [speakerMap]);

  // Initial parse
  useEffect(() => {
    parseScript(scriptText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScriptText(e.target.value);
  };

  // --- Voice Management ---
  const updateSpeakerVoice = (speaker: string, updates: Partial<VoiceConfig>) => {
    setSpeakerMap(prev => ({
      ...prev,
      [speaker]: { ...prev[speaker], ...updates }
    }));
  };

  const handleCloneSave = (voice: ClonedVoice) => {
    setClonedVoices(prev => [...prev, voice]);
    setIsCloneModalOpen(false);
    alert(`Voice "${voice.name}" saved to library!`);
  };

  // --- Generation Logic ---
  const generateSegmentAudio = async (segment: ScriptSegment, ctx: AudioContext): Promise<AudioBuffer> => {
    if (!apiKey) throw new Error("API Key missing");
    
    const config = speakerMap[segment.speaker];
    const voiceToUse = config.isCloned 
      ? clonedVoices.find(c => c.id === config.voiceName)?.baseVoice || 'Puck'
      : config.voiceName;

    const buffer = await generateSpeech(segment.text, voiceToUse, apiKey);
    
    // Use helper to convert raw PCM 24kHz mono to AudioBuffer
    return rawPcmToAudioBuffer(buffer, ctx, 24000);
  };

  const handleGenerateAll = async () => {
    if (segments.length === 0) return;
    setGenerationStatus(GenerationStatus.GENERATING);
    setIsPlaying(false);

    // Create a single context for processing this batch
    const processingCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    try {
      // We create a temporary promise array
      const promises = segments.map(async (seg) => {
         return generateSegmentAudio(seg, processingCtx);
      });

      const results = await Promise.all(promises);
      
      // Merge buffers
      const merged = mergeAudioBuffers(processingCtx, results, 0.5); // 0.5s gap between lines
      
      setFullAudioBuffer(merged);
      setGenerationStatus(GenerationStatus.COMPLETED);
    } catch (error) {
      console.error(error);
      setGenerationStatus(GenerationStatus.ERROR);
      alert("Failed to generate audio. Check console for details.");
    }
  };

  const handleBgMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBgMusic(file);
      const url = URL.createObjectURL(file);
      setBgMusicUrl(url);
    }
  };

  const downloadAudio = () => {
    if (!fullAudioBuffer) return;
    const blob = audioBufferToBlob(fullAudioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Story_${new Date().toISOString().split('T')[0]}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Rendering ---

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-robo-500 selection:text-white">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-gray-800 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-robo-500 to-neon-purple rounded-lg flex items-center justify-center">
              <Mic size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Robo AI <span className="text-robo-400 font-mono text-sm">Text-to-Speech Story Narrator</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {!apiKey && (
                <span className="text-xs text-red-400 flex items-center gap-1 bg-red-400/10 px-2 py-1 rounded border border-red-400/20">
                  <AlertCircle size={12}/> API Key Missing
                </span>
             )}
             <button 
               onClick={() => setIsHelpOpen(true)}
               className="p-2 text-gray-400 hover:text-white transition-colors"
               title="Help & Documentation"
             >
               <CircleHelp size={20} />
             </button>
             <button className="p-2 text-gray-400 hover:text-white transition-colors">
               <Settings size={20} />
             </button>
             <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
               <User size={16} />
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Script Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-1">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 rounded-t-xl border-b border-gray-800">
                <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-robo-500 rounded-full"></span> Script Editor
                </h2>
                <button 
                  onClick={() => parseScript(scriptText)}
                  className="text-xs flex items-center gap-1 text-robo-400 hover:text-robo-300 transition-colors"
                >
                  <RefreshCw size={12} /> Reparse
                </button>
              </div>
              <textarea
                value={scriptText}
                onChange={handleTextChange}
                className="w-full h-[600px] bg-transparent p-4 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:bg-gray-900/30 transition-colors scrollbar-thin"
                placeholder="[Speaker 1]: Enter your story script here..."
                spellCheck={false}
              />
            </div>
            
            <div className="text-xs text-gray-500 px-2">
              <p>Tip: Use format <code>[Speaker Name]: Dialogue</code> for best auto-detection.</p>
            </div>
          </div>

          {/* Right Column: Settings & Output */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Voice Mapping */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                 <Sliders size={18} className="text-robo-500"/> Voice Mapping
              </h3>
              
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {Object.keys(speakerMap).length === 0 && (
                  <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                    No speakers detected. Add script to map voices.
                  </div>
                )}

                {(Object.entries(speakerMap) as [string, VoiceConfig][]).map(([speaker, config]) => (
                  <div key={speaker} className="bg-gray-900 border border-gray-800 p-4 rounded-xl hover:border-gray-700 transition-colors">
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      <div className="flex items-center gap-3 min-w-[150px]">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-bold text-xs text-robo-300 border border-gray-600">
                           {speaker.charAt(0).toUpperCase()}
                         </div>
                         <span className="font-semibold text-sm text-white">{speaker}</span>
                      </div>

                      {/* Voice Selection */}
                      <div className="flex-1 flex gap-2">
                        <select 
                          value={config.isCloned ? config.voiceName : config.voiceName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const isClone = val.startsWith('clone_');
                            updateSpeakerVoice(speaker, { 
                              voiceName: val,
                              isCloned: isClone 
                            });
                          }}
                          className="bg-gray-950 border border-gray-700 text-sm text-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-robo-500 outline-none w-full"
                        >
                          <optgroup label="Google Prebuilt">
                            {PREBUILT_VOICES.map(v => (
                              <option key={v.name} value={v.name}>{v.name} ({v.gender}, {v.style})</option>
                            ))}
                          </optgroup>
                          {clonedVoices.length > 0 && (
                            <optgroup label="My Cloned Voices">
                              {clonedVoices.map(c => (
                                <option key={c.id} value={c.id}>{c.name} (Custom)</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        
                        <button 
                          onClick={() => setIsCloneModalOpen(true)}
                          className="p-2 bg-gray-800 hover:bg-gray-700 text-robo-400 rounded-lg border border-gray-700 transition-colors tooltip"
                          title="Clone New Voice"
                        >
                          <Mic size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Voice Customization Controls (Mock UI mostly, effectively used for post-process speed) */}
                    <div className="mt-4 grid grid-cols-3 gap-4 pt-3 border-t border-gray-800/50">
                       <div className="space-y-1">
                         <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                           <span>Speed</span>
                           <span>{config.speed}x</span>
                         </div>
                         <input 
                           type="range" min="0.5" max="2.0" step="0.1"
                           value={config.speed}
                           onChange={(e) => updateSpeakerVoice(speaker, { speed: parseFloat(e.target.value) })}
                           className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-robo-500"
                         />
                       </div>
                       <div className="space-y-1 opacity-50 pointer-events-none" title="Unavailable in Preview model">
                         <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                           <span>Pitch</span>
                           <span>{config.pitch}</span>
                         </div>
                         <input 
                           type="range" min="0.5" max="2.0" step="0.1"
                           value={config.pitch}
                           onChange={(e) => updateSpeakerVoice(speaker, { pitch: parseFloat(e.target.value) })}
                           className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-robo-500"
                         />
                       </div>
                       <div className="space-y-1">
                         <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                           <span>Vol</span>
                           <span>{Math.round(config.volume * 100)}%</span>
                         </div>
                         <input 
                           type="range" min="0" max="1.0" step="0.1"
                           value={config.volume}
                           onChange={(e) => updateSpeakerVoice(speaker, { volume: parseFloat(e.target.value) })}
                           className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-robo-500"
                         />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Background Music */}
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-gray-800 rounded-lg text-neon-purple">
                   <Music size={20} />
                 </div>
                 <div>
                   <h4 className="text-sm font-semibold text-white">Background Ambience</h4>
                   <p className="text-xs text-gray-500">{bgMusic ? bgMusic.name : 'No audio selected'}</p>
                 </div>
               </div>
               <label className="cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-xs font-semibold text-white transition-colors flex items-center gap-2">
                 <Upload size={14} /> Select Music
                 <input type="file" accept="audio/*" className="hidden" onChange={handleBgMusicUpload} />
               </label>
            </div>

            {/* 3. Action Area */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleGenerateAll}
                  disabled={segments.length === 0 || generationStatus === GenerationStatus.GENERATING}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                    generationStatus === GenerationStatus.GENERATING 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-900/30'
                  }`}
                >
                  {generationStatus === GenerationStatus.GENERATING ? (
                    <RefreshCw className="animate-spin" /> 
                  ) : (
                    <Play fill="currentColor" />
                  )}
                  {generationStatus === GenerationStatus.GENERATING ? 'Rendering Audio...' : 'Generate Full Audio'}
                </button>
                
                <button 
                  onClick={downloadAudio}
                  disabled={!fullAudioBuffer}
                  className="px-6 py-4 bg-gray-800 border border-gray-700 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Download Audio"
                >
                  <Download size={24} />
                </button>
              </div>

              <AudioPlayer 
                audioBuffer={fullAudioBuffer} 
                bgMusicUrl={bgMusicUrl}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
              />
            </div>

          </div>
        </div>
      </main>

      {isCloneModalOpen && (
        <VoiceCloneModal 
          onClose={() => setIsCloneModalOpen(false)}
          onSave={handleCloneSave}
        />
      )}
      
      {isHelpOpen && (
        <HelpModal 
          onClose={() => setIsHelpOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
