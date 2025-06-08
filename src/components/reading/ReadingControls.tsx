import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReadingControlsProps {
  audioMuted: boolean;
  videoMuted: boolean;
  readingType: 'chat' | 'voice' | 'video';
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndSession: () => void;
}

const ReadingControls: React.FC<ReadingControlsProps> = ({
  audioMuted,
  videoMuted,
  readingType,
  onToggleAudio,
  onToggleVideo,
  onEndSession
}) => {
  return (
    <div className="flex items-center justify-center space-x-4 p-4">
      <TooltipProvider>
        {/* Audio toggle button - only for voice and video readings */}
        {readingType !== 'chat' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onToggleAudio}
                variant="outline"
                size="icon"
                className={`rounded-full w-12 h-12 ${audioMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
              >
                {audioMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{audioMuted ? 'Unmute Microphone' : 'Mute Microphone'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Video toggle button - only for video readings */}
        {readingType === 'video' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={onToggleVideo}
                variant="outline"
                size="icon"
                className={`rounded-full w-12 h-12 ${videoMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
              >
                {videoMuted ? <VideoOff size={20} /> : <Video size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{videoMuted ? 'Turn On Camera' : 'Turn Off Camera'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Chat button for video/voice readings */}
        {readingType !== 'chat' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 bg-primary/20 text-primary-foreground hover:bg-primary/30"
              >
                <MessageSquare size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open Chat</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* End session button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={onEndSession}
              variant="destructive"
              size="icon"
              className="rounded-full w-12 h-12 bg-red-500 text-white hover:bg-red-600"
            >
              <PhoneOff size={20} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>End Reading Session</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ReadingControls;
