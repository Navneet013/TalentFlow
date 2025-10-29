import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAssessment, getAllAssessments } from '../api';
import { Link } from 'react-router-dom';
import {
  Alert,
  Loader,
  Stack,
  Text,
  Title,
  Paper,
  Group,
  Button,
  Pill,
} from '@mantine/core';
import type { AssessmentState } from './AssessmentBuilder'; // Import type if needed

export default function AssessmentList() {
  const queryClient = useQueryClient();
  const {
    data: assessments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assessments'],
    queryFn: getAllAssessments,
  });

 const deleteMutation = useMutation({
    mutationFn: deleteAssessment,
    onSuccess: () => {
      // Invalidate and refetch assessments after deletion
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    },
  });

  const onDeletionHandler = async (assessmentId: number) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      deleteMutation.mutate(assessmentId);
    }
  };

  if (isLoading) return <Loader />;
  if (isError) return <Alert color="red">Error loading assessments: {error.message}</Alert>;

  return (
    <Stack>
      <Title order={1}>Assessments</Title>
      <Text c="dimmed">List of all created assessments.</Text>

      {assessments && assessments.length === 0 && (
          <Paper p="lg" withBorder mt="md">
              <Text>No assessments have been created yet.</Text>
          </Paper>
      )}

      {assessments?.map((assessment) => {
        // Attempt to safely access the title from the builderState
        const assessmentTitle =
          (assessment.builderState as AssessmentState)?.title ||
          `Assessment for Job ${assessment.jobId}`;

        return (
          <Paper key={assessment.id} withBorder  shadow="md" p="xl" radius="md">
            <Group justify="space-between">
              <div>
                <Title order={3}>{assessmentTitle}</Title>
                <Pill  style={{ backgroundColor: '#124107ff', borderRadius: 999 }}>Job ID: {assessment.jobId}</Pill>
              </div>
            <Group style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <Button
                component={Link}
                to={`/jobs/${assessment.jobId}/assessment`} // Link to the builder
                variant="light"
                size="md"
              >
                Edit
              </Button>
               <Button
                  color="red"
                  variant="outline"
                  size="md"
                  onClick={() => onDeletionHandler(Number(assessment.id))}
                >
                  Delete
                </Button>
            </Group>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}