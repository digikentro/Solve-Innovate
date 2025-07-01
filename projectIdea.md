# SolveSmart SaaS Platform - Full MVP Blueprint

---

## 1. Project Vision

Build an AI-powered real-time innovation problem discovery platform where users submit interests and skills, and receive AI-generated "How Might We" (HMW) problem statements with real-time scoring, skill matching, and discovery capabilities.

Target Users: Students, Professionals, Innovators
Sectors: Business & Social Impact

---

## 2. End-to-End User Flow

1️⃣ User registers (OTP verification)
2️⃣ Onboarding wizard collects skills, interests, institution data
3️⃣ User types free-text problem interest query
4️⃣ AI generates HMW problem statements in real-time
5️⃣ Opportunity Score calculated (based on SolveSmart Opportunity Score Framework)
6️⃣ Required skills extracted
7️⃣ Skill match % calculated
8️⃣ User reviews problems and selects one to work on
9️⃣ Problem assigned to user's dashboard with progress tracking

---

## 3. Core Modules

### 3.1 User Management
- Registration & Email OTP verification
- Skill and profile management
- Institution & department tracking

### 3.2 Problem Discovery Engine
- AI-powered problem generation
- HMW formatting using GPT-4o
- Opportunity Score calculation
- Skill extraction and matching

### 3.3 Engagement Workspace
- Problem commitment flow
- Progress dashboard
- Team collaboration (future phase)
- Resource recommendations
- Mentorship connect (future phase)

### 3.4 Admin Portal
- User analytics
- Problem repository management
- Custom problem review and approval
- Skill distribution reports
- Platform usage metrics

---

## 4. Opportunity Score Framework

| Component | Max Score |
|------------|------------|
| Problem Significance | 25 |
| Solution Gap | 25 |
| Market Potential | 20 |
| Technical Feasibility | 15 |
| SDG Alignment (Social Impact only) | 15 |

> Total score = sum(scores) / 100 * 100%

---

## 5. AI Pipeline

### Input
- User query (free text)
- Sector & category (optional)
- User skills

### Processing
- Clean and normalize input
- Inject context: sector descriptions, example HMWs
- Run GPT-4o with engineered system prompt
- Generate 5 HMW statements + full scoring
- Extract required skills for each problem
- Use embeddings for skill match % calculation

### Output
- Structured JSON with:
  - HMW statements
  - Subscores
  - Total score
  - Required skills
  - Skill match %

---

## 6. Core AI Prompt Template

```markdown
You are an innovation opportunity analyzer.

Given:
- User query: {input}
- Sector: {sector}
- Category: {category}
- User Skills: {skills}

Output:
- 5 HMW statements
- Full Opportunity Score (significance, gap, market, feasibility, SDG)
- Required skills
- Return valid JSON.
```

---

## 7. Technology Stack

| Layer | Stack |
|-------|-------|
| Frontend | React.js (Next.js) |
| Backend | Python (FastAPI) |
| Database | PostgreSQL |
| Vector DB | Pinecone / ChromaDB |
| AI Models | OpenAI GPT-4o + embeddings |
| Hosting | AWS / GCP |

---

## 8. Database Schema (Simplified)

### Users Table
- id, name, email, phone, institution, position, department, skills

### Problems Table
- id, hmw_statement, sector, category, significance_score, solution_gap_score, market_potential_score, feasibility_score, sdg_alignment_score, total_score, required_skills

### CustomSubmissions Table
- id, user_id, input_text, ai_refined_hmw, ai_scores, status

### Embeddings Table
- id, problem_id, embedding_vector

---

## 9. Wireframe Pages

- Landing Page
- Registration & OTP Verification
- Onboarding Wizard (Institution ➔ Skills ➔ Interests)
- AI Search Dashboard
- Real-time Problem Results (with filters)
- Problem Detail Page
- Custom Problem Submission Page
- Commitment Flow Page
- Project Workspace
- Admin Portal

---

## 10. Development Phases

### Phase 1 - Core MVP
- Registration + OTP
- AI Search Engine
- Opportunity Scoring
- Skill Matching
- Custom Problem Submission
- Basic Admin Panel

### Phase 2 - Engagement Layer
- Commitment Flow
- Project Workspace
- User Progress Tracking

### Phase 3 - Community Layer
- Teams & Collaboration
- Mentorship Matching
- Skill Development Resources

### Phase 4 - AI Agent Layer
- Conversational discovery assistant
- RAG-based deeper problem suggestions

---

## 11. Key Innovations

- Real-time HMW generation from open-ended queries
- Live scoring aligned to structured framework
- AI-powered skill gap calculation
- SaaS scalable, highly modular, cloud-native architecture
- Built-in dynamic problem database

---

This blueprint consolidates all knowledge from existing SolveSmart documents, architecture, AI pipelines, developer guides, scoring frameworks, and your vision for SaaS expansion.

> ✅ Ready for development, team onboarding & system build.
