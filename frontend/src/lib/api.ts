import { API_BASE_URL } from './constants';
import { getToken } from './auth';
import { BookSearchResult } from '@/types/models';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  auth?: boolean;
}

async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const { auth = true, ...fetchOpts } = opts;

  const headers = new Headers(fetchOpts.headers);
  headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOpts,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const body = await response.json();
      if (body.error) {
        errorMessage = body.error;
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new ApiError(response.status, errorMessage);
  }

  return response.json();
}

export interface LoginResponse {
  token: string;
}

export async function login(password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/admin/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ password }),
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/admin/logout', {
    method: 'POST',
    auth: true,
  });
}

export async function searchBooks(q: string, signal?: AbortSignal): Promise<BookSearchResult[]> {
  return apiFetch<BookSearchResult[]>(`/search/books?q=${encodeURIComponent(q)}`, {
    auth: true,
    signal,
  });
}

export function createEntityApi<T>(resource: 'movies' | 'books' | 'shows') {
  const basePath = `/${resource}`;

  return {
    async getAll(): Promise<T[]> {
      return apiFetch<T[]>(basePath, { auth: false });
    },

    async getById(id: string): Promise<T> {
      return apiFetch<T>(`${basePath}/${id}`, { auth: false });
    },

    async create(data: Omit<T, 'id'>): Promise<{ id: string }> {
      const cleanData = stripEmptyDates(data as Record<string, unknown>);
      return apiFetch(`${basePath}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(cleanData),
      });
    },

    async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
      const cleanData = stripEmptyDates(data as Record<string, unknown>);
      await apiFetch(`${basePath}/${id}`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify(cleanData),
      });
    },

    async remove(id: string): Promise<void> {
      await apiFetch(`${basePath}/${id}`, {
        method: 'DELETE',
        auth: true,
      });
    },

    async updateStatus(id: string, status: string): Promise<void> {
      await apiFetch(`${basePath}/${id}/status`, {
        method: 'PATCH',
        auth: true,
        body: JSON.stringify({ status }),
      });
    },
  };
}

function stripEmptyDates(data: Record<string, unknown>): Record<string, unknown> {
  if (!data || typeof data !== 'object') return data;

  const cleaned = { ...data };
  if (cleaned.startDate === '' || cleaned.startDate === null) {
    delete cleaned.startDate;
  }
  if (cleaned.endDate === '' || cleaned.endDate === null) {
    delete cleaned.endDate;
  }
  return cleaned;
}
