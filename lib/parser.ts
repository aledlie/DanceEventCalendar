import { parse } from 'date-fns';
import { format, fromZonedTime } from 'date-fns-tz';
import * as cheerio from 'cheerio';
import type { DanceEvent } from '../types/types'; // Adjusted import path

const generateGoogleCalendarUrl = (event: Omit<DanceEvent, 'googleCalendarUrl'>): string | null => {
  if (!event.startDateTimeISO || !event.endDateTimeISO) return null;
  try {
    const startDate = new Date(event.startDateTimeISO);
    const endDate = new Date(event.endDateTimeISO);
    const gCalFormat = "yyyyMMdd'T'HHmmss'Z'";
    const gCalStartDate = format(startDate, gCalFormat, { timeZone: 'UTC' });
    const gCalEndDate = format(endDate, gCalFormat, { timeZone: 'UTC' });
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${gCalStartDate}/${gCalEndDate}`,
      details: `View event details at: ${event.eventUrl}`,
      location: event.location,
    });
    return `https://www.google.com/calendar/render?${params.toString()}`;
  } catch (error) {
    console.error(`Error generating Google Calendar URL for "${event.title}":`, error);
    return null;
  }
};

const parseDateTime = (dateStr: string, year: number) => {
    const dateTimeRegex = /(?:(\w{3}, \w{3} \d{1,2})|(\w{3} \d{1,2}))(?:, )?(\d{1,2}:\d{2} [AP]M)?(?: - (\d{1,2}:\d{2} [AP]M))? (\w{3})/;
    const match = dateStr.match(dateTimeRegex);
    if (!match) {
        console.warn(`[Parser] Could not parse date string with regex: "${dateStr}"`);
        return { startDateTimeISO: null, endDateTimeISO: null };
    }
    const [, longDate, shortDate, startTime, endTime, tz] = match;
    const datePart = longDate || shortDate;
    const effectiveStartTime = startTime || '12:00 AM';
    let effectiveEndTime = endTime;
    if (!effectiveEndTime && startTime) {
      const startForCalc = parse(`${effectiveStartTime}`, 'h:mm a', new Date());
      const endForCalc = new Date(startForCalc.getTime() + 2 * 60 * 60 * 1000);
      effectiveEndTime = format(endForCalc, 'h:mm a');
    } else if (!effectiveEndTime) {
        effectiveEndTime = '11:59 PM';
    }
    const timeZoneMap: { [key: string]: string } = { 'PDT': 'America/Los_Angeles', 'PST': 'America/Los_Angeles', 'EDT': 'America/New_York', 'EST': 'America/New_York', 'CDT': 'America/Chicago', 'CST': 'America/Chicago', 'MDT': 'America/Denver', 'MST': 'America/Denver' };
    const timeZone = timeZoneMap[tz] || 'UTC';
    try {
        const startStr = `${datePart} ${year} ${effectiveStartTime}`;
        const endStr = `${datePart} ${year} ${effectiveEndTime}`;
        const parseFormat = datePart.includes(',') ? 'EEE, MMM d yyyy h:mm a' : 'MMM d yyyy h:mm a';
        const parsedStartDate = parse(startStr, parseFormat, new Date());
        const parsedEndDate = parse(endStr, parseFormat, new Date());
        const startUtcDate = fromZonedTime(parsedStartDate, timeZone);
        const endUtcDate = fromZonedTime(parsedEndDate, timeZone);
        const startDateTimeISO = startUtcDate.toISOString();
        const endDateTimeISO = endUtcDate.toISOString();
        return { startDateTimeISO, endDateTimeISO };
    } catch (error) {
        console.error(`[Parser] Date parsing failed for string: "${dateStr}"`, error);
        return { startDateTimeISO: null, endDateTimeISO: null };
    }
};

export function parseEvents(html: string): DanceEvent[] {
  console.log('[Parser] Initializing parser...');
  if (!html || html.length < 500) {
      console.error('[Parser] ERROR: HTML is missing or too short. Length:', html?.length);
      return [];
  }

  const $ = cheerio.load(html);
  const events: DanceEvent[] = [];
  const currentYear = new Date().getFullYear();

  // This flexible selector is more likely to work on the live site.
  const eventSelector = 'div[class*="MuiPaper-root"] a[href^="/events/"]';

  console.log(`[Parser] Using selector: "${eventSelector}". Found ${$(eventSelector).length} potential events.`);
  if ($(eventSelector).length === 0) {
    console.warn("[Parser] WARNING: No event elements found. The website's HTML structure has likely changed.");
  }

  $(eventSelector).each((_i, element) => {
    const eventCard = $(element);
    const parentPaper = eventCard.closest('div[class*="MuiPaper-root"]');

    const title = parentPaper.find('h2, h3').first().text()?.trim() || 'Untitled Event';
    const location = parentPaper.find('p[class*="location"]').first().text()?.trim() || 'Location TBD';
    const rawDateStr = parentPaper.find('p[class*="date"]').first().text()?.trim() || 'Date TBD';
    const eventPath = eventCard.attr('href') || '';

    if (!eventPath || title === 'Untitled Event') return;

    const eventUrl = `https://www.danceplace.com${eventPath}`;
    const id = eventPath.split('/').pop() || Date.now().toString();

    const { startDateTimeISO, endDateTimeISO } = parseDateTime(rawDateStr, currentYear);
    
    const eventData: Omit<DanceEvent, 'googleCalendarUrl'> = { id, title, location, rawDateStr, startDateTimeISO, endDateTimeISO, eventUrl };
    const googleCalendarUrl = generateGoogleCalendarUrl(eventData);

    events.push({ ...eventData, googleCalendarUrl });
  });
  
  console.log(`[Parser] Successfully processed ${events.length} events.`);
  return events;
}

