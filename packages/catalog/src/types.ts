export type ContentSource = "owned_upload" | "public_domain" | "licensed_external";
export type FavoriteContentType = "movie" | "series" | "channel";
export type ProgressContentType = "movie" | "episode";

export interface Movie {
  id: string;
  title: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  duration_minutes: number | null;
  age_rating: string | null;
  genres: string[];
  video_url: string | null;
  source_type: ContentSource;
  rights_note: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Series {
  id: string;
  title: string;
  synopsis: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  release_year: number | null;
  age_rating: string | null;
  genres: string[];
  source_type: ContentSource;
  rights_note: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string;
  series_id: string;
  season_number: number;
  title: string | null;
}

export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  synopsis: string | null;
  duration_minutes: number | null;
  video_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  logo_url: string | null;
  stream_url: string;
  category: string | null;
  country_code: string | null;
  rights_note: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  content_type: FavoriteContentType;
  content_id: string;
  created_at: string;
}

export interface WatchProgress {
  id: string;
  user_id: string;
  content_type: ProgressContentType;
  content_id: string;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at: string;
}
