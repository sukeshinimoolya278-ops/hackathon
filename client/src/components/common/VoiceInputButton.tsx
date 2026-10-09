import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  label = 'Voice Input',
}) => {
  const { isListening, isSupported, toggleListening } = useVoiceInput(onTranscript);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      title={isListening ? 'Listening... click to stop' : 'Click to speak'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isListening
          ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
      } ${className}`}
    >
      {isListening ? (
        <>
          <MicOff className="w-3.5 h-3.5 text-rose-600" />
          <span>Listening...</span>
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-teal-600" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
