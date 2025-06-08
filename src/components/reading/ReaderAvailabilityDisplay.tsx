import React from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface DayAvailability {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface ReaderAvailabilityDisplayProps {
  availability: DayAvailability[];
}

const ReaderAvailabilityDisplay: React.FC<ReaderAvailabilityDisplayProps> = ({ availability }) => {
  return (
    <div className="w-full">
      <h4 className="font-semibold mb-2 text-accent">Weekly Availability</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {DAYS.map((day, i) => (
          <div key={day} className="flex items-center gap-4 p-2 rounded bg-black/20">
            <span className="w-20 text-sm font-medium">{day}</span>
            {availability[i]?.enabled ? (
              <span className="text-green-400 text-sm">
                {availability[i].start} - {availability[i].end}
              </span>
            ) : (
              <span className="text-gray-500 text-sm">Unavailable</span>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">* Times shown in your local timezone</p>
    </div>
  );
};

export default ReaderAvailabilityDisplay;
