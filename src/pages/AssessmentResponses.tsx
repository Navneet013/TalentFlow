// src/pages/AssessmentResponses.tsx

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getAssessmentResponses } from '../api';
import {
  Alert,
  Loader,
  Stack,
  Text,
  Title,
  Paper,
  Code,
} from '@mantine/core';

export default function AssessmentResponses() {
  const { jobId } = useParams();

  const {
    data: responses,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assessment-responses', jobId],
    // --- THIS IS THE FIX: Removed the stray underscore ---
    queryFn: () => getAssessmentResponses(jobId!),
    // --- END FIX ---
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <Stack>
        <Title order={1}>Assessment Responses</Title>
        <Loader />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack>
        <Title order={1}>Assessment Responses</Title>
        <Alert title="Error!" color="red" my="md">
          There was a problem fetching responses: {error.message}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={1}>Assessment Responses</Title>
      <Text>Job ID: {jobId}</Text>
      
      {responses && responses.length === 0 && (
        <Paper p="lg" withBorder>
          <Text>No responses submitted for this job yet.</Text>
        </Paper>
      )}

      {responses?.map((response) => (
        <Paper key={response.id} withBorder shadow="sm" p="md">
          <Text fw={500}>Response {response.id}</Text>
          <Text size="sm" c="dimmed">
            Submitted on: {new Date(response.submittedAt).toLocaleString()}
          </Text>
          
          {/* Display the raw JSON response data */}
          <Code block mt="md">
            {JSON.stringify(response.responseData, null, 2)}
          </Code>
        </Paper>
      ))}
    </Stack>
  );
}