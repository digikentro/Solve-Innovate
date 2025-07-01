import { useParams, useNavigate } from 'react-router-dom';
import { ProjectDetail } from '@/components/project/ProjectDetail';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!id) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectDetail />
      </div>
    </div>
  );
};
