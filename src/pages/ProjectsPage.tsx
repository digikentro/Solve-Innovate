import { ProjectList } from '@/components/project/ProjectList';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProjectsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectList />
      </div>
    </div>
  );
};
