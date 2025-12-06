import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ProjectService } from '@/services/projectService';
import type { Project } from '@/types/project';

export const useProjectData = (projectId: string | undefined, userId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId || !userId) return;

      try {
        setIsLoading(true);
        const data = await ProjectService.getProjectById(projectId, userId);

        if (!data) {
          toast.error('Project not found');
          navigate('/projects');
          return;
        }

        setProject(data);
      } catch (error) {
        console.error('Error loading project:', error);
        setError('Failed to load project');
        toast.error('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, userId, navigate]);

  const handleDelete = async () => {
    if (!projectId || !userId) return;

    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await ProjectService.deleteProject(projectId, userId);
        toast.success('Project deleted successfully');
        navigate('/projects');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      }
    }
  };

  const refetchProject = async () => {
    if (!projectId || !userId) return;

    try {
      const data = await ProjectService.getProjectById(projectId, userId);
      if (data) {
        setProject(data);
      }
    } catch (error) {
      console.error('Error refetching project:', error);
    }
  };

  return {
    project,
    setProject,
    isLoading,
    error,
    handleDelete,
    refetchProject,
  };
};
