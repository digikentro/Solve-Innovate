import { ProfileForm } from '@/components/profile/ProfileForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface ProfilePageProps {
  editMode?: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ editMode = false }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(editMode);

  // Sync with props
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="py-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          {!editMode && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile/edit')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md shadow-sm text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
        <ProfileForm editMode={editMode} />
      </div>
    </div>
  );
};

export const EditProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }
  return (
    <div className="py-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        </div>
        <ProfileForm editMode={true} onSuccess={() => navigate('/profile')} onCancel={() => navigate('/profile')} />
      </div>
    </div>
  );
};
