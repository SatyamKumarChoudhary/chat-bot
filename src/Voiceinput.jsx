import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const VoiceInput = ({ 
  onTranscriptionComplete, 
  onStatusUpdate, 
  disabled = false,
  placeholder = "Click to speak..." 
}) => {
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleVoiceClick = () => {
    if (disabled || isProcessingVoice) return;
    
    // Simple placeholder for now
    onStatusUpdate('success', '🎯 Voice feature coming soon!');
    onTranscriptionComplete('A12345678'); // Demo transcription
  };

  const styles = {
    voiceButton: {
      border: 'none',
      borderRadius: '25px',
      padding: '14px 16px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      minWidth: '52px',
      opacity: disabled ? 0.5 : 1,
      background: disabled
        ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white'
    }
  };

  return (
    <button 
      onClick={handleVoiceClick}
      disabled={disabled || isProcessingVoice}
      style={styles.voiceButton}
      title={disabled ? 'Voice input disabled' : 'Click to Speak'}
    >
      {isProcessingVoice ? (
        <Volume2 size={18} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
};

export default VoiceInput;