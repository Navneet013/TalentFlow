// src/pages/AssessmentBuilder.tsx
import { useEffect, useState, type Dispatch } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useImmerReducer } from 'use-immer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAssessment, updateAssessment } from '../api';
import {
    Alert, Loader, Stack, Text, Title, Paper, Group, Button, Grid,
    TextInput, Select, Textarea, Radio, Checkbox, NumberInput, Switch
} from '@mantine/core';
import { v4 as uuidv4 } from 'uuid';
import { type IAssessment } from '../db';

// --- State Shape ---
export type QuestionType =
  | 'single-choice' | 'multi-choice' | 'short-text'
  | 'long-text' | 'numeric' | 'file-upload';
export interface QuestionOption { id: string; text: string; }
export interface AssessmentQuestion {
    id: string; text: string; type: QuestionType; options: QuestionOption[];
    required?: boolean; maxLength?: number; min?: number; max?: number;
}
export interface AssessmentSection { id: string; title: string; questions: AssessmentQuestion[]; }
export interface AssessmentState { title: string; sections: AssessmentSection[]; }

const QUESTION_TYPES: { label: string; value: QuestionType }[] = [
    { label: 'Single Choice', value: 'single-choice' },
    { label: 'Multi Choice', value: 'multi-choice' },
    { label: 'Short Text', value: 'short-text' },
    { label: 'Long Text', value: 'long-text' },
    { label: 'Numeric', value: 'numeric' },
    { label: 'File Upload', value: 'file-upload' },
];

// --- Reducer Actions ---
type Action =
    | { type: 'SET_STATE'; payload: AssessmentState }
    | { type: 'UPDATE_TITLE'; payload: string }
    | { type: 'ADD_SECTION' } // No payload
    | { type: 'UPDATE_SECTION_TITLE'; payload: { sIndex: number; title: string } }
    | { type: 'ADD_QUESTION'; payload: { sIndex: number; type: QuestionType } }
    | { type: 'UPDATE_QUESTION_TEXT'; payload: { sIndex: number; qIndex: number; text: string } }
    | { type: 'UPDATE_QUESTION_TYPE'; payload: { sIndex: number; qIndex: number; type: QuestionType } }
    | { type: 'ADD_OPTION'; payload: { sIndex: number; qIndex: number } }
    | { type: 'UPDATE_OPTION'; payload: { sIndex: number; qIndex: number; oIndex: number; text: string } }
    | { type: 'UPDATE_QUESTION_REQUIRED'; payload: { sIndex: number; qIndex: number; required: boolean } }
    | { type: 'UPDATE_QUESTION_MAXLENGTH'; payload: { sIndex: number; qIndex: number; value?: number | string } }
    | { type: 'UPDATE_QUESTION_MIN'; payload: { sIndex: number; qIndex: number; value?: number | string } }
    | { type: 'UPDATE_QUESTION_MAX'; payload: { sIndex: number; qIndex: number; value?: number | string } };


// --- Reducer Implementation ---
const assessmentReducer = (draft: AssessmentState, action: Action) => {
    let question: AssessmentQuestion | undefined;

    if (action.type !== 'ADD_SECTION' && action.type !== 'UPDATE_TITLE' && action.type !== 'SET_STATE') {
        // Only actions with sIndex/qIndex will enter here
        if ('sIndex' in action.payload && 'qIndex' in action.payload) {
             question = draft.sections[action.payload.sIndex]?.questions[action.payload.qIndex];
        }
    }

    switch (action.type) {
        case 'SET_STATE': return action.payload;
        case 'UPDATE_TITLE': draft.title = action.payload; break;
        case 'ADD_SECTION': draft.sections.push({ id: uuidv4(), title: 'New Section', questions: [] }); break;
        case 'UPDATE_SECTION_TITLE':
            // Check if section exists before updating
            if(draft.sections[action.payload.sIndex]) {
                draft.sections[action.payload.sIndex].title = action.payload.title;
            }
            break;
        case 'ADD_QUESTION':
            if(draft.sections[action.payload.sIndex]) {
                draft.sections[action.payload.sIndex].questions.push({
                    id: uuidv4(), text: 'New Question', type: action.payload.type, options: [],
                    required: true,
                });
            }
            break;
        // Cases that use the 'question' variable (safe now due to the check above)
        case 'UPDATE_QUESTION_TEXT': if (question) question.text = action.payload.text; break;
        case 'UPDATE_QUESTION_TYPE':
            if (question) {
                 question.type = action.payload.type;
                 if (action.payload.type !== 'single-choice' && action.payload.type !== 'multi-choice') question.options = [];
                 if (action.payload.type !== 'numeric') { question.min = undefined; question.max = undefined; }
                 if (action.payload.type !== 'short-text' && action.payload.type !== 'long-text') question.maxLength = undefined;
            }
            break;
        case 'ADD_OPTION': if (question) question.options.push({ id: uuidv4(), text: 'New Option' }); break;
        case 'UPDATE_OPTION': if (question) question.options[action.payload.oIndex].text = action.payload.text; break;
        case 'UPDATE_QUESTION_REQUIRED': if (question) question.required = action.payload.required; break;
        case 'UPDATE_QUESTION_MAXLENGTH': if (question) question.maxLength = action.payload.value === '' || action.payload.value === undefined ? undefined : Number(action.payload.value); break;
        case 'UPDATE_QUESTION_MIN': if (question) question.min = action.payload.value === '' || action.payload.value === undefined ? undefined : Number(action.payload.value); break;
        case 'UPDATE_QUESTION_MAX': if (question) question.max = action.payload.value === '' || action.payload.value === undefined ? undefined : Number(action.payload.value); break;
    }
};

// --- Main Page Component ---
export default function AssessmentBuilder() {
    const { jobId } = useParams();
    const queryClient = useQueryClient();
    const [initialState] = useState<AssessmentState>({ title: 'New Assessment', sections: [] });
    const [state, dispatch] = useImmerReducer(assessmentReducer, initialState);

    const { data, isLoading, isError, error } = useQuery<IAssessment, Error>({
        queryKey: ['assessment', jobId],
        queryFn: () => getAssessment(jobId!),
        enabled: !!jobId,
        staleTime: Infinity,
    });

    useEffect(() => {
        if (data) {
            const loadedState = (data.builderState && typeof data.builderState === 'object' && 'sections' in data.builderState)
                ? (data.builderState as AssessmentState)
                : { title: 'New Assessment', sections: [] };
            dispatch({ type: 'SET_STATE', payload: loadedState });
        }
    }, [data, dispatch]);

    const { mutate: handleSave, isPending: isSaving } = useMutation<
        IAssessment, Error, { jobId: string; builderState: AssessmentState }
    >({
        mutationFn: updateAssessment,
        onSuccess: (savedData) => {
            queryClient.setQueryData(['assessment', jobId], savedData);
            alert('Assessment Saved Successfully!');
        },
        onError: (err) => {
            console.error("Save failed:", err);
            alert(`Error saving assessment: ${err.message}`);
        },
    });

    if (isLoading) return <Group justify='center' mt="xl"><Loader /></Group>;
    if (isError) return <Alert color="red" title="Error loading assessment">{error.message}</Alert>;

    return (
        <Stack>
            <Group justify="space-between">
                <Title order={1}>Assessment Builder</Title>
                <Group>
                    <Button component={Link} to={`/assessment/${jobId}/take`} target="_blank" variant="outline">
                        Preview & Take
                    </Button>
                    <Button onClick={() => handleSave({ jobId: jobId!, builderState: state })} loading={isSaving}>
                        Save Assessment
                    </Button>
                </Group>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper shadow="sm" p="md" withBorder radius="md">
                        <AssessmentEditor state={state} dispatch={dispatch} />
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper shadow="sm" p="md" withBorder radius="md" style={{ position: 'sticky', top: 'var(--mantine-spacing-md)' }}>
                        <Title order={3} mb="md">Live Preview</Title>
                        <AssessmentPreview state={state} />
                    </Paper>
                </Grid.Col>
            </Grid>
        </Stack>
    );
}

// --- Editor Component ---
function AssessmentEditor({ state, dispatch }: { state: AssessmentState; dispatch: Dispatch<Action> }) {
    return (
        <Stack>
            <TextInput label="Assessment Title" value={state.title} onChange={(e) => dispatch({ type: 'UPDATE_TITLE', payload: e.currentTarget.value })} required />
            {state.sections.map((section, sIndex) => (
                <Paper key={section.id} withBorder p="sm" radius="md" mt="md">
                    <Stack>
                        <TextInput label="Section Title" value={section.title} onChange={(e) => dispatch({ type: 'UPDATE_SECTION_TITLE', payload: { sIndex, title: e.currentTarget.value } })} required />
                        {section.questions.map((q, qIndex) => (
                            <Paper key={q.id} withBorder p="xs" radius="sm" mt="xs">
                                <Stack gap="xs">
                                    <Textarea label="Question Text" value={q.text} autosize minRows={1} onChange={(e) => dispatch({ type: 'UPDATE_QUESTION_TEXT', payload: { sIndex, qIndex, text: e.currentTarget.value } })} required />
                                    <Select label="Type" value={q.type} data={QUESTION_TYPES} allowDeselect={false} onChange={(val) => dispatch({ type: 'UPDATE_QUESTION_TYPE', payload: { sIndex, qIndex, type: val as QuestionType } })} />
                                    {(q.type === 'single-choice' || q.type === 'multi-choice') && (
                                        <Stack gap={2} mt={2}>
                                            <Text size="xs" fw={500}>Options</Text>
                                            {q.options.map((opt, oIndex) => ( <TextInput key={opt.id} value={opt.text} size="xs" onChange={(e) => dispatch({ type: 'UPDATE_OPTION', payload: { sIndex, qIndex, oIndex, text: e.currentTarget.value } })} /> ))}
                                            <Button size="compact-xs" variant="light" mt={2} onClick={() => dispatch({ type: 'ADD_OPTION', payload: { sIndex, qIndex } })}> Add Option </Button>
                                        </Stack>
                                    )}
                                    {q.type === 'numeric' && (
                                        <Group grow>
                                            <NumberInput size="xs" label="Min Value" value={q.min} onChange={(value) => dispatch({ type: 'UPDATE_QUESTION_MIN', payload: { sIndex, qIndex, value } })} />
                                            <NumberInput size="xs" label="Max Value" value={q.max} onChange={(value) => dispatch({ type: 'UPDATE_QUESTION_MAX', payload: { sIndex, qIndex, value } })} />
                                        </Group>
                                    )}
                                     {(q.type === 'short-text' || q.type === 'long-text') && (
                                        <NumberInput size="xs" label="Max Length" value={q.maxLength} min={1} onChange={(value) => dispatch({ type: 'UPDATE_QUESTION_MAXLENGTH', payload: { sIndex, qIndex, value } })} />
                                     )}
                                     <Switch mt="xs" label="Required" size="sm" checked={q.required} onChange={(event) => dispatch({ type: 'UPDATE_QUESTION_REQUIRED', payload: { sIndex, qIndex, required: event.currentTarget.checked } })} />
                                </Stack>
                            </Paper>
                        ))}
                        <Select label="Add Question to Section" placeholder="Select type..." data={QUESTION_TYPES} onChange={(val) => { if (val) { dispatch({ type: 'ADD_QUESTION', payload: { sIndex, type: val as QuestionType } }); } }} value={null} mt="sm" />
                    </Stack>
                </Paper>
            ))}
            <Button onClick={() => dispatch({ type: 'ADD_SECTION' })} mt="lg">Add Section</Button>
        </Stack>
    );
}

// --- Live Preview Component ---
function AssessmentPreview({ state }: { state: AssessmentState }) {
    return (
        <Stack>
            <Title order={2} ta="center">{state.title || "Assessment Preview"}</Title>
            {state.sections.map((section) => (
                <Stack key={section.id} gap="md" mt="lg">
                    <Title order={4}>{section.title || "Section Preview"}</Title>
                    {section.questions.map((q) => (
                        <Paper key={q.id} p="sm" withBorder radius="sm">
                            <Stack gap="xs">
                                <Text fw={500}>{q.text} {q.required && <Text span c="red"> *</Text>}</Text>
                                {q.type === 'single-choice' && ( <Radio.Group> <Stack gap={2}>{q.options.map((opt) => (<Radio key={opt.id} value={opt.id} label={opt.text} disabled />))}</Stack> </Radio.Group> )}
                                {q.type === 'multi-choice' && ( <Checkbox.Group> <Stack gap={2}>{q.options.map((opt) => (<Checkbox key={opt.id} value={opt.id} label={opt.text} disabled />))}</Stack> </Checkbox.Group> )}
                                {q.type === 'short-text' && <TextInput disabled placeholder={`Max length: ${q.maxLength ?? 'N/A'}`}/>}
                                {q.type === 'long-text' && <Textarea disabled placeholder={`Max length: ${q.maxLength ?? 'N/A'}`} minRows={3}/>}
                                {q.type === 'numeric' && <NumberInput disabled min={q.min} max={q.max} placeholder={`Range: ${q.min ?? '-inf'} to ${q.max ?? '+inf'}`}/>}
                                {q.type === 'file-upload' && ( <Button variant="outline" disabled>Upload File</Button> )}
                            </Stack>
                        </Paper>
                    ))}
                </Stack>
            ))}
            {state.sections.length === 0 && <Text c="dimmed" ta="center" mt="md">Add sections and questions using the editor.</Text>}
        </Stack>
    );
}