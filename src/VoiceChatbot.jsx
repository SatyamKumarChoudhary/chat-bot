import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader, Send, Clock, CreditCard, DollarSign, HelpCircle } from 'lucide-react';

const VoiceChatbot = () => {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [avatarState, setAvatarState] = useState('idle');
  const [continuousMode, setContinuousMode] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0); // For voice visualization
  
  // Chat history state
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Sarah from Maybank. You can speak anytime - I'm always listening!",
      sender: 'bot',
      timestamp: new Date(),
      isNew: false
    }
  ]);

  // Refs
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize audio visualization
  const initializeAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
        
        animationFrameRef.current = requestAnimationFrame(visualize);
      };
      
      visualize();
    } catch (error) {
      console.error('Error initializing audio visualization:', error);
    }
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setAvatarState('listening');
        setLiveTranscript('');
        initializeAudioVisualization();
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscriptText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscriptText += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setLiveTranscript(interimTranscript);
        }
        
        if (finalTranscriptText.trim()) {
          const userMessage = finalTranscriptText.trim();
          addMessage(userMessage, 'user');
          setLiveTranscript('');
          handleQuery(userMessage);
          
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setAudioLevel(0);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (continuousMode && !isSpeaking && audioEnabled) {
          setTimeout(() => {
            startListening();
          }, 100);
        }
        
        if (!isProcessing) {
          setAvatarState('idle');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setAvatarState('idle');
        setLiveTranscript('');
        setAudioLevel(0);
        
        if (event.error === 'no-speech') {
          if (!continuousMode) {
            addMessage("I didn't hear anything. Please try again.", 'bot');
          }
        } else if (event.error === 'network') {
          addMessage("There seems to be a network issue. Please check your connection.", 'bot');
        }
        
        if (continuousMode && audioEnabled && event.error !== 'network') {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      };
    }

    // Start listening automatically
    setTimeout(() => {
      speakMessage("Hello! I'm Sarah from Maybank. You can speak anytime - I'm always listening!");
      setTimeout(() => {
        startListening();
      }, 3000);
    }, 500);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      speechSynthesis.cancel();
    };
  }, []);

  // Add message with animation
  const addMessage = (text, sender) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date(),
      isNew: true
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Remove animation flag after animation completes
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, isNew: false } : msg
        )
      );
    }, 500);
  };

  // Speak function
  const speakMessage = (message) => {
    if (!audioEnabled) return;
    
    speechSynthesis.cancel();
    
    setIsSpeaking(true);
    setAvatarState('speaking');
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;
    
    const setVoice = () => {
      const voices = speechSynthesis.getVoices();
      const preferredVoices = ['Google UK English Female', 'Microsoft Zira', 'Samantha', 'Victoria'];
      
      let selectedVoice = null;
      for (const voiceName of preferredVoices) {
        selectedVoice = voices.find(voice => 
          voice.name.includes(voiceName) || 
          (voice.name.includes('Female') && voice.lang.startsWith('en'))
        );
        if (selectedVoice) break;
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    };
    
    if (speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      speechSynthesis.addEventListener('voiceschanged', setVoice);
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (!isListening && !isProcessing) {
        setAvatarState('idle');
      }
      
      if (continuousMode && audioEnabled) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    };
    
    speechSynthesis.speak(utterance);
  };

  // Start listening function
  const startListening = () => {
    if (!recognitionRef.current || isSpeaking) return;
    
    try {
      recognitionRef.current.start();
      console.log('Started listening...');
    } catch (error) {
      console.log('Recognition already started or error:', error);
      if (error.message && error.message.includes('already started')) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      }
    }
  };

  // Toggle continuous mode
  const toggleListening = () => {
    setContinuousMode(!continuousMode);
    
    if (!continuousMode) {
      startListening();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setLiveTranscript('');
      }
    }
  };

  // Send query to LLM
  const handleQuery = async (query) => {
    console.log('User query:', query);
    setIsProcessing(true);
    setAvatarState('thinking');
    
    addMessage("Sarah is thinking...", 'bot-thinking');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are Sarah, a helpful Maybank customer service assistant. Keep responses concise (2-3 sentences) and natural for voice. User query: ${query}`
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('LLM Response:', data.response);
      
      setMessages(prev => prev.filter(msg => msg.text !== "Sarah is thinking..."));
      addMessage(data.response, 'bot');
      
      setTimeout(() => {
        speakMessage(data.response);
      }, 500);

    } catch (error) {
      console.error('Error calling LLM:', error);
      setMessages(prev => prev.filter(msg => msg.text !== "Sarah is thinking..."));
      const fallbackResponse = "I'm having trouble connecting right now. Please try again in a moment.";
      addMessage(fallbackResponse, 'bot');
      setTimeout(() => speakMessage(fallbackResponse), 500);
    }
    
    setIsProcessing(false);
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    addMessage(action, 'user');
    handleQuery(action);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
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
    animatedBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0
    },
    particle: {
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.1)',
      pointerEvents: 'none'
    },
    header: {
      padding: '16px 24px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 2
    },
    brandText: {
      color: 'white',
      fontSize: '22px',
      fontWeight: '700',
      margin: 0
    },
    audioToggle: {
      background: 'transparent',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      padding: '8px 16px',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      transition: 'all 0.3s ease'
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      zIndex: 1
    },
    chatSection: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      overflowY: 'auto',
      gap: '16px'
    },
    messageRow: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '12px',
      opacity: 0,
      animation: 'slideIn 0.5s ease forwards'
    },
    botMessageRow: {
      justifyContent: 'flex-start'
    },
    userMessageRow: {
      justifyContent: 'flex-end'
    },
    message: {
      maxWidth: '70%',
      padding: '12px 18px',
      borderRadius: '18px',
      fontSize: '15px',
      lineHeight: '1.5',
      position: 'relative',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transform: 'scale(0.9)',
      animation: 'messageAppear 0.3s ease forwards'
    },
    botMessage: {
      background: 'rgba(255, 255, 255, 0.95)',
      color: '#1a1a1a',
      borderBottomLeftRadius: '6px'
    },
    userMessage: {
      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      color: 'white',
      borderBottomRightRadius: '6px'
    },
    thinkingMessage: {
      background: 'rgba(255, 255, 255, 0.8)',
      color: '#6b7280',
      fontStyle: 'italic'
    },
    timestamp: {
      fontSize: '11px',
      marginTop: '4px',
      opacity: 0.7
    },
    avatarContainer: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10
    },
    avatar: {
      width: '180px',
      height: '180px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ffd1dc 0%, #ffb6c1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '80px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      position: 'relative',
      transition: 'all 0.3s ease',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      transform: avatarState === 'speaking' ? 'scale(1.05)' : 'scale(1)'
    },
    avatarGlow: {
      position: 'absolute',
      inset: '-15px',
      borderRadius: '50%',
      background: avatarState === 'listening' ? 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)' :
                 avatarState === 'speaking' ? 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)' :
                 avatarState === 'thinking' ? 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)' :
                 'transparent',
      opacity: avatarState !== 'idle' ? 1 : 0,
      animation: avatarState !== 'idle' ? 'pulse 2s infinite' : 'none',
      transition: 'all 0.3s ease'
    },
    soundWave: {
      position: 'absolute',
      borderRadius: '50%',
      border: '2px solid',
      opacity: 0,
      pointerEvents: 'none'
    },
    controlsSection: {
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 2
    },
    quickActions: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap',
      justifyContent: 'center'
    },
    quickActionButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '20px',
      padding: '8px 16px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.3s ease'
    },
    microphoneContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px'
    },
    micButton: {
      width: '72px',
      height: '72px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      background: continuousMode 
        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
      color: 'white',
      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      transform: isListening ? `scale(${1 + audioLevel * 0.2})` : 'scale(1)'
    },
    liveTranscript: {
      position: 'absolute',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '25px',
      fontSize: '16px',
      maxWidth: '80%',
      textAlign: 'center',
      zIndex: 20
    },
    waveform: {
      position: 'absolute',
      bottom: '110px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '3px',
      alignItems: 'center',
      height: '40px'
    },
    waveBar: {
      width: '3px',
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '3px',
      transition: 'height 0.2s ease'
    }
  };

  // Generate animated particles for background
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      style={{
        ...styles.particle,
        width: `${Math.random() * 60 + 20}px`,
        height: `${Math.random() * 60 + 20}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animation: `float ${Math.random() * 20 + 10}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`
      }}
    />
  ));

  // Generate sound waves for avatar
  const soundWaves = isListening || isSpeaking ? Array.from({ length: 3 }, (_, i) => (
    <div
      key={i}
      style={{
        ...styles.soundWave,
        width: `${240 + i * 60}px`,
        height: `${240 + i * 60}px`,
        borderColor: avatarState === 'listening' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)',
        animation: `soundWave ${2 + i * 0.5}s ease-out infinite`,
        animationDelay: `${i * 0.3}s`
      }}
    />
  )) : null;

  // Generate waveform bars
  const waveformBars = Array.from({ length: 15 }, (_, i) => {
    const height = isListening ? (audioLevel * 40 + Math.random() * 20) : 10;
    return (
      <div
        key={i}
        style={{
          ...styles.waveBar,
          height: `${height}px`,
          animation: isListening ? `wave ${0.5 + i * 0.05}s ease-in-out infinite` : 'none'
        }}
      />
    );
  });

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBackground}>
        {particles}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.brandText}>Maybank Voice Assistant</h1>
        <button onClick={toggleAudio} style={styles.audioToggle}>
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        {/* Chat Messages */}
        <div style={styles.chatSection}>
          {messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                ...styles.messageRow,
                ...(message.sender === 'user' ? styles.userMessageRow : styles.botMessageRow),
                animationDelay: message.isNew ? `${index * 0.1}s` : '0s'
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(message.sender === 'user' ? styles.userMessage : 
                      message.sender === 'bot-thinking' ? styles.thinkingMessage : 
                      styles.botMessage),
                  animationDelay: message.isNew ? `${index * 0.1 + 0.1}s` : '0s'
                }}
              >
                <p style={{ margin: 0 }}>{message.text}</p>
                {message.sender !== 'bot-thinking' && (
                  <p style={{
                    ...styles.timestamp,
                    color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : '#6b7280'
                  }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: '4px' }} />
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Central Avatar with Sound Waves */}
        <div style={styles.avatarContainer}>
          <div style={{ position: 'relative' }}>
            {soundWaves}
            <div style={styles.avatar}>
              <div style={styles.avatarGlow}></div>
              <div style={{ fontSize: avatarState === 'thinking' ? '70px' : '80px' }}>
                {avatarState === 'thinking' ? '🤔' : '👩‍💼'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Waveform Visualization */}
      {isListening && (
        <div style={styles.waveform}>
          {waveformBars}
        </div>
      )}

      {/* Live Transcript */}
      {liveTranscript && (
        <div style={styles.liveTranscript}>
          {liveTranscript}
        </div>
      )}

      {/* Controls Section */}
      <div style={styles.controlsSection}>
        {/* Quick Actions */}
        <div style={styles.quickActions}>
          <button 
            style={styles.quickActionButton}
            onClick={() => handleQuickAction("What's my account balance?")}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <DollarSign size={14} />
            Account Balance
          </button>
          <button 
            style={styles.quickActionButton}
            onClick={() => handleQuickAction("How do I transfer money?")}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <Send size={14} />
            Transfer Money
          </button>
          <button 
            style={styles.quickActionButton}
            onClick={() => handleQuickAction("Show me my recent transactions")}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <CreditCard size={14} />
            Transactions
          </button>
          <button 
            style={styles.quickActionButton}
            onClick={() => handleQuickAction("I need help with my card")}
            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            <HelpCircle size={14} />
            Card Help
          </button>
        </div>

        {/* Microphone */}
        <div style={styles.microphoneContainer}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', margin: 0 }}>
              {continuousMode ? '🎤 Always Listening' : '🔇 Push to Talk'}
            </p>
          </div>
          <button
            onClick={toggleListening}
            style={styles.micButton}
            title={continuousMode ? 'Click to turn OFF continuous listening' : 'Click to turn ON continuous listening'}
          >
            {continuousMode ? <Mic size={28} /> : <MicOff size={28} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.3;
          }
          33% { 
            transform: translateY(-30px) translateX(30px) rotate(120deg);
            opacity: 0.6;
          }
          66% { 
            transform: translateY(30px) translateX(-30px) rotate(240deg);
            opacity: 0.3;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes messageAppear {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes soundWave {
          0% {
            opacity: 0.8;
            transform: scale(0.8);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        /* Aurora effect for background */
        @keyframes aurora {
          0% {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          }
          25% {
            background: linear-gradient(135deg, #764ba2 0%, #f093fb 50%, #667eea 100%);
          }
          50% {
            background: linear-gradient(135deg, #f093fb 0%, #667eea 50%, #764ba2 100%);
          }
          75% {
            background: linear-gradient(135deg, #667eea 0%, #f093fb 50%, #764ba2 100%);
          }
          100% {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          }
        }
        
        /* Apply aurora animation to container */
        .animated-gradient {
          animation: aurora 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default VoiceChatbot;