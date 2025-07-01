# SmartSolve POC - Innovation Opportunity Score Framework

## Overview

This is a Proof of Concept (POC) implementation of the SmartSolve platform, which uses AI to help users generate and select "How Might We" (HMW) problem statements with comprehensive opportunity scoring and source verification.

## 🚀 Features Implemented

### Core Features
- ✅ **HMW Generation Engine** - AI-powered problem statement generation
- ✅ **6-Dimensional Opportunity Scoring** - Market, Innovation, Feasibility, Impact, India Context, Global Relevance
- ✅ **Source Verification System** - 5-tier credibility framework with bias detection
- ✅ **Project Management** - Create, edit, and manage innovation projects
- ✅ **User Authentication** - Secure login/signup with Supabase Auth
- ✅ **Dashboard** - Real-time project statistics and insights

### Essential POC Features
- ✅ **Error Handling & Resilience** - Retry mechanisms, fallbacks, user-friendly errors
- ✅ **Basic Caching** - localStorage-based caching for performance
- ✅ **Basic Security** - Rate limiting, input validation, XSS protection
- ✅ **Frontend Integration** - IOS dashboard with score visualization
- ✅ **Error Boundaries** - React error boundary for graceful error handling

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hot Toast** for notifications

### Backend
- **Supabase** for database and authentication
- **OpenAI API** for AI-powered features
- **Edge Functions** for serverless operations

### Services
- `ErrorHandler` - Comprehensive error handling with retry logic
- `CachingService` - localStorage-based caching with TTL
- `SecurityService` - Rate limiting, validation, and security checks
- `ProjectService` - Project CRUD operations with security integration
- `IOSFrameworkService` - 6-dimensional opportunity scoring
- `SourceVerificationService` - Source credibility assessment

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard and analytics
│   ├── layout/         # Layout components
│   ├── ui/            # Reusable UI components
│   └── assessment/    # Assessment forms
├── contexts/          # React contexts
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── pages/            # Page components
├── services/         # Business logic services
└── types/            # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SmartSolve
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Database Setup**
   - Run Supabase migrations in `supabase/migrations/`
   - Deploy edge functions in `supabase/functions/`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Rate Limiting
Configure rate limits in `src/services/securityService.ts`:
```typescript
rateLimits: {
  api: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },  // 5 attempts per 15 minutes
  hmwGeneration: { maxRequests: 20, windowMs: 60 * 60 * 1000 } // 20 generations per hour
}
```

### Caching
Configure cache TTL in `src/services/cachingService.ts`:
```typescript
export enum CACHE_TTL {
  SHORT = 5 * 60 * 1000,    // 5 minutes
  MEDIUM = 30 * 60 * 1000,  // 30 minutes
  LONG = 2 * 60 * 60 * 1000, // 2 hours
  DAY = 24 * 60 * 60 * 1000  // 24 hours
}
```

## 🛡️ Security Features

### Input Validation
- Required field validation
- Length restrictions
- Pattern matching
- XSS protection
- SQL injection prevention

### Rate Limiting
- Per-user rate limiting
- Operation-specific limits
- Automatic cleanup of expired entries

### Error Handling
- Graceful error recovery
- User-friendly error messages
- Comprehensive error logging
- Retry mechanisms with exponential backoff

## 📊 Dashboard Features

### Project Statistics
- Total projects count
- Recent projects (last 7 days)
- Sector distribution (Social Impact vs Business)
- Project opportunity scores

### Real-time Data
- Cached data with automatic refresh
- Error handling with retry options
- Loading states and fallbacks

## 🔄 Error Handling

### Error Types
- `SmartSolveError` - Base error class
- `ValidationError` - Input validation errors
- `NetworkError` - Network connectivity issues
- `APIError` - API request failures
- `DatabaseError` - Database operation errors
- `AuthenticationError` - Auth-related errors
- `RateLimitError` - Rate limiting violations

### Error Recovery
- Automatic retry with exponential backoff
- Fallback mechanisms for critical operations
- User-friendly error messages
- Error boundary for React components

## 🗄️ Caching Strategy

### Cache Levels
- **Short-term** (5 min): Search results, temporary data
- **Medium-term** (30 min): User projects, statistics
- **Long-term** (2 hours): Static data, configurations
- **Day** (24 hours): Rarely changing data

### Cache Management
- Automatic cleanup of expired entries
- Namespace-based organization
- Pattern-based invalidation
- Storage quota management

## 🧪 Testing the POC

### 1. User Registration/Login
- Test user registration flow
- Verify authentication state management
- Test login/logout functionality

### 2. Project Creation
- Create projects in both sectors (Social Impact, Business)
- Test input validation and error handling
- Verify project data persistence

### 3. HMW Generation
- Test AI-powered problem generation
- Verify rate limiting on generation requests
- Test error handling for API failures

### 4. Dashboard
- Verify real-time statistics
- Test caching behavior
- Check error boundary functionality

### 5. Security Features
- Test rate limiting by making rapid requests
- Verify input validation with malicious data
- Test XSS protection

## 🚨 Known Limitations (POC)

### Performance
- localStorage-based caching (limited storage)
- No server-side caching
- No CDN for static assets

### Security
- Basic rate limiting (client-side)
- No advanced threat detection
- Limited audit logging

### Scalability
- Single-page application
- No load balancing
- Limited concurrent user support

### Features
- No real-time collaboration
- Limited export capabilities
- No advanced analytics

## 🔮 Future Enhancements

### Phase 2 Features
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Export functionality (PDF, Excel)
- [ ] Team management
- [ ] Advanced search and filtering

### Infrastructure
- [ ] Redis caching
- [ ] CDN integration
- [ ] Load balancing
- [ ] Advanced monitoring
- [ ] Automated testing

### Security
- [ ] Advanced threat detection
- [ ] Audit logging
- [ ] Multi-factor authentication
- [ ] Role-based access control

## 📝 API Documentation

### Project Service
```typescript
// Create project
ProjectService.createProject(data, userId)

// Get user projects
ProjectService.getUserProjects(userId)

// Update project
ProjectService.updateProject(projectId, data, userId)

// Delete project
ProjectService.deleteProject(projectId, userId)
```

### Error Handling
```typescript
// Wrap operations with retry logic
ErrorHandler.withRetry(operation, context)

// Handle specific error types
try {
  // operation
} catch (error) {
  if (error instanceof ValidationError) {
    // handle validation error
  }
}
```

### Caching
```typescript
// Cache expensive operations
CachingService.withCache(key, options, operation)

// Manual cache management
CachingService.set(key, data, options)
CachingService.get(key, options)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For POC-related questions or issues:
1. Check the error logs in browser console
2. Review the error handling documentation
3. Check Supabase dashboard for database issues
4. Verify API key configurations

---

**Note**: This is a POC implementation. For production use, additional security, performance, and scalability measures would be required. 