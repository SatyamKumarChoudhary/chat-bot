import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

const RobotAvatar = ({ isProcessing = false, isTalking = false }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load the .lottie file
    const loadAnimation = async () => {
      try {
        // For .lottie files, we need to import them differently
        const response = await fetch('/src/assets/robot-avatar.lottie');
        const arrayBuffer = await response.arrayBuffer();
        
        // Convert to JSON (this might need adjustment based on the file)
        // For now, let's try a simple approach
        console.log('Loading robot avatar animation...');
        
        // Alternative: if the file is actually JSON, try this:
        const textData = await fetch('/src/assets/robot-avatar.lottie').then(r => r.text());
        const jsonData = JSON.parse(textData);
        setAnimationData(jsonData);
      } catch (error) {
        console.error('Error loading robot avatar:', error);
      }
    };

    loadAnimation();
  }, []);

  if (!animationData) {
    return (
      <div className="avatar-placeholder">
        <div className="robot-fallback">🤖</div>
      </div>
    );
  }

  return (
    <div className="robot-avatar-container">
      <div className={`robot-avatar ${isProcessing ? 'processing' : ''} ${isTalking ? 'talking' : ''}`}>
        <Lottie 
          animationData={animationData}
          loop={isProcessing || isTalking}
          autoplay={isProcessing || isTalking}
          style={{ 
            height: 150, 
            width: 150,
            filter: isTalking ? 'brightness(1.1)' : 'none'
          }}
        />
      </div>
      
      {/* Status indicator */}
      <div className="status-indicator">
        {isProcessing && <span className="status-text">Processing...</span>}
        {isTalking && <span className="status-text">Speaking...</span>}
      </div>
    </div>
  );
};

export default RobotAvatar;