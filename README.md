# TalentFlow - Hiring Platform

A React front-end application for HR teams to manage jobs, candidates, and assessments - built as a technical assessment project.

## 🚀 Project Overview

TalentFlow is a mini hiring platform built with React, TypeScript, and Vite. It simulates a backend using MSW (Mock Service Worker) and persists data locally using Dexie/IndexedDB.

### Core Features

- **Job Management**: Create, edit, archive, and reorder jobs with drag-and-drop
- **Candidate Management**: Track candidates through hiring stages with kanban boards
- **Assessments**: Build custom assessments with multiple question types
- **Real-time Updates**: Optimistic UI updates with rollback on failure
- **Virtualized Lists**: Handle 1000+ candidates efficiently with react-virtual
- **Local Persistence**: All data persists in IndexedDB

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for server state management
- **Mantine UI** for components
- **MSW** for API mocking
- **Dexie** for IndexedDB
- **React Router** for navigation
- **dnd-kit** for drag-and-drop
- **React Hook Form** for form handling
- **TanStack Virtual** for virtualization

## 📦 Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to the project directory
cd TalentFlow

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🏗️ Architecture

### Project Structure

```
TalentFlow/
├── src/
│   ├── api.ts                 # API client functions
│   ├── db.ts                  # Dexie database schema
│   ├── seed.ts                # Database seeding script
│   ├── main.tsx               # App entry point
│   ├── components/
│   │   └── Layout.tsx         # Main app layout with navigation
│   ├── pages/
│   │   ├── JobsBoard.tsx      # Jobs list with pagination & filters
│   │   ├── JobKanbanBoard.tsx # Kanban board for candidates
│   │   ├── CandidatesList.tsx  # Virtualized candidates list
│   │   ├── CandidateProfile.tsx # Candidate details & timeline
│   │   ├── AssessmentBuilder.tsx # Assessment creation
│   │   ├── TakeAssessment.tsx # Assessment taking interface
│   │   └── AssessmentResponses.tsx # View submitted responses
│   └── mocks/
│       ├── browser.ts         # MSW worker setup
│       ├── handlers.ts        # API mock handlers
│       └── utils.ts          # Mock utilities (delays, errors)
```

### Data Flow

1. **MSW Layer**: Simulates network requests with injected delays (200-1200ms) and errors (5-10%)
2. **API Layer**: Axios-based API client with TanStack Query for caching
3. **IndexedDB**: Dexie stores all data locally, survives page refreshes
4. **React Query**: Provides caching, optimistic updates, and error handling

### Key Design Decisions

- **Optimistic Updates**: Jobs reordering and candidate stage changes update UI immediately, roll back on error
- **Virtualization**: Candidates list virtualizes for performance with 1000+ items
- **Server-like Pagination**: Jobs use pagination similar to a real backend
- **Local-first**: All data persists in IndexedDB, restored on refresh

## 📋 Features Implementation

### Jobs Board

- ✅ List with pagination (10 items per page)
- ✅ Filter by status (active/archived) and search by title
- ✅ Archive/Unarchive jobs
- ✅ Drag-and-drop reordering with rollback on error
- ✅ Deep linking `/jobs/:jobId/board`
- ✅ Links to assessment builder and kanban board

### Candidates

- ✅ Virtualized list (react-virtual)
- ✅ Client-side search by name/email
- ✅ Server-like filter by stage
- ✅ Candidate profile route `/candidates/:id`
- ✅ Timeline of status changes and notes
- ✅ Kanban board with drag-and-drop between stages
- ✅ Notes with @mention highlighting

### Assessments

- ✅ Assessment builder per job
- ✅ Multiple question types (single-choice, multi-choice, short/long text, numeric, file-upload stub)
- ✅ Live preview pane
- ✅ Persistent builder state
- ✅ Form runtime with validation (required, max length)
- ✅ Conditional questions (show Q3 only if Q1 === "Yes")
- ✅ View submitted responses

## 🎯 API Endpoints (MSW)

The following endpoints are mocked:

### Jobs

- `GET /jobs?search=&status=&page=&pageSize=&sort=`
- `PATCH /jobs/:id` - Update job status
- `PATCH /jobs/reorder` - Reorder jobs (50% error rate for testing)

### Candidates

- `GET /candidates?search=&stage=&page=`
- `PATCH /candidates/:id` - Update stage
- `GET /candidates/:id` - Get details
- `GET /candidates/:id/timeline` - Get timeline
- `POST /candidates/:id/notes` - Add note
- `GET /candidates-for-job/:jobId`

### Assessments

- `GET /assessments/:jobId`
- `PUT /assessments/:jobId`
- `POST /assessments/:jobId/submit`
- `GET /assessment-responses/:jobId`

## 📊 Seeded Data

- **25 jobs** (mixed active/archived)
- **1000 candidates** randomly assigned to jobs and stages
- **3 assessments** with varying question types
- **Timeline events** for initial candidates

### Implemented Features

1. All core requirements from the technical assessment
2. Optimistic UI updates with rollback
3. Error rate simulation (50% for reorder, 5-10% for other operations)
4. Virtualized rendering for performance
5. Local persistence with IndexedDB

### Architecture Highlights

- **Error Simulation**: 50% error rate on job reordering to test optimistic updates
- **Database Migrations**: Uses Dexie versioning for schema evolution
- **MSW Integration**: Service worker runs in development for realistic API behavior

## 🎨 UI/UX Features

- Modern, clean interface using Mantine UI
- Responsive design with AppShell layout
- Loading states and error handling
- Debounced search (300ms delay)
- Toast notifications for save success
- Smooth drag-and-drop animations

## 🧪 Testing Considerations

The app is set up for testing with:

- Simulated network delays (200-1200ms)
- Error injection (5-10% random errors)
- Optimistic update rollback on failures

## 📝 Future Improvements

1. Add job creation/edit form
2. Implement job detail page with deep linking
3. Add comprehensive form validation including numeric ranges
4. Implement file upload functionality
5. Add @mention autocomplete suggestions
6. Add more question types (scale, matrix, etc.)
7. Export assessment responses to CSV
8. Add authentication and multi-user support
9. Real-time collaboration features

## 📄 License

This project was created as a technical assessment and is for demonstration purposes.

## 👤 Author

Navneet Singh
