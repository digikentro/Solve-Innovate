import { supabase } from '@/lib/supabase';

export interface AdminUser {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
    role: string | null;
    institution: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    project_count: number;
    status: 'active' | 'banned';
}

export interface AdminProject {
    id: string;
    title: string;
    description: string | null;
    status: string;
    user_id: string;
    owner_email: string;
    owner_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface SystemStats {
    totalUsers: number;
    totalProjects: number;
    activeUsersToday: number;
    projectsThisWeek: number;
    recentSignups: { date: string; count: number }[];
    projectTrends: { date: string; count: number }[];
}

// Sample data for development
const SAMPLE_USERS: AdminUser[] = [
    {
        id: '1',
        email: 'john.doe@example.com',
        full_name: 'John Doe',
        username: 'johndoe',
        role: 'user',
        institution: 'Stanford University',
        created_at: '2024-12-15T10:30:00Z',
        last_sign_in_at: '2024-12-30T08:15:00Z',
        project_count: 5,
        status: 'active',
    },
    {
        id: '2',
        email: 'jane.smith@example.com',
        full_name: 'Jane Smith',
        username: 'janesmith',
        role: 'user',
        institution: 'MIT',
        created_at: '2024-12-10T14:20:00Z',
        last_sign_in_at: '2024-12-29T16:45:00Z',
        project_count: 3,
        status: 'active',
    },
    {
        id: '3',
        email: 'alex.kumar@example.com',
        full_name: 'Alex Kumar',
        username: 'alexk',
        role: 'user',
        institution: 'IIT Delhi',
        created_at: '2024-12-05T09:00:00Z',
        last_sign_in_at: '2024-12-28T12:30:00Z',
        project_count: 8,
        status: 'active',
    },
    {
        id: '4',
        email: 'sarah.wilson@example.com',
        full_name: 'Sarah Wilson',
        username: 'sarahw',
        role: 'user',
        institution: 'Harvard Business School',
        created_at: '2024-11-20T11:45:00Z',
        last_sign_in_at: '2024-12-25T09:00:00Z',
        project_count: 2,
        status: 'active',
    },
    {
        id: '5',
        email: 'mike.chen@example.com',
        full_name: 'Mike Chen',
        username: 'mikechen',
        role: 'user',
        institution: 'Berkeley',
        created_at: '2024-11-15T08:30:00Z',
        last_sign_in_at: null,
        project_count: 0,
        status: 'banned',
    },
];

const SAMPLE_PROJECTS: AdminProject[] = [
    {
        id: 'p1',
        title: 'AI-Powered Healthcare Assistant',
        description: 'A chatbot that helps patients schedule appointments and get basic health information.',
        status: 'active',
        user_id: '1',
        owner_email: 'john.doe@example.com',
        owner_name: 'John Doe',
        created_at: '2024-12-20T10:00:00Z',
        updated_at: '2024-12-29T15:30:00Z',
    },
    {
        id: 'p2',
        title: 'Sustainable Fashion Marketplace',
        description: 'An eco-friendly platform for buying and selling second-hand clothing.',
        status: 'draft',
        user_id: '2',
        owner_email: 'jane.smith@example.com',
        owner_name: 'Jane Smith',
        created_at: '2024-12-18T14:00:00Z',
        updated_at: '2024-12-28T09:15:00Z',
    },
    {
        id: 'p3',
        title: 'Smart Agriculture IoT System',
        description: 'IoT-based solution for monitoring soil health and automating irrigation.',
        status: 'active',
        user_id: '3',
        owner_email: 'alex.kumar@example.com',
        owner_name: 'Alex Kumar',
        created_at: '2024-12-15T11:30:00Z',
        updated_at: '2024-12-30T08:00:00Z',
    },
    {
        id: 'p4',
        title: 'Mental Health Companion App',
        description: 'Mobile app providing daily mental wellness exercises and mood tracking.',
        status: 'active',
        user_id: '1',
        owner_email: 'john.doe@example.com',
        owner_name: 'John Doe',
        created_at: '2024-12-10T09:00:00Z',
        updated_at: '2024-12-27T14:45:00Z',
    },
    {
        id: 'p5',
        title: 'EdTech Learning Platform',
        description: 'Interactive platform for personalized K-12 education with gamification.',
        status: 'draft',
        user_id: '4',
        owner_email: 'sarah.wilson@example.com',
        owner_name: 'Sarah Wilson',
        created_at: '2024-12-05T16:20:00Z',
        updated_at: '2024-12-22T11:00:00Z',
    },
    {
        id: 'p6',
        title: 'Carbon Footprint Tracker',
        description: 'Help individuals and businesses track and reduce their carbon emissions.',
        status: 'active',
        user_id: '3',
        owner_email: 'alex.kumar@example.com',
        owner_name: 'Alex Kumar',
        created_at: '2024-12-01T08:45:00Z',
        updated_at: '2024-12-26T10:30:00Z',
    },
];

const SAMPLE_STATS: SystemStats = {
    totalUsers: 127,
    totalProjects: 342,
    activeUsersToday: 45,
    projectsThisWeek: 28,
    recentSignups: [
        { date: '2024-12-24', count: 5 },
        { date: '2024-12-25', count: 3 },
        { date: '2024-12-26', count: 8 },
        { date: '2024-12-27', count: 12 },
        { date: '2024-12-28', count: 7 },
        { date: '2024-12-29', count: 15 },
        { date: '2024-12-30', count: 9 },
    ],
    projectTrends: [
        { date: '2024-12-24', count: 4 },
        { date: '2024-12-25', count: 2 },
        { date: '2024-12-26', count: 6 },
        { date: '2024-12-27', count: 8 },
        { date: '2024-12-28', count: 5 },
        { date: '2024-12-29', count: 10 },
        { date: '2024-12-30', count: 7 },
    ],
};

export class AdminService {
    // Use sample data for now - will integrate with Supabase later
    private static useSampleData = true;

    static async getAllUsers(): Promise<AdminUser[]> {
        if (this.useSampleData) {
            return Promise.resolve(SAMPLE_USERS);
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getAllProjects(): Promise<AdminProject[]> {
        if (this.useSampleData) {
            return Promise.resolve(SAMPLE_PROJECTS);
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*, profiles!user_id(email, full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    static async getSystemStats(): Promise<SystemStats> {
        if (this.useSampleData) {
            return Promise.resolve(SAMPLE_STATS);
        }

        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        const { count: projectCount } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true });

        return {
            totalUsers: userCount || 0,
            totalProjects: projectCount || 0,
            activeUsersToday: 0,
            projectsThisWeek: 0,
            recentSignups: [],
            projectTrends: [],
        };
    }

    static async banUser(userId: string): Promise<void> {
        if (this.useSampleData) {
            console.log('Sample: Banning user', userId);
            return Promise.resolve();
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: 'banned' })
            .eq('id', userId);

        if (error) throw error;
    }

    static async unbanUser(userId: string): Promise<void> {
        if (this.useSampleData) {
            console.log('Sample: Unbanning user', userId);
            return Promise.resolve();
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: 'user' })
            .eq('id', userId);

        if (error) throw error;
    }

    static async deleteProject(projectId: string): Promise<void> {
        if (this.useSampleData) {
            console.log('Sample: Deleting project', projectId);
            return Promise.resolve();
        }

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;
    }
}
