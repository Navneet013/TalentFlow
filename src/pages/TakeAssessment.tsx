// src/pages/TakeAssessment.tsx

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
    useForm, type SubmitHandler, Controller, type Control,
    type FieldErrors, type UseFormRegister, type FieldValues
} from 'react-hook-form';
import { getAssessment, submitAssessment } from '../api';
import {
    Alert, Loader, Stack, Text, Title, Paper, Button, Container,
    TextInput, Textarea, Radio, Checkbox, NumberInput, FileInput
} from '@mantine/core';
// Import IAssessment from db
import { type IAssessment } from '../db';
import { type AssessmentState, type AssessmentSection, type AssessmentQuestion, type QuestionOption } from './AssessmentBuilder';
import { IconUpload } from '@tabler/icons-react';

// Use FieldValues for better type safety with dynamic field names
type FormInputs = FieldValues;

export default function TakeAssessment() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const {
        register, handleSubmit, watch, control,
        formState: { errors },
    } = useForm<FormInputs>();

    // Use the imported IAssessment type here
    const { data: assessment, isLoading, isError, error } = useQuery<IAssessment, Error>({
        queryKey: ['assessment', jobId],
        queryFn: () => getAssessment(jobId!),
        enabled: !!jobId,
        staleTime: 1000 * 60 * 15, // Cache assessment structure for 15 mins
    });

    const { mutate: handleSubmitForm, isPending: isSubmitting } = useMutation({
        mutationFn: submitAssessment,
        onSuccess: () => {
            alert('Assessment submitted successfully!');
            navigate('/jobs'); // Navigate back to jobs list on success
        },
        onError: (err: unknown) => {
            console.error("Submission failed:", err);
            alert(`Error submitting assessment: ${err instanceof Error ? err.message : 'Unknown error'}`);
        },
    });

    // Handle form submission - data contains { questionId: answer }
    const onSubmit: SubmitHandler<FormInputs> = (data) => {
        console.log('Form data:', data);
        // Remove undefined/null values before sending
        // Rename unused key variable to _key
        const cleanData = Object.fromEntries(Object.entries(data).filter(([ , v]) => v !== null && v !== undefined));
        handleSubmitForm({ jobId: jobId!, responseData: cleanData });
    };

    // --- Render States ---
    if (isLoading) return <Container size="sm" py="xl" style={{ textAlign: 'center' }}><Loader /></Container>;
    if (isError) return <Container size="sm" py="xl"><Alert color="red" title="Error loading assessment">{error?.message}</Alert></Container>;

    // Ensure builderState is a valid AssessmentState structure
    const formState = (assessment?.builderState && typeof assessment.builderState === 'object' && 'sections' in assessment.builderState)
                     ? assessment.builderState as AssessmentState
                     : null; // Handle case where builderState is invalid or empty

    // Example: Watch the value of the *first question in the first section* for conditional logic
    const firstQuestionId = formState?.sections[0]?.questions[0]?.id;
    const firstQuestionValue = firstQuestionId ? watch(firstQuestionId) : undefined;

    // Handle case where assessment structure is missing or invalid after loading
    if (!formState) {
       return <Container size="sm" py="xl"><Alert color="orange" title="Assessment Not Configured">This assessment has not been set up correctly.</Alert></Container>;
    }


    return (
        <Container size="sm" py="xl">
            <Paper shadow="sm" p="lg" withBorder radius="md">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Stack>
                        <Title order={1}>{formState.title || "Assessment"}</Title>
                        <Text c="dimmed">Please fill out the assessment below. Fields marked with * are required.</Text>

                        {formState.sections.map((section: AssessmentSection) => (
                            <Stack key={section.id} mt="lg" gap="md">
                                <Title order={3}>{section.title}</Title>
                                {section.questions.map((q: AssessmentQuestion) => {

                                    // Example Conditional Logic: Show Q2 only if Q1 (first question) has a specific answer
                                    const isConditionallyHidden = q.id === 'q2' && firstQuestionValue !== 'A syntax extension for JS';

                                    if (isConditionallyHidden) {
                                        return (
                                            <Alert key={q.id} color="blue" title="Conditional Question">
                                                This question will appear based on your previous answers.
                                            </Alert>
                                        );
                                    }

                                    return (
                                        <RenderQuestion
                                            key={q.id}
                                            q={q}
                                            register={register}
                                            control={control}
                                            errors={errors}
                                        />
                                    );
                                })}
                            </Stack>
                        ))}

                        <Button type="submit" mt="xl" loading={isSubmitting}>Submit Assessment</Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
}

// --- Helper component to render each question type ---
interface RenderQuestionProps {
    q: AssessmentQuestion;
    register: UseFormRegister<FormInputs>;
    control: Control<FormInputs>;
    errors: FieldErrors<FormInputs>;
}

function RenderQuestion({ q, register, control, errors }: RenderQuestionProps) {
    // Dynamically build validation rules from the question object
    const rules = {
        required: q.required ? 'This field is required' : false,
        maxLength: (q.type === 'short-text' || q.type === 'long-text') && q.maxLength
            ? { value: q.maxLength, message: `Maximum ${q.maxLength} characters` }
            : undefined,
        min: q.type === 'numeric' && q.min !== undefined
            ? { value: q.min, message: `Minimum value is ${q.min}` }
            : undefined,
        max: q.type === 'numeric' && q.max !== undefined
            ? { value: q.max, message: `Maximum value is ${q.max}` }
            : undefined,
        // Combined range validation for numeric
        validate: q.type === 'numeric' && q.min !== undefined && q.max !== undefined
            ? (value: unknown) => { // Use unknown for value
                  const num = Number(value);
                  if (value === '' || value === null || value === undefined) return true; // Let required handle empty
                  if (isNaN(num)) return 'Must be a number';
                  return (num >= q.min! && num <= q.max!) || `Value must be between ${q.min} and ${q.max}`;
              }
            : undefined,
    };

    const fieldName = q.id; // Use question ID as the field name

    return (
        <Paper withBorder p="md" radius="sm">
            <Stack gap="xs">
                <Text fw={500}>
                    {q.text} {q.required && <Text span c="red"> *</Text>}
                </Text>

                {/* Render input based on type */}
                {q.type === 'single-choice' && (
                    <Controller name={fieldName} control={control} rules={rules}
                        render={({ field }) => (
                            <Radio.Group {...field} value={String(field.value ?? '')}>
                                <Stack gap="xs">
                                    {q.options.map((opt: QuestionOption) => (
                                        <Radio key={opt.id} value={opt.text} label={opt.text} />
                                    ))}
                                </Stack>
                            </Radio.Group>
                        )}
                    />
                )}
                {q.type === 'multi-choice' && (
                    <Controller name={fieldName} control={control} rules={rules}
                         render={({ field }) => (
                             <Checkbox.Group {...field} value={Array.isArray(field.value) ? field.value : []}>
                                <Stack gap="xs">
                                    {q.options.map((opt: QuestionOption) => (
                                        <Checkbox key={opt.id} value={opt.text} label={opt.text} />
                                    ))}
                                </Stack>
                             </Checkbox.Group>
                         )}
                    />
                )}
                {q.type === 'short-text' && ( <TextInput {...register(fieldName, rules)} /> )}
                {q.type === 'long-text' && ( <Textarea {...register(fieldName, rules)} minRows={3}/> )}
                {q.type === 'numeric' && (
                    <Controller name={fieldName} control={control} rules={rules}
                         render={({ field }) => (
                             <NumberInput
                                {...field}
                                min={q.min} max={q.max} // Pass constraints to component
                                value={field.value ?? ''} // Handle undefined value for NumberInput
                                onChange={(value) => field.onChange(value)} // RHF expects value | string
                             />
                         )}
                    />
                )}
                 {/* File Upload Input */}
                {q.type === 'file-upload' && (
                     <Controller
                        name={fieldName}
                        control={control}
                        rules={rules} // Apply required rule if set in builder
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <FileInput
                                ref={ref} // Pass ref for RHF
                                label="" // Label provided by question text above
                                placeholder="Click to select or drop file"
                                leftSection={<IconUpload size={16} stroke={1.5}/>}
                                onBlur={onBlur} // RHF blur handler
                                // Mantine onChange gives File | null, RHF expects event or value
                                onChange={(payload: File | null) => onChange(payload)}
                                value={value instanceof File ? value : null} // RHF stores File object
                                error={errors[fieldName]?.message as string | undefined}
                                // Note: No actual upload happens here, just selection.
                                // File object would be in form data on submit.
                                // Add accept prop based on requirements if needed: accept="image/png,image/jpeg"
                                clearable // Allow removing selection
                            />
                        )}
                     />
                )}

                {/* Display validation error */}
                {errors[fieldName] && ( <Text c="red" size="sm">{errors[fieldName]?.message as string}</Text> )}
            </Stack>
        </Paper>
    );
}