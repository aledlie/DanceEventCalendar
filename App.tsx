import React, { useState, useCallback } from 'react';
import { fetchAndProcessEvents } from './services/geminiService';
import { processEvents } from './services/eventService';
import { DanceEvent, CategorizedEvents, GroundingChunk } from './types';
import EventCard from './components/EventCard';
import { LogoIcon, SearchIcon } from './components/icons';
import StatusDisplay from './components/StatusDisplay';

export type Status = 'idle' | 'fetching' | 'processing' | 'success' | 'error';

const App: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [events, setEvents] = useState<CategorizedEvents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [upcomingEventCount, setUpcomingEventCount] = useState(0);
  const [pastEventsCount, setPastEventsCount] = useState(0);

  const handleFetchEvents = useCallback(async () => {
    setStatus('fetching');
    setError(null);
    setEvents(null);
    setSources([]);
    setUpcomingEventCount(0);
    setPastEventsCount(0);

    try {
      const { events: fetchedEvents, sources: fetchedSources } = await fetchAndProcessEvents();

      setStatus('processing');
      await new Promise(resolve => setTimeout(resolve, 500));
      const { categorizedEvents, upcomingEventCount, pastEventCount } = processEvents(fetchedEvents);

      setEvents(categorizedEvents);
      setSources(fetchedSources);
      setUpcomingEventCount(upcomingEventCount);
      setPastEventsCount(pastEventCount);
      setStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus('error');
    }
  }, []);

  const sortedCategories = events ? Object.keys(events).sort() : [];
  const isLoading = status === 'fetching' || status === 'processing';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-10 w-10 text-indigo-400"/>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dance Event Importer</h1>
          </div>
        </header>

        <main>
          <div className="bg-gray-800/50 rounded-xl p-6 shadow-2xl border border-gray-700 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-indigo-300">Scrape Dance Events</h2>
            <p className="mt-2 text-gray-400">
              Click the button to fetch future events from DancePlace. The AI will scrape the page, sort the events by date, and organize them for you.
            </p>
            <div className="mt-6">
              <button
                onClick={handleFetchEvents}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-400/80 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <SearchIcon className="h-5 w-5 mr-2" />
                    Fetch & Organize Events
                  </>
                )}
              </button>
            </div>
            {status !== 'idle' && (
              <div className="mt-6">
                 <StatusDisplay status={status} error={error} />
              </div>
            )}
          </div>
          
          <div className={`mt-10 transition-all duration-700 ease-out ${status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
             {status === 'success' && events && (
                <div className="bg-gray-800/50 rounded-xl p-6 shadow-2xl border border-gray-700">
                  <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Scrape Results</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full text-green-200 bg-green-900/50">
                        {upcomingEventCount} Found
                      </span>
                      {pastEventsCount > 0 && (
                        <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full text-yellow-200 bg-yellow-900/50">
                          {pastEventsCount} Past Events Hidden
                        </span>
                      )}
                    </div>
                  </div>
                  {sortedCategories.length > 0 ? (
                  <div className="space-y-8">
                    {sortedCategories.map(style => (
                      <div key={style}>
                        <h3 className="text-2xl font-semibold text-indigo-300 border-b-2 border-gray-700 pb-2 mb-6">{style}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {events[style].map((event: DanceEvent, index: number) => (
                            <EventCard key={`${style}-${index}`} event={event} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                    <p className="text-center text-gray-400 py-8">No upcoming events found. Try again later.</p>
                )}
                </div>
            )}
          </div>

          {status === 'success' && sources.length > 0 && (
             <div className={`mt-8 transition-all duration-700 ease-out ${status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="font-semibold text-gray-300">Data Sources</h4>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-400 space-y-1">
                  {sources.map((source, index) => (
                    <li key={index}>
                      <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                        {source.web.title || source.web.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default App;
