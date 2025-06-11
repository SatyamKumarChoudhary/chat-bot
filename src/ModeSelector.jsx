import React from 'react';
import { MessageSquare, Mic, Bot, User } from 'lucide-react';

const ModeSelector = ({ currentMode, onModeChange }) => {
  const styles = {
    selectorContainer: {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      zIndex: 1000
    },
    modeButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 18px',
      borderRadius: '25px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(10px)',
      minWidth: '180px',
      justifyContent: 'center'
    },
    textMode: {
      background: currentMode === 'text' 
        ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' 
        : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))',
      color: currentMode === 'text' ? 'white' : '#475569',
      border: currentMode === 'text' ? 'none' : '2px solid #e2e8f0'
    },
    voiceMode: {
      background: currentMode === 'voice' 
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
        : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))',
      color: currentMode === 'voice' ? 'white' : '#475569',
      border: currentMode === 'voice' ? 'none' : '2px solid #e2e8f0'
    },
    indicator: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: '2px solid white'
    },
    textIndicator: {
      backgroundColor: currentMode === 'text' ? '#22c55e' : 'transparent'
    },
    voiceIndicator: {
      backgroundColor: currentMode === 'voice' ? '#22c55e' : 'transparent'
    }
  };

  return (
    <div style={styles.selectorContainer}>
      {/* Text Chat Mode Button */}
      <button
        onClick={() => onModeChange('text')}
        style={{
          ...styles.modeButton,
          ...styles.textMode,
          transform: currentMode === 'text' ? 'scale(1.05)' : 'scale(1)'
        }}
        onMouseOver={(e) => {
          if (currentMode !== 'text') {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
          }
        }}
        onMouseOut={(e) => {
          if (currentMode !== 'text') {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }
        }}
      >
        <div style={{ position: 'relative' }}>
          <MessageSquare size={20} />
          <div style={{
            ...styles.indicator,
            ...styles.textIndicator
          }}></div>
        </div>
        <span>Text Chat</span>
      </button>

      {/* Voice Chat Mode Button */}
      <button
        onClick={() => onModeChange('voice')}
        style={{
          ...styles.modeButton,
          ...styles.voiceMode,
          transform: currentMode === 'voice' ? 'scale(1.05)' : 'scale(1)'
        }}
        onMouseOver={(e) => {
          if (currentMode !== 'voice') {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
          }
        }}
        onMouseOut={(e) => {
          if (currentMode !== 'voice') {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
          }
        }}
      >
        <div style={{ position: 'relative' }}>
          <User size={20} />
          <div style={{
            ...styles.indicator,
            ...styles.voiceIndicator
          }}></div>
        </div>
        <span>Voice Chat</span>
      </button>
    </div>
  );
};

export default ModeSelector;