# AI Development Guide for SolveSmart

## How to Work with This AI Assistant

### 1. Project Structure
```
solvesmart/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/        # Feature-based modules
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx         # Main app component
├── supabase/
│   ├── migrations/        # Database migrations
│   └── functions/          # Edge functions
└── docs/                   # Documentation
```

### 2. Development Workflow
1. **Task Breakdown**: The AI will break down features into atomic tasks
2. **Implementation**: AI will implement one task at a time
3. **Review**: AI will explain changes and request feedback
4. **Iteration**: AI will refine based on feedback

### 3. AI Capabilities
- Can create/modify React components
- Can write database migrations
- Can implement API endpoints
- Can write tests
- Can debug issues
- Can optimize performance

### 4. Best Practices
- Always use TypeScript
- Follow React hooks pattern
- Use functional components
- Implement proper error boundaries
- Write tests for critical paths
- Document complex logic

### 5. How to Provide Feedback
- Be specific about issues
- Reference file and line numbers
- Provide examples when possible
- Use the following format:
  ```
  FILE: path/to/file.tsx
  ISSUE: Description of issue
  SUGGESTION: Suggested change
  ```

## Communication Protocol

### When AI Needs Clarification:
- Will ask specific questions
- Will provide multiple options when uncertain
- Will confirm understanding before proceeding

### When AI Completes a Task:
- Will summarize changes made
- Will highlight potential issues
- Will suggest next steps

### When AI Encounters Errors:
- Will analyze the error
- Will propose solutions
- Will wait for confirmation before proceeding

## Getting Started

1. First, let's set up the project structure
2. Then we'll implement core features one by one
3. We'll test and refine as we go

Would you like to start with the project setup?
