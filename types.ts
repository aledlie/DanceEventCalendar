
export interface DanceEvent {
  title: string;
  dates: string[];
  location: string;
  styles: string[];
  url: string;
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
