import {
  AppShell,
  Group,
  Title,
  NavLink,
  Avatar,
  Text,
  Box,
  Burger,
  Drawer,
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  IconBriefcase,
  IconUsers,
  IconUserCircle,
  IconFileText,
  IconChartBar,
} from "@tabler/icons-react";

export default function Layout() {
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  // Reusable nav links component
  const navLinks = (
    <Box style={{ flex: 1 }}>
      <NavLink
        label="Dashboard"
        component={Link}
        to="/dashboard"
        leftSection={<IconChartBar size="1rem" stroke={1.5} />}
        c="gray.0"
        active={isActive("/dashboard")}
        variant="light"
        color="blue"
        styles={{ root: { borderRadius: "md", marginBottom: 4 } }}
        onClick={close}
      />
      <NavLink
        label="Jobs Board"
        component={Link}
        to="/jobs"
        leftSection={<IconBriefcase size="1rem" stroke={1.5} />}
        c="gray.0"
        active={isActive("/jobs")}
        variant="light"
        color="blue"
        styles={{ root: { borderRadius: "md", marginBottom: 4 } }}
        onClick={close}
      />
      <NavLink
        label="Candidates"
        component={Link}
        to="/candidates"
        leftSection={<IconUsers size="1rem" stroke={1.5} />}
        c="gray.0"
        active={isActive("/candidates")}
        variant="light"
        color="blue"
        styles={{ root: { borderRadius: "md", marginBottom: 4 } }}
        onClick={close}
      />
      <NavLink
        label="Assessments"
        component={Link}
        to="/assessments"
        leftSection={<IconFileText size="1rem" stroke={1.5} />}
        c="gray.0"
        active={isActive("/assessments")}
        variant="light"
        color="blue"
        styles={{ root: { borderRadius: "md" } }}
        onClick={close}
      />
    </Box>
  );

  const userProfile = (
    <Box p="sm" style={{ borderTop: "1px solid var(--mantine-color-dark-7)" }}>
      <Group>
        <Avatar color="blue.6" variant="filled">
          <IconUserCircle />
        </Avatar>
        <div>
          <Text c="gray.0" fw={500} size="sm">
            Navneet Singh
          </Text>
        </div>
      </Group>
    </Box>
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: true }, // hides sidebar on small screens
      }}
      padding="md"
    >
      {/* HEADER */}
      <AppShell.Header
        bg="dark.8"
        style={{ borderBottom: "1px solid var(--mantine-color-dark-6)" }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Burger visible on mobile */}
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="blue.4"
            />
            <Link to="/jobs" style={{ textDecoration: "none" }}>
              <Title order={2} c="blue.5">
                TalentFlow
              </Title>
            </Link>
          </Group>
        </Group>
      </AppShell.Header>

      {/* SIDEBAR (Desktop only) */}
      <AppShell.Navbar
        p="md"
        bg="dark.9"
        style={{ borderRight: "1px solid var(--mantine-color-dark-7)" }}
      >
        {navLinks}
        {userProfile}
      </AppShell.Navbar>

      {/* DRAWER (Mobile) */}
      <Drawer
        opened={opened}
        onClose={close}
        size="250"
        padding="md"
        hiddenFrom="sm"
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        styles={{
          content: { backgroundColor: "var(--mantine-color-dark-9)" },
        }}
      >
        <ScrollArea h="100%">
          {navLinks}
          {userProfile}
        </ScrollArea>
      </Drawer>

      {/* MAIN CONTENT */}
      <AppShell.Main bg="dark.7">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
