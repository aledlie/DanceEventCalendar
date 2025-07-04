import { DanceEvent, CategorizedEvents } from '../types/types';

export interface ProcessedEventsResult {
  categorizedEvents: CategorizedEvents;
  upcomingEventCount: number;
  pastEventCount: number;
}

// NEW: A helper function to categorize events based on keywords in their title.
// This replaces the old `event.styles` array which we don't have.
const getEventCategories = (event: DanceEvent): string[] => {
  const categories: Set<string> = new Set();
  const title = event.title.toLowerCase();

  // Keyword mapping to standardized categories
  const styleMap: { [key: string]: string } = {
    'salsa': 'Salsa',
    'bachata': 'Bachata',
    'zouk': 'Zouk',
    'kizomba': 'Kizomba',
    'west coast swing': 'West Coast Swing',
    'wcs': 'West Coast Swing',
    'fusion': 'Fusion',
    'ecstatic': 'Ecstatic',
    'contact improv': 'Contact Improv',
  };

  for (const keyword in styleMap) {
    if (title.includes(keyword)) {
      categories.add(styleMap[keyword]);
    }
  }

  // If no specific category was found, assign it to 'Uncategorized'.
  if (categories.size === 0) {
    categories.add('Uncategorized');
  }

  return Array.from(categories);
};

/**
 * Processes a list of scraped dance events to filter, sort, and categorize them.
 * @param events The array of DanceEvent objects from our scraper.
 * @returns An object containing categorized events and counts of upcoming/past events.
 */
export const processEvents = (events: DanceEvent[]): ProcessedEventsResult => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Standardize to the beginning of the day

  const upcomingEvents: DanceEvent[] = [];
  let pastEventCount = 0;

  // CHANGED: Simplified filtering logic using pre-parsed ISO dates.
  events.forEach(event => {
    // Use the endDateTimeISO for checking if an event is in the past.
    if (!event.endDateTimeISO) {
      // If we can't determine the end date, consider it past.
      pastEventCount++;
      return;
    }

    const endDate = new Date(event.endDateTimeISO);
    if (endDate < today) {
      pastEventCount++;
    } else {
      upcomingEvents.push(event);
    }
  });

  // CHANGED: Simplified sorting logic.
  upcomingEvents.sort((a, b) => {
    // Handle cases where start dates might be null.
    if (!a.startDateTimeISO) return 1;
    if (!b.startDateTimeISO) return -1;
    // Sort chronologically by start date.
    return new Date(a.startDateTimeISO).getTime() - new Date(b.startDateTimeISO).getTime();
  });

  const categorizedEvents: CategorizedEvents = {};
  upcomingEvents.forEach(event => {
    // CHANGED: Use our new title-based categorization function.
    const styles = getEventCategories(event);
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
