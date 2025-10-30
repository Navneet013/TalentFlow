// src/main.tsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme, MantineProvider } from "@mantine/core";

import "@mantine/core/styles.css"; // Import base Mantine styles

import { initializeDatabase } from "./seed.ts";
import Layout from "./components/Layout.tsx";
import JobsBoard from "./pages/JobsBoard.tsx";
import JobDetail from "./pages/JobDetail.tsx";
import CandidatesList from "./pages/CandidatesList.tsx";
import JobKanbanBoard from "./pages/JobKanbanBoard.tsx";
import CandidateProfile from "./pages/CandidateProfile.tsx";
import AssessmentBuilder from "./pages/AssessmentBuilder.tsx";
import TakeAssessment from "./pages/TakeAssessment.tsx";
import AssessmentResponses from "./pages/AssessmentResponses.tsx";
import AssessmentList from "./pages/AssessmentList.tsx";
import Dashboard from "./pages/Dashboard.tsx";

// Theme (Dark Mode)
const theme = createTheme({
  colors: {
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#1A1B1E",
      "#141517",
      "#101113",
    ],
    blue: [
      "#e7f5ff",
      "#d0ebff",
      "#a5d8ff",
      "#74c0fc",
      "#4dabf7",
      "#339af0",
      "#228be6",
      "#1c7ed6",
      "#1971c2",
      "#1864ab",
    ],
  },
  primaryColor: "blue",
  defaultRadius: "md",
  // colorScheme: 'dark', // Let defaultColorScheme handle this
});

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> }, // Redirect root to /jobs
      { path: "dashboard", element: <Dashboard /> },
      { path: "jobs", element: <JobsBoard /> },
      { path: "jobs/:jobId", element: <JobDetail /> }, // Job Detail route [cite: 12]
      { path: "jobs/:jobId/board", element: <JobKanbanBoard /> }, // Kanban board per job [cite: 18]
      { path: "jobs/:jobId/assessment", element: <AssessmentBuilder /> }, // Assessment builder per job [cite: 22]
      { path: "jobs/:jobId/responses", element: <AssessmentResponses /> }, // View responses per job
      { path: "candidates", element: <CandidatesList /> }, // Candidate list [cite: 15]
      { path: "candidates/:id", element: <CandidateProfile /> }, // Candidate profile [cite: 17]
      { path: "assessments", element: <AssessmentList /> }, // Assessments List route
    ],
  },
  { path: "/assessment/:jobId/take", element: <TakeAssessment /> }, // Standalone assessment taking page [cite: 25]
]);

// Function to prepare MSW (only in development)
// async function prepareApp() {
//   if (import.meta.env.DEV) {
//     const { worker } = await import('./mocks/browser.ts');
//     // Start MSW with specific options [cite: 27, 45]
//     await worker.start({ onUnhandledRequest: 'bypass' });
//   }
// }

async function prepareApp() {
  // The "if" check is REMOVED.
  const { worker } = await import("./mocks/browser.ts");
  // Start MSW always [cite: 27, 45]
  await worker.start({ onUnhandledRequest: "bypass" });
}

// Main function to start the app
async function startApp() {
  await prepareApp(); // Start MSW if needed
  await initializeDatabase(); // Initialize and seed Dexie [cite: 42, 44]

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* Apply theme and set default color scheme */}
      <MantineProvider theme={theme} defaultColorScheme="dark">
        {" "}
        {/* Use dark theme */}
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>
  );
}

startApp(); // Run the start function
