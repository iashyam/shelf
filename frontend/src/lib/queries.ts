import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEntityApi, login as apiLogin, logout as apiLogout, searchBooks } from './api';
import { Movie, Book, Show } from '@/types/models';

type Resource = 'movies' | 'books' | 'shows';

const movieApi = createEntityApi<Movie>('movies');
const bookApi = createEntityApi<Book>('books');
const showApi = createEntityApi<Show>('shows');

const apis: Record<Resource, ReturnType<typeof createEntityApi>> = {
  movies: movieApi,
  books: bookApi,
  shows: showApi,
};

/** Search-as-you-type against the book search endpoint. Pass an already-debounced query. */
export function useBookSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search', 'books', trimmed],
    queryFn: ({ signal }) => searchBooks(trimmed, signal),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEntityList(resource: Resource) {
  return useQuery({
    queryKey: [resource],
    queryFn: () => apis[resource].getAll(),
  });
}

export function useCreateEntity(resource: Resource) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apis[resource].create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useUpdateEntity(resource: Resource) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apis[resource].update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useDeleteEntity(resource: Resource) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apis[resource].remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useUpdateEntityStatus(resource: Resource) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apis[resource].updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (password: string) => apiLogin(password),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiLogout(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
