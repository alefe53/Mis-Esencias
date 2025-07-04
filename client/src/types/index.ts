// src/types/index.ts

export interface Mood {
  id: number;
  name: string;
}

export interface ReleaseInfo {
  title: string;
  type: string;
  year: number;
  coverArtUrl?: string;
  description?: string;
}

export interface Track {
  id: number;
  title: string;
  description?: string;
  filePath: string;
  playableUrl?: string | null;
  artistName?: string;
  moods?: Mood[]; 
  releaseInfo?: ReleaseInfo;
  duration_seconds?: number; 
}

export interface User {
  id: string;
  email: string;
  subscription_tier_id: number;
  first_name: string;
  last_name: string; 
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}


