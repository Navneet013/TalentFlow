// src/components/Layout.tsx

import {
  AppShell,
  Group,
  Title,
  NavLink,
  Avatar,
  Text,
  Box,
} from '@mantine/core';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  IconBriefcase,
  IconUsers,
  IconUserCircle,
  IconFileText,
} from '@tabler/icons-react';

export default function Layout() {
  const location = useLocation(); // Hook to get current path

  // Helper to determine if a NavLink is active
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm', // Collapse on small screens
      }}
      padding="md"
    >
      {/* Header Bar - Dark Theme */}
      <AppShell.Header bg="dark.8" style={{ borderBottom: '1px solid var(--mantine-color-dark-6)' }}>
        <Group h="100%" px="md">
          {/* Link title back to jobs board */}
          <Link to="/jobs" style={{ textDecoration: 'none' }}>
            <Title order={2} c="blue.5">
              TalentFlow
            </Title>
          </Link>
        </Group>
      </AppShell.Header>

      {/* Sidebar Navigation - Dark Theme with White Text */}
      <AppShell.Navbar p="md" bg="dark.9" style={{ borderRight: '1px solid var(--mantine-color-dark-7)' }}>
        <Box style={{ flex: 1 }}>
          {/* Jobs Link */}
          <NavLink
            label="Jobs Board"
            component={Link}
            to="/jobs"
            leftSection={<IconBriefcase size="1rem" stroke={1.5} />}
            c="gray.0" // White text
            active={isActive('/jobs')} // Highlight if path starts with /jobs
            variant="light" // Use light variant for subtle active state
            color="blue"    // Use primary blue for active color
            styles={{ root: { borderRadius: 'md', marginBottom: 4 } }}
          />
          {/* Candidates Link */}
          <NavLink
            label="Candidates"
            component={Link}
            to="/candidates"
            leftSection={<IconUsers size="1rem" stroke={1.5} />}
            c="gray.0" // White text
            active={isActive('/candidates')}
            variant="light"
            color="blue"
            styles={{ root: { borderRadius: 'md', marginBottom: 4 } }}
          />
          {/* Assessments Link */}
           <NavLink
            label="Assessments"
            component={Link}
            to="/assessments"
            leftSection={<IconFileText size="1rem" stroke={1.5} />}
            c="gray.0" // White text
            active={isActive('/assessments')}
            variant="light"
            color="blue"
            styles={{ root: { borderRadius: 'md' } }}
          />
        </Box>

        {/* User Profile Area */}
        <Box p="sm" style={{ borderTop: '1px solid var(--mantine-color-dark-7)' }}>
          <Group>
            <Avatar color="blue.6" variant="filled">
              <IconUserCircle />
            </Avatar>
            <div>
              {/* White text for name */}
              <Text c="gray.0" fw={500} size="sm">
                Navneet Singh
              </Text>
            </div>
          </Group>
        </Box>
      </AppShell.Navbar>

      {/* Main Content Area - Slightly lighter dark background */}
      <AppShell.Main bg="dark.7">
        <Outlet /> {/* Renders the matched page component */}
      </AppShell.Main>
    </AppShell>
  );
}