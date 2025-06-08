import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { webRTCService } from '@/lib/webrtc';
import { useAuth } from '@/contexts/AuthContext';
import { startSession, endSession, getBalance } from '@/lib/api';

// Rate per minute based on reader's rate (this would come from the reader's profile)
const DEFAULT_RATE_PER_MINUTE = 5.00; // $5.00 per minute default

interface SessionTimerProps {
  isActive: boolean;
  elapsedTime: number;
  rate: number;
}

// Session timer component that displays elapsed time and cost
const SessionTimer: React.FC<SessionTimerProps> = ({ isActive, elapsedTime, rate }) => {
  // Format elapsed time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate current cost
  const cost = ((elapsedTime / 60) * rate).toFixed(2);

  return (
    <div className="session-timer ethereal-border p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-300">Elapsed Time</p>
          <p className="text-2xl font-bold text-white">
            {formatTime(elapsedTime)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-300">Current Cost</p>
          <p className="text-2xl font-bold text-accent">
            ${cost}
          </p>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          {isActive ? 'Session in progress' : 'Session paused'}
        </p>
      </div>
    </div>
  );
};

// Main reading session component
const ReadingSession: React.FC = () => {
  const { user } = useAuth();
  const { readerId, sessionId } = useParams<{ readerId: string; sessionId?: string }>();
  const navigate = useNavigate();

  // State for session
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [readerRate, setReaderRate] = useState(DEFAULT_RATE_PER_MINUTE);
  
  // Refs for media elements and timer
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      if (!user || !readerId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Connect to socket server
        webRTCService.connect(user.id, user.role === 'reader' ? 'reader' : 'client');
        
        // Start a new session if no sessionId is provided
        if (!sessionId) {
          const sessionResponse = await startSession(readerId);
          currentSessionIdRef.current = sessionResponse.sessionId;
        } else {
          currentSessionIdRef.current = sessionId;
        }

        // Get user balance
        const balance = await getBalance();
        setUserBalance(balance);

        // Initialize WebRTC
        const roomId = currentSessionIdRef.current;
        const initialized = await webRTCService.initSession(roomId, {
          onTrack: (stream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
            }
          },
          onConnectionStateChange: (state) => {
            setIsConnected(state === 'connected');
            if (state === 'connected') {
              startSessionTimer();
            } else if (state === 'disconnected' || state === 'failed') {
              stopSessionTimer();
            }
          },
          onError: (err) => {
            setError(`Connection error: ${err.message}`);
          },
          onMuteChange: (audioMuted, videoMuted) => {
            setAudioMuted(audioMuted);
            setVideoMuted(videoMuted);
          }
        });

        if (!initialized) {
          throw new Error('Failed to initialize WebRTC session');
        }

        // Start local media
        const localStream = await webRTCService.startLocalMedia(true, true);
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Create offer if client
        if (user.role === 'client') {
          await webRTCService.createOffer();
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Session initialization error:', err);
        setError(`Failed to initialize session: ${(err as Error).message}`);
        setIsLoading(false);
      }
    };

    initSession();

    return () => {
      stopSessionTimer();
      webRTCService.disconnect();
    };
  }, [user, readerId, sessionId]);

  // Timer functions
  const startSessionTimer = () => {
    setSessionActive(true);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prevTime => {
        const newTime = prevTime + 1;
        
        // Check if user can afford another minute
        const currentCost = (newTime / 60) * readerRate;
        if (currentCost >= userBalance) {
          // End session if user can't afford to continue
          handleEndSession();
        }
        
        return newTime;
      });
    }, 1000);
  };

  const stopSessionTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setSessionActive(false);
  };

  // Handle mute/unmute
  const handleToggleAudio = () => {
    const newState = webRTCService.toggleAudio();
    setAudioMuted(!!newState);
  };

  const handleToggleVideo = () => {
    const newState = webRTCService.toggleVideo();
    setVideoMuted(!!newState);
  };

  // End session
  const handleEndSession = async () => {
    stopSessionTimer();

    try {
      if (currentSessionIdRef.current) {
        await endSession(currentSessionIdRef.current);
      }
      webRTCService.endSession();
      
      // Navigate back to dashboard
      navigate(user?.role === 'reader' ? '/reader/dashboard' : '/client/dashboard');
    } catch (err) {
      console.error('Error ending session:', err);
      setError(`Failed to end session: ${(err as Error).message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-white">Connecting to your session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-secondary rounded-lg">
          <h3 className="text-xl mb-4">Connection Error</h3>
          <p className="text-white mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* Left sidebar - Chat or reader information */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="ethereal-border rounded-lg p-4 h-full">
            <h3 className="text-xl mb-4">Session Chat</h3>
            <div className="h-[calc(100%-2rem)] flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4">
                {/* Chat messages would go here */}
                <p className="text-muted-foreground text-center my-8">
                  Chat functionality coming soon...
                </p>
              </div>
              
              {/* Chat input */}
              <div className="mt-auto">
                <input 
                  type="text" 
                  className="w-full p-2 rounded-md bg-black/30 border border-primary/30"
                  placeholder="Type your message..."
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main video area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Remote video (main view) */}
          <div className="aspect-video w-full bg-black/50 rounded-xl overflow-hidden relative">
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-black/70 rounded-lg overflow-hidden border border-white/20">
              <video 
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Connection status */}
            <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-green-500/80' : 'bg-yellow-500/80'}`}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
            
            {/* Balance indicator */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-accent/80 text-black text-xs">
              Balance: ${userBalance.toFixed(2)}
            </div>
          </div>
          
          {/* Controls and timer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SessionTimer 
                isActive={sessionActive}
                elapsedTime={elapsedTime}
                rate={readerRate}
              />
            </div>
            <div className="md:col-span-1 flex items-center justify-around">
              <button 
                onClick={handleToggleAudio}
                className={`p-3 rounded-full ${audioMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
              >
                {audioMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <button 
                onClick={handleToggleVideo}
                className={`p-3 rounded-full ${videoMuted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
              >
                {videoMuted ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
              <button 
                onClick={handleEndSession}
                className="p-3 rounded-full bg-red-500/20 text-red-400"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingSession;
