import { Genre } from './genre';

export type MovieStatus = 'watchlist' | 'currentlyWatching' | 'watched';
export type BookStatus = 'toRead' | 'currentlyReading' | 'read';
export type ShowStatus = 'watchlist' | 'currentlyWatching' | 'watched';

export interface Movie {
  id: string;
  title: string;
  director: string;
  startDate: string;
  endDate: string;
  length: number;
  genre: Genre;
  status: MovieStatus;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  startDate: string;
  endDate: string;
  pages: number;
  genre: Genre;
  status: BookStatus;
  externalId?: string;
  coverUrl?: string;
  year?: number;
}

export interface BookSearchResult {
  externalId: string;
  title: string;
  author: string;
  pages: number;
  year: number;
  genre: Genre;
  coverUrl: string;
}

export interface Show {
  id: string;
  title: string;
  director: string;
  startDate: string;
  endDate: string;
  seasons: number;
  genre: Genre;
  status: ShowStatus;
}

export type MovieInput = Omit<Movie, 'id'> & { endDate?: string; startDate?: string };
export type BookInput = Omit<Book, 'id'> & { endDate?: string; startDate?: string };
export type ShowInput = Omit<Show, 'id'> & { endDate?: string; startDate?: string };
