'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { EntityConfig } from '@/lib/entityConfig';
import { useCreateEntity, useUpdateEntity } from '@/lib/queries';
import { ApiError } from '@/lib/api';

interface AddItemModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  config: EntityConfig<T>;
  editItem?: T;
  resource: 'movies' | 'books' | 'shows';
}

export function AddItemModal<T extends { id?: string }>({
  isOpen,
  onClose,
  config,
  editItem,
  resource,
}: AddItemModalProps<T>) {
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [error, setError] = useState('');
  const createMutation = useCreateEntity(resource);
  const updateMutation = useUpdateEntity(resource);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        const dateFields = new Set(
          config.formFields.filter((f) => f.type === 'date').map((f) => f.name)
        );
        const data: Record<string, string | number> = {};
        Object.entries(editItem).forEach(([key, value]) => {
          if (key !== 'id' && (typeof value === 'string' || typeof value === 'number')) {
            // <input type="date"> only accepts YYYY-MM-DD; backend returns full ISO datetimes
            if (dateFields.has(key) && typeof value === 'string') {
              if (value.includes('0001-01-01')) return;
              data[key] = value.slice(0, 10);
            } else {
              data[key] = value;
            }
          }
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing form state to the item being edited when the modal opens
        setFormData(data);
      } else {
        setFormData({});
      }
    }
  }, [editItem, isOpen, config.formFields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const payload: Record<string, string | number> = {};

      // Only include fields that were in the form (and thus intentionally set)
      config.formFields.forEach((field) => {
        if (formData.hasOwnProperty(field.name)) {
          let value = formData[field.name];

          // Skip empty/invalid values
          if (value === undefined || value === null || value === '') {
            return;
          }

          if (field.type === 'date') {
            // Skip the invalid "0001-01-01" date; backend expects full ISO datetime,
            // but <input type="date"> only gives YYYY-MM-DD
            if (!String(value).includes('0001-01-01')) {
              payload[field.name] = `${value}T00:00:00Z`;
            }
          } else if (field.type === 'number') {
            // Convert to number and validate
            const num = Number(value);
            if (isNaN(num) || num < 0) {
              return;
            }
            payload[field.name] = num;
          } else if (field.type === 'select') {
            // Skip if "Select X" placeholder value
            if (String(value).toLowerCase().startsWith('select')) {
              return;
            }
            payload[field.name] = value;
          } else {
            // Text field - trim and validate not empty
            const str = String(value).trim();
            if (str.length === 0) {
              return;
            }
            payload[field.name] = str;
          }
        }
      });

      if (editItem?.id) {
        await updateMutation.mutateAsync({ id: editItem.id, data: payload });
      } else {
        payload.status = config.defaultCreateStatus;
        await createMutation.mutateAsync(payload);
      }

      onClose();
      setFormData({});
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save');
      }
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // New items always land on the backlog (TBW/TBR) — only ask for the basics plus genre.
  // Dates get set automatically by quick actions (Start/Finish) as status changes.
  // Editing an existing item still exposes the full field set (genre, status, dates).
  const visibleFields = editItem
    ? config.formFields
    : config.formFields.filter(
        (field) => field.type === 'text' || field.type === 'number' || field.name === 'genre'
      );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            {editItem ? `Edit ${config.singularLabel}` : `Add ${config.singularLabel}`}
          </h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {visibleFields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-shadow"
                >
                  <option value="">Select {field.label.toLowerCase()}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-shadow"
                />
              )}
            </div>
          ))}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-foreground font-medium hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isLoading ? '...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
