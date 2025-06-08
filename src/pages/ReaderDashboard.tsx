import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getReaderSessions, getEarnings, getReaderReviews } from '@/lib/api';
import { getReaderBookings, acceptBooking, declineBooking } from '@/lib/backend';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import ReaderAvailability from '@/components/reading/ReaderAvailability';

interface Session {
  id: string;
  clientName: string;
  startedAt: string;
  endedAt: string;
  status: string;
  earnings: number;
}

interface Review {
  id: string;
  clientName: string;
  rating: number;
  text: string;
  createdAt: string;
}

const ReaderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<number>(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingActionLoading, setBookingActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [earns, sess, revs, bks] = await Promise.all([
          getEarnings(),
          getReaderSessions(),
          getReaderReviews(),
          getReaderBookings(),
        ]);
        setEarnings(earns);
        setSessions(sess);
        setReviews(revs);
        setBookings(bks);
      } catch (e) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-alex-brush text-accent mb-6">Welcome, {user?.firstName}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-4">
          <div className="font-bold text-lg mb-2">Total Earnings</div>
          <div className="text-2xl text-accent mb-2">${earnings.toFixed(2)}</div>
          <Button asChild className="w-full">
            <Link to="/wallet">Withdraw</Link>
          </Button>
        </Card>
        <Card className="p-4 md:col-span-2">
          <div className="font-bold text-lg mb-2">Quick Actions</div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link to="/marketplace">View Marketplace</Link></Button>
            <Button asChild variant="outline"><Link to="/dashboard#reviews">My Reviews</Link></Button>
            <Button asChild variant="outline"><Link to="/dashboard#availability">Set Availability</Link></Button>
          </div>
        </Card>
      </div>
      <Card className="p-4 mb-8">
        <div className="font-bold text-lg mb-4">Upcoming Bookings</div>
        {bookings.length === 0 ? (
          <div className="text-gray-400">No upcoming bookings.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Date</th>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-t border-gray-800">
                    <td>{b.date}</td>
                    <td>{b.time}</td>
                    <td>{b.clientName}</td>
                    <td>
                      {b.status === 'pending' ? (
                        <div className="flex gap-2 items-center">
                          <Button
                            size="sm"
                            disabled={bookingActionLoading === b.id}
                            onClick={async () => {
                              setBookingActionLoading(b.id);
                              await acceptBooking(b.id);
                              setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'confirmed' } : x));
                              setBookingActionLoading(null);
                            }}
                            className="bg-green-700/80 hover:bg-green-700"
                          >
                            {bookingActionLoading === b.id ? 'Accepting...' : 'Accept'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={bookingActionLoading === b.id}
                            onClick={async () => {
                              setBookingActionLoading(b.id);
                              await declineBooking(b.id);
                              setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'declined' } : x));
                              setBookingActionLoading(null);
                            }}
                          >
                            {bookingActionLoading === b.id ? 'Declining...' : 'Decline'}
                          </Button>
                        </div>
                      ) : (
                        <span>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card className="p-4 mb-8">
        <div className="font-bold text-lg mb-4">Upcoming & Recent Readings</div>
        {sessions.length === 0 ? (
          <div className="text-gray-400">No readings yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Date</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Earnings</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} className="border-t border-gray-800">
                    <td>{new Date(s.startedAt).toLocaleString()}</td>
                    <td>{s.clientName}</td>
                    <td>{s.status}</td>
                    <td>${s.earnings.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card className="p-4" id="reviews">
        <div className="font-bold text-lg mb-4">My Reviews</div>
        {reviews.length === 0 ? (
          <div className="text-gray-400">No reviews yet.</div>
        ) : (
          <ul className="space-y-4">
            {reviews.map(r => (
              <li key={r.id} className="border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-accent">{r.clientName}</span>
                  <span className="text-yellow-400">{'★'.repeat(r.rating)}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-gray-200 mt-1">{r.text}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card className="p-4 mt-8" id="availability">
        <div className="font-bold text-lg mb-4">Availability & Schedule</div>
        <ReaderAvailability />
      </Card>
    </div>
  );
};

export default ReaderDashboard;
