// src/pages/CandidateProfile.tsx

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCandidateDetails,
  getCandidateTimeline,
  addCandidateNote,
} from '../api';
import {
  Alert,
  Loader,
  Stack,
  Text,
  Title,
  Paper,
  Group,
  Timeline,
  Textarea,
  Button,
  Highlight,
  Box,
} from '@mantine/core';

export default function CandidateProfile() {
  const { id } = useParams();
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  // 1. Fetch candidate's personal details
  const {
    data: candidate,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
    error: errorDetails,
  } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => getCandidateDetails(id!),
    enabled: !!id,
  });

  // 2. Fetch candidate's timeline
  const {
    data: timeline,
    isLoading: isLoadingTimeline,
    isError: isErrorTimeline,
    error: errorTimeline,
  } = useQuery({
    queryKey: ['candidate-timeline', id],
    queryFn: () => getCandidateTimeline(id!),
    enabled: !!id,
  });

  // 3. Mutation for adding a note
  const { mutate: handleAddNote, isPending: isAddingNote } = useMutation({
    mutationFn: addCandidateNote,
    onSuccess: () => {
      // Refresh the timeline
      queryClient.invalidateQueries({ queryKey: ['candidate-timeline', id] });
      setNote(''); // Clear the textarea
    },
  });

  // 4. Handle submit
  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !id) return;
    handleAddNote({ candidateId: id, note });
  };

  // --- Render States ---
  if (isLoadingDetails) {
    return <Loader />;
  }

  if (isErrorDetails) {
    return (
      <Alert title="Error!" color="red">
        Could not load candidate: {errorDetails.message}
      </Alert>
    );
  }

  return (
    <Stack>
      <Title order={1}>{candidate?.name}</Title>
      <Text c="dimmed">{candidate?.email}</Text>

      <Group align="flex-start" mt="xl">
        {/* Left Side: Timeline */}
        <Box style={{ flex: 2 }}>
          <Title order={3} mb="md">
            Timeline
          </Title>
          {isLoadingTimeline && <Loader />}
          {isErrorTimeline && (
            <Alert title="Error!" color="red">
              Could not load timeline: {errorTimeline.message}
            </Alert>
          )}
          <Timeline active={0} bulletSize={18} lineWidth={2}>
            {timeline?.map((event) => (
              <Timeline.Item
                key={event.id}
                title={event.type === 'note' ? 'Note Added' : 'Stage Changed'}
              >
                <Paper shadow="xs" p="sm" withBorder>
                  {event.type === 'note' ? (
                    // Use Highlight for @mentions
                    <Highlight highlight="@">
                      {event.content}
                    </Highlight>
                  ) : (
                    <Text>
                      Moved to{' '}
                      <Text span fw={700} style={{ textTransform: 'capitalize' }}>
                        {event.content}
                      </Text>
                    </Text>
                  )}
                </Paper>
                <Text size="xs" c="dimmed" mt={4}>
                  {new Date(event.timestamp).toLocaleString()}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </Box>

        {/* Right Side: Add Note */}
        <Paper
          shadow="sm"
          p="md"
          withBorder
          style={{ flex: 1, position: 'sticky', top: 20 }}
        >
          <form onSubmit={handleSubmitNote}>
            <Stack>
              <Title order={4}>Add a Note</Title>
              <Textarea
                placeholder="Type @ to mention..."
                rows={5}
                value={note}
                onChange={(e) => setNote(e.currentTarget.value)}
                required
              />
              <Button type="submit" loading={isAddingNote}>
                Save Note
              </Button>
            </Stack>
          </form>
        </Paper>
      </Group>
    </Stack>
  );
}