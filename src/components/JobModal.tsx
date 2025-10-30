import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Select,
  MultiSelect,
  Group,
} from '@mantine/core';
import { DateInput } from '@mantine/dates'; 
import { type IJob } from '../db';
import { type JobFormData } from '../api';


const LOCATIONS = ['Remote', 'New York', 'London', 'Berlin', 'Tokyo'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract'];

const initialTags = [
  'React', 'TypeScript', 'Node.js', 'Remote', 'Python', 'AWS',
  'Design', 'Management', 'Full-Stack', 'Frontend', 'Backend', 'DevOps',
];

interface JobModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => Promise<void>;
  job?: IJob | null;
  isLoading: boolean;
}

export default function JobModal({ opened, onClose, onSubmit, job, isLoading }: JobModalProps) {
  const [tagData, setTagData] = useState<string[]>(initialTags);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    register,
  } = useForm<JobFormData>({
    defaultValues: {
      title: '',
      status: 'active',
      description: '',
      keyRequirements: '',
      tags: [],
      location: '',
      type: '',
      date: new Date(),
    },
  });

  useEffect(() => {
    if (opened) {
      if (job) {
        reset({
          title: job.title,
          status: job.status,
          tags: job.tags,
          description: job.description,
          keyRequirements: job.keyRequirements,
          location: job.location,
          type: job.type,
          date: job.date,
        });
        setTagData(Array.from(new Set([...initialTags, ...job.tags])));
      } else {
        reset({
          title: '',
          status: 'active',
          tags: [],
          description: '',
          keyRequirements: '',
          location: '',
          type: '',
          date: new Date(),
        });
        setTagData(initialTags);
      }
    }
  }, [job, reset, opened]);

  const handleFormSubmit = async (data: JobFormData) => {
    await onSubmit(data);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={job ? 'Edit Job' : 'Create New Job'}
      size="md"
      centered
    >
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack>
          {/* --- TITLE --- */}
          <TextInput
            label="Job Title"
            placeholder="e.g. Senior React Developer"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />

          {/* --- DESCRIPTION --- */}
          <TextInput
            label="Job Description"
            placeholder="Describe the job role..."
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
          />

          {/* --- KEY REQUIREMENTS --- */}
          <TextInput
            label="Key Requirements"
            placeholder="We are currently looking for..."
            {...register('keyRequirements', { required: 'Requirements are required' })}
            error={errors.keyRequirements?.message}
          />

          {/* --- LOCATION --- */}
          <Controller
            name="location"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                label="Location"
                placeholder="Select location"
                data={LOCATIONS.map(l => ({ value: l, label: l }))}
                {...field}
              />
            )}
          />

          {/* --- TYPE --- */}
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                label="Job Type"
                placeholder="Select job type"
                data={JOB_TYPES.map(t => ({ value: t, label: t }))}
                {...field}
              />
            )}
          />

          {/* --- DATE --- */}
          <Controller
  name="date"
  control={control}
  render={({ field }) => (
    <DateInput
      label="Job Date"
      placeholder="Pick a date"
      value={field.value instanceof Date ? field.value : new Date(field.value)}
      onChange={(d) => field.onChange(d ?? new Date())} // ✅ keep as Date object
      minDate={new Date()} // only allow today or future dates
    />
  )}
/>

          {/* --- STATUS --- */}
          <Controller
            name="status"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                label="Status"
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
                {...field}
              />
            )}
          />

          {/* --- TAGS --- */}
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Tags"
                placeholder="Select tags (max 5)"
                data={tagData}
                searchable
                maxValues={5}
                {...field}
              />
            )}
          />

          {/* --- BUTTONS --- */}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {job ? 'Update Job' : 'Create Job'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
