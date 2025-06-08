import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getReaderProfile, submitReview } from '@/lib/api';
import { Star, Clock, DollarSign } from 'lucide-react';

interface ReaderProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profileImage?: string;
  primarySpecialty?: string;
  specialties?: string[];
  bio?: string;
  ratePerMinute: number;
}

interface ReviewData {
  readerId: string;
  sessionId: string;
  rating: number;
  reviewText: string;
  timestamp: string;
}

interface LocationState {
  sessionId: string;
  duration: number;
  totalCost: number;
  readingType: 'chat' | 'voice' | 'video';
}

const ReadingReview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { readerId } = useParams<{ readerId: string }>();
  const state = location.state as LocationState;
  
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [readerProfile, setReaderProfile] = useState<ReaderProfile | null>(null);
  
  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };
  
  useEffect(() => {
    // Load reader profile
    const loadReaderProfile = async () => {
      if (!readerId) return;
      
      try {
        const profile = await getReaderProfile(readerId);
        setReaderProfile(profile);
      } catch (err) {
        console.error('Error loading reader profile:', err);
        setError('Failed to load reader profile');
      }
    };
    
    loadReaderProfile();
    
    // Redirect if no session data was provided
    if (!state || !state.sessionId) {
      navigate('/marketplace');
    }
  }, [readerId, navigate, state]);
  
  const handleSubmitReview = async () => {
    if (rating === 0) {
      setError('Please provide a star rating');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!state.sessionId || !readerId) {
        throw new Error('Missing session data');
      }
      
      await submitReview({
        readerId,
        sessionId: state.sessionId,
        rating,
        reviewText: review,
        timestamp: new Date().toISOString()
      });
      
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit review';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-mystic-950 to-celestial-950">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-alex-brush text-center text-accent mb-6">
          Your Reading Session Has Ended
        </h1>
        
        {/* Session summary */}
        <Card className="mb-8 bg-black/50 border border-primary/30 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Clock className="h-6 w-6 mx-auto text-accent mb-2" />
              <h3 className="text-sm text-gray-400">Session Duration</h3>
              <p className="text-xl font-semibold text-white">
                {state?.duration ? formatDuration(state.duration) : '--:--'}
              </p>
            </div>
            
            <div className="text-center">
              <DollarSign className="h-6 w-6 mx-auto text-accent mb-2" />
              <h3 className="text-sm text-gray-400">Total Cost</h3>
              <p className="text-xl font-semibold text-accent">
                ${state?.totalCost ? state.totalCost.toFixed(2) : '0.00'}
              </p>
            </div>
            
            <div className="text-center">
              <div className="h-6 w-6 mx-auto text-accent mb-2 flex items-center justify-center">
                {state?.readingType === 'video' ? '📹' : state?.readingType === 'voice' ? '🎤' : '💬'}
              </div>
              <h3 className="text-sm text-gray-400">Reading Type</h3>
              <p className="text-xl font-semibold text-white capitalize">
                {state?.readingType || 'Unknown'}
              </p>
            </div>
          </div>
          
          {readerProfile && (
            <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden">
                {readerProfile.profileImage ? (
                  <img 
                    src={readerProfile.profileImage} 
                    alt={readerProfile.displayName || readerProfile.firstName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xl font-medium text-primary">
                    {(readerProfile.firstName?.[0] || '') + (readerProfile.lastName?.[0] || '')}
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium">
                  {readerProfile.displayName || `${readerProfile.firstName} ${readerProfile.lastName}`}
                </h3>
                <p className="text-sm text-gray-400">
                  {readerProfile.primarySpecialty || readerProfile.specialties?.[0]}
                </p>
              </div>
            </div>
          )}
        </Card>
        
        {/* Review form */}
        {success ? (
          <Card className="p-6 bg-green-900/20 border border-green-700">
            <div className="text-center">
              <div className="text-green-400 text-5xl mb-4">✓</div>
              <h2 className="text-xl font-medium text-white mb-2">
                Thank you for your feedback!
              </h2>
              <p className="text-gray-300 mb-4">
                Your review has been submitted successfully.
              </p>
              <p className="text-sm text-gray-400">
                Redirecting to your dashboard...
              </p>
            </div>
          </Card>
        ) : (
          <Card className="bg-black/50 border border-primary/30 p-6">
            <h2 className="text-xl font-medium mb-6">Share Your Feedback</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rate your experience
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star 
                      size={32}
                      className={`${(hoverRating || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-500'} 
                        transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  {rating === 5 ? 'Excellent!' : 
                   rating === 4 ? 'Very Good!' : 
                   rating === 3 ? 'Good' : 
                   rating === 2 ? 'Fair' : 'Poor'}
                </p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your review (optional)
              </label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this reader..."
                className="bg-black/30 border border-primary/30"
                rows={4}
              />
            </div>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isSubmitting}
              >
                Skip
              </Button>
              
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || rating === 0}
                className="bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReadingReview;
