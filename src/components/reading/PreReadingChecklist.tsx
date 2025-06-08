import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getReaderProfile, getBalance } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, AlertCircle, Video, Mic, Speaker, Wifi } from 'lucide-react';

interface PreReadingChecklistProps {
  readingType: 'chat' | 'voice' | 'video';
  onStartReading: () => void;
}

const PreReadingChecklist: React.FC<PreReadingChecklistProps> = ({ readingType, onStartReading }) => {
  const { user } = useAuth();
  const { readerId } = useParams<{ readerId: string }>();
  const navigate = useNavigate();
  
  const [deviceChecks, setDeviceChecks] = useState({
    camera: readingType !== 'video' ? 'skipped' : 'pending',
    microphone: readingType === 'chat' ? 'skipped' : 'pending',
    speaker: 'pending',
    connection: 'pending'
  });
  
  const [readerProfile, setReaderProfile] = useState<any>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    // Load reader profile and user balance
    const loadData = async () => {
      if (!readerId) return;
      
      try {
        const [readerData, balanceData] = await Promise.all([
          getReaderProfile(readerId),
          user ? getBalance() : Promise.resolve(0)
        ]);
        
        setReaderProfile(readerData);
        setUserBalance(balanceData);
        
        // Check if balance is sufficient
        const minimumBalance = readerData.ratePerMinute * 3; // Minimum 3 minutes
        if (balanceData < minimumBalance) {
          setError(`Insufficient balance. You need at least $${minimumBalance.toFixed(2)} to start a reading.`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load necessary data');
      }
    };
    
    loadData();
    checkInternetConnection();
    
    // Clean up function to stop media streams
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [readerId, user, readingType]);
  
  const startDeviceChecks = async () => {
    try {
      // Check internet connection
      await checkInternetConnection();
      
      // Skip camera check for chat and voice readings
      if (readingType === 'video') {
        await checkCamera();
      }
      
      // Skip microphone check for chat readings
      if (readingType !== 'chat') {
        await checkMicrophone();
      }
      
      // Check speakers
      await checkSpeakers();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const checkInternetConnection = async () => {
    setDeviceChecks(prev => ({ ...prev, connection: 'checking' }));
    
    try {
      const response = await fetch('https://www.google.com', { mode: 'no-cors' });
      setDeviceChecks(prev => ({ ...prev, connection: 'success' }));
      return true;
    } catch (err) {
      setDeviceChecks(prev => ({ ...prev, connection: 'failure' }));
      throw new Error('Internet connection check failed');
    }
  };
  
  const checkCamera = async () => {
    setDeviceChecks(prev => ({ ...prev, camera: 'checking' }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Display video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setLocalStream(stream);
      setDeviceChecks(prev => ({ ...prev, camera: 'success' }));
      return true;
    } catch (err) {
      setDeviceChecks(prev => ({ ...prev, camera: 'failure' }));
      throw new Error('Camera check failed. Please ensure your camera is connected and permissions are granted.');
    }
  };
  
  const checkMicrophone = async () => {
    setDeviceChecks(prev => ({ ...prev, microphone: 'checking' }));
    
    try {
      // If we already have a stream with video, just check for audio track
      if (localStream && localStream.getVideoTracks().length > 0) {
        // Add audio track to existing stream
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach(track => {
          localStream.addTrack(track);
        });
      } else {
        // Create new stream with just audio
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(stream);
      }
      
      setDeviceChecks(prev => ({ ...prev, microphone: 'success' }));
      return true;
    } catch (err) {
      setDeviceChecks(prev => ({ ...prev, microphone: 'failure' }));
      throw new Error('Microphone check failed. Please ensure your microphone is connected and permissions are granted.');
    }
  };
  
  const checkSpeakers = async () => {
    setDeviceChecks(prev => ({ ...prev, speaker: 'checking' }));
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Create and play a test sound
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // 440 Hz = A4
      
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      // Stop after a short time
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        setDeviceChecks(prev => ({ ...prev, speaker: 'success' }));
      }, 1000);
      
      return true;
    } catch (err) {
      setDeviceChecks(prev => ({ ...prev, speaker: 'failure' }));
      throw new Error('Speaker check failed. Please ensure your speakers are connected and working.');
    }
  };
  
  const handleStartReading = () => {
    // Ensure all relevant checks have passed
    const requiredChecks = Object.entries(deviceChecks).filter(([key, value]) => {
      if (key === 'camera' && readingType !== 'video') return false;
      if (key === 'microphone' && readingType === 'chat') return false;
      return true;
    });
    
    const allChecksPassed = requiredChecks.every(([_, value]) => value === 'success' || value === 'skipped');
    
    if (!allChecksPassed) {
      setError('Please complete all device checks before starting the reading');
      return;
    }
    
    // Check if balance is sufficient
    if (userBalance < (readerProfile?.ratePerMinute || 0) * 3) {
      navigate('/wallet', { 
        state: { 
          neededAmount: (readerProfile?.ratePerMinute || 0) * 3, 
          currentBalance: userBalance,
          returnTo: `/reading/${readerId}`
        } 
      });
      return;
    }
    
    // Clean up media streams before starting
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Start reading session
    onStartReading();
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <X className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>;
      default:
        return <div className="h-5 w-5 rounded-full border border-gray-300"></div>;
    }
  };
  
  const getCheckItem = (
    title: string,
    description: string,
    status: string,
    icon: React.ReactNode,
    action?: () => void
  ) => (
    <div className="flex items-center p-4 border-b border-gray-800 last:border-b-0">
      <div className="mr-4 text-accent">{icon}</div>
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="ml-4 flex items-center">
        {getStatusIcon(status)}
        {status !== 'success' && status !== 'skipped' && (
          <Button
            onClick={action}
            variant="ghost"
            size="sm"
            className="ml-2 text-accent hover:text-accent/80"
          >
            {status === 'failure' ? 'Retry' : 'Check'}
          </Button>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-alex-brush text-accent mb-6 text-center">
        Prepare for Your Reading
      </h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400">{error}</p>
            {error.includes('balance') && (
              <Button
                onClick={() => navigate('/wallet')}
                variant="link"
                className="p-0 h-auto text-accent text-sm"
              >
                Add funds to your wallet
              </Button>
            )}
          </div>
        </div>
      )}
      
      <Card className="bg-black/50 border border-primary/30 mb-6">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium">System Check</h3>
          <p className="text-sm text-gray-400">
            Let's make sure everything is working properly before your reading
          </p>
        </div>
        
        {getCheckItem(
          'Internet Connection',
          'Check your internet connectivity',
          deviceChecks.connection,
          <Wifi />,
          checkInternetConnection
        )}
        
        {readingType !== 'chat' && getCheckItem(
          'Microphone',
          'Check if your microphone is working',
          deviceChecks.microphone,
          <Mic />,
          checkMicrophone
        )}
        
        {readingType === 'video' && getCheckItem(
          'Camera',
          'Check if your camera is working',
          deviceChecks.camera,
          <Video />,
          checkCamera
        )}
        
        {getCheckItem(
          'Speakers',
          'Test your audio output',
          deviceChecks.speaker,
          <Speaker />,
          checkSpeakers
        )}
      </Card>
      
      {deviceChecks.camera === 'success' && readingType === 'video' && (
        <div className="mb-6 aspect-video w-full max-h-64 bg-black rounded-lg overflow-hidden mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <p className="text-xs text-center text-gray-400 mt-1">
            Your camera preview
          </p>
        </div>
      )}
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        
        <Button
          onClick={() => startDeviceChecks()}
          variant="outline"
          className="mx-2"
        >
          Run All Checks
        </Button>
        
        <Button
          onClick={handleStartReading}
          className="bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic"
        >
          Start Reading
        </Button>
      </div>
    </div>
  );
};

export default PreReadingChecklist;
