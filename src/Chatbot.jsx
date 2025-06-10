import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, User, MessageCircle, Volume2 } from 'lucide-react';
import VoiceInput from './VoiceInput'; // Import the voice component

const Chatbot = () => {
  // Enhanced customer database with ID numbers
  const customerDatabase = [
    { phone: "1234567890", name: "John Smith", id: "CUST001", idNumber: "A12345678" },
    { phone: "9876543210", name: "Sarah Johnson", id: "CUST002", idNumber: "B87654321" },
    { phone: "5555555555", name: "Mike Chen", id: "CUST003", idNumber: "C11111111" },
    { phone: "1111222233", name: "Emily Davis", id: "CUST004", idNumber: "D22233444" },
    { phone: "9999888877", name: "David Wilson", id: "CUST005", idNumber: "E99988877" }
  ];

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "🏦 Hello! Welcome to Maybank Customer Care. I'm SatyamBot, your intelligent AI assistant.",
      sender: 'bot',
      timestamp: new Date()
    },
    {
      id: 2,
      text: "For your security and privacy, I need to verify your identity with a 2-step authentication process.",
      sender: 'bot',
      timestamp: new Date()
    },
    {
      id: 3,
      text: "Step 1: Please enter your National ID / Passport Number (or click the microphone to speak):",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [authStep, setAuthStep] = useState('id'); // 'id', 'phone', 'authenticated', 'failed'
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [enteredId, setEnteredId] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice-related states
  const [voiceStatus, setVoiceStatus] = useState({ type: 'idle', message: '' });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text, sender) => {
    const newMessage = {
      id: messages.length + 1,
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Voice Input Handlers
  const handleVoiceTranscription = (transcribedText) => {
    // Set the transcribed text to input field
    setInputText(transcribedText);
    
    // Auto-submit if it looks like a complete response
    if (transcribedText.length > 3) {
      setTimeout(() => {
        handleTextSubmission(transcribedText);
      }, 1000);
    }
  };

  const handleVoiceStatusUpdate = (type, message) => {
    setVoiceStatus({ type, message });
    
    // Add voice status messages to chat (except idle messages)
    if (message && type !== 'idle' && message.trim()) {
      addMessage(message, 'bot');
    }
  };

  // Authentication functions
  const authenticateStep1 = (idNumber) => {
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    const customer = customerDatabase.find(c => c.idNumber === cleanId);
    
    if (customer) {
      setEnteredId(cleanId);
      setAuthStep('phone');
      
      simulateTyping();
      setTimeout(() => {
        addMessage("✅ ID verified successfully!", 'bot');
        setTimeout(() => {
          addMessage("Step 2: Please enter your registered mobile number (or use voice input):", 'bot');
        }, 1000);
      }, 1000);
    } else {
      setAuthStep('failed');
      simulateTyping();
      setTimeout(() => {
        addMessage("🚫 ID verification failed. The ID number you entered is not found in our Maybank records.", 'bot');
        setTimeout(() => {
          addMessage("For security reasons, please visit your nearest Maybank branch with valid ID or call our customer service hotline at 1-300-88-6688. Thank you!", 'bot');
        }, 2000);
      }, 1000);
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
      
      simulateTyping();
      setTimeout(() => {
        addMessage(`🎉 Authentication successful! Welcome back, ${customer.name}!`, 'bot');
        setTimeout(() => {
          addMessage("I'm SatyamBot, your personal Maybank assistant. You can now type your questions or use voice input by clicking the microphone. How can I help you today?", 'bot');
        }, 1500);
      }, 1000);
    } else {
      setAuthStep('failed');
      simulateTyping();
      setTimeout(() => {
        addMessage("🚫 Phone verification failed. The mobile number doesn't match with the provided ID.", 'bot');
        setTimeout(() => {
          addMessage("Please ensure you're using the correct mobile number registered with your account. Contact Maybank at 1-300-88-6688 for assistance.", 'bot');
        }, 2000);
      }, 1000);
    }
  };

  const handleQuery = async (query) => {
    simulateTyping();
    
    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `You are SatyamBot, a professional Maybank customer service AI assistant. Customer: ${currentCustomer.name} (ID: ${currentCustomer.id}). Customer Query: ${query}. Provide helpful, professional banking assistance.`
        })
      });

      if (!response.ok) {
        throw new Error('API call failed');
      }

      const data = await response.json();
      
      setTimeout(() => {
        addMessage(data.response, 'bot');
      }, 1000);

    } catch (error) {
      console.error('Error calling API:', error);
      const fallbackResponse = `Hello ${currentCustomer.name}, I'm experiencing technical difficulties. Please try again in a moment or contact Maybank at 1-300-88-6688 for immediate assistance.`;
      
      setTimeout(() => {
        addMessage(fallbackResponse, 'bot');
      }, 1000);
    }
  };

  const handleTextSubmission = async (text) => {
    if (authStep === 'id') {
      authenticateStep1(text);
    } else if (authStep === 'phone') {
      authenticateStep2(text);
    } else if (authStep === 'authenticated') {
      await handleQuery(text);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    addMessage(inputText, 'user');
    const userInput = inputText;
    setInputText('');

    await handleTextSubmission(userInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Styles
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      maxWidth: '900px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      boxShadow: '0 0 30px rgba(0,0,0,0.1)'
    },
    header: {
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 30%, #60a5fa 70%, #93c5fd 100%)',
      color: 'white',
      padding: '24px 28px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    },
    headerBg: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      opacity: 0.4
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'relative',
      zIndex: 1
    },
    logoArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logo: {
      width: '52px',
      height: '52px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
    },
    title: {
      fontSize: '26px',
      fontWeight: '800',
      margin: 0,
      letterSpacing: '-0.8px',
      textShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    subtitle: {
      color: 'rgba(255,255,255,0.95)',
      fontSize: '15px',
      margin: 0,
      fontWeight: '500',
      textShadow: '0 1px 5px rgba(0,0,0,0.1)'
    },
    brandTag: {
      fontSize: '13px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
      padding: '6px 16px',
      borderRadius: '25px',
      marginLeft: 'auto',
      fontWeight: '600',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    },
    statusBar: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 24px',
      background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)'
    },
    statusContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    statusBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '25px',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    voiceIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '25px',
      fontSize: '13px',
      fontWeight: '500',
      marginLeft: 'auto'
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    },
    messageContainer: {
      display: 'flex'
    },
    userMessageContainer: {
      justifyContent: 'flex-end'
    },
    botMessageContainer: {
      justifyContent: 'flex-start'
    },
    message: {
      maxWidth: '75%',
      padding: '16px 20px',
      borderRadius: '20px',
      fontSize: '15px',
      lineHeight: '1.4',
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    userMessage: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      color: 'white',
      borderBottomRightRadius: '8px'
    },
    botMessage: {
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderBottomLeftRadius: '8px',
      color: '#1e293b'
    },
    timestamp: {
      fontSize: '11px',
      marginTop: '6px',
      opacity: 0.8,
      fontWeight: '400'
    },
    inputArea: {
      backgroundColor: 'white',
      borderTop: '1px solid #e2e8f0',
      padding: '20px 24px',
      background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)'
    },
    inputContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-end'
    },
    input: {
      flex: 1,
      border: '2px solid #e2e8f0',
      borderRadius: '25px',
      padding: '14px 20px',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.3s ease',
      backgroundColor: '#fafbfc'
    },
    sendButton: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '25px',
      padding: '14px 24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
    },
    demoData: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#f1f5f9',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    demoButton: {
      fontSize: '12px',
      backgroundColor: 'white',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      padding: '6px 12px',
      margin: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#475569'
    },
    typingIndicator: {
      display: 'flex',
      gap: '6px',
      padding: '16px 20px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '20px',
      borderBottomLeftRadius: '8px',
      maxWidth: '80px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    typingDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#94a3b8',
      borderRadius: '50%',
      animation: 'bounce 1.4s infinite ease-in-out'
    },
    poweredBy: {
      textAlign: 'center',
      padding: '12px',
      fontSize: '11px',
      color: '#64748b',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0'
    }
  };

  // Determine if voice should be disabled based on current state
  const isVoiceDisabled = authStep === 'failed' || isTyping;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerBg}></div>
        <div style={styles.headerContent}>
          <div style={styles.logoArea}>
            <div style={styles.logo}>
              <MessageCircle size={24} />
            </div>
            <div>
              <h1 style={styles.title}>SatyamBot</h1>
              <p style={styles.subtitle}>Maybank AI Assistant • 24/7 Support • Voice Enabled</p>
            </div>
          </div>
          <div style={styles.brandTag}>
            Powered by Maybank + AWS
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusContent}>
          {authStep === 'id' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              color: '#92400e',
              border: '1px solid #f59e0b'
            }}>
              <Phone size={16} />
              <span>🔐 Step 1: ID Verification Required</span>
            </div>
          )}
          {authStep === 'phone' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
              color: '#1e40af',
              border: '1px solid #3b82f6'
            }}>
              <Phone size={16} />
              <span>📱 Step 2: Phone Verification Required</span>
            </div>
          )}
          {authStep === 'authenticated' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              color: '#065f46',
              border: '1px solid #10b981'
            }}>
              <User size={16} />
              <span>
                ✅ Authenticated: {currentCustomer?.name} • ID: {currentCustomer?.id}
              </span>
            </div>
          )}
          {authStep === 'failed' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
              color: '#991b1b',
              border: '1px solid #ef4444'
            }}>
              <User size={16} />
              <span>❌ Authentication Failed - Contact Support</span>
            </div>
          )}
          
          {/* Voice Status Indicator */}
          {voiceStatus.type !== 'idle' && (
            <div style={{
              ...styles.voiceIndicator,
              background: voiceStatus.type === 'recording' || voiceStatus.type === 'listening'
                ? 'linear-gradient(135deg, #fee2e2, #fecaca)' 
                : voiceStatus.type === 'processing'
                ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                : voiceStatus.type === 'success'
                ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                : 'linear-gradient(135deg, #fee2e2, #fecaca)',
              color: voiceStatus.type === 'recording' || voiceStatus.type === 'listening' || voiceStatus.type === 'error'
                ? '#991b1b' 
                : voiceStatus.type === 'processing'
                ? '#92400e'
                : '#065f46',
              border: voiceStatus.type === 'recording' || voiceStatus.type === 'listening' || voiceStatus.type === 'error'
                ? '1px solid #ef4444'
                : voiceStatus.type === 'processing'
                ? '1px solid #f59e0b'
                : '1px solid #10b981'
            }}>
              <Volume2 size={16} />
              <span>
                {voiceStatus.type === 'recording' && '🎤 Recording...'}
                {voiceStatus.type === 'listening' && '🎤 Listening...'}
                {voiceStatus.type === 'processing' && '🔄 Processing...'}
                {voiceStatus.type === 'success' && '✅ Voice Ready'}
                {voiceStatus.type === 'error' && '❌ Voice Error'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              ...styles.messageContainer,
              ...(message.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer)
            }}
          >
            <div
              style={{
                ...styles.message,
                ...(message.sender === 'user' ? styles.userMessage : styles.botMessage)
              }}
            >
              <p style={{margin: 0}}>{message.text}</p>
              <p style={{
                ...styles.timestamp,
                color: message.sender === 'user' ? '#bfdbfe' : '#6b7280'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={styles.botMessageContainer}>
            <div style={styles.typingIndicator}>
              <div style={styles.typingDot}></div>
              <div style={{...styles.typingDot, animationDelay: '0.2s'}}></div>
              <div style={{...styles.typingDot, animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {authStep !== 'failed' && (
        <div style={styles.inputArea}>
          <div style={styles.inputContainer}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                authStep === 'id' 
                  ? "Enter your National ID / Passport Number..." 
                  : authStep === 'phone'
                  ? "Enter your registered mobile number..."
                  : "Ask me anything about your account..."
              }
              style={{
                ...styles.input,
                borderColor: inputText ? '#3b82f6' : '#e2e8f0'
              }}
              disabled={voiceStatus.type === 'recording' || voiceStatus.type === 'processing'}
            />
            
            {/* Voice Input Component */}
            <VoiceInput
              onTranscriptionComplete={handleVoiceTranscription}
              onStatusUpdate={handleVoiceStatusUpdate}
              disabled={isVoiceDisabled}
              placeholder={
                authStep === 'id' 
                  ? "Click to speak your ID number" 
                  : authStep === 'phone'
                  ? "Click to speak your phone number"
                  : "Click to speak your question"
              }
            />
            
            <button 
              onClick={handleSend} 
              style={{
                ...styles.sendButton,
                transform: inputText ? 'scale(1.02)' : 'scale(1)',
                opacity: inputText ? 1 : 0.7
              }}
              disabled={voiceStatus.type === 'recording' || voiceStatus.type === 'processing'}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </div>
          
          {authStep === 'id' && (
            <div style={styles.demoData}>
              <p style={{fontSize: '13px', color: '#475569', margin: '0 0 12px 0', fontWeight: '500'}}>
                🆔 Demo Credentials - Try these ID Numbers (or speak them):
              </p>
              <div>
                {customerDatabase.slice(0, 3).map(customer => (
                  <button
                    key={customer.idNumber}
                    onClick={() => setInputText(customer.idNumber)}
                    style={{
                      ...styles.demoButton,
                      ':hover': { backgroundColor: '#f1f5f9', borderColor: '#3b82f6' }
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f1f5f9';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#cbd5e1';
                    }}
                  >
                    🆔 {customer.idNumber} ({customer.name})
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {authStep === 'phone' && (
            <div style={styles.demoData}>
              <p style={{fontSize: '13px', color: '#475569', margin: '0 0 12px 0', fontWeight: '500'}}>
                📱 Demo Credentials - Try these Mobile Numbers (or speak them):
              </p>
              <div>
                {customerDatabase.filter(c => c.idNumber === enteredId).map(customer => (
                  <button
                    key={customer.phone}
                    onClick={() => setInputText(customer.phone)}
                    style={{
                      ...styles.demoButton,
                      ':hover': { backgroundColor: '#f1f5f9', borderColor: '#3b82f6' }
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f1f5f9';
                      e.target.style.borderColor = '#3b82f6';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#cbd5e1';
                    }}
                  >
                    📱 {customer.phone} ({customer.name})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Powered By Footer */}
      <div style={styles.poweredBy}>
        🔒 Secured by Maybank • Voice Powered by AWS Transcribe • Your data is protected with bank-grade encryption
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          } 40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;