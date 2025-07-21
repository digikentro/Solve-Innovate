import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  website: string | null;
  role: string | null;
  institution: string | null;
  skills: string[];
  interests: string[];
  created_at: string;
  updated_at: string;
};

type CreateProfileInput = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
type UpdateProfileInput = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>;

export const profileService = {
  // Get current user's profile
  getProfile: async (): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    
    if (!data) {
      return null;
    }
    
    // Ensure arrays are always arrays
    const profile = data as Profile;
    return {
      ...profile,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      interests: Array.isArray(profile.interests) ? profile.interests : [],
    };
  },

  // Update or create profile
  updateProfile: async (input: UpdateProfileInput): Promise<Profile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // First try to get the existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Profile doesn't exist, create it
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      return data;
    } else {
      // Profile exists, update it
      const { data, error } = await supabase
      .from('profiles')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
        .eq('id', user.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    
    return data;
    }
  },
};
