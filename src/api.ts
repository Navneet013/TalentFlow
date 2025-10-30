// src/api.ts

import axios from 'axios';
import {
  type IJob,
  type JobStatus,
  type ICandidate,
  type CandidateStage,
  type ITimelineEvent,
  type IAssessment,
  type IAssessmentResponse,
} from './db';

export interface GetJobsResponse {
  jobs: IJob[];
  totalCount: number;
}
// Interface GetJobsParams includes tags filter
interface GetJobsParams {
  page: number;
  pageSize: number;
  search: string;
  status: JobStatus | 'all';
  tags: string[]; // Added tags array for filtering
}
export const getJobs = async (params: GetJobsParams): Promise<GetJobsResponse> => {
  const { data } = await axios.get('/jobs', {
       params: params,
       // Axios needs help serializing arrays correctly for URL params
       // Convert { tags: ['a', 'b'] } to ?tags=a&tags=b
       paramsSerializer: params => {
            const searchParams = new URLSearchParams();
            for (const key in params) {
                const value = params[key as keyof typeof params]; // Add index signature access
                if (Array.isArray(value)) {
                    value.forEach((val: string) => searchParams.append(key, val));
                } else if (value !== undefined && value !== null) {
                     searchParams.append(key, String(value));
                }
            }
            return searchParams.toString();
        }
    });
  return data;
};

export const getJobDetails = async (jobId: string): Promise<IJob> => {
  const { data } = await axios.get(`/jobs/${jobId}`);
  return data;
};

// Shape matches JobModal's react-hook-form data
export interface JobFormData {
  title: string;
  status: JobStatus;
  tags: string[];
  description: string;
  keyRequirements:string;
  location:string;
  type:string;
  date: Date;
}
export const createJob = async (jobData: JobFormData): Promise<IJob> => {
  const { data } = await axios.post('/jobs', jobData);
  return data;
};

export interface UpdateJobParams {
  jobId: number;
  jobData: JobFormData;
}
export const updateJob = async ({ jobId, jobData }: UpdateJobParams): Promise<IJob> => {
  const { data } = await axios.patch(`/jobs/${jobId}`, jobData);
  return data;
};

export interface UpdateJobStatusParams {
  jobId: number;
  status: JobStatus;
}
export const updateJobStatus = async ({ jobId, status }: UpdateJobStatusParams): Promise<IJob> => {
  const { data } = await axios.patch(`/jobs/${jobId}/status`, { status });
  return data;
};

export interface ReorderJobsParams {
  activeId: number;
  overId: number;
}
export const reorderJobs = async (params: ReorderJobsParams): Promise<{ success: true }> => {
  const { data } = await axios.patch('/jobs/reorder', params);
  return data;
};

// --- Candidate ---
interface GetCandidatesParams { stage: CandidateStage | 'all'; }
export const getCandidates = async (params: GetCandidatesParams): Promise<ICandidate[]> => { const { data } = await axios.get('/candidates', { params: params }); return data; };
export const getCandidatesForJob = async (jobId: string): Promise<ICandidate[]> => { const { data } = await axios.get(`/candidates-for-job/${jobId}`); return data; };
export interface UpdateCandidateStageParams { candidateId: number; stage: CandidateStage; } // Exported
export const updateCandidateStage = async ({ candidateId, stage }: UpdateCandidateStageParams): Promise<ICandidate> => { const { data } = await axios.patch(`/candidates/${candidateId}`, { stage }); return data; };
export const getCandidateDetails = async (candidateId: string): Promise<ICandidate> => { const { data } = await axios.get(`/candidates/${candidateId}`); return data; };
export const getCandidateTimeline = async (candidateId: string): Promise<ITimelineEvent[]> => { const { data } = await axios.get(`/candidates/${candidateId}/timeline`); return data; };
interface AddCandidateNoteParams { candidateId: string; note: string; }
export const addCandidateNote = async ({ candidateId, note }: AddCandidateNoteParams): Promise<ITimelineEvent> => { const { data } = await axios.post(`/candidates/${candidateId}/notes`, { note }); return data; };

// --- Assessment ---
export const getAllAssessments = async (): Promise<IAssessment[]> => { const { data } = await axios.get('/assessments'); return data; };
export const getAssessment = async (jobId: string): Promise<IAssessment> => { const { data } = await axios.get(`/assessments/${jobId}`); return data; };
interface UpdateAssessmentParams { jobId: string; builderState: object; }
export const updateAssessment = async ({ jobId, builderState }: UpdateAssessmentParams): Promise<IAssessment> => { const { data } = await axios.put(`/assessments/${jobId}`, { builderState }); return data; };
interface SubmitAssessmentParams { jobId: string; responseData: object; }
export const submitAssessment = async ({ jobId, responseData }: SubmitAssessmentParams): Promise<IAssessmentResponse> => { const { data } = await axios.post(`/assessments/${jobId}/submit`, { responseData }); return data; };
export const getAssessmentResponses = async (jobId: string): Promise<IAssessmentResponse[]> => { const { data } = await axios.get(`/assessment-responses/${jobId}`); return data; };
export const deleteAssessment = async (assessmentId: number): Promise<void> => { await axios.delete(`/assessments/${assessmentId}`); };