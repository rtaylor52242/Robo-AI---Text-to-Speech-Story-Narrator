import React from 'react';
import { X, MessageSquare, Mic, Music, Play, Download, Users } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/90">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-robo-500 rounded-full"></span>
            How to Use Robo AI
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Script Input */}
          <section className="flex gap-5">
            <div className="shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-robo-400 border border-gray-700">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Write Your Script</h3>
              <p className="text-gray-400 mb-3 leading-relaxed">
                Enter your story in the script editor on the left. The app automatically detects speakers if you use the standard format:
              </p>
              <div className="bg-gray-950 border border-gray-800 p-4 rounded-lg font-mono text-sm text-gray-300">
                <p><span className="text-robo-400">[Speaker 1]:</span> Hello, how are you today?</p>
                <p><span className="text-neon-purple">[Narrator]:</span> The sun was setting behind the hills.</p>
                <p><span className="text-green-400">John:</span> I am ready for the adventure!</p>
              </div>
            </div>
          </section>

          {/* Section 2: Voice Mapping */}
          <section className="flex gap-5">
            <div className="shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-neon-purple border border-gray-700">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Assign Voices</h3>
              <p className="text-gray-400 leading-relaxed">
                Once your script is parsed, identified speakers appear in the right column. 
                Use the <strong>Dropdown Menu</strong> to assign a specific Google AI voice to each character.
                You can adjust <strong>Speed</strong> and <strong>Volume</strong> to give each character a unique personality.
              </p>
            </div>
          </section>

          {/* Section 3: Voice Cloning */}
          <section className="flex gap-5">
            <div className="shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-red-500 border border-gray-700">
              <Mic size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Clone a Voice</h3>
              <p className="text-gray-400 mb-2 leading-relaxed">
                Want a unique voice? Click the <span className="inline-flex items-center justify-center p-1 bg-gray-800 rounded border border-gray-700 mx-1"><Mic size={12} /></span> icon next to the voice dropdown.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400 text-sm">
                  <li>Record 10-30 seconds of your voice.</li>
                  <li>The AI analyzes the tone and pitch.</li>
                  <li>Save it as a custom voice (e.g., "Hero Clone") to use in your story.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Music & Generate */}
          <section className="flex gap-5">
            <div className="shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-yellow-500 border border-gray-700">
              <Play size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">4. Add Music & Generate</h3>
              <p className="text-gray-400 mb-2 leading-relaxed">
                <strong>Background Music:</strong> Upload an audio file to play ambient sound behind the narration.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Click the big <strong>Generate Audio</strong> button to process the text. The AI will render each line and stitch them together into a cohesive story.
              </p>
            </div>
          </section>

           {/* Section 5: Download */}
           <section className="flex gap-5">
            <div className="shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-green-500 border border-gray-700">
              <Download size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">5. Download</h3>
              <p className="text-gray-400 leading-relaxed">
                Once generation is complete, use the Player to preview. Satisfied? Click the Download button to save the full story as a <code>.wav</code> file.
              </p>
            </div>
          </section>

        </div>
        
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-robo-600 hover:bg-robo-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-robo-900/20"
          >
            Got it, let's create!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;