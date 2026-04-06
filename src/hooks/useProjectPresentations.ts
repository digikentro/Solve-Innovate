import { useCallback, useEffect, useState } from 'react';
import { presentationApi } from '@/services/presentationApi';
import type { ProjectPresentationSummary } from '@/types/presentation';

interface UseProjectPresentationsReturn {
  presentations: ProjectPresentationSummary[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPresentation: (title?: string) => Promise<ProjectPresentationSummary | null>;
  renamePresentation: (id: string, title: string) => Promise<ProjectPresentationSummary | null>;
  deletePresentation: (id: string) => Promise<boolean>;
}

export const useProjectPresentations = (
  projectId: string
): UseProjectPresentationsReturn => {
  const [presentations, setPresentations] = useState<ProjectPresentationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await presentationApi.listProjectPresentations(projectId);
      setPresentations(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load presentations');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPresentation = useCallback(
    async (title?: string) => {
      setError(null);
      try {
        const cleanTitle = (title || 'Untitled Presentation').trim() || 'Untitled Presentation';
        const result = await presentationApi.createProjectPresentation(projectId, title);
        const now = new Date().toISOString();
        const optimistic: ProjectPresentationSummary = {
          id: result.presentation_id,
          project_id: projectId,
          title: cleanTitle,
          status: 'draft',
          created_at: now,
          updated_at: now,
          current_revision_id: null,
          current_markdown_presentation_id: null,
          current_slide_count: null,
          logo_url: null,
          logo_position: 'top-right',
          preview_title: null,
          preview_snippet: null,
        };
        setPresentations((prev) => [
          optimistic,
          ...prev.filter((item) => item.id !== optimistic.id),
        ]);
        refresh().catch(() => {});
        return optimistic;
      } catch (e: any) {
        setError(e.message || 'Failed to create presentation');
        return null;
      }
    },
    [projectId, refresh]
  );

  const renamePresentation = useCallback(
    async (id: string, title: string) => {
      setError(null);
      try {
        const updated = await presentationApi.renameProjectPresentation(id, title);
        setPresentations((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } catch (e: any) {
        setError(e.message || 'Failed to rename presentation');
        return null;
      }
    },
    []
  );

  const deletePresentation = useCallback(async (id: string) => {
    setError(null);
    const previous = presentations;
    setPresentations((prev) => prev.filter((item) => item.id !== id));
    try {
      await presentationApi.deleteProjectPresentation(id);
      return true;
    } catch (e: any) {
      setPresentations(previous);
      setError(e.message || 'Failed to delete presentation');
      return false;
    }
  }, [presentations]);

  return {
    presentations,
    isLoading,
    error,
    refresh,
    createPresentation,
    renamePresentation,
    deletePresentation,
  };
};
