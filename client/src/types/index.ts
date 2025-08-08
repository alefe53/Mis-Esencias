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

export interface TrackLink {
  platform: string;
  url: string;
}

export interface Track {
  id: number;
  title: string;
  trackNumber?: number;
  description?: string;
  filePath: string;
  playableUrl?: string | null;
  artistName?: string;
  moods?: Mood[]; 
  releaseInfo?: ReleaseInfo;
  duration_seconds?: number; 
  required_subscription_tier_id?: number | null;
  links?: TrackLink[]; 
}

export interface User {
  id: string;
  email: string;
  subscription_tier_id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  avatar_url: string | null; 
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  birthDate?: string; 
}

export interface ReleaseSummary {
  id: number;
  title: string;
  coverArtUrl: string;
  releaseYear: number;
}

export interface GalleryImage {
  id: number;
  imageUrl: string;
  description: string | null;
  trackId: number | null;
}

export interface ReleaseDetails extends ReleaseSummary {
  description: string | null;
  artistName: string;
  tracks: Track[]; 
  gallery: GalleryImage[];
  featuredVideoUrl?: string | null; 
}

export interface BandReleaseSummary {
	id: number;
	title: string;
	coverArtUrl: string;
	releaseYear: number;
}

export interface Band {
	id: number;
	name: string;
	description: string | null;
	image_url: string;
	roles_summary: string | null;
	releases: BandReleaseSummary[];
}

export interface EngineeringProjectSummary {
  id: number;
  artist_or_band_name: string;
  description: string | null;
  cover_art_url: string;
  latest_year?: number; 
}

export interface EngineeringProjectDetails extends EngineeringProjectSummary {
  releases: ReleaseSummary[];
  gallery?: GalleryImage[];
}

export interface ChatMessage {
  id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_admin: boolean;
}

export interface AdminConversationSummary {
  conversation_id: number;
  user_id: string;
  user_full_name: string;
  user_avatar_url: string | null;
  last_message_content: string;
  last_message_at: string;
  is_user_blocked: boolean;
  last_message_formatted: string; 
}

export interface SubscriptionTier {
  id: number;
  name: string;
  price: number;
  description: string | null;
  features: {
    items: string[];
  } | null;
}

export interface PrivateGalleryImage {
  signedUrl: string | null;
  title: string | null;
  description: string | null;
  file_path: string;
}

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  subscription_tier_id: number;
  subscription_name: string;
}

export interface PostAuthor {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface PostStats {
  likesCount: number;
  commentsCount: number;
}

export interface PostComment {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: PostAuthor;
  likesCount: number;
  isLikedByUser: boolean;
  parentCommentId: number | null;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface PollData {
  options: PollOption[];
  userVote: number | null;
}

export interface Post {
  id: number;
  title: string | null;
  content: string | null;
  imageUrl: string | null;
  postType: 'text' | 'poll' | 'weekly_audio' | 'weekly_quote';
  createdAt: string;
  author: PostAuthor;
  stats: PostStats;
  isLikedByUser: boolean;
  comments: PostComment[];
  pollData: PollData | null;
}
export interface DeviceInfo {
  id: string;
  label: string;
}
export interface LiveSession {
  id: number;
  title: string;
  description: string | null;
  storage_path: string;
  duration_seconds: number;
  created_at: string; // Para saber cuándo fue
  thumbnail_url: string | null; // Una imagen de vista previa
  peak_viewers: number; // Máximo de espectadores
  is_public: boolean; // Para controlar visibilidad
  tags: string[] | null; // Etiquetas
}