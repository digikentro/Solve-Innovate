import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FiEdit2, FiUser, FiBriefcase, FiBook, FiAward, FiLayers } from 'react-icons/fi';

export const ProfileCard = () => {
  const { user } = useAuth();

  if (!user) return null;

  const profile = user.user_metadata || {};
  
  // Default values for profile fields
  const {
    full_name = 'Not set',
    role = 'Not specified',
    institution = 'Not specified',
    skills = [],
    interests = []
  } = profile;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-indigo-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Profile</h2>
          <Link
            to="/profile/edit"
            className="text-indigo-100 hover:text-white transition-colors"
            title="Edit Profile"
          >
            <FiEdit2 className="h-5 w-5" />
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FiUser className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{full_name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-gray-400">
              <FiBriefcase className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-sm text-gray-900">{role}</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-gray-400">
              <FiBook className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Institution</p>
              <p className="text-sm text-gray-900">{institution}</p>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-gray-400">
                <FiAward className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Skills</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {skills.map((skill: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {interests.length > 0 && (
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 text-gray-400">
                <FiLayers className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Interests</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {interests.map((interest: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="text-sm">
          <Link 
            to="/profile" 
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            View full profile →
          </Link>
        </div>
      </div>
    </div>
  );
};
