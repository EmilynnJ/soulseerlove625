import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import BookingPaymentForm from './BookingPaymentForm';
import { createBooking } from '@/lib/backend';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface BookingWidgetProps {
  availability: Array<{ enabled: boolean; start: string; end: string }>;
  onBook: (dayIndex: number, time: string) => Promise<void>;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({ availability, onBook }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleBook = async () => {
    // Should not be called directly for scheduled readings
    // Use after payment success
    if (selectedDay === null || !selectedTime) return;
    setBooking(true);
    setError(null);
    try {
      await onBook(selectedDay, selectedTime);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      setSelectedDay(null);
      setSelectedTime('');
      setShowPayment(false);
    } catch (e) {
      setError('Booking failed. Try again.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-black/30 rounded-lg border border-primary/20">
      <h4 className="font-semibold mb-2 text-accent">Request a Session</h4>
      <div className="flex flex-wrap gap-2 mb-4">
        {DAYS.map((day, i) => (
          <Button
            key={day}
            size="sm"
            variant={selectedDay === i ? 'default' : 'outline'}
            className={availability[i]?.enabled ? '' : 'opacity-40 cursor-not-allowed'}
            onClick={() => availability[i]?.enabled && setSelectedDay(i)}
            disabled={!availability[i]?.enabled}
          >
            {day.slice(0, 3)}
          </Button>
        ))}
      </div>
      {selectedDay !== null && availability[selectedDay]?.enabled && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <label htmlFor="time" className="text-sm">Time:</label>
            <input
              id="time"
              type="time"
              value={selectedTime}
              min={availability[selectedDay].start}
              max={availability[selectedDay].end}
              onChange={e => setSelectedTime(e.target.value)}
              className="rounded border border-gray-700 bg-gray-900 text-gray-100 px-2 py-1"
            />
          </div>
          {/* Payment required for scheduled booking */}
          {selectedTime && !showPayment && (
            <Button
              onClick={() => setShowPayment(true)}
              className="w-full"
              disabled={booking}
            >
              Next: Pay & Book
            </Button>
          )}
          {showPayment && (
            <BookingPaymentForm
              amount={25}
              onSuccess={handleBook}
            />
          )}
        </>
      )}
      {success && <span className="ml-4 text-green-400">Requested!</span>}
      {error && <span className="ml-4 text-red-400">{error}</span>}
    </div>
  );
};

export default BookingWidget;
