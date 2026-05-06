import { useState, useEffect } from 'react';

export function useEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (_) {}
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 1000);
    return () => clearInterval(interval);
  }, []);

  return { events };
}
