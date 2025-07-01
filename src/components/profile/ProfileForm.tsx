import { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { profileService, type Profile } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { ChipsInput } from '@/components/ui/ChipsInput';
import { Loader2 } from 'lucide-react';

type ProfileUpdateData = Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Common skills and interests for suggestions
const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'HTML/CSS', 'UI/UX Design', 'Product Management', 'Data Analysis', 'Machine Learning',
  'DevOps', 'Cloud Computing', 'Cybersecurity', 'Blockchain', 'Mobile Development'
] as const;

const COMMON_INTERESTS = [
  'Web Development', 'Mobile Apps', 'AI/ML', 'Data Science', 'Cloud Computing',
  'Cybersecurity', 'Blockchain', 'IoT', 'AR/VR', 'Game Development', 'Open Source',
  'Startups', 'Entrepreneurship', 'UI/UX Design', 'DevOps', 'Cloud Native',
  'Serverless', 'Microservices', 'Quantum Computing', 'Robotics'
] as const;

interface ProfileFormProps {
  editMode?: boolean;
  onSuccess?: (profile: Profile | null) => void;
  onCancel?: () => void;
}

type ProfileFormData = {
  full_name: string;
  username: string;
  bio: string;
  website: string;
  role: string;
  institution: string;
  skills: string[];
  interests: string[];
};

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().default(''),
  website: z.string().default(''),
  role: z.string().min(1, 'Role is required').default(''),
  institution: z.string().min(1, 'Institution is required').default(''),
  skills: z.array(z.string())
    .max(10, { message: 'You can add up to 10 skills' })
    .default([]),
  interests: z.array(z.string())
    .max(10, { message: 'You can add up to 10 interests' })
    .default([]),
});

export const ProfileForm = ({ 
  editMode = false,
  onSuccess,
  onCancel 
}: ProfileFormProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(editMode);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    control, 
    formState: { errors, isSubmitting } 
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema) as any, // Type assertion to fix resolver type
    defaultValues: {
      full_name: user?.user_metadata?.full_name || '',
      username: user?.user_metadata?.preferred_username || '',
      bio: '',
      website: '',
      role: '',
      institution: '',
      skills: [],
      interests: [],
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const profile = await profileService.getProfile();
        if (profile) {
          setCurrentProfile(profile);
          reset({
            full_name: profile.full_name || '',
            username: profile.username || '',
            bio: profile.bio || '',
            website: profile.website || '',
            role: profile.role || '',
            institution: profile.institution || '',
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            interests: Array.isArray(profile.interests) ? profile.interests : [],
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      const profileData = {
        full_name: data.full_name,
        username: data.username,
        bio: data.bio,
        website: data.website,
        role: data.role,
        institution: data.institution,
        skills: data.skills,
        interests: data.interests,
        updated_at: new Date().toISOString(),
      };
      
      const updatedProfile = await profileService.updateProfile(profileData);
      setCurrentProfile(updatedProfile);
      
      toast.success('Profile updated successfully');
      if (onSuccess) onSuccess(updatedProfile);
      if (!editMode) setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (currentProfile) {
      reset({
        full_name: currentProfile.full_name || '',
        username: currentProfile.username || '',
        bio: currentProfile.bio || '',
        website: currentProfile.website || '',
        role: currentProfile.role || '',
        institution: currentProfile.institution || '',
        skills: Array.isArray(currentProfile.skills) ? currentProfile.skills : [],
        interests: Array.isArray(currentProfile.interests) ? currentProfile.interests : [],
      });
      setIsEditing(false);
    } else {
      reset({
        full_name: user?.user_metadata?.full_name || '',
        username: user?.user_metadata?.preferred_username || '',
        bio: '',
        website: '',
        role: '',
        institution: '',
        skills: [],
        interests: [],
      });
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto bg-white shadow overflow-hidden sm:rounded-lg">

      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(onSubmit)(e);
      }} className="space-y-8 p-6">
        <div className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal details and contact information.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Your full name"
                  disabled={!isEditing}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  {...register('username')}
                  className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Your username"
                  disabled={!isEditing}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                id="website"
                type="url"
                {...register('website')}
                className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="https://yourwebsite.com"
                disabled={!isEditing}
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                {...register('bio')}
                disabled={!isEditing}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Tell us about yourself..."
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="pt-8 border-t border-gray-200">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Professional Information</h4>
              <p className="mt-1 text-sm text-gray-500">
                Share your professional background and expertise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  {...register('role')}
                  className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Your professional role or title"
                  disabled={!isEditing}
                />
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  id="institution"
                  type="text"
                  {...register('institution')}
                  className="block w-full h-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Your company or school"
                  disabled={!isEditing}
                />
                {errors.institution && (
                  <p className="mt-1 text-sm text-red-600">{errors.institution.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills & Interests Section */}
          <div className="pt-8 border-t border-gray-200">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Skills & Interests</h4>
              <p className="mt-1 text-sm text-gray-500">
                Add your top skills and interests to help us match you with relevant opportunities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                <Controller
                  name="skills"
                  control={control}
                  render={({ field }) => (
                    <ChipsInput
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={COMMON_SKILLS}
                      placeholder="Type and press Enter to add skills..."
                      maxItems={10}
                      disabled={!isEditing}
                      className="min-h-[42px]"
                    />
                  )}
                />
                {errors.skills && (
                  <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                )}
              </div>

              {/* Interests */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interests
                </label>
                <Controller
                  name="interests"
                  control={control}
                  render={({ field }) => (
                    <ChipsInput
                      value={field.value || []}
                      onChange={field.onChange}
                      suggestions={COMMON_INTERESTS}
                      placeholder="Type and press Enter to add interests..."
                      maxItems={10}
                      disabled={!isEditing}
                      className="min-h-[42px]"
                    />
                  )}
                />
                {errors.interests && (
                  <p className="mt-1 text-sm text-red-600">{errors.interests.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
