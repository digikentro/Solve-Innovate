import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectService } from '@/services/projectService';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectForm } from '@/components/project/ProjectForm';
import { ProjectInput } from '@/types/project';

export default function ProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectInput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || !user) return navigate('/projects');
      try {
        setLoading(true);
        const data = await ProjectService.getProjectById(id, user.id);
        if (!data) {
          navigate('/projects');
          return;
        }
        if (data.user_id !== user.id) {
          navigate('/projects');
          return;
        }
        setProject(data);
      } catch (error) {
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id, user, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!project) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <ProjectForm initialData={project} />
    </div>
  );
}