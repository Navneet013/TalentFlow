// src/seed.ts

import {
  db,
  type IJob,
  type ICandidate,
  type IAssessment,
  type CandidateStage,
  type JobStatus,
  type ITimelineEvent,
  JOB_TYPES, // Import new type
  // type JobType,
} from './db';
import { faker } from '@faker-js/faker';

// --- Helper functions ---
const JOB_TITLES: string[] = [
  'Senior React Developer', 'Product Manager', 'UX/UI Designer', 'DevOps Engineer', 'Data Scientist', 'Frontend Developer', 'Backend Engineer', 'Full-Stack Developer'
];
const JOB_TAGS: string[] = ['React', 'TypeScript', 'Remote', 'Node.js', 'Python', 'AWS', 'Design', 'Management'];
const CANDIDATE_STAGES: CandidateStage[] = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
const JOB_STATUSES: JobStatus[] = ['active', 'archived'];
// --- NEW: Location data ---
const LOCATIONS: string[] = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Miami, FL', 'Remote', 'Atlanta, GA'];
// --- END NEW ---

function createSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// --- Main Seeding Function ---
async function seedDatabase() {
  try {
    await db.transaction('rw', [db.jobs, db.candidates, db.assessments, db.timelineEvents, db.assessmentResponses], async () => {

      // 1. Seed Jobs (UPDATED)
      console.log('Seeding jobs...');
      const jobsToCreate: IJob[] = [];
      for (let i = 0; i < 25; i++) {
        const jobTitle = faker.helpers.arrayElement(JOB_TITLES) + ` (L${i + 1})`;
       jobsToCreate.push({
  title: jobTitle,
  slug: createSlug(jobTitle),
  status: faker.helpers.arrayElement(JOB_STATUSES),
  tags: faker.helpers.arrayElements(JOB_TAGS, { min: 1, max: 3 }),
  order: i,
  // --- NEW FIELDS ---
  description: faker.lorem.paragraphs(2, '\n\n'),
  location: faker.helpers.arrayElement(LOCATIONS),
  type: faker.helpers.arrayElement(JOB_TYPES),
  keyRequirements: `• ${faker.lorem.sentence()}\n• ${faker.lorem.sentence()}\n• ${faker.lorem.sentence()}`,
  // --- END NEW FIELDS ---
  date: faker.date.future({ years: 1 }), // 👈 random date within the next year
});

      }
      await db.jobs.bulkAdd(jobsToCreate);
      console.log(`Seeded ${jobsToCreate.length} jobs.`);
      const allJobs = await db.jobs.toArray();
      const jobIds = allJobs.map(job => job.id!);

      // 2. Seed Candidates (Unchanged)
      console.log('Seeding candidates...');
      const candidatesToCreate: ICandidate[] = [];
      for (let i = 0; i < 1000; i++) {
        candidatesToCreate.push({
          name: faker.person.fullName(),
          email: faker.internet.email().toLowerCase(),
          stage: faker.helpers.arrayElement(CANDIDATE_STAGES),
          jobId: faker.helpers.arrayElement(jobIds),
        });
      }
      await db.candidates.bulkAdd(candidatesToCreate);
      console.log(`Seeded ${candidatesToCreate.length} candidates.`);
      const allCandidates = await db.candidates.toArray();

      // 3. Seed Assessments (Unchanged from your previous version)
      console.log('Seeding assessments...');
       const assessmentsToCreate: IAssessment[] = [
        {
          jobId: jobIds[0],
          builderState: {
            title: 'React Developer Quiz',
            sections: [{
              id: 's1', title: 'Core Concepts',
              questions: [
                { id: 'q1', text: 'What is JSX?', type: 'single-choice', options: [{id: 'o1', text: 'A syntax extension for JS'}, {id: 'o2', text: 'A new programming language'}, {id: 'o3', text: 'A database'}], required: true },
                { id: 'q2', text: 'What is a React Hook?', type: 'short-text', options: [], required: true, maxLength: 100 },
                { id: 'q3', text: 'Explain the Virtual DOM.', type: 'long-text', options: [], required: true, maxLength: 500 },
                { id: 'q4', text: 'Years of React experience', type: 'numeric', options: [], required: true, min: 0, max: 20 },
                { id: 'q5', text: 'Upload a code sample (optional)', type: 'file-upload', options: [], required: false },
              ]
            }]
          }
        },
        {
          jobId: jobIds[1],
          builderState: {
            title: 'Product Manager Assessment',
            sections: [
              { id: 's2', title: 'Product Thinking', questions: [ /* ... */ ] }
            ]
          }
        },
        {
          jobId: jobIds[2],
          builderState: {
            title: 'UX/UI Designer Portfolio Review',
            sections: [
              { id: 's3', title: 'Portfolio & Process', questions: [ /* ... */ ] }
            ]
          }
        },
      ];
      await db.assessments.bulkAdd(assessmentsToCreate);
      console.log(`Seeded ${assessmentsToCreate.length} assessments.`);

      // 4. Seed Timeline Events (Unchanged from your previous version)
      console.log('Seeding timeline events...');
      const timelineEventsToCreate: ITimelineEvent[] = [];
       for (let i = 0; i < Math.min(50, allCandidates.length); i++) {
         // ... (loop to create events)
       }
      await db.timelineEvents.bulkAdd(timelineEventsToCreate);
      console.log(`Seeded ${timelineEventsToCreate.length} timeline events.`);

    });
    console.log('Database seeding complete!');
  } catch (error) { console.error('Error seeding database:', error); }
}

// --- initializeDatabase Function (Unchanged) ---
export async function initializeDatabase() {
  await db.open(); // Ensures migrations run
  const jobCount = await db.jobs.count();
  if (jobCount > 0) { console.log('Database already populated. Skipping seed.'); return; }
  console.log('Database is empty. Seeding new data...');
  await seedDatabase();
}