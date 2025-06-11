import React, { useState, useRef, useEffect } from 'react';
import { Send, User, MessageCircle, Bot, Shield, Sparkles } from 'lucide-react';

const TextChatbot = () => {
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
      text: "🏦 Hello! Welcome to Maybank Customer Care.",
      sender: 'bot',
      timestamp: new Date()
    },
    {
      id: 2,
      text: "I'm SatyamBot, your intelligent AI assistant. Please enter your National ID / Passport Number to get started:",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [authStep, setAuthStep] = useState('id');
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
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
    setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Single-step authentication
  const authenticate = (idNumber) => {
    const cleanId = idNumber.replace(/\s/g, '').toUpperCase();
    const customer = customerDatabase.find(c => c.idNumber === cleanId);
    
    if (customer) {
      setCurrentCustomer(customer);
      setAuthStep('authenticated');
      simulateTyping();
      setTimeout(() => {
        addMessage(`✨ Welcome back, ${customer.name}!`, 'bot');
        setTimeout(() => {
          addMessage("Your account is now verified. How can I assist you today with your banking needs?", 'bot');
        }, 1200);
      }, 1000);
    } else {
      setAuthStep('failed');
      simulateTyping();
      setTimeout(() => {
        addMessage("⚠️ ID verification failed. The ID number entered is not found in our records.", 'bot');
        setTimeout(() => {
          addMessage("Please visit your nearest Maybank branch or call 1-300-88-6688 for assistance.", 'bot');
        }, 1500);
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
      const fallbackResponse = `I apologize, ${currentCustomer.name}. I'm experiencing technical difficulties. Please try again or contact Maybank at 1-300-88-6688.`;
      
      setTimeout(() => {
        addMessage(fallbackResponse, 'bot');
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    addMessage(inputText, 'user');
    const userInput = inputText;
    setInputText('');

    if (authStep === 'id') {
      authenticate(userInput);
    } else if (authStep === 'authenticated') {
      await handleQuery(userInput);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Modern styles with glassmorphism and gradients
  const styles = {
    wrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
      background: `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
      `
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '85vh',
      width: '100%',
      maxWidth: '800px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      position: 'relative'
    },
    header: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '24px 30px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      position: 'relative'
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logoArea: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logo: {
      width: '48px',
      height: '48px',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    titleSection: {
      flex: 1
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      margin: 0,
      letterSpacing: '-0.5px'
    },
    subtitle: {
      fontSize: '14px',
      opacity: 0.9,
      margin: '4px 0 0 0',
      fontWeight: '400'
    },
    brandTag: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      background: 'rgba(255, 255, 255, 0.2)',
      padding: '8px 16px',
      borderRadius: '20px',
      fontWeight: '500',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    statusBar: {
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px 24px'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      background: '#fafbfc'
    },
    messageContainer: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px'
    },
    userMessageContainer: {
      justifyContent: 'flex-end'
    },
    botMessageContainer: {
      justifyContent: 'flex-start'
    },
    avatar: {
      width: '36px',
      height: '36px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      flexShrink: 0
    },
    botAvatar: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    userAvatar: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      boxShadow: '0 4px 12px rgba(245, 87, 108, 0.3)'
    },
    message: {
      maxWidth: '70%',
      padding: '14px 18px',
      borderRadius: '18px',
      fontSize: '14px',
      lineHeight: '1.5',
      position: 'relative'
    },
    userMessage: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderBottomRightRadius: '6px',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    botMessage: {
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderBottomLeftRadius: '6px',
      color: '#1e293b',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    },
    timestamp: {
      fontSize: '11px',
      marginTop: '4px',
      opacity: 0.7
    },
    inputArea: {
      backgroundColor: 'white',
      borderTop: '1px solid #e2e8f0',
      padding: '20px',
      background: 'linear-gradient(to bottom, #ffffff, #f8fafc)'
    },
    inputContainer: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    input: {
      flex: 1,
      border: '2px solid #e2e8f0',
      borderRadius: '24px',
      padding: '12px 20px',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.3s ease',
      backgroundColor: '#fafbfc'
    },
    sendButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '24px',
      width: '48px',
      height: '48px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
    },
    demoData: {
      marginTop: '12px',
      padding: '12px',
      backgroundColor: '#f1f5f9',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    demoButton: {
      fontSize: '12px',
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '6px 12px',
      margin: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#475569'
    },
    typingIndicator: {
      display: 'flex',
      gap: '4px',
      padding: '14px 18px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '18px',
      borderBottomLeftRadius: '6px',
      width: 'fit-content',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
    },
    typingDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#667eea',
      borderRadius: '50%',
      animation: 'typing 1.4s infinite ease-in-out'
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.backgroundPattern}></div>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.logoArea}>
              <div style={styles.logo}>
                <Bot size={28} />
              </div>
              <div style={styles.titleSection}>
                <h1 style={styles.title}>SatyamBot</h1>
                <p style={styles.subtitle}>Maybank AI Assistant</p>
              </div>
            </div>
            <div style={styles.brandTag}>
              <Sparkles size={14} />
              <span>Powered by AWS</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={styles.statusBar}>
          {authStep === 'id' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              color: '#92400e',
              border: '1px solid #f59e0b'
            }}>
              <Shield size={14} />
              <span>ID Verification Required</span>
            </div>
          )}
          {authStep === 'authenticated' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              color: '#065f46',
              border: '1px solid #10b981'
            }}>
              <User size={14} />
              <span>Verified: {currentCustomer?.name}</span>
            </div>
          )}
          {authStep === 'failed' && (
            <div style={{
              ...styles.statusBadge,
              background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
              color: '#991b1b',
              border: '1px solid #ef4444'
            }}>
              <Shield size={14} />
              <span>Verification Failed</span>
            </div>
          )}
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
              {message.sender === 'bot' && (
                <div style={{...styles.avatar, ...styles.botAvatar}}>AI</div>
              )}
              <div
                style={{
                  ...styles.message,
                  ...(message.sender === 'user' ? styles.userMessage : styles.botMessage)
                }}
              >
                <p style={{margin: 0}}>{message.text}</p>
                <p style={{
                  ...styles.timestamp,
                  color: message.sender === 'user' ? 'rgba(255,255,255,0.8)' : '#64748b'
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.sender === 'user' && (
                <div style={{...styles.avatar, ...styles.userAvatar}}>
                  {currentCustomer ? currentCustomer.name.split(' ').map(n => n[0]).join('') : 'U'}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div style={styles.botMessageContainer}>
              <div style={{...styles.avatar, ...styles.botAvatar}}>AI</div>
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
                    : "Type your message..."
                }
                style={{
                  ...styles.input,
                  borderColor: inputText ? '#667eea' : '#e2e8f0'
                }}
              />
              
              <button 
                onClick={handleSend} 
                style={{
                  ...styles.sendButton,
                  opacity: inputText ? 1 : 0.6,
                  transform: inputText ? 'scale(1)' : 'scale(0.95)'
                }}
                disabled={!inputText.trim()}
              >
                <Send size={20} />
              </button>
            </div>
            
            {authStep === 'id' && (
              <div style={styles.demoData}>
                <p style={{fontSize: '12px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '500'}}>
                  Quick login - Click to use demo ID:
                </p>
                <div style={{display: 'flex', flexWrap: 'wrap'}}>
                  {customerDatabase.map(customer => (
                    <button
                      key={customer.idNumber}
                      onClick={() => setInputText(customer.idNumber)}
                      style={styles.demoButton}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#f1f5f9';
                        e.target.style.borderColor = '#667eea';
                        e.target.style.color = '#667eea';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.color = '#475569';
                      }}
                    >
                      {customer.name} ({customer.idNumber})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
        }
        
        div::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TextChatbot;