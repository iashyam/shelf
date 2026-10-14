import { Movie, Book, Show } from '@/types/models';
import { MOVIE_STATUS_LABELS, BOOK_STATUS_LABELS, SHOW_STATUS_LABELS } from '@/types/status';

export interface ColumnDef<T> {
  header: string;
  key: keyof T | null;
  render: (row: T) => React.ReactNode;
  width?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export interface EntityConfig<T> {
  resource: 'movies' | 'books' | 'shows';
  navLabel: string;
  singularLabel: string;
  pluralLabel: string;
  searchPlaceholder: string;
  statusFilters: Array<{ value: 'all' | string; label: string }>;
  statusLabels: Record<string, string>;
  columns: ColumnDef<T>[];
  formFields: FormField[];
  /** Status new items are created with — everything starts on the backlog. */
  defaultCreateStatus: string;
  /** Show the external-database search box when adding a new item. */
  searchable?: boolean;
  sortOptions: Array<{ value: string; label: string }>;
}

export const movieConfig: EntityConfig<Movie> = {
  resource: 'movies',
  navLabel: 'Movies',
  singularLabel: 'movie',
  pluralLabel: 'movies',
  searchPlaceholder: 'Search movies...',
  statusFilters: [
    { value: 'all', label: 'All' },
    { value: 'currentlyWatching', label: 'Watching' },
    { value: 'watchlist', label: 'TBW' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'watched', label: 'Completed' },
  ],
  statusLabels: MOVIE_STATUS_LABELS,
  columns: [
    {
      header: 'TITLE',
      key: 'title',
      render: (row) => row.title,
    },
    { header: 'DIRECTOR', key: 'director', render: (row) => row.director },
    { header: 'GENRE', key: 'genre', render: (row) => row.genre },
    { header: 'DATE WATCHED', key: 'endDate', render: (row) => row.endDate },
    { header: 'LENGTH', key: 'length', render: (row) => `${row.length} min` },
    { header: 'STATUS', key: 'status', render: (row) => row.status },
  ],
  formFields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'director', label: 'Director', type: 'text', required: true },
    { name: 'length', label: 'Length (minutes)', type: 'number', required: true },
    {
      name: 'genre',
      label: 'Genre',
      type: 'select',
      required: true,
      options: [
        { value: 'general', label: 'General' },
        { value: 'action', label: 'Action' },
        { value: 'comedy', label: 'Comedy' },
        { value: 'drama', label: 'Drama' },
        { value: 'horror', label: 'Horror' },
        { value: 'thriller', label: 'Thriller' },
        { value: 'romance', label: 'Romance' },
        { value: 'documentary', label: 'Documentary' },
        { value: 'animation', label: 'Animation' },
        { value: 'crime', label: 'Crime' },
        { value: 'sciFi', label: 'Science Fiction' },
        { value: 'fantasy', label: 'Fantasy' },
        { value: 'mystery', label: 'Mystery' },
        { value: 'adventure', label: 'Adventure' },
        { value: 'family', label: 'Family' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'watchlist', label: 'To be Watched' },
        { value: 'currentlyWatching', label: 'Watching' },
        { value: 'watched', label: 'Completed' },
      ],
    },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'endDate', label: 'End Date', type: 'date' },
  ],
  defaultCreateStatus: 'watchlist',
  sortOptions: [
    { value: 'recent', label: 'Recently updated' },
    { value: 'titleAsc', label: 'Title (A–Z)' },
    { value: 'titleDesc', label: 'Title (Z–A)' },
  ],
};

export const bookConfig: EntityConfig<Book> = {
  resource: 'books',
  navLabel: 'Books',
  singularLabel: 'book',
  pluralLabel: 'books',
  searchPlaceholder: 'Search books...',
  statusFilters: [
    { value: 'all', label: 'All' },
    { value: 'currentlyReading', label: 'Reading' },
    { value: 'toRead', label: 'TBR' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'read', label: 'Completed' },
  ],
  statusLabels: BOOK_STATUS_LABELS,
  columns: [
    {
      header: 'TITLE',
      key: 'title',
      render: (row) => row.title,
    },
    { header: 'AUTHOR', key: 'author', render: (row) => row.author },
    { header: 'GENRE', key: 'genre', render: (row) => row.genre },
    { header: 'DATE READ', key: 'endDate', render: (row) => row.endDate },
    { header: 'PAGES', key: 'pages', render: (row) => `${row.pages} pages` },
    { header: 'STATUS', key: 'status', render: (row) => row.status },
  ],
  formFields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'author', label: 'Author', type: 'text', required: true },
    { name: 'pages', label: 'Pages', type: 'number', required: true },
    {
      name: 'genre',
      label: 'Genre',
      type: 'select',
      required: true,
      options: [
        { value: 'anyBook', label: 'General' },
        { value: 'travel', label: 'Travel' },
        { value: 'thriller', label: 'Thriller' },
        { value: 'scienceFiction', label: 'Science Fiction' },
        { value: 'popularScience', label: 'Popular Science' },
        { value: 'classic', label: 'Classic' },
        { value: 'magicRealism', label: 'Magic Realism' },
        { value: 'contemporaryFiction', label: 'Contemporary Fiction' },
        { value: 'fantasy', label: 'Fantasy' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'toRead', label: 'To be Read' },
        { value: 'currentlyReading', label: 'Reading' },
        { value: 'read', label: 'Completed' },
      ],
    },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'endDate', label: 'End Date', type: 'date' },
  ],
  defaultCreateStatus: 'toRead',
  searchable: true,
  sortOptions: [
    { value: 'recent', label: 'Recently updated' },
    { value: 'titleAsc', label: 'Title (A–Z)' },
    { value: 'titleDesc', label: 'Title (Z–A)' },
  ],
};

export const showConfig: EntityConfig<Show> = {
  resource: 'shows',
  navLabel: 'Shows',
  singularLabel: 'show',
  pluralLabel: 'shows',
  searchPlaceholder: 'Search shows...',
  statusFilters: [
    { value: 'all', label: 'All' },
    { value: 'currentlyWatching', label: 'Watching' },
    { value: 'watchlist', label: 'TBW' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'watched', label: 'Completed' },
  ],
  statusLabels: SHOW_STATUS_LABELS,
  columns: [
    {
      header: 'TITLE',
      key: 'title',
      render: (row) => row.title,
    },
    { header: 'DIRECTOR', key: 'director', render: (row) => row.director },
    { header: 'GENRE', key: 'genre', render: (row) => row.genre },
    { header: 'DATE WATCHED', key: 'endDate', render: (row) => row.endDate },
    { header: 'SEASONS', key: 'seasons', render: (row) => `${row.seasons} season${row.seasons !== 1 ? 's' : ''}` },
    { header: 'STATUS', key: 'status', render: (row) => row.status },
  ],
  formFields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'director', label: 'Director', type: 'text', required: true },
    { name: 'seasons', label: 'Seasons', type: 'number', required: true },
    {
      name: 'genre',
      label: 'Genre',
      type: 'select',
      required: true,
      options: [
        { value: 'general', label: 'General' },
        { value: 'action', label: 'Action' },
        { value: 'comedy', label: 'Comedy' },
        { value: 'drama', label: 'Drama' },
        { value: 'horror', label: 'Horror' },
        { value: 'thriller', label: 'Thriller' },
        { value: 'romance', label: 'Romance' },
        { value: 'documentary', label: 'Documentary' },
        { value: 'animation', label: 'Animation' },
        { value: 'crime', label: 'Crime' },
        { value: 'sciFi', label: 'Science Fiction' },
        { value: 'fantasy', label: 'Fantasy' },
        { value: 'mystery', label: 'Mystery' },
        { value: 'adventure', label: 'Adventure' },
        { value: 'family', label: 'Family' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'watchlist', label: 'To be Watched' },
        { value: 'currentlyWatching', label: 'Watching' },
        { value: 'watched', label: 'Completed' },
      ],
    },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'endDate', label: 'End Date', type: 'date' },
  ],
  defaultCreateStatus: 'watchlist',
  sortOptions: [
    { value: 'recent', label: 'Recently updated' },
    { value: 'titleAsc', label: 'Title (A–Z)' },
    { value: 'titleDesc', label: 'Title (Z–A)' },
  ],
};
