import { DanceEvent, CategorizedEvents } from '../types';
import { parseDate } from '../utils/dateUtils';

export interface ProcessedEventsResult {
  categorizedEvents: CategorizedEvents;
  upcomingEventCount: number;
  pastEventCount: number;
}

/**
 * Processes a list of raw dance events to filter for upcoming ones,
 * sort them, and categorize them by style.
 * @param events The raw array of DanceEvent objects from the Gemini API.
 * @returns An object containing categorized events and counts of upcoming/past events.
 */
export const processEvents = (events: DanceEvent[]): ProcessedEventsResult => {
  const today = new Date();
  // Set time to the beginning of the day to ensure correct date comparison.
  today.setHours(0, 0, 0, 0);

  let pastEventCount = 0;
  
  const upcomingEvents = events
    .map(event => {
      // Attach a parsed start date for reliable sorting.
      const startDate = parseDate(event.dates[0]);
      return { ...event, startDate };
    })
    .filter(event => {
      // Use the last date in the array as the event's end date.
      const endDateStr = event.dates[event.dates.length - 1];
      const endDate = parseDate(endDateStr);
      
      // If we can't parse an end date, treat it as invalid and filter it out.
      if (!endDate) {
        pastEventCount++;
        return false;
      }
      
      // Keep events that end today or in the future.
      if (endDate < today) {
        pastEventCount++;
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort chronologically by start date.
      if (a.startDate && b.startDate) {
        return a.startDate.getTime() - b.startDate.getTime();
      }
      // Fallback for events with unparseable start dates.
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return 0;
    });

  const categorizedEvents: CategorizedEvents = {};
  upcomingEvents.forEach(event => {
    // Use 'Uncategorized' as a fallback if no styles are listed.
    const styles = event.styles && event.styles.length > 0 ? event.styles : ['Uncategorized'];
    styles.forEach(style => {
      if (!categorizedEvents[style]) {
        categorizedEvents[style] = [];
      }
      categorizedEvents[style].push(event);
    });
  });

  return {
    categorizedEvents,
    upcomingEventCount: upcomingEvents.length,
    pastEventCount,
  };
};
