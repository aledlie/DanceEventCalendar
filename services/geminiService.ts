import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DanceEvent, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = "You are an API that returns only JSON. Do not add any conversational text, introductions, or markdown formatting. Your entire response should be a single, valid JSON object or array based on the user's prompt.";

const PROMPT = `
Please act as an expert web scraper and data processor.
Visit the URL 'https://www.danceplace.com/events'.
Scrape all the event listings visible on that page.
For each event, extract the following information:
- title: The name of the event.
- dates: The start and end dates of the event. Provide this as an array of strings in "YYYY-MM-DD" format. e.g., ["2024-08-15", "2024-08-18"]. If it's a single day, provide one date in the array.
- location: The city and state/country of the event, e.g., "Orlando, FL".
- styles: An array of dance styles associated with the event, e.g., ["Salsa", "Bachata", "Kizomba"].
- url: The direct URL to the event's detail page on danceplace.com.

Format the entire output as a single JSON object with a single key "events" which is an array of the event objects you found.
Do not include any other text or explanation outside of the JSON structure.
Example of a single event object in the array:
{
  "title": "Example Dance Festival",
  "dates": ["2024-09-05", "2024-09-08"],
  "location": "New York, NY",
  "styles": ["Salsa", "Mambo"],
  "url": "https://www.danceplace.com/events/example-dance-festival"
}
`;

export const fetchAndProcessEvents = async (): Promise<{ events: DanceEvent[], sources: GroundingChunk[] }> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: PROMPT,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    if (!response.text) {
      throw new Error("AI response was empty or blocked. Please check safety settings.");
    }
    let text = response.text.trim();
    
    // 1. Robustly find and extract the JSON string.
    // It could be wrapped in markdown fences.
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = text.match(fenceRegex);
    let jsonStr = match ? match[1].trim() : text;
    
    // If not in a fence, find the first '{' or '[' to be sure we start at the beginning of the JSON.
    if (!match) {
        const firstBracket = jsonStr.indexOf('[');
        const firstBrace = jsonStr.indexOf('{');
        
        let start = -1;
        // Find the first occurrence of either bracket or brace
        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
            start = firstBracket;
        } else if (firstBrace !== -1) {
            start = firstBrace;
        }

        if (start === -1) {
            throw new Error("AI response did not contain a valid JSON object or array.");
        }
        // Find the corresponding last bracket or brace
        const lastBracket = jsonStr.lastIndexOf(']');
        const lastBrace = jsonStr.lastIndexOf('}');
        const end = Math.max(lastBracket, lastBrace);

        if (end === -1) {
             throw new Error("AI response did not contain a valid JSON object or array.");
        }

        jsonStr = jsonStr.substring(start, end + 1);
    }
    
    // 2. Parse the extracted string.
    const parsedData = JSON.parse(jsonStr);
    
    // 3. Normalize the data structure. The AI might return an array, an object with an 'events' key, or a single object.
    let events: DanceEvent[];
    if (Array.isArray(parsedData)) {
      events = parsedData; // Handles case: `[...]`
    } else if (parsedData && parsedData.events && Array.isArray(parsedData.events)) {
      events = parsedData.events; // Handles case: `{ "events": [...] }`
    } else if (parsedData && typeof parsedData === 'object' && parsedData.title) {
      events = [parsedData]; // Handles case: `{...}` (single event)
    } else {
      throw new Error("Invalid data structure in AI response. Expected an array of events or an object containing an 'events' array.");
    }

    const rawSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: GroundingChunk[] = rawSources
      .filter(source => source.web?.uri) // Ensure web and uri properties exist
      .map(source => ({
        web: {
          uri: source.web!.uri!,
          title: source.web!.title || source.web!.uri!,
        },
      }));

    return { events, sources };
  } catch (error) {
    console.error("Error fetching or processing event data:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse data from the AI. The response was not valid JSON.");
    }
    if (error instanceof Error) {
        throw new Error(`${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching events.");
  }
};
