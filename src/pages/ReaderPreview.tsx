import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getReaderProfile, getBalance } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Clock, DollarSign, Video, MessageCircle, Phone, Calendar, Award, Shield, AlertCircle } from 'lucide-react';
import ReaderAvailabilityDisplay from '@/components/reading/ReaderAvailabilityDisplay';
import BookingWidget from '@/components/reading/BookingWidget';

interface ReaderProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profileImage: string;
  bannerImage?: string;
  specialties: string[];
  bio: string;
  longBio?: string;
  rating: number;
  reviewCount: number;
  ratePerMinute: number;
  isOnline: boolean;
  yearsExperience: number;
  availableReadingTypes: Array<'chat' | 'voice' | 'video'>;
  languages?: string[];
  reviews?: Array<{
    id: string;
    clientName: string;
    rating: number;
    comment: string;
    date: string;
  }>;
}

const ReaderPreview: React.FC = () => {
  const { readerId } = useParams<{ readerId: string }>();
  const location = useLocation();
  const readingType = location.state?.readingType || 'video';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [reader, setReader] = useState<ReaderProfile | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('about');
  
  useEffect(() => {
    const loadData = async () => {
      if (!readerId) return;
      
      try {
        setLoading(true);
        const [readerData, balanceData] = await Promise.all([
          getReaderProfile(readerId),
          user ? getBalance() : Promise.resolve(0)
        ]);
        
        setReader(readerData);
        setUserBalance(balanceData);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load reader information');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [readerId, user]);
  
  const handleStartReading = async (type: 'chat' | 'voice' | 'video') => {
    if (!user) {
      navigate('/login', { state: { from: `/reader/${readerId}/preview` } });
      return;
    }
    
    if (!reader) return;
    
    // Check if user has enough balance for at least 3 minutes
    const minimumBalance = reader.ratePerMinute * 3; // Minimum 3 minutes
    if (userBalance < minimumBalance) {
      navigate('/wallet', { 
        state: { 
          neededAmount: minimumBalance, 
          currentBalance: userBalance,
          returnTo: `/reader/${readerId}/preview`
        } 
      });
      return;
    }
    
    // Navigate to the appropriate reading session
    navigate(`/reading/${readerId}`, { state: { readingType: type } });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ethereal-glow animate-pulse">
          <p className="text-lg text-accent">Loading reader profile...</p>
        </div>
      </div>
    );
  }
  
  if (error || !reader) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-900/20 border border-red-700 rounded-lg max-w-lg">
          <h3 className="text-xl text-red-400 mb-2">Unable to Load Profile</h3>
          <p className="text-white/70">{error}</p>
          <Button 
            className="mt-4 bg-accent hover:bg-accent/80" 
            onClick={() => navigate('/marketplace')}
          >
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-8">
      {/* Banner and basic info */}
      <div className="relative h-64 bg-gradient-to-b from-celestial-900/50 to-mystic-900/50">
        {reader.bannerImage && (
          <img 
            src={reader.bannerImage} 
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        
        <div className="absolute bottom-0 left-0 w-full transform translate-y-1/2 px-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent">
              <img 
                src={reader.profileImage}
                alt={reader.displayName || `${reader.firstName} ${reader.lastName}`}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left md:pb-2">
              <h1 className="text-2xl md:text-3xl font-alex-brush text-accent glow-text-sm">
                {reader.displayName || `${reader.firstName} ${reader.lastName}`}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-1">
                {reader.specialties.slice(0, 3).map(specialty => (
                  <span key={specialty} className="text-xs bg-primary/30 text-primary-foreground px-2 py-0.5 rounded-full">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-1 md:pb-2">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="text-lg font-semibold">{reader.rating}</span>
                <span className="text-sm text-gray-300 ml-1">({reader.reviewCount} reviews)</span>
              </div>
              
              <div className="text-sm text-gray-300 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{reader.yearsExperience}+ years experience</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content area */}
      <div className="container mx-auto px-4 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-black/50 border border-primary/30 p-6">
              {/* Online status */}
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full ${reader.isOnline ? 'bg-green-500' : 'bg-gray-500'} mr-2`}></div>
                <span>{reader.isOnline ? 'Online Now' : 'Offline'}</span>
              </div>
              
              {/* Rate */}
              <div className="mb-6">
                <h3 className="text-gray-300 text-sm mb-2">Reading Rate</h3>
                <div className="text-2xl font-semibold text-accent flex items-center">
                  <DollarSign className="h-6 w-6 mr-1" />
                  <span>{reader.ratePerMinute.toFixed(2)}</span>
                  <span className="text-base text-gray-300 ml-1">/minute</span>
                </div>
              </div>
              
              {/* Reading types */}
              <div className="mb-6">
                <h3 className="text-gray-300 text-sm mb-2">Available Reading Types</h3>
                <div className="space-y-2">
                  {[
                    { id: 'chat', name: 'Chat Reading', icon: MessageCircle },
                    { id: 'voice', name: 'Voice Reading', icon: Phone },
                    { id: 'video', name: 'Video Reading', icon: Video }
                  ].map(type => {
                    const isAvailable = reader.availableReadingTypes.includes(type.id as 'chat' | 'voice' | 'video');
                    return (
                      <div key={type.id} className="flex items-center">
                        <type.icon className={`h-5 w-5 mr-2 ${isAvailable ? 'text-accent' : 'text-gray-600'}`} />
                        <span className={isAvailable ? 'text-white' : 'text-gray-600'}>
                          {type.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Languages */}
              {reader.languages && reader.languages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-gray-300 text-sm mb-2">Languages</h3>
                  <div className="flex flex-wrap gap-1">
                    {reader.languages.map(language => (
                      <span key={language} className="text-xs bg-primary/20 text-gray-300 px-2 py-0.5 rounded-full">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Balance info */}
              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-300">Your Balance:</span>
                  <span className="font-semibold">${userBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Min. required (3 min):</span>
                  <span>${(reader.ratePerMinute * 3).toFixed(2)}</span>
                </div>
                {userBalance < reader.ratePerMinute * 3 && (
                  <div className="mt-2 text-yellow-400 text-xs flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>You need to add funds before a session</span>
                  </div>
                )}
              </div>
              
              {/* Start reading buttons */}
              <div className="space-y-3">
                {['video', 'voice', 'chat'].map(type => {
                  const isAvailable = reader.availableReadingTypes.includes(type as 'chat' | 'voice' | 'video');
                  const Icon = type === 'video' ? Video : type === 'voice' ? Phone : MessageCircle;
                  return (
                    <Button 
                      key={type}
                      disabled={!isAvailable || !reader.isOnline}
                      onClick={() => handleStartReading(type as 'chat' | 'voice' | 'video')}
                      className={`w-full ${isAvailable && reader.isOnline ? 'bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic' : 'bg-gray-800 text-gray-500'}`}
                      title={!isAvailable ? `${type} readings not available` : (!reader.isOnline ? 'Reader is offline' : undefined)}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      Start {type.charAt(0).toUpperCase() + type.slice(1)} Reading
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6">
                <Card className="bg-black/50 border border-primary/30 p-6">
                  <h2 className="text-xl font-semibold mb-4 text-accent">About Me</h2>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {reader.longBio || reader.bio}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h3 className="text-accent flex items-center mb-3">
                        <Award className="h-5 w-5 mr-2" />
                        Specialties
                      </h3>
                      <ul className="space-y-1">
                        {reader.specialties.map(specialty => (
                          <li key={specialty} className="flex items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent mr-2"></span>
                            <span>{specialty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <h3 className="text-accent flex items-center mb-3">
                        <Shield className="h-5 w-5 mr-2" />
                        Guarantees
                      </h3>
                      <ul className="space-y-1">
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent mr-2"></span>
                          <span>Verified psychic abilities</span>
                        </li>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent mr-2"></span>
                          <span>100% satisfaction guarantee</span>
                        </li>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent mr-2"></span>
                          <span>Confidential readings</span>
                        </li>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent mr-2"></span>
                          <span>24/7 customer support</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-4">
                <Card className="bg-black/50 border border-primary/30 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-accent">Client Reviews</h2>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="font-semibold">{reader.rating}</span>
                      <span className="text-sm text-gray-400 ml-1">({reader.reviewCount})</span>
                    </div>
                  </div>
                  
                  {reader.reviews && reader.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reader.reviews.map(review => (
                        <div key={review.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold">{review.clientName}</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                                />
                              ))}
                              <span className="text-xs text-gray-400 ml-2">{review.date}</span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">This reader doesn't have any reviews yet.</p>
                  )}
                </Card>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <Card className="bg-black/50 border border-primary/30 p-6">
                  <div className="flex items-center mb-6">
                    <Calendar className="h-5 w-5 mr-2" />
                    <h2 className="text-xl font-semibold text-accent">Schedule a Session</h2>
                  </div>
                  
                  <p className="text-gray-300 mb-4">
                    This reader is currently accepting spontaneous readings when online. 
                    Scheduled sessions coming soon.
                  </p>
                  
                  <div className="bg-primary/10 p-4 rounded-lg">
                    {/* ReaderAvailabilityDisplay shows the reader's weekly schedule */}
                    {/* TODO: Replace mock data with real API data */}
                    <ReaderAvailabilityDisplay availability={[
                      { enabled: true, start: '10:00', end: '18:00' }, // Sun
                      { enabled: true, start: '10:00', end: '18:00' }, // Mon
                      { enabled: true, start: '10:00', end: '18:00' }, // Tue
                      { enabled: true, start: '10:00', end: '18:00' }, // Wed
                      { enabled: true, start: '10:00', end: '18:00' }, // Thu
                      { enabled: true, start: '10:00', end: '16:00' }, // Fri
                      { enabled: false, start: '', end: '' }, // Sat
                    ]} />
                    <BookingWidget
                      availability={[
                        { enabled: true, start: '10:00', end: '18:00' },
                        { enabled: true, start: '10:00', end: '18:00' },
                        { enabled: true, start: '10:00', end: '18:00' },
                        { enabled: true, start: '10:00', end: '18:00' },
                        { enabled: true, start: '10:00', end: '18:00' },
                        { enabled: true, start: '10:00', end: '16:00' },
                        { enabled: false, start: '', end: '' },
                      ]}
                      onBook={async (dayIndex, time) => {
                        // TODO: Replace with real API call
                        await new Promise(res => setTimeout(res, 800));
                      }}
                    />
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReaderPreview;
