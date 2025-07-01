# SolveSmart - AI-Optimized Technical Specification

## 1. Implementation Guide

### 1.1 File Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `kebab-case.ts`
- Tests: `ComponentName.test.tsx`
- Types: `types.ts` in each feature folder

### 1.2 Component Structure
```typescript
// components/ComponentName.tsx
import React from 'react';
import { useCustomHook } from '../hooks';
import type { ComponentProps } from '../types';

interface ComponentNameProps {
  // Props documentation
  title: string;
  onAction: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onAction,
}) => {
  // Hooks
  const { data, loading } = useCustomHook();

  // Handlers
  const handleClick = () => {
    // Implementation
    onAction();
  };

  // Render
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="component-name">
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
      {data && <div>{data}</div>}
    </div>
  );
};
```

## 2. Database Schema (Supabase)

### 2.1 Tables

#### profiles
```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users profile (extends auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  email text unique,
  institution_id uuid references institutions(id),
  department text,
  skills text[] default '{}'::text[],
  interests text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;

-- Add index for faster lookups
create index idx_profiles_email on public.profiles (email);
```

## 3. API Endpoints

### 3.1 Authentication (Supabase Auth)

```typescript
// lib/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Sign up
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};
```

## 4. AI Integration

### 4.1 Problem Generation

```typescript
// lib/ai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateHMW = async (input: {
  query: string;
  skills: string[];
  interests: string[];
}) => {
  const prompt = `Generate 5 HMW statements based on:
  - Query: ${input.query}
  - Skills: ${input.skills.join(', ')}
  - Interests: ${input.interests.join(', ')}`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4',
  });

  return completion.choices[0].message.content;
};
```

## 5. Testing Strategy

### 5.1 Component Test Example

```typescript
// components/__tests__/ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders the component', () => {
    render(<ComponentName title="Test" onAction={jest.fn()} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', () => {
    const mockAction = jest.fn();
    render(<ComponentName title="Test" onAction={mockAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
```

## 6. Development Workflow

### 6.1 Branch Naming
- `feat/`: New features
- `fix/`: Bug fixes
- `docs/`: Documentation changes
- `refactor/`: Code refactoring
- `test/`: Test updates

### 6.2 Commit Message Format
```
type(scope): short description

Longer description if needed

[optional footer]
```

Example:
```
feat(auth): add email verification

- Implement email verification flow
- Add success/error handling
- Update auth documentation
```

## 7. Environment Variables

```env
# Frontend
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend (Edge Functions)
SUPABASE_SERVICE_ROLE=your-service-role
OPENAI_API_KEY=your-openai-key
```

## 8. Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`
5. Run tests: `npm test`

## 9. AI Implementation Notes

### When Implementing a New Feature:
1. Create a new branch: `git checkout -b feat/feature-name`
2. Implement the feature
3. Write tests
4. Update documentation
5. Create a pull request

### When Fixing a Bug:
1. Create a new branch: `git checkout -b fix/bug-description`
2. Write a failing test
3. Fix the bug
4. Ensure all tests pass
5. Update documentation if needed
6. Create a pull request
