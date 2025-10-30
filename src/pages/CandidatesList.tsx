import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCandidates, updateCandidateStage } from "../api";
import Box from "@mui/material/Box";
import {
  Alert,
  Loader,
  Paper,
  Title,
  TextInput,
  Select,
  Stack,
  Group,
  Text,
  SegmentedControl,
} from "@mantine/core";
import { type CandidateStage, STAGES, type ICandidate } from "../db";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Link } from "react-router-dom";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { IconLayoutKanban, IconList } from "@tabler/icons-react";

// --- Draggable Card Component (For Kanban) ---
function DraggableCard({ candidate }: { candidate: ICandidate }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    // Use candidate ID as the unique ID for dragging
    id: candidate.id!,
    // Pass current stage in data payload for drag end logic
    data: { stage: candidate.stage },
  });

  // Apply transform styles for dragging effect
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100, // Ensure dragged item is on top
        cursor: "grabbing", // Change cursor while dragging
      }
    : { cursor: "grab" }; // Default grab cursor

  return (
    // Apply draggable props and styles to the Paper component
    <Paper
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      shadow="xs"
      p="sm"
      withBorder
      radius="sm"
    >
      <Text fw={500}>{candidate.name}</Text>
      <Text size="xs" c="dimmed">
        {candidate.email}
      </Text>
    </Paper>
  );
}

// --- Droppable Column Component (For Kanban) ---
function DroppableColumn({
  stage,
  children,
}: {
  stage: CandidateStage;
  children: React.ReactNode;
}) {
  // Make the entire column a droppable area, identified by the stage name
  const { setNodeRef } = useDroppable({ id: stage });

  return (
    <Paper
      ref={setNodeRef} // Assign ref for dnd-kit
      shadow="sm"
      p="md"
      withBorder
      radius="md"
      style={{
        width: 300, // Fixed column width
        flexShrink: 0, // Prevent shrinking in the flex container
        height: "100%", // Fill available vertical space
        display: "flex",
        flexDirection: "column", // Stack title and content vertically
        backgroundColor: "var(--mantine-color-dark-8)", // Background color for the column
      }}
    >
      {/* Column Title */}
      <Title
        order={4}
        style={{
          textTransform: "capitalize",
          flexShrink: 0,
          marginBottom: "var(--mantine-spacing-md)",
        }}
      >
        {stage}
      </Title>
      {/* Scrollable container for cards */}
      <Box
        style={{
          flex: 1,
          overflowY: "auto", // Keep scroll working
          paddingRight: "4px",
          scrollbarWidth: "none", // Hide scrollbar (Firefox)
          msOverflowStyle: "none", // Hide scrollbar (old Edge)
        }}
        sx={{
          "&::-webkit-scrollbar": { display: "none" }, // Hide scrollbar (Chrome, Safari)
        }}
      >
        <Stack gap="sm">
          {children} {/* Render DraggableCard components here */}
        </Stack>
      </Box>
    </Paper>
  );
}

// --- Main Candidates Page Component ---
export default function CandidatesList() {
  // State for toggling between list and kanban views
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  // State for stage filter (used only in list view)
  const [stageFilter, setStageFilter] = useState<CandidateStage | "all">("all");
  // State for search input (used in both views)
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();
  // Query key to fetch all candidates (used by both views)
  const queryKey = ["candidates", { stage: "all" }];

  // Local state copy of candidates for optimistic updates in Kanban view
  const [localKanbanCandidates, setLocalKanbanCandidates] = useState<
    ICandidate[]
  >([]);

  // Fetch ALL candidates using React Query
  const {
    data: allCandidates,
    isLoading,
    isError,
    error,
  } = useQuery<ICandidate[], Error>({
    queryKey: queryKey,
    queryFn: () => getCandidates({ stage: "all" }), // API call to get all
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });

  // Effect to update local Kanban state when fetched data changes
  useEffect(() => {
    if (allCandidates) {
      setLocalKanbanCandidates(allCandidates);
    }
  }, [allCandidates]);

  // --- List View Logic ---
  const listParentRef = useRef<HTMLDivElement>(null); // Ref for virtualizer scroll element

  // Memoized calculation for candidates filtered for the list view
  const filteredListCandidates = useMemo(() => {
    if (!allCandidates) return [];
    let list = allCandidates;
    // Apply stage filter if not 'all'
    if (stageFilter !== "all") {
      list = list.filter((c) => c.stage === stageFilter);
    }
    // Apply search filter if search term exists
    if (search) {
      const lowerSearch = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.email.toLowerCase().includes(lowerSearch)
      );
    }
    return list;
  }, [allCandidates, search, stageFilter]); // Dependencies: run when these change

  // Setup virtualizer for the list view
  const listRowVirtualizer = useVirtualizer({
    count: filteredListCandidates.length, // Number of items to virtualize
    getScrollElement: () => listParentRef.current, // Function to get scroll container element
    estimateSize: () => 75, // Estimated height of each list item
    overscan: 10, // Render extra items above/below viewport for smoother scrolling
  });
  // --- End List View Logic ---

  // --- Kanban View Logic ---
  // Memoized calculation grouping candidates by stage for Kanban columns
  const candidatesByStage = useMemo(() => {
    let filtered = localKanbanCandidates; // Start with local state for optimistic updates
    // Apply search filter if search term exists
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.email.toLowerCase().includes(lowerSearch)
      );
    }
    // Group the filtered candidates into an object keyed by stage
    return STAGES.reduce((acc, stage) => {
      acc[stage] = filtered.filter((c) => c.stage === stage);
      return acc;
    }, {} as Record<CandidateStage, ICandidate[]>);
  }, [localKanbanCandidates, search]); // Dependencies: run when local state or search changes

  // Memoized calculation for the total number of candidates shown in Kanban (after search)
  const kanbanTotalShown = useMemo(
    () =>
      Object.values(candidatesByStage).reduce(
        (sum, arr) => sum + arr.length,
        0
      ),
    [candidatesByStage]
  ); // Dependency: run when grouped candidates change
  // --- End Kanban View Logic ---

  // --- Mutation for Stage Change (with Optimistic Update) ---
  const { mutate: handleStageChange } = useMutation<
    ICandidate, // Type returned by mutationFn on success
    Error, // Type of error thrown on failure
    { candidateId: number; stage: CandidateStage }, // Type of variables passed to mutate()
    { previousCandidates?: ICandidate[] } // Type of context object returned from onMutate
  >({
    mutationFn: updateCandidateStage, // The API function to call
    // onMutate runs *before* the mutation function
    onMutate: async ({ candidateId, stage }) => {
      // Cancel any outgoing refetches for this query key to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKey });
      // Snapshot the previous value of local Kanban state
      const previousCandidates = localKanbanCandidates;
      // Optimistically update the local Kanban state
      setLocalKanbanCandidates((prev) =>
        prev.map(
          (c) => (c.id === candidateId ? { ...c, stage: stage } : c) // Update stage for the matched candidate
        )
      );
      // Optimistically update the main query cache as well
      queryClient.setQueryData<ICandidate[]>(
        queryKey,
        (oldData) =>
          oldData?.map((c) =>
            c.id === candidateId ? { ...c, stage: stage } : c
          ) ?? []
      );
      // Return context object with the snapshot
      return { previousCandidates };
    },
    // onError runs if the mutation function throws an error
    onError: (err, variables, context) => {
      console.error("Failed to move candidate, rolling back...", err.message);
      // Rollback local Kanban state using the snapshot from context
      if (context?.previousCandidates) {
        setLocalKanbanCandidates(context.previousCandidates);
        // Rollback query cache too
        queryClient.setQueryData(queryKey, context.previousCandidates);
      }
      // TODO: Add user notification (e.g., Toast) about the failure
    },
    // onSettled runs after the mutation succeeds or fails
    onSettled: () => {
      // Always refetch the data to ensure consistency with the "server" (Dexie)
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  // --- DragEnd Handler (For Kanban View) ---
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event; // Get the active (dragged) and over (dropped on) elements

    // If not dropped onto a valid droppable area, do nothing
    if (!over || !active) return;

    const candidateId = Number(active.id); // Draggable ID is candidate.id (string), convert to number
    const newStage = over.id as CandidateStage; // Droppable ID is stage name (string)

    // Find the candidate from local state to get the old stage
    const candidate = localKanbanCandidates.find((c) => c.id === candidateId);
    if (!candidate) return; // Should not happen if state is synced
    const oldStage = candidate.stage;

    // If dropped onto a different column, trigger the mutation
    if (newStage !== oldStage) {
      handleStageChange({ candidateId, stage: newStage });
    }
  }

  // --- Render Logic ---
  // Loading state
  if (isLoading)
    return (
      <Group justify="center" mt="xl">
        <Loader />
      </Group>
    );
  // Error state
  if (isError)
    return (
      <Alert color="red" title="Error loading candidates">
        {error.message}
      </Alert>
    );

  // Main component layout
  return (
    <Stack style={{ height: `calc(100vh - 160px)` }}>
      {" "}
      {/* Adjust height dynamically */}
      {/* Header: Title and View Toggle */}
      <Group justify="space-between">
        <Title order={1}>Candidates</Title>
        <SegmentedControl
          style={{ width: "200px" }}
          value={viewMode}
          onChange={(value) => setViewMode(value as "list" | "kanban")}
          data={[
            {
              label: (
                <Group gap="xs" justify="center">
                  <IconList size={16} />
                  <Text size="sm">List</Text>
                </Group>
              ),
              value: "list",
            },
            {
              label: (
                <Group gap="xs" justify="center">
                  <IconLayoutKanban size={16} />
                  <Text size="sm">Kanban</Text>
                </Group>
              ),
              value: "kanban",
            },
          ]}
        />
      </Group>
      {/* Filters Group: Search always visible, Stage filter only for list */}
      <Group>
        <TextInput
          placeholder="Search by name or email..."
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearch(event.currentTarget.value)
          }
          style={{ flex: 1 }}
          // clearable
        />
        {viewMode === "list" && (
          <Select
            placeholder="Filter by stage"
            value={stageFilter}
            onChange={(value) =>
              setStageFilter(value as CandidateStage | "all")
            }
            data={[
              { label: "All Stages", value: "all" },
              // Dynamically generate stage options from STAGES constant
              ...STAGES.map((s) => ({
                label: s.charAt(0).toUpperCase() + s.slice(1),
                value: s,
              })),
            ]}
            clearable={false} // Stage filter should always have a value
            style={{ width: 180 }} // Fixed width for stage filter
          />
        )}
      </Group>
      {/* Conditional Rendering: List View or Kanban View */}
      {viewMode === "list" ? (
        // --- List View ---
        <>
          <Text size="sm" c="dimmed">
            Showing {filteredListCandidates.length} candidate(s)
          </Text>
          {/* Scroll container for virtualized list */}
          <Box
            ref={listParentRef}
            style={{
              flexGrow: 1,
              overflow: "auto", // Keep scroll working
              scrollbarWidth: "none", // Hide scrollbar (Firefox)
              msOverflowStyle: "none", // Hide scrollbar (old Edge)
            }}
            sx={{
              "&::-webkit-scrollbar": { display: "none" }, // Hide scrollbar (Chrome, Safari)
            }}
          >
            {/* Inner container with total height for virtualizer */}
            <Box
              style={{
                height: `${listRowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {/* Render only the virtual items */}
              {listRowVirtualizer.getVirtualItems().map((virtualItem) => {
                const candidate = filteredListCandidates[virtualItem.index];
                // Ensure candidate exists before rendering
                if (!candidate) return null;
                return (
                  <Box
                    key={virtualItem.key} // Key for React reconciliation
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`, // Height determined by virtualizer
                      transform: `translateY(${virtualItem.start}px)`, // Position determined by virtualizer
                      padding: "4px 0", // Vertical padding for spacing
                    }}
                  >
                    {/* Link each list item to the candidate's profile page */}
                    <Link
                      to={`/candidates/${candidate.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Paper shadow="xs" p="sm" withBorder radius="sm">
                        <Group justify="space-between" wrap="nowrap">
                          {" "}
                          {/* Use wrap="nowrap" */}
                          <Box>
                            <Title order={5}>{candidate.name}</Title>
                            <Text size="xs" c="dimmed">
                              {candidate.email} | Stage: {candidate.stage}
                            </Text>
                          </Box>
                          {/* Removed candidate.experience */}
                        </Group>
                      </Paper>
                    </Link>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </>
      ) : (
        // --- Kanban View ---
        <>
          <Text size="sm" c="dimmed">
            Showing {kanbanTotalShown} candidate(s) matching search
          </Text>
          {/* Drag and Drop context for Kanban */}
          <DndContext onDragEnd={handleDragEnd}>
            {/* Horizontally scrolling container for columns */}
            <Group
              align="stretch" // Columns fill height
              wrap="nowrap" // Prevent wrapping
              gap="md"
              style={{
                overflowX: "auto",
                height: "100%",
                paddingBottom: "10px",
                WebkitOverflowScrolling: "touch", // For smooth scrolling on mobile
                scrollbarWidth: "thin",
              }} // Allow horizontal scroll
            >
              {/* Map through STAGES to create a column for each */}
              {STAGES.map((stage) => (
                <DroppableColumn key={stage} stage={stage}>
                  {/* Map through candidates for the current stage */}
                  {candidatesByStage[stage]?.map((candidate) => (
                    <DraggableCard key={candidate.id} candidate={candidate} />
                  ))}
                  {/* Show empty state message if no candidates in this stage */}
                  {(!candidatesByStage[stage] ||
                    candidatesByStage[stage].length === 0) && (
                    <Text size="sm" c="dimmed" ta="center" mt="md">
                      (Empty)
                    </Text>
                  )}
                  {/* Optional: Show count per column */}
                  {candidatesByStage[stage]?.length > 0 && (
                    <Text size="xs" c="dimmed" ta="center" mt="sm">
                      {candidatesByStage[stage].length} candidate(s)
                    </Text>
                  )}
                </DroppableColumn>
              ))}
            </Group>
          </DndContext>
        </>
      )}
    </Stack>
  );
}
