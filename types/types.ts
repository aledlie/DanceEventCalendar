
export interface DanceEvent {
  id: string; // A unique ID, typically from the URL
  title: string;
  location: string;
  rawDateStr: string; // The original, unparsed date string for display
  startDateTimeISO: string | null; // Parsed start time in ISO 8601 format for sorting and filtering
  endDateTimeISO: string | null;   // Parsed end time in ISO 8601 format
  eventUrl: string; // Full URL to the event's page on DancePlace
  googleCalendarUrl: string | null; // Pre-filled link for easy import into Google Calendar
}

export interface CategorizedEvents {
  [style: string]: DanceEvent[];
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}
