import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const VoiceInput = ({ 
  onTranscriptionComplete, 
  onStatusUpdate, 
  disabled = false,
  placeholder = "Click to speak..." 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Web Speech API for restricted environments
  const processAudioWithWebSpeech = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onStatusUpdate('error', '❌ Speech recognition not supported in this browser.');
      setIsProcessingVoice(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      onStatusUpdate('listening', '🎤 Listening... Speak clearly now');
    };
    
    recognition.onresult = (event) => {
      const transcribedText = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      if (transcribedText.trim()) {
        onStatusUpdate('success', `🎯 I heard: "${transcribedText}"`);
        onTranscriptionComplete(transcribedText);
      } else {
        onStatusUpdate('error', '🔇 Sorry, I couldn\'t understand. Please try again.');
      }
      setIsProcessingVoice(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = '❌ Speech recognition failed. ';
      
      switch(event.error) {
        case 'not-allowed':
          errorMessage += 'Microphone access denied. Please allow microphone permissions.';
          break;
        case 'no-speech':
          errorMessage += 'No speech detected. Please try again.';
          break;
        case 'network':
          errorMessage += 'Network error. Please check your connection.';
          break;
        default:
          errorMessage += `Error: ${event.error}. Please try text input.`;
      }
      
      onStatusUpdate('error', errorMessage);
      setIsProcessingVoice(false);
    };
    
    recognition.onend = () => {
      setIsProcessingVoice(false);
      onStatusUpdate('idle', '');
    };
    
    try {
      recognition.start();
    } catch (error) {
      onStatusUpdate('error', '❌ Could not start speech recognition. Please use text input.');
      setIsProcessingVoice(false);
    }
  };

  // AWS Transcribe with fallback to Web Speech
  const processAudioWithTranscribe = async (audioBlob) => {
    try {
      onStatusUpdate('processing', '🔄 Processing your voice with AWS Transcribe...');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      
      const response = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!response.ok) {
        throw new Error('AWS Transcribe failed - falling back to browser speech recognition');
      }

      const data = await response.json();
      const transcribedText = data.transcript || data.text || '';
      
      if (transcribedText.trim()) {
        onStatusUpdate('success', `🎯 AWS Transcribe heard: "${transcribedText}"`);
        onTranscriptionComplete(transcribedText);
      } else {
        throw new Error('Empty transcription from AWS');
      }
      
    } catch (error) {
      console.error('AWS Transcribe failed, using Web Speech API:', error);
      onStatusUpdate('processing', '🔄 AWS failed, trying browser speech recognition...');
      // Fallback to browser-based speech recognition
      setTimeout(() => {
        processAudioWithWebSpeech();
      }, 500);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Start recording for AWS Transcribe
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Process the audio
        await processAudioWithTranscribe(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      onStatusUpdate('recording', '🎤 Recording... Click microphone again to stop');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onStatusUpdate('error', '❌ Microphone access denied. Trying browser speech recognition...');
      
      // Fallback to direct speech recognition
      setTimeout(() => {
        processAudioWithWebSpeech();
      }, 500);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
      
      onStatusUpdate('processing', '🔄 Processing your recording...');
    }
  };

  // Main voice input handler
  const handleVoiceClick = () => {
    if (disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else if (isProcessingVoice) {
      return; // Do nothing if already processing
    } else {
      // For most environments, try direct Web Speech API first
      setIsProcessingVoice(true);
      processAudioWithWebSpeech();
    }
  };

  // Component styles
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
      opacity: disabled ? 0.5 : 1
    }
  };

  return (
    <button 
      onClick={handleVoiceClick}
      disabled={disabled || isProcessingVoice}
      style={{
        ...styles.voiceButton,
        background: isRecording 
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : isProcessingVoice
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : disabled
          ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        transform: (isRecording || isProcessingVoice) ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isRecording 
          ? '0 6px 20px rgba(239, 68, 68, 0.4)'
          : isProcessingVoice
          ? '0 6px 20px rgba(245, 158, 11, 0.4)'
          : '0 4px 12px rgba(16, 185, 129, 0.3)'
      }}
      title={
        disabled 
          ? 'Voice input disabled' 
          : isRecording 
          ? 'Stop Recording' 
          : isProcessingVoice 
          ? 'Processing...' 
          : 'Click to Speak'
      }
    >
      {isProcessingVoice ? (
        <Volume2 size={18} />
      ) : isRecording ? (
        <MicOff size={18} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
};

export default VoiceInput;