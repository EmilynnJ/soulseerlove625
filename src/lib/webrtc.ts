// src/lib/webrtc.ts
// WebRTC and Socket.IO service for SoulSeer reading sessions
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const ICE_SERVERS = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
    ],
  }
];

// Add additional TURN servers from env if available
if (import.meta.env.VITE_TURN_SERVER && 
    import.meta.env.VITE_TURN_USERNAME && 
    import.meta.env.VITE_TURN_CREDENTIAL) {
  ICE_SERVERS.push({
    urls: import.meta.env.VITE_TURN_SERVER,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  });
}

interface RTCSessionConfig {
  onTrack?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onError?: (error: Error) => void;
  onMuteChange?: (audioMuted: boolean, videoMuted: boolean) => void;
}

export class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  private role: 'reader' | 'client' | null = null;
  private config: RTCSessionConfig = {};
  private isAudioMuted = false;
  private isVideoMuted = false;
  
  // Connect to signaling server
  connect(userId: string, role: 'reader' | 'client') {
    if (this.socket) return;
    
    this.userId = userId;
    this.role = role;
    
    this.socket = io(SOCKET_URL, {
      auth: { userId },
      withCredentials: true,
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
    });
    
    this.socket.on('signal', this.handleSignal.bind(this));
    this.socket.on('ice-candidate', this.handleIceCandidate.bind(this));
    this.socket.on('session-end', this.handleSessionEnd.bind(this));
    
    return this.socket;
  }
  
  // Initialize WebRTC for a session
  async initSession(roomId: string, config: RTCSessionConfig = {}) {
    this.config = config;
    this.roomId = roomId;
    
    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection({ 
        iceServers: ICE_SERVERS,
      });
      
      // Set up event listeners
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendIceCandidate(event.candidate);
          if (this.config.onIceCandidate) {
            this.config.onIceCandidate(event.candidate);
          }
        }
      };
      
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.config.onTrack) {
          this.config.onTrack(this.remoteStream);
        }
      };
      
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('Connection state changed:', state);
        if (this.config.onConnectionStateChange && state) {
          this.config.onConnectionStateChange(state);
        }
      };
      
      // Join the room on the signaling server
      if (this.socket) {
        this.socket.emit('join-room', { roomId, userId: this.userId, role: this.role });
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing WebRTC session:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      return false;
    }
  }
  
  // Start local media (audio/video)
  async startLocalMedia(audioEnabled = true, videoEnabled = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } : false,
      });
      
      // Add tracks to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }
      
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
      return null;
    }
  }
  
  // Create and send offer (initiator)
  async createOffer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await this.peerConnection.setLocalDescription(offer);
      
      // Send the offer to the other peer
      if (this.socket) {
        this.socket.emit('signal', {
          roomId: this.roomId,
          userId: this.userId,
          type: 'offer',
          sdp: offer.sdp,
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }
  
  // Handle incoming WebRTC signaling
  private async handleSignal(data: any) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      
      if (data.userId === this.userId) return; // Ignore our own messages
      
      if (data.type === 'offer') {
        // Set remote description
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: 'offer', sdp: data.sdp })
        );
        
        // Create and send answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        if (this.socket) {
          this.socket.emit('signal', {
            roomId: this.roomId,
            userId: this.userId,
            type: 'answer',
            sdp: answer.sdp,
          });
        }
      } else if (data.type === 'answer') {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: data.sdp })
        );
      }
    } catch (error) {
      console.error('Error handling signal:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }
  
  // Handle incoming ICE candidates
  private async handleIceCandidate(data: any) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      
      if (data.userId === this.userId) return; // Ignore our own messages
      
      await this.peerConnection.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }
  
  // Send ICE candidate to peer
  private sendIceCandidate(candidate: RTCIceCandidate) {
    if (this.socket) {
      this.socket.emit('ice-candidate', {
        roomId: this.roomId,
        userId: this.userId,
        candidate,
      });
    }
  }
  
  // Toggle audio mute status
  toggleAudio() {
    if (!this.localStream) return;
    
    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;
    
    this.isAudioMuted = !this.isAudioMuted;
    audioTracks.forEach(track => {
      track.enabled = !this.isAudioMuted;
    });
    
    if (this.config.onMuteChange) {
      this.config.onMuteChange(this.isAudioMuted, this.isVideoMuted);
    }
    
    return this.isAudioMuted;
  }
  
  // Toggle video mute status
  toggleVideo() {
    if (!this.localStream) return;
    
    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    this.isVideoMuted = !this.isVideoMuted;
    videoTracks.forEach(track => {
      track.enabled = !this.isVideoMuted;
    });
    
    if (this.config.onMuteChange) {
      this.config.onMuteChange(this.isAudioMuted, this.isVideoMuted);
    }
    
    return this.isVideoMuted;
  }
  
  // Handle session end
  private handleSessionEnd() {
    this.endSession();
  }
  
  // End the WebRTC session
  endSession() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Leave the room
    if (this.socket && this.roomId) {
      this.socket.emit('leave-room', {
        roomId: this.roomId,
        userId: this.userId,
      });
    }
    
    this.roomId = null;
    this.remoteStream = null;
  }
  
  // Disconnect and cleanup
  disconnect() {
    this.endSession();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.userId = null;
    this.role = null;
  }
  
  // Get local media stream
  getLocalStream() {
    return this.localStream;
  }
  
  // Get remote media stream
  getRemoteStream() {
    return this.remoteStream;
  }
}

// Create and export a singleton instance
export const webRTCService = new WebRTCService();
