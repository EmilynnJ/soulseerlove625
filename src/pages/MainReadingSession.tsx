import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { webRTCService } from '@/lib/webrtc';
import { PaymentManager } from '@/lib/paymentManager';
import { startSession, endSession, getReaderProfile } from '@/lib/api';

// Components
import PreReadingChecklist from '@/components/reading/PreReadingChecklist';
import ReadingControls from '@/components/reading/ReadingControls';
import SessionTimer from '@/components/reading/SessionTimer';
import ReadingChat from '@/components/reading/ReadingChat';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  isReader: boolean;
  content: string;
  timestamp: Date;
}

const MainReadingSession: React.FC = () => {
  const { user } = useAuth();
  const { readerId } = useParams<{ readerId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const readingType = location.state?.readingType || 'video';
  
  // State for session
  const [showChecklist, setShowChecklist] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [videoMuted, setVideoMuted] = useState<boolean>(false);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [readerProfile, setReaderProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Refs for media elements and services
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const paymentManagerRef = useRef<PaymentManager | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Load reader profile
  useEffect(() => {
    const loadReaderProfile = async () => {
      if (!readerId) return;
      
      try {
        const profile = await getReaderProfile(readerId);
        setReaderProfile(profile);
      } catch (err: any) {
        setError(err.message || 'Failed to load reader profile');
      }
    };
    
    loadReaderProfile();
    
    // Clean up on unmount
    return () => {
      if (paymentManagerRef.current) {
        paymentManagerRef.current.stopBilling();
      }
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Close WebRTC connection
      webRTCService.closeConnection();
    };
  }, [readerId]);
  
  // Function to handle start reading after checklist
  const handleStartReading = async () => {
    if (!user || !readerId || !readerProfile) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Connect to socket server
      webRTCService.connect(user.id, user.role === 'reader' ? 'reader' : 'client');
      
      // Start a new session
      const sessionResponse = await startSession(readerId);
      currentSessionIdRef.current = sessionResponse.sessionId;
      
      // Initialize payment manager
      paymentManagerRef.current = new PaymentManager(
        user.id,
        readerId,
        readerProfile.ratePerMinute || 5.0,
        {
          onBalanceUpdate: (balance) => {
            setUserBalance(balance);
          },
          onBalanceLow: (balance, minRequired) => {
            // You could show a warning notification here
          },
          onBalanceDepleted: () => {
            // Handle session end due to depleted balance
            handleEndSession(true);
          }
        }
      );
      
      // Initialize payment manager
      const paymentInitSuccess = await paymentManagerRef.current.initialize(
        sessionResponse.sessionId
      );
      
      if (!paymentInitSuccess) {
        throw new Error('Insufficient balance to start the reading session');
      }
      
      // Initialize WebRTC
      const roomId = currentSessionIdRef.current;
      
      // Set up media constraints based on reading type
      const constraints: MediaStreamConstraints = {
        audio: readingType !== 'chat',
        video: readingType === 'video'
      };
      
      const initialized = await webRTCService.initSession(roomId, {
        mediaConstraints: constraints,
        onTrack: (stream) => {
          if (remoteVideoRef.current && readingType === 'video') {
            remoteVideoRef.current.srcObject = stream;
          }
        },
        onLocalStream: (stream) => {
          if (localVideoRef.current && readingType === 'video') {
            localVideoRef.current.srcObject = stream;
          }
        },
        onConnectionStateChange: (state) => {
          setIsConnected(state === 'connected');
          if (state === 'connected') {
            setSessionActive(true);
            
            // Add welcome message to chat
            const welcomeMessage: Message = {
              id: `system-${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              isReader: false,
              content: `Welcome to your ${readingType} reading with ${readerProfile.displayName || readerProfile.firstName}. Your session has begun.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, welcomeMessage]);
            
            // Start billing
            if (paymentManagerRef.current) {
              paymentManagerRef.current.startBilling();
            }
            
            // Start timer
            startSessionTimer();
          } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            handleEndSession();
          }
        },
        onError: (err) => {
          setError(`Connection error: ${err.message}`);
        },
        onMessage: (data) => {
          // Handle text messages
          if (data.type === 'chat' && data.message) {
            const newMessage: Message = {
              id: `msg-${Date.now()}`,
              senderId: data.senderId,
              senderName: data.senderName || (data.isReader ? readerProfile.displayName : user.firstName),
              isReader: data.isReader,
              content: data.message,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
          }
        },
        onMuteChange: (audioMuted, videoMuted) => {
          setAudioMuted(audioMuted);
          setVideoMuted(videoMuted);
        }
      });
      
      if (!initialized) {
        throw new Error('Failed to initialize WebRTC session');
      }
      
      setShowChecklist(false);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to start reading session');
      setIsLoading(false);
    }
  };
  
  // Start session timer
  const startSessionTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };
  
  // Toggle audio mute
  const handleToggleAudio = () => {
    webRTCService.toggleAudio();
    setAudioMuted(!audioMuted);
  };
  
  // Toggle video mute
  const handleToggleVideo = () => {
    webRTCService.toggleVideo();
    setVideoMuted(!videoMuted);
  };
  
  // End reading session
  const handleEndSession = async (balanceDepleted: boolean = false) => {
    // Stop timer and billing
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (paymentManagerRef.current) {
      paymentManagerRef.current.stopBilling();
    }
    
    // Close WebRTC connection
    webRTCService.closeConnection();
    
    // Call API to end session
    if (currentSessionIdRef.current) {
      try {
        await endSession(currentSessionIdRef.current);
      } catch (err) {
        console.error('Error ending session:', err);
      }
    }
    
    // Reset state
    setSessionActive(false);
    setIsConnected(false);
    
    // Add system message
    const endMessage: Message = {
      id: `system-end-${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      isReader: false,
      content: balanceDepleted 
        ? 'Your session has ended because your balance is depleted.' 
        : 'Your reading session has ended.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, endMessage]);
    
    // Navigate to review screen after a delay
    setTimeout(() => {
      navigate(`/reading/${readerId}/review`, {
        state: {
          sessionId: currentSessionIdRef.current,
          duration: elapsedSeconds,
          totalCost: paymentManagerRef.current ? paymentManagerRef.current.getCurrentCost() : 0,
          readingType
        }
      });
    }, 3000);
  };
  
  // Send a chat message
  const handleSendMessage = (message: string) => {
    if (!user || !message.trim()) return;
    
    // Create local message object
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      isReader: user.role === 'reader',
      content: message,
      timestamp: new Date()
    };
    
    // Add to messages state
    setMessages(prev => [...prev, newMessage]);
    
    // Send via WebRTC
    webRTCService.sendMessage({
      type: 'chat',
      message,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      isReader: user.role === 'reader'
    });
  };
  
  // If we're still in checklist mode
  if (showChecklist) {
    return (
      <PreReadingChecklist 
        readingType={readingType as 'chat' | 'voice' | 'video'}
        onStartReading={handleStartReading}
      />
    );
  }
  
  // Loading or error state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ethereal-glow animate-pulse">
          <p className="text-lg text-accent">Connecting to your reader...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-4 text-red-500">
            <AlertCircle size={48} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-white">Connection Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
            >
              Back to Marketplace
            </Button>
            <Button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                handleStartReading();
              }}
              className="bg-accent hover:bg-accent/80"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-mystic-950 to-celestial-950">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* Chat sidebar - Show on left for larger screens, bottom for mobile */}
        <div className="lg:col-span-1 lg:order-1 order-3 lg:h-auto h-80">
          <div className="ethereal-border rounded-lg h-full overflow-hidden">
            <ReadingChat 
              sessionId={currentSessionIdRef.current || ''}
              readerId={readerId || ''}
              onSendMessage={handleSendMessage}
              messages={messages}
            />
          </div>
        </div>
        
        {/* Main video/content area */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          <div className="flex flex-col gap-4">
            {/* Reader name and status */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-alex-brush text-accent">
                  {readerProfile?.displayName || `${readerProfile?.firstName} ${readerProfile?.lastName}`}
                </h2>
                <p className="text-sm text-gray-400">
                  {readerProfile?.primarySpecialty || readerProfile?.specialties?.[0]}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-green-500/80' : 'bg-yellow-500/80'}`}>
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
            
            {/* Video container for video readings */}
            {readingType === 'video' && (
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
              </div>
            )}
            
            {/* Voice reading display */}
            {readingType === 'voice' && (
              <div className="aspect-video w-full bg-black/20 rounded-xl overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-accent/20 mx-auto mb-4 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-accent/30 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center">
                        {isConnected ? (
                          <div className="w-8 h-8 rounded-full bg-accent animate-pulse"></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-yellow-500/50"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-white">Voice Reading in Progress</h3>
                  <p className="text-sm text-gray-400">Audio connection established</p>
                </div>
              </div>
            )}
            
            {/* Chat-only reading display */}
            {readingType === 'chat' && (
              <div className="aspect-video w-full bg-black/20 rounded-xl overflow-hidden flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="ethereal-glow mb-4">
                    <span className="font-alex-brush text-2xl">✨ Chat Reading ✨</span>
                  </div>
                  <p className="text-gray-300 max-w-md mx-auto">
                    You are now in a private chat reading session with {readerProfile?.displayName || readerProfile?.firstName}.
                    Use the chat panel to communicate and receive your guidance.
                  </p>
                </div>
              </div>
            )}
            
            {/* Timer and controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <SessionTimer 
                  isActive={sessionActive}
                  elapsedSeconds={elapsedSeconds}
                  ratePerMinute={readerProfile?.ratePerMinute || 5}
                  currentBalance={userBalance}
                />
              </div>
              <div className="md:col-span-1">
                <div className="ethereal-border rounded-lg p-2">
                  <ReadingControls
                    audioMuted={audioMuted}
                    videoMuted={videoMuted}
                    readingType={readingType as 'chat' | 'voice' | 'video'}
                    onToggleAudio={handleToggleAudio}
                    onToggleVideo={handleToggleVideo}
                    onEndSession={() => handleEndSession(false)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainReadingSession;
