import React from 'react';
import { Clock, DollarSign } from 'lucide-react';

interface SessionTimerProps {
  isActive: boolean;
  elapsedSeconds: number;
  ratePerMinute: number;
  currentBalance: number;
}

const SessionTimer: React.FC<SessionTimerProps> = ({ 
  isActive, 
  elapsedSeconds, 
  ratePerMinute,
  currentBalance 
}) => {
  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate current cost
  const cost = ((elapsedSeconds / 60) * ratePerMinute).toFixed(2);
  
  // Calculate remaining time
  const remainingMinutes = Math.floor(currentBalance / ratePerMinute);
  const remainingSeconds = Math.floor((currentBalance / ratePerMinute - remainingMinutes) * 60);
  const remainingTime = `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  // Low balance warning
  const lowBalance = currentBalance < ratePerMinute * 3; // Less than 3 minutes remaining

  return (
    <div className="ethereal-border p-4 rounded-lg">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-300 flex items-center justify-center">
            <Clock className="h-3 w-3 mr-1" /> Elapsed Time
          </p>
          <p className="text-xl font-bold text-white">
            {formatTime(elapsedSeconds)}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-300 flex items-center justify-center">
            <DollarSign className="h-3 w-3 mr-1" /> Current Cost
          </p>
          <p className="text-xl font-bold text-accent">
            ${cost}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-gray-300">Remaining Time</p>
          <p className={`text-xl font-bold ${lowBalance ? 'text-red-400' : 'text-white'}`}>
            {remainingTime}
          </p>
        </div>
      </div>
      
      <div className="mt-2 text-center">
        <p className={`text-xs ${isActive ? 'text-green-400' : 'text-gray-400'}`}>
          {isActive ? 'Session in progress' : 'Session paused'}
        </p>
        
        {lowBalance && (
          <p className="text-xs text-red-400 mt-1 animate-pulse">
            Low balance warning! Less than 3 minutes remaining.
          </p>
        )}
      </div>
    </div>
  );
};

export default SessionTimer;
