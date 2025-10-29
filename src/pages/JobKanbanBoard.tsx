// src/pages/JobKanbanBoard.tsx

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getCandidatesForJob, updateCandidateStage } from '../api';
import {
  Alert,
  Loader,
  Stack,
  Text,
  Title,
  Paper,
  Group,
  Box,
} from '@mantine/core';
import {
  type CandidateStage,
  STAGES,
  type ICandidate,
} from '../db';
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core';

// --- 1. Draggable Card Component ---
function DraggableCard({ candidate }: { candidate: ICandidate }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: candidate.id!,
    data: { stage: candidate.stage },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      shadow="xs"
      p="sm"
      withBorder
    >
      <Text fw={500}>{candidate.name}</Text>
      <Text size="xs">{candidate.email}</Text>
    </Paper>
  );
}

// --- 2. Droppable Column Component ---
function DroppableColumn({
  stage,
  children,
}: {
  stage: CandidateStage;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: stage,
  });

  return (
    <Paper
      ref={setNodeRef}
      shadow="sm"
      p="md"
      withBorder
      style={{
        minWidth: 300,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Title
        order={4}
        style={{ textTransform: 'capitalize', flexShrink: 0 }}
      >
        {stage}
      </Title>

      <Box
        style={{
          flex: 1,
          overflowY: 'auto',
          marginTop: '1rem',
        }}
      >
        <Stack gap="sm">
          {children}
        </Stack>
      </Box>
    </Paper>
  );
}

// --- 3. Main Kanban Board Page ---
export default function JobKanbanBoard() {
  const { jobId } = useParams();
  const queryClient = useQueryClient();
  const queryKey = ['candidates-for-job', jobId];

  const [localCandidates, setLocalCandidates] = useState<ICandidate[]>([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKey,
    queryFn: () => getCandidatesForJob(jobId!),
    enabled: !!jobId,
  });

  useEffect(() => {
    if (data) {
      setLocalCandidates(data);
    }
  }, [data]);

  const candidatesByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = localCandidates.filter((c) => c.stage === stage);
      return acc;
    }, {} as Record<CandidateStage, ICandidate[]>);
  }, [localCandidates]);

  const { mutate: handleStageChange } = useMutation({
    mutationFn: updateCandidateStage,

    onMutate: async ({ candidateId, stage }: { candidateId: number, stage: CandidateStage }) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousCandidates = localCandidates;
      setLocalCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, stage: stage } : c
        )
      );
      return { previousCandidates };
    },

    onError: (err, variables, context) => {
      console.error('Failed to move candidate, rolling back...', err);
      if (context?.previousCandidates) {
        setLocalCandidates(context.previousCandidates);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const candidateId = active.id as number;
    const newStage = over.id as CandidateStage;
    const oldStage = active.data.current?.stage as CandidateStage;
    if (newStage === oldStage) return;
    handleStageChange({ candidateId, stage: newStage });
  }

  if (isLoading) {
    return (
      <Stack>
        <Title order={1}>Kanban Board</Title>
        <Loader />
      </Stack>
    );
  }

  // --- THIS IS THE FIX ---
  if (isError) {
    return (
      <Stack>
        <Title order={1}>Kanban Board</Title>
        <Alert title="Error!" color="red" my="md">
          There was a problem fetching candidates: {error.message}
        </Alert>
      </Stack>
    );
  }
  // --- END FIX ---

  return (
    <Stack style={{ height: 'calc(100vh - 120px)' }}>
      <Title order={1}>Kanban Board</Title>
      
      <DndContext onDragEnd={handleDragEnd}>
        <Group
          align="flex-start"
          wrap="nowrap"
          style={{ overflowX: 'auto', height: '100%' }}
        >
          {STAGES.map((stage) => (
            <DroppableColumn key={stage} stage={stage}>
              {candidatesByStage[stage].map((candidate) => (
                <DraggableCard key={candidate.id} candidate={candidate} />
              ))}
              {candidatesByStage[stage].length === 0 && (
                <Text size="sm" c="dimmed">
                  (Empty)
                </Text>
              )}
            </DroppableColumn>
          ))}
        </Group>
      </DndContext>
    </Stack>
  );
}