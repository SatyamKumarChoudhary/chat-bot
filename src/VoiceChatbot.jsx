import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Phone, User } from 'lucide-react';

const VoiceChatbot = () => {
  // Enhanced customer database
  const customerDatabase = [
    { phone: "1234567890", name: "John Smith", id: "CUST001", idNumber: "A12345678" },
    { phone: "9876543210", name: "Sarah Johnson", id: "CUST002", idNumber: "B87654321" },
    { phone: "5555555555", name: "Mike Chen", id: "CUST003", idNumber: "C11111111" },
    { phone: "1111222233", name: "Emily Davis", id: "CUST004", idNumber: "D22233444" },
    { phone: "9999888877", name: "David Wilson", id: "CUST005", idNumber: "E99988877" }
  ];

  const [authStep, setAuthStep] = useState('id');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [enteredId, setEnteredId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("Hello! I'm Sarah, your Maybank voice assistant. Please speak your National ID or Passport Number for verification.");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Avatar animation states
  const [avatarState, setAvatarState] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'

  // Refs for speech recognition and synthesis
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setAvatarState('listening');
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setAvatarState('thinking');
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setAvatarState('idle');
        console.error('Speech recognition error:', event.error);
      };
    }

    // Speak initial message
    speakMessage("Hello! I'm Sarah, your Maybank voice assistant. Please speak your National ID or Passport Number for verification.");

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const speakMessage = (message) => {
    if (!audioEnabled) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    setCurrentMessage(message);
    setIsSpeaking(true);
    setAvatarState('speaking');
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    
    // Try to use a female voice
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen') ||
      voice.name.includes('Victoria')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setAvatarState('idle');
    };
    
    speechSynthesis.speak(utterance);
    speechSynthesisRef.current = utterance;
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceInput = async (transcript) => {
    setConversationHistory(prev => [...prev, { type: 'user', message: transcript }]);
    
    if (authStep === 'id') {
      authenticateStep1(transcript);
    } else if (authStep === 'phone') {
      authenticateStep2(transcript);
    } else if (authStep === 'authenticated') {
      await handleQuery(transcript);
    }
  };

  const authenticateStep1 = (idNumber) => {
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    const customer = customerDatabase.find(c => c.idNumber === cleanId);
    
    if (customer) {
      setEnteredId(cleanId);
      setAuthStep('phone');
      const message = `Great! ID verified successfully. Now please speak your registered mobile number.`;
      setConversationHistory(prev => [...prev, { type: 'bot', message }]);
      setTimeout(() => speakMessage(message), 500);
    } else {
      setAuthStep('failed');
      const message = `I'm sorry, but the ID number you provided is not found in our Maybank records. For security reasons, please visit your nearest Maybank branch or call our customer service hotline.`;
      setConversationHistory(prev => [...prev, { type: 'bot', message }]);
      setTimeout(() => speakMessage(message), 500);
    }
  };

  const authenticateStep2 = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const customer = customerDatabase.find(c => 
      c.idNumber === enteredId && c.phone === cleanPhone
    );
    
    if (customer) {
      setCurrentCustomer(customer);
      setAuthStep('authenticated');
      const message = `Perfect! Authentication successful. Welcome back, ${customer.name}! I'm here to help you with all your banking needs. What can I assist you with today?`;
      setConversationHistory(prev => [...prev, { type: 'bot', message }]);
      setTimeout(() => speakMessage(message), 500);
    } else {
      setAuthStep('failed');
      const message = `I'm sorry, but the mobile number doesn't match with the provided ID. Please ensure you're using the correct mobile number registered with your account.`;
      setConversationHistory(prev => [...prev, { type: 'bot', message }]);
      setTimeout(() => speakMessage(message), 500);
    }
  };

  const handleQuery = async (query) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are Sarah, a professional and friendly Maybank customer service voice assistant. Customer: ${currentCustomer.name} (ID: ${currentCustomer.id}). Customer Query: ${query}. Provide helpful, conversational banking assistance in a natural speaking tone.`
        })
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();
      setConversationHistory(prev => [...prev, { type: 'bot', message: data.response }]);
      setTimeout(() => speakMessage(data.response), 500);

    } catch (error) {
      console.error('Error calling API:', error);
      const fallbackResponse = `Hello ${currentCustomer.name}, I'm experiencing some technical difficulties right now. Please try asking your question again in a moment, or you can call our customer service hotline for immediate assistance.`;
      setConversationHistory(prev => [...prev, { type: 'bot', message: fallbackResponse }]);
      setTimeout(() => speakMessage(fallbackResponse), 500);
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setAvatarState('idle');
    }
  };

  // Styles
  const styles = {
    container: {
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="white" fill-opacity="0.03"%3E%3Ccircle cx="50" cy="50" r="2"/%3E%3C/g%3E%3C/svg%3E")',
      animation: 'float 6s ease-in-out infinite'
    },
    header: {
      padding: '20px 30px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      zIndex: 2
    },
    brandInfo: {
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    brandText: {
      fontSize: '24px',
      fontWeight: '700',
      margin: 0,
      textShadow: '0 2px 10px rgba(0,0,0,0.3)'
    },
    statusInfo: {
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    },
    statusBadge: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backdropFilter: 'blur(10px)'
    },
    avatarSection: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      zIndex: 1
    },
    avatarContainer: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '30px'
    },
    avatar: {
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '120px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    avatarFace: {
      position: 'relative',
      zIndex: 2
    },
    avatarGlow: {
      position: 'absolute',
      top: '-20px',
      left: '-20px',
      right: '-20px',
      bottom: '-20px',
      borderRadius: '50%',
      opacity: 0,
      transition: 'all 0.3s ease'
    },
    listeningGlow: {
      background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
      opacity: avatarState === 'listening' ? 1 : 0,
      animation: avatarState === 'listening' ? 'pulse 2s infinite' : 'none'
    },
    speakingGlow: {
      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
      opacity: avatarState === 'speaking' ? 1 : 0,
      animation: avatarState === 'speaking' ? 'speakPulse 1s infinite' : 'none'
    },
    thinkingGlow: {
      background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
      opacity: avatarState === 'thinking' ? 1 : 0,
      animation: avatarState === 'thinking' ? 'think 1.5s infinite' : 'none'
    },
    messageDisplay: {
      maxWidth: '600px',
      textAlign: 'center',
      color: 'white',
      fontSize: '18px',
      lineHeight: '1.6',
      fontWeight: '500',
      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
      minHeight: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    controlsSection: {
      padding: '30px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      position: 'relative',
      zIndex: 2
    },
    controlButton: {
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)'
    },
    micButton: {
      background: isListening 
        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
        : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: 'white',
      transform: isListening ? 'scale(1.1)' : 'scale(1)'
    },
    audioButton: {
      background: audioEnabled 
        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      color: 'white'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern}></div>
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandInfo}>
          <div style={styles.brandText}>Maybank Voice Assistant</div>
        </div>
        <div style={styles.statusInfo}>
          {authStep === 'id' && (
            <div style={{
              ...styles.statusBadge,
              background: 'rgba(245, 158, 11, 0.3)',
              border: '1px solid rgba(245, 158, 11, 0.5)'
            }}>
              <Phone size={16} />
              <span>ID Verification</span>
            </div>
          )}
          {authStep === 'phone' && (
            <div style={{
              ...styles.statusBadge,
              background: 'rgba(59, 130, 246, 0.3)',
              border: '1px solid rgba(59, 130, 246, 0.5)'
            }}>
              <Phone size={16} />
              <span>Phone Verification</span>
            </div>
          )}
          {authStep === 'authenticated' && (
            <div style={{
              ...styles.statusBadge,
              background: 'rgba(34, 197, 94, 0.3)',
              border: '1px solid rgba(34, 197, 94, 0.5)'
            }}>
              <User size={16} />
              <span>Authenticated: {currentCustomer?.name}</span>
            </div>
          )}
          {authStep === 'failed' && (
            <div style={{
              ...styles.statusBadge,
              background: 'rgba(239, 68, 68, 0.3)',
              border: '1px solid rgba(239, 68, 68, 0.5)'
            }}>
              <User size={16} />
              <span>Authentication Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Section */}
      <div style={styles.avatarSection}>
        <div style={styles.avatarContainer}>
          <div style={styles.avatar}>
            {/* Glow effects */}
            <div style={{...styles.avatarGlow, ...styles.listeningGlow}}></div>
            <div style={{...styles.avatarGlow, ...styles.speakingGlow}}></div>
            <div style={{...styles.avatarGlow, ...styles.thinkingGlow}}></div>
            
            {/* Avatar face */}
            <div style={styles.avatarFace}>👩‍💼</div>
          </div>
          
          <div style={styles.messageDisplay}>
            {currentMessage}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controlsSection}>
        <button
          onClick={isListening ? stopListening : startListening}
          style={{...styles.controlButton, ...styles.micButton}}
          disabled={isSpeaking || authStep === 'failed'}
          onMouseOver={(e) => {
            if (!isListening && !isSpeaking && authStep !== 'failed') {
              e.target.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            if (!isListening) {
              e.target.style.transform = 'scale(1)';
            }
          }}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        
        <button
          onClick={toggleAudio}
          style={{...styles.controlButton, ...styles.audioButton}}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          {audioEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
        </button>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        
        @keyframes speakPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          25% { transform: scale(1.05); opacity: 1; }
          75% { transform: scale(1.02); opacity: 0.9; }
        }
        
        @keyframes think {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          33% { transform: scale(1.03); opacity: 0.8; }
          66% { transform: scale(1.01); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default VoiceChatbot;