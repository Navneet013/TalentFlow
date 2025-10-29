// src/db.ts

import Dexie, { type Table } from 'dexie';

// 1. Define the type *first* as a string literal union
export type CandidateStage =
  | 'applied'
  | 'screen'
  | 'tech'
  | 'offer'
  | 'hired'
  | 'rejected';

// 2. Now, define the constant *using* that type
export const STAGES: CandidateStage[] = [
  'applied',
  'screen',
  'tech',
  'offer',
  'hired',
  'rejected',
];

export type JobStatus = 'active' | 'archived';

// --- NEW: Define Job Type ---
export type JobType = 'Full-time' | 'Part-time' | 'Contract';
export const JOB_TYPES: JobType[] = ['Full-time', 'Part-time', 'Contract'];
// --- END NEW ---

// --- UPDATED: IJob Interface ---
export interface IJob {
  id?: number;
  title: string;
  slug: string;
  status: JobStatus;
  tags: string[];
  order: number;
  // --- NEW FIELDS ---
  description: string;
  location: string;
  type: JobType;
  keyRequirements: string;
  date: Date
  // --- END NEW FIELDS ---
}
// --- END UPDATE ---

export interface ICandidate {
  id?: number;
  name: string;
  email: string;
  stage: CandidateStage;
  jobId: number;
}

export interface IAssessment {
  id?: number;
  jobId: number;
  builderState: object;
}

export type TimelineEventType = 'note' | 'stage_change';
export interface ITimelineEvent {
  id?: number;
  candidateId: number;
  timestamp: Date;
  type: TimelineEventType;
  content: string;
}

export interface IAssessmentResponse {
  id?: number;
  jobId: number;
  responseData: object; 
  submittedAt: Date;
}

export class TalentFlowDB extends Dexie {
  jobs!: Table<IJob>;
  candidates!: Table<ICandidate>;
  assessments!: Table<IAssessment>;
  timelineEvents!: Table<ITimelineEvent>;
  assessmentResponses!: Table<IAssessmentResponse>;

  constructor() {
    super('talentFlowDB');
    
    // --- UPDATED: Schema Versions ---
    this.version(1).stores({
      jobs: '++id, title, slug, status, order',
      candidates: '++id, name, email, stage, jobId',
      assessments: '++id, jobId',
    });
    
    this.version(2).stores({
      jobs: '++id, title, slug, status, order',
      candidates: '++id, name, email, stage, jobId',
      assessments: '++id, jobId',
      timelineEvents: '++id, candidateId, timestamp', 
    });
    
    this.version(3).stores({
      jobs: '++id, title, slug, status, order',
      candidates: '++id, name, email, stage, jobId',
      assessments: '++id, jobId',
      timelineEvents: '++id, candidateId, timestamp', 
      assessmentResponses: '++id, jobId, submittedAt',
    });

    // --- NEW: Migration to Version 4 ---
    // This migration adds the new fields to the jobs table
    // and indexes 'location' and 'type' for future filtering
    this.version(4).stores({
      jobs: '++id, title, slug, status, order, location, type', // Add new indexes
      candidates: '++id, name, email, stage, jobId',
      assessments: '++id, jobId',
      timelineEvents: '++id, candidateId, timestamp', 
      assessmentResponses: '++id, jobId, submittedAt',
    });
    // --- END NEW ---
  }
}

export const db = new TalentFlowDB();