// src/pages/JobsBoard.tsx

import { useState, useEffect, type ChangeEvent } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getJobs,
  reorderJobs,
  updateJobStatus,
  createJob,
  updateJob,
  type JobFormData,
  type GetJobsResponse,
  type UpdateJobParams,
  type UpdateJobStatusParams,
  type ReorderJobsParams,
} from "../api";
import {
  Alert,
  Loader,
  Paper,
  Title,
  TextInput,
  // Select, // Keep Select for now, SegmentedControl is an alternative
  Pagination,
  Stack,
  Group,
  Text,
  Button,
  Box,
  ActionIcon,
  Tooltip,
  MultiSelect,
  Grid, // Import Grid
  Badge, // Import Badge
  SegmentedControl, // Import SegmentedControl
} from "@mantine/core";
import type { IJob, JobStatus } from "../db";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, // Import arrayMove
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import JobModal from "../components/JobModal";
import {
  IconEdit,
  IconGripVertical,
  IconSearch,
  IconBriefcase,
} from "@tabler/icons-react"; // Import new icons

// --- SortableJobItem Component ---
// This is restyled to match the screenshot while keeping functionality from
interface SortableJobItemProps {
  job: IJob;
  isPendingStatus: boolean;
  variablesStatus?: UpdateJobStatusParams;
  onUpdateStatus: (data: UpdateJobStatusParams) => void;
  onEdit: (job: IJob) => void;
}

function SortableJobItem({
  job,
  isPendingStatus,
  variablesStatus,
  onUpdateStatus,
  onEdit,
}: SortableJobItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: job.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isPendingStatus && variablesStatus?.jobId === job.id ? 0.5 : 1,
    height: "100%", // Make grid items fill height
    display: "flex",
    flexDirection: "column",
  } as const;

  return (
    <Box ref={setNodeRef} style={style} {...attributes}>
      {/* Styled Paper component */}
      <Paper
        withBorder
        p="md"
        radius="md"
        shadow="sm"
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "var(--mantine-color-dark-8)",
        }}
      >
        {/* Card Header (Drag handle, Icon, Title, Status, Edit) */}
        <Group justify="space-between" mb="xs" wrap="nowrap">
          <Group
            gap="xs"
            {...listeners}
            style={{
              cursor: "grab",
              touchAction: "none",
              minWidth: 0,
              flexShr: 1,
            }}
          >
            <ActionIcon
              variant="transparent"
              color="gray.6"
              title="Drag to reorder"
            >
              <IconGripVertical size={18} stroke={1.5} />
            </ActionIcon>
            <IconBriefcase
              size={20}
              stroke={1.5}
              color="var(--mantine-color-blue-5)"
            />
            <Link
              to={`/jobs/${job.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                overflow: "hidden",
              }}
            >
              <Title
                order={5}
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {job.title}
              </Title>
            </Link>
          </Group>
          <Group gap={6} style={{ flexShr: 0 }}>
            <Badge
              size="sm"
              variant="light"
              radius="sm"
              color={job.status === "active" ? "green" : "gray"}
            >
              {job.status}
            </Badge>
            <Tooltip label="Edit Job Details">
              <ActionIcon
                variant="default"
                size="sm"
                onClick={() => onEdit(job)}
              >
                <IconEdit size={14} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* Description Placeholder */}
        <Text size="sm" c="dimmed" lineClamp={3} mt="sm">
          {job.description}
        </Text>

        {/* Metadata Placeholders */}
        <Group gap="xs" mt="md">
          <Badge variant="outline" color="gray" radius="md" p={'sm'} size="sm">
            {job.location}
          </Badge>
          <Badge variant="outline" color="gray" radius="md" p={'sm'} size="sm">
            {job.type}
          </Badge>
          <Badge variant="outline" color="gray" radius="md" p={'sm'} size="sm">
            {new Date(job.date).toLocaleDateString()}
          </Badge>
        </Group>

        {/* Key Requirements Placeholder */}
        <Box
          mt="md"
          pt="md"
          style={{ borderTop: "1px solid var(--mantine-color-dark-6)" }}
        >
          <Title order={6} mb="xs">
            Key Requirements
          </Title>
          <Text size="xs" c="dimmed">
            {job.keyRequirements}
          </Text>
        </Box>

        {/* Skills & Technologies (Uses real tags) */}
        <Box
          mt="md"
          pt="md"
          style={{ borderTop: "1px solid var(--mantine-color-dark-6)" }}
        >
          <Title order={6} mb="xs">
            Skills & Technologies
          </Title>
          <Group gap={4}>
            {job.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="light" radius="sm" size="xs">
                {" "}
                {tag}{" "}
              </Badge>
            ))}
            {job.tags.length > 3 && (
              <Badge variant="transparent" color="dimmed" radius="sm" size="xs">
                {" "}
                +{job.tags.length - 3} more{" "}
              </Badge>
            )}
            {job.tags.length === 0 && (
              <Text size="xs" c="dimmed">
                No tags
              </Text>
            )}
          </Group>
        </Box>

        {/* Action Buttons (Kept for functionality) */}
        <Group
          gap="xs"
          mt="auto"
          pt="md"
          style={{ borderTop: "1px solid var(--mantine-color-dark-6)" }}
        >
          <Button
            component={Link}
            to={`/jobs/${job.id}/responses`}
            variant="light"
            size="xs"
            color="gray"
          >
            Responses
          </Button>
          <Button
            component={Link}
            to={`/jobs/${job.id}/board`}
            variant="outline"
            size="xs"
          >
            Board
          </Button>
          <Button
            size="xs"
            variant="light"
            color={job.status === "active" ? "yellow" : "green"}
            loading={isPendingStatus && variablesStatus?.jobId === job.id}
            onClick={() =>
              onUpdateStatus({
                jobId: job.id!,
                status: job.status === "active" ? "archived" : "active",
              })
            }
          >
            {job.status === "active" ? "Archive" : "Activate"}
          </Button>
        </Group>
      </Paper>
    </Box>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function JobsBoard() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [tags, setTags] = useState<string[]>([]);
  const [page, setPage] = useState(9); // Use 9 for 3x3 grid
  const [pageSize] = useState(9); // Use 9 for 3x3 grid
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [debouncedTags] = useDebouncedValue(tags, 300);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingJob, setEditingJob] = useState<IJob | null>(null);

  const availableTags = [
    "React",
    "TypeScript",
    "Remote",
    "Node.js",
    "Python",
    "AWS",
    "Design",
    "Management",
    "Full-Stack",
    "Frontend",
    "Backend",
    "DevOps",
  ];

  const queryClient = useQueryClient();
  const queryKey = [
    "jobs",
    { search: debouncedSearch, status, tags: debouncedTags, page, pageSize },
  ];

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery<
    GetJobsResponse,
    Error
  >({
    queryKey,
    queryFn: () =>
      getJobs({
        search: debouncedSearch,
        status,
        tags: debouncedTags,
        page,
        pageSize,
      }),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, debouncedTags]);

  // --- Mutations ---
  const {
    mutate: handleUpdateStatus,
    isPending: isUpdateStatusPending,
    variables: updateStatusVariables,
  } = useMutation<IJob, Error, UpdateJobStatusParams>({
    mutationFn: updateJobStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
    onError: (err) => console.error("Failed to update status:", err.message),
  });

  // FIX: Added onMutate logic back
  const { mutate: handleReorder } = useMutation<
    { success: true },
    Error,
    ReorderJobsParams,
    { previousData?: GetJobsResponse }
  >({
    mutationFn: reorderJobs,
    onMutate: async (variables: ReorderJobsParams) => {
      const { activeId, overId } = variables;
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousData = queryClient.getQueryData<GetJobsResponse>(queryKey);
      if (previousData?.jobs) {
        const fromIndex = previousData.jobs.findIndex((j) => j.id === activeId);
        const toIndex = previousData.jobs.findIndex((j) => j.id === overId);
        if (fromIndex !== -1 && toIndex !== -1) {
          const newJobsArray = arrayMove(previousData.jobs, fromIndex, toIndex);
          queryClient.setQueryData<GetJobsResponse>(queryKey, (oldData) =>
            oldData ? { ...oldData, jobs: newJobsArray } : undefined
          );
        }
      }
      return { previousData };
    },
    onError: (
      err: Error,
      variables: ReorderJobsParams,
      context?: { previousData?: GetJobsResponse }
    ) => {
      console.error("Reorder failed, rolling back...", err.message);
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  // FIX: Added close() to onSuccess
  const { mutate: handleCreateJob, isPending: isCreating } = useMutation<
    IJob,
    Error,
    JobFormData
  >({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      close(); // Close modal
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        console.error("Mutation failed:", err.message);
      } else {
        console.error("Mutation failed:", err);
      }
    },
  });

  const { mutate: handleUpdateJob, isPending: isUpdating } = useMutation<
    IJob,
    Error,
    UpdateJobParams
  >({
    mutationFn: updateJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      close(); // Close modal
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        console.error("Mutation failed:", err.message);
      } else {
        console.error("Mutation failed:", err);
      }
    },
  });

  // --- Handlers ---
  const openCreateModal = () => {
    setEditingJob(null);
    open();
  };
  const openEditModal = (job: IJob) => {
    setEditingJob(job);
    open();
  };

  const handleFormSubmit = async (values: JobFormData): Promise<void> => {
    if (editingJob) {
      handleUpdateJob({ jobId: editingJob.id!, jobData: values });
    } else {
      handleCreateJob(values);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      handleReorder({
        activeId: active.id as number,
        overId: over.id as number,
      });
    }
  }

  if (isLoading && !isPlaceholderData)
    // Use isPlaceholderData
    return (
      <Group justify="center" mt="lg">
        <Loader />
      </Group>
    );

  if (isError)
    return (
      <Alert color="red" title="Error loading jobs">
        {" "}
        {error instanceof Error
          ? error.message
          : "An unexpected error occurred."}{" "}
      </Alert>
    );

  const jobsToShow: IJob[] = data?.jobs ?? [];
  const totalJobCount: number = data?.totalCount ?? 0;
  const startJobIndex = Math.min((page - 1) * pageSize + 1, totalJobCount);
  const endJobIndex = Math.min(page * pageSize, totalJobCount);

  return (
    <Stack gap="lg">
      {" "}
      {/* STYLED: Use Stack with gap */}
      {/* <Title order={1}>Jobs Board</Title> // Title is in Header */}
      {/* STYLED: Filter Bar */}
      <Paper p="md" radius="md" withBorder>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <TextInput
              placeholder="Search jobs by title..."
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.currentTarget.value)
              }
              leftSection={<IconSearch size={16} stroke={1.5} />}
              // clearable // Commented out as requested
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: "auto" }}>
            {/* STYLED: Status filter as SegmentedControl */}
            <SegmentedControl
              value={status}
              onChange={(value) => setStatus(value as JobStatus | "all")}
              data={[
                { label: "All Jobs", value: "all" },
                { label: "Active", value: "active" },
                { label: "Archived", value: "archived" },
              ]}
              color="blue"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: "auto" }}>
            {/* Tag filter (simplified from screenshot) */}
            <MultiSelect
              placeholder="Filter by tags"
              data={availableTags}
              value={tags}
              onChange={setTags}
              searchable
              clearable
              size="sm"
            />
          </Grid.Col>
          <Grid.Col
            span={{ base: 12, md: "auto" }}
            style={{ marginLeft: "auto" }}
          >
            <Group>
              {/* <SegmentedControl ... /> Placeholder for grid/list toggle */}
              <Button onClick={openCreateModal}>+ Create Job</Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>
      {/* STYLED: Info Bar */}
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Showing {startJobIndex} to {endJobIndex} of {totalJobCount} jobs
        </Text>
        {totalJobCount > pageSize && (
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(totalJobCount / pageSize)}
            siblings={1}
            size="sm"
            disabled={isPlaceholderData}
          />
        )}
      </Group>
      {(isLoading || isPlaceholderData) && (
        <Group justify="center" my="sm">
          <Loader size="sm" />
        </Group>
      )}
      {/* STYLED: Grid Layout for Cards */}
      <Box mt="md">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={jobsToShow.map((j) => j.id!)}
            strategy={verticalListSortingStrategy}
          >
            <Grid gutter="md">
              {jobsToShow.length > 0
                ? jobsToShow.map(
                    (
                      job: IJob // Explicit type
                    ) => (
                      <Grid.Col key={job.id} span={{ base: 12, sm: 6, lg: 4 }}>
                        <SortableJobItem
                          job={job}
                          isPendingStatus={isUpdateStatusPending}
                          variablesStatus={updateStatusVariables}
                          onUpdateStatus={handleUpdateStatus}
                          onEdit={openEditModal}
                        />
                      </Grid.Col>
                    )
                  )
                : !isLoading &&
                  !isPlaceholderData && (
                    <Grid.Col span={12}>
                      <Paper
                        p="lg"
                        withBorder
                        style={{ textAlign: "center" }}
                        mt="md"
                        radius="md"
                      >
                        <Text c="dimmed">
                          No jobs match the current filters.
                        </Text>
                      </Paper>
                    </Grid.Col>
                  )}
            </Grid>
          </SortableContext>
        </DndContext>
      </Box>
      {/* Modal */}
      <JobModal
        opened={opened}
        onClose={close}
        job={editingJob}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
      />
    </Stack>
  );
}
