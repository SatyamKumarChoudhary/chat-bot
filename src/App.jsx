import React, { useState } from 'react';
import TextChatbot from './TextChatbot';
import VoiceChatbot from './VoiceChatbot';
import ModeSelector from './ModeSelector';
import { GitBranch } from 'lucide-react';

function App() {
  const [currentMode, setCurrentMode] = useState('text'); // 'text' or 'voice'

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
  };

  return (
    <div className="App">
      {/* Render the appropriate chatbot based on current mode */}
      {currentMode === 'text' ? (
        <TextChatbot />
      ) : (
        <VoiceChatbot />
      )}
      
      {/* Mode Selector - Always visible */}
      <ModeSelector 
        currentMode={currentMode}
        onModeChange={handleModeChange}
      />
    </div>
  );
}

export default App;