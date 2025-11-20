import React, { useState, useRef } from 'react';
import { ClonedVoice } from '../types';
import { Mic, Square, Play, Save, Loader2, X } from 'lucide-react';

interface VoiceCloneModalProps {
  onClose: () => void;
  onSave: (voice: ClonedVoice) => void;
}

const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({ onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      let t = 0;
      timerRef.current = window.setInterval(() => {
        t++;
        setTimer(t);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access required for voice cloning.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleAnalyzeAndSave = () => {
    if (!voiceName || !audioBlob) return;

    setIsAnalyzing(true);
    
    // Simulate API Analysis Delay
    setTimeout(() => {
      setIsAnalyzing(false);
      const newVoice: ClonedVoice = {
        id: `clone_${Date.now()}`,
        name: voiceName,
        // We fallback to a random prebuilt voice for the simulation
        baseVoice: ['Puck', 'Kore', 'Fenrir'][Math.floor(Math.random() * 3)],
        createdAt: Date.now()
      };
      onSave(newVoice);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-robo-500 rounded-full"></span>
            Voice Cloning Lab
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Recording Area */}
          <div className="bg-gray-800/50 rounded-xl p-6 flex flex-col items-center justify-center border border-gray-700 border-dashed min-h-[160px]">
            {!audioBlob ? (
              <>
                <div className="text-4xl font-mono mb-4 text-robo-400">
                  00:{timer.toString().padStart(2, '0')}
                </div>
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-semibold transition-all"
                  >
                    <Mic size={20} /> Start Recording
                  </button>
                ) : (
                  <button 
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold animate-pulse"
                  >
                    <Square size={20} /> Stop Recording
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-4">Record 10-30 seconds of clear speech.</p>
              </>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg mb-4">
                  <span className="text-sm text-gray-300">Sample Recorded</span>
                  <button onClick={() => setAudioBlob(null)} className="text-xs text-red-400 hover:text-red-300">Reset</button>
                </div>
                <audio controls src={URL.createObjectURL(audioBlob)} className="w-full h-8 mb-4" />
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Name your Voice Model</label>
                  <input 
                    type="text" 
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="e.g., Hero Clone"
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-robo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
             <button 
               onClick={onClose}
               className="px-4 py-2 text-gray-400 hover:text-white"
             >
               Cancel
             </button>
             <button 
               onClick={handleAnalyzeAndSave}
               disabled={!audioBlob || !voiceName || isAnalyzing}
               className="flex items-center gap-2 px-6 py-2 bg-robo-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold hover:bg-robo-500 transition-colors"
             >
               {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
               {isAnalyzing ? 'Analyzing...' : 'Save Voice'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloneModal;
