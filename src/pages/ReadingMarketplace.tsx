import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailableReaders, getReaderProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Clock, DollarSign, Video, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Reader {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profileImage: string;
  specialties: string[];
  bio: string;
  rating: number;
  reviewCount: number;
  ratePerMinute: number;
  isOnline: boolean;
  yearsExperience?: number;
  availableReadingTypes: Array<'chat' | 'voice' | 'video'>;
}

const ReadingMarketplace: React.FC = () => {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // All possible specialties for filtering
  const allSpecialties = [
    'Tarot Reading', 'Astrology', 'Medium', 'Clairvoyant', 'Love & Relationships', 
    'Career', 'Spirit Guide', 'Angel Reading', 'Past Life', 'Psychic', 'Dream Interpretation'
  ];

  // Reading types
  const readingTypes = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'voice', label: 'Voice', icon: Phone },
    { id: 'video', label: 'Video', icon: Video }
  ];

  useEffect(() => {
    const fetchReaders = async () => {
      try {
        setLoading(true);
        const data = await getAvailableReaders();
        setReaders(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load readers');
      } finally {
        setLoading(false);
      }
    };

    fetchReaders();
  }, []);

  const filteredReaders = readers.filter(reader => {
    // Filter by specialty
    const matchesSpecialty = selectedSpecialty === 'all' || 
      reader.specialties.includes(selectedSpecialty);
      
    // Filter by reading type
    const matchesType = selectedType === 'all' || 
      reader.availableReadingTypes.includes(selectedType as 'chat' | 'voice' | 'video');
      
    return matchesSpecialty && matchesType;
  });

  const handleStartReading = (readerId: string, readingType: 'chat' | 'voice' | 'video') => {
    if (!user) {
      navigate('/login', { state: { from: `/reader/${readerId}` } });
      return;
    }
    navigate(`/reader/${readerId}/preview`, { state: { readingType } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="ethereal-glow animate-pulse">
          <p className="text-lg text-accent">Loading psychic readers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-900/20 border border-red-700 rounded-lg max-w-lg">
          <h3 className="text-xl text-red-400 mb-2">Unable to Connect</h3>
          <p className="text-white/70">{error}</p>
          <Button 
            className="mt-4 bg-accent hover:bg-accent/80" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-alex-brush mb-8 text-center text-accent glow-text-sm">
        Find Your Spiritual Guide
      </h1>
      
      {/* Filters */}
      <div className="ethereal-border rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Specialty filter */}
          <div className="w-full md:w-1/2">
            <label className="text-sm text-gray-300 block mb-2">Filter by specialty:</label>
            <select 
              value={selectedSpecialty} 
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full p-2 rounded-md bg-black/30 border border-primary/30 text-white"
            >
              <option value="all">All Specialties</option>
              {allSpecialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          
          {/* Reading type filter */}
          <div className="w-full md:w-1/2">
            <label className="text-sm text-gray-300 block mb-2">Filter by reading type:</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 rounded-md bg-black/30 border border-primary/30 text-white"
            >
              <option value="all">All Types</option>
              {readingTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reader grid */}
      {filteredReaders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReaders.map(reader => (
            <Card key={reader.id} className="bg-black/50 border border-primary/30 overflow-hidden">
              <div className="relative">
                {/* Online indicator */}
                <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${reader.isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                
                {/* Reader image */}
                <img 
                  src={reader.profileImage} 
                  alt={reader.displayName || `${reader.firstName} ${reader.lastName}`} 
                  className="w-full h-48 object-cover"
                />
                
                {/* Rating */}
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-md flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1 fill-yellow-400" />
                  <span className="text-sm">{reader.rating} ({reader.reviewCount})</span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-accent mb-1">
                  {reader.displayName || `${reader.firstName} ${reader.lastName}`}
                </h3>
                
                {/* Specialties */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {reader.specialties.slice(0, 3).map(specialty => (
                    <span key={specialty} className="text-xs bg-primary/30 text-primary-foreground px-2 py-0.5 rounded-full">
                      {specialty}
                    </span>
                  ))}
                  {reader.specialties.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{reader.specialties.length - 3} more
                    </span>
                  )}
                </div>
                
                {/* Experience & rate */}
                <div className="flex justify-between mb-3 text-sm text-gray-300">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{reader.yearsExperience || '5'}+ years</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>${reader.ratePerMinute.toFixed(2)}/min</span>
                  </div>
                </div>
                
                {/* Bio - truncated */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {reader.bio}
                </p>
                
                {/* Reading type buttons */}
                <div className="flex justify-between gap-2">
                  {readingTypes.map(type => {
                    const isAvailable = reader.availableReadingTypes.includes(type.id as 'chat' | 'voice' | 'video');
                    return (
                      <Button 
                        key={type.id}
                        disabled={!isAvailable || !reader.isOnline}
                        onClick={() => handleStartReading(reader.id, type.id as 'chat' | 'voice' | 'video')}
                        className={`flex-1 ${isAvailable && reader.isOnline ? 'bg-gradient-to-r from-mystic-600 to-celestial-600 hover:from-mystic-700 hover:to-celestial-700 text-white glow-mystic' : 'bg-gray-800 text-gray-500'}`}
                        title={!isAvailable ? `${type.label} readings not available` : (!reader.isOnline ? 'Reader is offline' : undefined)}
                      >
                        <type.icon className="mr-1 h-4 w-4" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-10">
          <p className="text-lg text-gray-300">No readers match your filters.</p>
          <Button 
            onClick={() => { setSelectedSpecialty('all'); setSelectedType('all'); }}
            className="mt-4 bg-accent hover:bg-accent/80"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReadingMarketplace;
