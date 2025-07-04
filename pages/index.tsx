import { useState } from 'react';
import { EventCard } from '../components/EventCard';
import { DanceEvent } from '../types/types';

// A simple progress bar component to match the UI
const ProgressBar = ({ progress }: { progress: number }) => (
  <div style={{ width: '100%', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden', height: '8px' }}>
    <div style={{ width: `${progress}%`, backgroundColor: '#00e676', height: '100%', transition: 'width 0.5s ease-in-out' }} />
  </div>
);

export default function DanceEventImporterPage() {
  const [events, setEvents] = useState<DanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    setEvents([]);
    setStatusMessage('Fetching events...');
    setProgress(30);

    try {
      const response = await fetch('/api/scrape');
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch events from API');
      }

      setStatusMessage('Parsing and organizing...');
      setProgress(70);

      const data: { events: DanceEvent[] } = await response.json();

      const now = new Date().toISOString();
      const upcomingEvents = data.events.filter(event => event.endDateTimeISO && event.endDateTimeISO > now);
      
      const sortedEvents = upcomingEvents.sort((a, b) => {
        if (!a.startDateTimeISO || !b.startDateTimeISO) return 0;
        return new Date(a.startDateTimeISO).getTime() - new Date(b.startDateTimeISO).getTime();
      });

      setEvents(sortedEvents);
      setStatusMessage(`Successfully processed all events! Found ${sortedEvents.length} upcoming.`);
      setProgress(100);
    } catch (e: any) {
      setError(e.message);
      setStatusMessage('');
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // You can replace these classNames with your actual theme's classes
    <div className="dark-theme-container"> 
      <header className="main-header">
        <h1>Dance Event Importer</h1>
      </header>

      <main>
        <div className="card">
          <h2>Scrape Dance Events</h2>
          <p>Click the button to fetch future events from DancePlace. The AI will scrape the page, sort the events by date, and organize them for you.</p>
          <button onClick={handleFetchEvents} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Fetch & Organize Events'}
          </button>
          
          {statusMessage && (
            <div className="status-container">
              <p>{statusMessage}</p>
              {progress > 0 && <ProgressBar progress={progress} />}
            </div>
          )}
          {error && <p className="error-message">Error: {error}</p>}
        </div>

        <div className="card">
          <h2>Scrape Results</h2>
          <span className="count-badge">{events.length} Found</span>

          <div className="results-list">
            {events.length > 0 ? (
              events.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <p>No upcoming events found. Click the button above to start.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
