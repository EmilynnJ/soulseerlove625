import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayAvailability {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

const defaultAvailability: DayAvailability[] = DAYS.map(() => ({
  enabled: false,
  start: '09:00',
  end: '17:00',
}));

const ReaderAvailability: React.FC = () => {
  const [availability, setAvailability] = useState<DayAvailability[]>([...defaultAvailability]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleToggleDay = (i: number) => {
    setAvailability(avail => avail.map((a, idx) => idx === i ? { ...a, enabled: !a.enabled } : a));
  };

  const handleTimeChange = (i: number, field: 'start' | 'end', value: string) => {
    setAvailability(avail => avail.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await setReaderAvailability(availability);
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-bold text-lg mb-4">Set Your Weekly Availability</h3>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4">
        {DAYS.map((day, i) => (
          <div key={day} className="flex flex-col items-center">
            <label className="font-semibold mb-2">{day}</label>
            <Button
              size="sm"
              variant={availability[i].enabled ? 'default' : 'outline'}
              className={`mb-2 w-20 ${availability[i].enabled ? 'bg-accent' : ''}`}
              onClick={() => handleToggleDay(i)}
            >
              {availability[i].enabled ? 'Available' : 'Off'}
            </Button>
            <input
              type="time"
              value={availability[i].start}
              onChange={e => handleTimeChange(i, 'start', e.target.value)}
              disabled={!availability[i].enabled}
              className="mb-1 w-20 text-center rounded border border-gray-700 bg-gray-900 text-gray-100"
            />
            <span className="text-xs mb-1">to</span>
            <input
              type="time"
              value={availability[i].end}
              onChange={e => handleTimeChange(i, 'end', e.target.value)}
              disabled={!availability[i].enabled}
              className="w-20 text-center rounded border border-gray-700 bg-gray-900 text-gray-100"
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} className="mt-2">
        {saving ? 'Saving...' : 'Save Availability'}
      </Button>
      {success && <span className="ml-4 text-green-400">Saved!</span>}
    </Card>
  );
};

export default ReaderAvailability;
