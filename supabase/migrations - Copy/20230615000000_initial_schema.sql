-- Enable necessary extensions
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;

-- Create profiles table
create table public.profiles (
  id uuid not null primary key references auth.users on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  skills text[],
  interests text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table public.projects (
  id uuid default extensions.uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  status text default 'draft'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ideas table
create table public.ideas (
  id uuid default extensions.uuid_generate_v4() primary key,
  project_id uuid references public.projects on delete cascade not null,
  content text not null,
  ai_generated boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.ideas enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile."
  on public.profiles for update
  using (auth.uid() = id);

-- Create policies for projects
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

-- Create policies for ideas
create policy "Users can view ideas for their projects"
  on public.ideas for select
  using (exists (
    select 1 from public.projects
    where projects.id = ideas.project_id
    and projects.user_id = auth.uid()
  ));

create policy "Users can insert ideas for their projects"
  on public.ideas for insert
  with check (exists (
    select 1 from public.projects
    where projects.id = ideas.project_id
    and projects.user_id = auth.uid()
  ));

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to handle new user signups
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a function to get the current user's profile
create or replace function public.get_user_profile()
returns json as $$
  select to_jsonb(profiles.*) - 'id'
  from public.profiles
  where id = auth.uid();
$$ language sql security definer;
