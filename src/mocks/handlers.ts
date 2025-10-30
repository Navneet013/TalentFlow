import { http, HttpResponse } from 'msw';
import {
    db, type IJob, type JobStatus, type ICandidate, type CandidateStage,
    type ITimelineEvent, type IAssessment, type IAssessmentResponse, STAGES
} from '../db';
import { delay, randomDelay, shouldError, serverError } from './utils';
import type Dexie from 'dexie';
import { type JobFormData } from '../api';

// Helper to create slug
function createSlug(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export const handlers = [
    // --- GET /jobs ---
    http.get('/jobs', async ({ request }) => {
        await delay(randomDelay());
        if (shouldError(0.05)) { return serverError(); }
        try {
            const url = new URL(request.url);
            const page = Number(url.searchParams.get('page') || '1');
            const pageSize = Number(url.searchParams.get('pageSize') || '10');
            const search = url.searchParams.get('search') || '';
            const status = url.searchParams.get('status') || 'all';
            const tags = url.searchParams.getAll('tags');
            let collection: Dexie.Collection<IJob, number>;
            if (status !== 'all') { collection = db.jobs.where('status').equals(status as JobStatus); }
            else { collection = db.jobs.toCollection(); }
            if (search) { const lowerSearch = search.toLowerCase(); collection = collection.filter(job => job.title.toLowerCase().includes(lowerSearch)); }
            if (tags.length > 0) { collection = collection.filter(job => tags.every(tag => job.tags.includes(tag))); }
            const totalCount = await collection.count();
            const jobs = await collection.sortBy('order').then(sortedJobs => sortedJobs.slice((page - 1) * pageSize, page * pageSize));
            return HttpResponse.json({ jobs: jobs, totalCount: totalCount });
        } catch (e) { console.error('Error in GET /jobs handler:', e); return serverError(); }
    }),

    // --- GET /jobs/:jobId ---
    http.get('/jobs/:jobId', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const { jobId } = params;
            const id = Number(jobId);
            if (isNaN(id)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const job = await db.jobs.get(id);
            if (!job) { return new HttpResponse(null, { status: 404, statusText: 'Job Not Found' }); }
            return HttpResponse.json(job);
        } catch (e) { console.error('Error in GET /jobs/:jobId handler:', e); return serverError(); }
    }),

    // --- POST /jobs ---
    http.post('/jobs', async ({ request }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { title, status, tags,description,keyRequirements , location, type, date} = (await request.json()) as JobFormData;
            if (!title) { return new HttpResponse('Title is required', { status: 400 }); }
            const slug = createSlug(title);
            const existing = await db.jobs.where('slug').equals(slug).first();
            if (existing) { return new HttpResponse('Job title must be unique (slug already exists)', { status: 400 }); }
            const maxOrderJob = await db.jobs.orderBy('order').last();
            const nextOrder = (maxOrderJob?.order ?? -1) + 1;
            const newJob: IJob = {
                           title,
                           slug,
                           description,
                           keyRequirements,
                           location,
                           type: type as IJob['type'],  
                           date,
                           status: status || 'active',
                           tags: tags || [],
                           order: nextOrder
        };
            const newId = await db.jobs.add(newJob);
            const createdJob = await db.jobs.get(newId);
            console.log('Created Job:', createdJob);
            return HttpResponse.json(createdJob, { status: 201 });
        } catch (e) { console.error('Error in POST /jobs handler:', e); return serverError(); }
    }),

    // --- PATCH /jobs/:id (Full Edit) ---
    http.patch('/jobs/:id', async ({ request, params }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { id } = params;
            const jobId = Number(id);
            if (isNaN(jobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const { title, status, tags,description,keyRequirements, location, type, date  } = (await request.json()) as JobFormData;
            if (!title) { return new HttpResponse('Title is required', { status: 400 }); }
            const slug = createSlug(title);
            const existing = await db.jobs.where('slug').equals(slug).first();
            if (existing && existing.id !== jobId) { return new HttpResponse('Job title must be unique (slug already exists)', { status: 400 }); }
            const updates = {
  title,
  slug,
  status,
  tags,
  description,
  keyRequirements,
  location,
  type: type as IJob['type'],  // ✅ same fix
  date
};
            const updatedCount = await db.jobs.update(jobId, updates);
            if (updatedCount === 0) { return new HttpResponse(null, { status: 404, statusText: 'Job not found for update'}); }
            const updatedJob = await db.jobs.get(jobId);
            console.log('Updated Job:', updatedJob);
            return HttpResponse.json(updatedJob);
        } catch (e) { console.error('Error in PATCH /jobs/:id handler:', e); return serverError(); }
    }),

    // --- PATCH /jobs/:id/status ---
    http.patch('/jobs/:id/status', async ({ request, params }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { id } = params;
            const jobId = Number(id);
             if (isNaN(jobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const { status } = (await request.json()) as { status: JobStatus };
            if (!status || (status !== 'active' && status !== 'archived')) { return new HttpResponse('Invalid status provided', { status: 400 }); }
            const updatedCount = await db.jobs.update(jobId, { status: status });
            if (updatedCount === 0) { return new HttpResponse(null, { status: 404, statusText: 'Job not found for status update'}); }
            const updatedJob = await db.jobs.get(jobId);
            console.log('Updated Job Status:', updatedJob);
            return HttpResponse.json(updatedJob);
        } catch (e) { console.error('Error in PATCH /jobs/:id/status handler:', e); return serverError(); }
    }),

    // --- PATCH /jobs/reorder ---
    http.patch('/jobs/reorder', async ({ request }) => {
        await delay(randomDelay());
        if (shouldError(0.5)) { console.log('REORDER: Simulating server error'); return serverError(); }
        try {
             const { activeId, overId } = await request.json() as { activeId: number, overId: number };
             console.log(`REORDER: Request received - Move ${activeId} over ${overId}`);
             await db.transaction('rw', db.jobs, async () => {
                 const allJobs = await db.jobs.orderBy('order').toArray();
                 const fromIndex = allJobs.findIndex(j => j.id === activeId);
                 const toIndex = allJobs.findIndex(j => j.id === overId);
                 if (fromIndex === -1 || toIndex === -1) { throw new Error("Job not found during reorder"); }
                 const [movedItem] = allJobs.splice(fromIndex, 1);
                 allJobs.splice(toIndex, 0, movedItem);
                 const updates = allJobs.map((job, index) => ({ key: job.id!, changes: { order: index } }));
                 await db.jobs.bulkUpdate(updates);
                 console.log(`REORDER: Dexie bulkUpdate executed for ${updates.length} jobs.`);
             });
             console.log('REORDER: Transaction successful');
             return HttpResponse.json({ success: true });
        } catch(e) { console.error('Error in PATCH /jobs/reorder handler:', e); return serverError(); }
    }),

    // --- POST /candidates ---
    http.post('/candidates', async ({ request }) => {
         await delay(randomDelay());
         if (shouldError(0.08)) { return serverError(); }
         try {
             const { name, email, jobId, stage } = await request.json() as Partial<ICandidate>;
             if (!name || !email || !jobId || !stage || !STAGES.includes(stage)) { return new HttpResponse('Missing or invalid fields (name, email, jobId, stage)', { status: 400 }); }
             const jobExists = await db.jobs.get(jobId);
             if (!jobExists) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
             const newCandidate: ICandidate = { name, email: email.toLowerCase(), jobId, stage };
             const newId = await db.candidates.add(newCandidate);
             const createdCandidate = await db.candidates.get(newId);
             console.log('Created Candidate:', createdCandidate);
             const newEvent: ITimelineEvent = { candidateId: newId!, timestamp: new Date(), type: 'stage_change', content: stage };
             await db.timelineEvents.add(newEvent);
             return HttpResponse.json(createdCandidate, { status: 201 });
         } catch (e) { console.error('Error in POST /candidates handler:', e); return serverError(); }
    }),

    // --- GET /candidates ---
    http.get('/candidates', async ({ request }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const url = new URL(request.url);
            const stage = (url.searchParams.get('stage') || 'all') as CandidateStage | 'all';
            let collection: Dexie.Collection<ICandidate, number>;
            if (stage !== 'all') { collection = db.candidates.where('stage').equals(stage); }
            else { collection = db.candidates.toCollection(); }
            const allCandidates = await collection.toArray();
            return HttpResponse.json(allCandidates);
        } catch (e) { console.error('Error in GET /candidates handler:', e); return serverError(); }
    }),

    // --- GET /candidates/:id ---
    http.get('/candidates/:id', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const { id } = params;
            const candidateId = Number(id);
            if (isNaN(candidateId)) { return new HttpResponse('Invalid Candidate ID', { status: 400 }); }
            const candidate = await db.candidates.get(candidateId);
            if (!candidate) { return new HttpResponse(null, { status: 404, statusText: 'Candidate Not Found' }); }
            return HttpResponse.json(candidate);
        } catch (e) { console.error('Error in GET /candidates/:id handler:', e); return serverError(); }
    }),

    // --- GET /candidates-for-job/:jobId ---
    http.get('/candidates-for-job/:jobId', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const { jobId } = params;
            const numJobId = Number(jobId);
            if (isNaN(numJobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const candidates = await db.candidates.where('jobId').equals(numJobId).toArray();
            return HttpResponse.json(candidates);
        } catch (e) { console.error('Error in GET /candidates-for-job/:jobId handler:', e); return serverError(); }
    }),

    // --- PATCH /candidates/:id (Stage Change) ---
    http.patch('/candidates/:id', async ({ request, params }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { id } = params;
            const candidateId = Number(id);
            if (isNaN(candidateId)) { return new HttpResponse('Invalid Candidate ID', { status: 400 }); }
            const { stage } = (await request.json()) as { stage: CandidateStage };
            if (!stage || !STAGES.includes(stage)) { return new HttpResponse('Invalid stage provided', { status: 400 }); }
            const updatedCount = await db.candidates.update(candidateId, { stage: stage });
            if (updatedCount === 0) { return new HttpResponse(null, { status: 404, statusText: 'Candidate not found for update'}); }
            const newEvent: ITimelineEvent = { candidateId, timestamp: new Date(), type: 'stage_change', content: stage };
            await db.timelineEvents.add(newEvent);
            const updatedCandidate = await db.candidates.get(candidateId);
            console.log('Updated Candidate Stage:', updatedCandidate);
            return HttpResponse.json(updatedCandidate);
        } catch (e) { console.error('Error in PATCH /candidates/:id handler:', e); return serverError(); }
    }),

    // --- GET /candidates/:id/timeline ---
    http.get('/candidates/:id/timeline', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const { id } = params;
            const candidateId = Number(id);
            if (isNaN(candidateId)) { return new HttpResponse('Invalid Candidate ID', { status: 400 }); }
            const events = await db.timelineEvents.where('candidateId').equals(candidateId).sortBy('timestamp');
            return HttpResponse.json(events.reverse());
        } catch (e) { console.error('Error in GET /candidates/:id/timeline handler:', e); return serverError(); }
    }),

    // --- POST /candidates/:id/notes ---
    http.post('/candidates/:id/notes', async ({ request, params }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { id } = params;
            const candidateId = Number(id);
            if (isNaN(candidateId)) { return new HttpResponse('Invalid Candidate ID', { status: 400 }); }
            const { note } = (await request.json()) as { note: string };
            if (!note) { return new HttpResponse('Note content is required', { status: 400 }); }
            const newEvent: ITimelineEvent = { candidateId, timestamp: new Date(), type: 'note', content: note };
            const newId = await db.timelineEvents.add(newEvent);
            const createdEvent = await db.timelineEvents.get(newId);
            console.log('Added Note:', createdEvent);
            return HttpResponse.json(createdEvent, { status: 201 });
        } catch (e) { console.error('Error in POST /candidates/:id/notes handler:', e); return serverError(); }
    }),

    // --- GET /assessments ---
    http.get('/assessments', async () => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const allAssessments = await db.assessments.toArray();
            return HttpResponse.json(allAssessments);
        } catch (e) { console.error('Error in GET /assessments handler:', e); return serverError(); }
    }),

    // --- GET /assessments/:jobId ---
    http.get('/assessments/:jobId', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const { jobId } = params;
            const numJobId = Number(jobId);
            if (isNaN(numJobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const assessment = await db.assessments.where('jobId').equals(numJobId).first();
            if (assessment) { return HttpResponse.json(assessment); }
            else { return HttpResponse.json({ jobId: numJobId, builderState: { title: 'New Assessment', sections: [] } } as IAssessment); }
        } catch (e) { console.error('Error in GET /assessments/:jobId handler:', e); return serverError(); }
    }),

    // --- PUT /assessments/:jobId ---
    http.put('/assessments/:jobId', async ({ request, params }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { jobId } = params;
            const numJobId = Number(jobId);
            if (isNaN(numJobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const { builderState } = (await request.json()) as { builderState: object };
            if (!builderState) { return new HttpResponse('Builder state is required', { status: 400 }); }
            const existing = await db.assessments.where('jobId').equals(numJobId).first();
            if (existing && existing.id) {
                await db.assessments.update(existing.id, { builderState });
                const updated = await db.assessments.get(existing.id);
                console.log('Updated Assessment:', updated);
                return HttpResponse.json(updated);
            } else {
                const newAssessment: IAssessment = { jobId: numJobId, builderState: builderState };
                const newId = await db.assessments.add(newAssessment);
                const created = await db.assessments.get(newId);
                console.log('Created Assessment:', created);
                return HttpResponse.json(created, { status: 201 });
            }
        } catch (e) { console.error('Error in PUT /assessments/:jobId handler:', e); return serverError(); }
    }),

    // --- DELETE /assessments/:id ---
    http.delete('/assessments/:id', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError(0.1)) { console.error('DELETE /assessments/:id - Simulating Error'); return serverError(); }
        try {
            const { id } = params;
            const assessmentId = Number(id);
            if (isNaN(assessmentId)) { return new HttpResponse('Invalid Assessment ID', { status: 400 }); }
            const existing = await db.assessments.get(assessmentId);
            if (!existing) { return new HttpResponse(null, { status: 404, statusText: 'Assessment Not Found' }); }
            await db.assessments.delete(assessmentId);
            console.log(`Deleted assessment with ID: ${assessmentId}`);
            return new HttpResponse(null, { status: 204 });
        } catch (e) { console.error('Error in DELETE /assessments/:id handler:', e); return serverError(); }
    }),

    // --- POST /assessments/:jobId/submit ---
    http.post('/assessments/:jobId/submit', async ({ request, params }) => {
        await delay(randomDelay());
        if (shouldError(0.08)) { return serverError(); }
        try {
            const { jobId } = params;
            const numJobId = Number(jobId);
            if (isNaN(numJobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const { responseData } = (await request.json()) as { responseData: object };
             if (!responseData) { return new HttpResponse('Response data is required', { status: 400 }); }
            const newResponse: IAssessmentResponse = { jobId: numJobId, responseData, submittedAt: new Date() };
            const newId = await db.assessmentResponses.add(newResponse);
            const createdResponse = await db.assessmentResponses.get(newId);
            console.log('Assessment response saved:', createdResponse);
            return HttpResponse.json(createdResponse, { status: 201 });
        } catch (e) { console.error('Error in POST /assessments/:jobId/submit handler:', e); return serverError(); }
    }),

    // --- GET /assessment-responses/:jobId ---
    http.get('/assessment-responses/:jobId', async ({ params }) => {
        await delay(randomDelay());
        if (shouldError()) { return serverError(); }
        try {
            const { jobId } = params;
            const numJobId = Number(jobId);
            if (isNaN(numJobId)) { return new HttpResponse('Invalid Job ID', { status: 400 }); }
            const responses = await db.assessmentResponses.where('jobId').equals(numJobId).sortBy('submittedAt');
            return HttpResponse.json(responses.reverse());
        } catch (e) { console.error('Error in GET /assessment-responses/:jobId handler:', e); return serverError(); }
    }),
];