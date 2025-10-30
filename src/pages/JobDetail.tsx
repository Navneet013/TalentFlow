// src/pages/JobDetail.tsx

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getJobDetails } from '../api'; // Use the API function
import {
  Alert,
  Loader,
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  Badge,
  Container,
  Grid,
  List,
  ThemeIcon,
  ActionIcon, 
  Tooltip,  
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBriefcase,
  IconUsers,
  IconFileText,
  IconCheck,
  IconExternalLink, 
} from '@tabler/icons-react';

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const { data: job, isLoading, isError, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobDetails(jobId!), // Use API function
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader />
      </Container>
    );
  }

  if (isError || !job) {
    return (
      <Container size="lg" py="xl">
        <Group mb="md">
           <ActionIcon onClick={() => navigate('/jobs')} variant="subtle" size="lg">
               <IconArrowLeft />
           </ActionIcon>
           <Title order={3}>Error</Title>
        </Group>
        <Alert color="red" title="Not Found">
          Could not load job details. Error: {error?.message || 'Job not found.'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl"> {/* Add more gap */}
        {/* Header */}
        <Group>
           <Tooltip label="Back to Jobs List">
               <ActionIcon onClick={() => navigate('/jobs')} variant="light" size="lg">
                   <IconArrowLeft />
               </ActionIcon>
           </Tooltip>
           <Title order={2} style={{ flexGrow: 1 }}>Job Details</Title> {/* Adjusted title size */}
        </Group>

        {/* Job Title Card */}
        <Paper shadow="sm" p="xl" withBorder radius="md">
          <Stack>
            <Group justify="space-between" align="flex-start">
              <div>
                <Title order={1}>{job.title}</Title>
                <Text c="dimmed" mt="xs" size="sm">
                  Slug: <code>{job.slug}</code>
                </Text>
              </div>
              <Badge
                size="lg"
                color={job.status === 'active' ? 'green' : 'gray'} // Use gray for archived
                variant="light" // Use light variant
                radius="sm"
              >
                {job.status}
              </Badge>
            </Group>

            {job.tags.length > 0 && (
              <Group mt="sm" gap="xs"> {/* Smaller gap for tags */}
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="outline" color="blue" radius="sm">
                    {tag}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        </Paper>

        {/* Quick Actions Card */}
        <Paper shadow="sm" p="lg" withBorder radius="md">
          <Title order={4} mb="md">
            Quick Actions
          </Title>
          <Grid grow> {/* Use grow for equal width columns */}
            <Grid.Col span={{ base: 12, sm: 4 }}> {/* Responsive columns */}
              <Button component={Link} to={`/jobs/${job.id}/board`} variant="light" fullWidth leftSection={<IconUsers size="1rem" />}>
                View Kanban Board
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Button component={Link} to={`/jobs/${job.id}/assessment`} variant="light" fullWidth leftSection={<IconFileText size="1rem" />}>
                Manage Assessment
              </Button>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Button component={Link} to={`/jobs/${job.id}/responses`} variant="light" fullWidth leftSection={<IconBriefcase size="1rem" />}>
                View Responses
              </Button>
            </Grid.Col>
            {/* Link to Take Assessment */}
             <Grid.Col span={{ base: 12, sm: 4 }}>
               <Button component="a" href={`/assessment/${job.id}/take`} target="_blank" variant="outline" fullWidth leftSection={<IconExternalLink size="1rem" />}>
                 Take Assessment (Link)
               </Button>
             </Grid.Col>
          </Grid>
        </Paper>

        {/* Job Information Card */}
        <Paper shadow="sm" p="lg" withBorder radius="md">
          <Title order={4} mb="md">
            Job Information
          </Title>
          <List
            spacing="xs"
            size="sm"
            center
            icon={
              <ThemeIcon color="blue" size={20} radius="xl">
                <IconCheck size={12} stroke={3} />
              </ThemeIcon>
            }
          >
            <List.Item><Text span fw={500}>Job ID: </Text>{job.id}</List.Item>
            <List.Item>
              <Text span fw={500}>Status: </Text>
              <Badge color={job.status === 'active' ? 'green' : 'gray'} variant="light" size="sm" radius="sm">
                {job.status}
              </Badge>
            </List.Item>
            <List.Item><Text span fw={500}>Order: </Text>{job.order}</List.Item>
            <List.Item><Text span fw={500}>Tags: </Text>{job.tags.join(', ') || <Text span c="dimmed">No tags</Text>}</List.Item>
          </List>
        </Paper>
      </Stack>
    </Container>
  );
}