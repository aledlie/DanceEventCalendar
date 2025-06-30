import React from 'react';
import { DanceEvent } from '../types';
import { CalendarIcon, LocationIcon, LinkIcon } from './icons';
import { parseDate, formatDateRange } from '../utils/dateUtils';

interface EventCardProps {
  event: DanceEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {

  const createGoogleCalendarLink = (eventData: DanceEvent): string => {
    const { title, dates, location, url } = eventData;

    const formatForCalendar = (d: Date | null): string | null => {
       if (!d) return null;
        return d.toISOString().split('T')[0].replace(/-/g, '');
    };

    const startDate = parseDate(dates[0]);
    const endDate = parseDate(dates[dates.length - 1]);

    if (!startDate || !endDate) return '#';

    // For all-day events, Google Calendar's end date is exclusive.
    // So we need to add one day to the event's actual end date to make it inclusive.
    const calendarEndDate = new Date(endDate);
    calendarEndDate.setDate(calendarEndDate.getDate() + 1);

    const startDateStr = formatForCalendar(startDate);
    const endDateStr = formatForCalendar(calendarEndDate);
    if (!startDateStr || !endDateStr) return '#';

    const calendarUrl = new URL('https://www.google.com/calendar/render');
    calendarUrl.searchParams.append('action', 'TEMPLATE');
    calendarUrl.searchParams.append('text', title);
    calendarUrl.searchParams.append('dates', `${startDateStr}/${endDateStr}`);
    calendarUrl.searchParams.append('location', location);
    calendarUrl.searchParams.append('details', `Find more details and get tickets here:\n${url}`);

    return calendarUrl.toString();
  };

  const calendarLink = createGoogleCalendarLink(event);

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 flex flex-col h-full transition-transform transform hover:-translate-y-1 hover:shadow-indigo-500/20">
      <div className="p-5 flex-grow">
        <h4 className="text-lg font-bold text-white truncate">{event.title}</h4>
        <p className="text-sm text-indigo-300 font-semibold mt-1">{formatDateRange(event.dates)}</p>
        <div className="mt-4 flex items-center text-gray-400">
          <LocationIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{event.location}</span>
        </div>
      </div>
      <div className="p-5 bg-gray-800/50 border-t border-gray-700 flex flex-wrap items-center justify-between gap-2">
         <a
          href={calendarLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Add to Calendar
        </a>
         <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          title="View on DancePlace"
          className="text-gray-400 hover:text-indigo-400 transition-colors"
        >
          <LinkIcon className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
};

export default EventCard;
