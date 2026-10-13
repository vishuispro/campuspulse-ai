import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateInterventionInput,
  canTransitionStatus,
  createInterventionRecord,
  updateInterventionLifecycleStatus,
  updateInterventionFollowUp,
  loadInterventionsFromStorage,
  STORAGE_KEY,
  CreateInterventionInput,
} from '../services/interventionStore';
import {
  computeInterventionMetrics,
  filterInterventions,
  sortInterventions,
  paginateInterventions,
  INITIAL_INTERVENTION_FILTERS,
} from '../utils/interventionFilterSort';
import { Intervention } from '../types/student';

// Mock localStorage for Vitest
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Intervention Workflow - Input Validation', () => {
  const validInput: CreateInterventionInput = {
    student_id: 'CS2021001',
    student_name: 'Aarav Sharma',
    type: 'Academic Tutoring',
    priority: 'high',
    assigned_to: 'Dr. Ramesh Shastri',
    action_plan: 'Assign remedial sessions for Data Structures algorithm analysis.',
    created_at: '2026-10-01',
    target_follow_up_date: '2026-10-15',
    initial_status: 'pending',
  };

  it('accepts valid intervention input', () => {
    const result = validateInterventionInput(validInput);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it('rejects empty student_id and student_name', () => {
    const result = validateInterventionInput({
      ...validInput,
      student_id: '',
      student_name: '   ',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.student_id).toBeDefined();
    expect(result.errors.student_name).toBeDefined();
  });

  it('rejects invalid intervention type', () => {
    // @ts-expect-error testing invalid type
    const result = validateInterventionInput({ ...validInput, type: 'InvalidCategory' });
    expect(result.valid).toBe(false);
    expect(result.errors.type).toBeDefined();
  });

  it('rejects short assigned_to name and action plan under 5 characters', () => {
    const result = validateInterventionInput({
      ...validInput,
      assigned_to: 'A',
      action_plan: 'Plan',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.assigned_to).toBeDefined();
    expect(result.errors.action_plan).toBeDefined();
  });

  it('validates date formats and chronological order', () => {
    const invalidDateFormat = validateInterventionInput({
      ...validInput,
      created_at: '10/01/2026',
    });
    expect(invalidDateFormat.valid).toBe(false);
    expect(invalidDateFormat.errors.created_at).toBeDefined();

    const pastFollowUp = validateInterventionInput({
      ...validInput,
      created_at: '2026-10-15',
      target_follow_up_date: '2026-10-01',
    });
    expect(pastFollowUp.valid).toBe(false);
    expect(pastFollowUp.errors.target_follow_up_date).toContain('earlier than');
  });
});

describe('Intervention Workflow - Status Lifecycle Transitions', () => {
  it('permits valid lifecycle forward transitions', () => {
    expect(canTransitionStatus('pending', 'in_progress')).toBe(true);
    expect(canTransitionStatus('pending', 'escalated')).toBe(true);
    expect(canTransitionStatus('pending', 'resolved')).toBe(true);
    expect(canTransitionStatus('in_progress', 'resolved')).toBe(true);
    expect(canTransitionStatus('in_progress', 'escalated')).toBe(true);
    expect(canTransitionStatus('escalated', 'in_progress')).toBe(true);
    expect(canTransitionStatus('escalated', 'resolved')).toBe(true);
  });

  it('permits re-opening resolved cases to in_progress', () => {
    expect(canTransitionStatus('resolved', 'in_progress')).toBe(true);
  });

  it('prohibits illegal lifecycle regressions and self-transitions', () => {
    expect(canTransitionStatus('pending', 'pending')).toBe(false);
    expect(canTransitionStatus('in_progress', 'in_progress')).toBe(false);
    expect(canTransitionStatus('in_progress', 'pending')).toBe(false);
    expect(canTransitionStatus('resolved', 'pending')).toBe(false);
    expect(canTransitionStatus('resolved', 'escalated')).toBe(false);
  });
});

describe('Intervention Workflow - Mutation and Store Operations', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  const sampleIntervention: Intervention = {
    id: 'INT-TEST-001',
    student_id: 'CS2021001',
    student_name: 'Aarav Sharma',
    type: 'Academic Tutoring',
    priority: 'high',
    status: 'in_progress',
    assigned_to: 'Dr. Ramesh Shastri',
    created_at: '2026-10-01',
    target_follow_up_date: '2026-10-20',
    notes: 'Weekly remedial coding practice sessions scheduled.',
    status_history: [
      {
        from_status: 'pending',
        to_status: 'in_progress',
        timestamp: '2026-10-02T10:00:00Z',
        changed_by: 'Dr. Ramesh Shastri',
        notes: 'Session started.',
      },
    ],
  };

  it('creates new intervention and records history in localStorage', () => {
    const initialList: Intervention[] = [sampleIntervention];
    const { updatedList, newIntervention } = createInterventionRecord(initialList, {
      student_id: 'IS2021045',
      student_name: 'Bhavna Sen',
      type: 'Attendance Counseling',
      priority: 'critical',
      assigned_to: 'Prof. Arvind Kumar',
      action_plan: 'Contact student guardian and review 64% attendance records.',
      created_at: '2026-10-05',
      target_follow_up_date: '2026-10-12',
    });

    expect(updatedList.length).toBe(2);
    expect(newIntervention.student_id).toBe('IS2021045');
    expect(newIntervention.status).toBe('pending');
    expect(newIntervention.is_user_created).toBe(true);
    expect(newIntervention.status_history?.length).toBe(1);

    // Verify localStorage persistence
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    expect(saved.length).toBe(2);
    expect(saved[0].id).toBe(newIntervention.id);
  });

  it('requires resolution notes when resolving a case', () => {
    const list = [sampleIntervention];

    // Attempt to resolve without note
    expect(() => {
      updateInterventionLifecycleStatus(list, sampleIntervention.id, 'resolved', 'Dr. Ramesh', '');
    }).toThrow(/resolution note explaining the actions taken/);

    // Attempt with note < 5 chars
    expect(() => {
      updateInterventionLifecycleStatus(list, sampleIntervention.id, 'resolved', 'Dr. Ramesh', 'Done');
    }).toThrow(/resolution note explaining the actions taken/);

    // Successful resolution
    const { updatedList, updatedRecord } = updateInterventionLifecycleStatus(
      list,
      sampleIntervention.id,
      'resolved',
      'Dr. Ramesh',
      'Completed 4 remedial tutoring sessions. Midterm performance improved to 74%.'
    );

    expect(updatedRecord.status).toBe('resolved');
    expect(updatedRecord.outcome_notes).toContain('Completed 4 remedial tutoring');
    expect(updatedRecord.status_history?.length).toBe(2);
    expect(updatedList[0].status).toBe('resolved');
  });

  it('rejects illegal status transition via updateInterventionLifecycleStatus', () => {
    const list = [sampleIntervention]; // currently in_progress
    expect(() => {
      updateInterventionLifecycleStatus(list, sampleIntervention.id, 'pending', 'Admin');
    }).toThrow(/Illegal status transition/);
  });

  it('updates follow-up date and appends follow-up notes', () => {
    const list = [sampleIntervention];
    const { updatedRecord } = updateInterventionFollowUp(
      list,
      sampleIntervention.id,
      '2026-11-01',
      'Student completed mid-term check-in with faculty mentor.',
      'Dr. Ramesh'
    );

    expect(updatedRecord.target_follow_up_date).toBe('2026-11-01');
    expect(updatedRecord.notes).toContain('Student completed mid-term check-in');
    expect(updatedRecord.notes).toContain('Weekly remedial coding practice');
  });

  it('handles corrupted localStorage data gracefully with fallback to seed data', () => {
    const seeds = [sampleIntervention];

    // Case 1: Corrupt non-JSON string
    localStorage.setItem(STORAGE_KEY, 'invalid-broken-json{{{');
    const recovered1 = loadInterventionsFromStorage(seeds);
    expect(recovered1.length).toBe(1);
    expect(recovered1[0].id).toBe(sampleIntervention.id);

    // Case 2: Array with invalid schema
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ bad_field: true }]));
    const recovered2 = loadInterventionsFromStorage(seeds);
    expect(recovered2.length).toBe(1);

    // Case 3: Empty string
    localStorage.clear();
    const loadedFromEmpty = loadInterventionsFromStorage(seeds);
    expect(loadedFromEmpty.length).toBe(1);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});

describe('Intervention Workflow - Filtering, Metrics & Sorting', () => {
  const referenceDate = '2026-10-10';

  const testCases: Intervention[] = [
    {
      id: 'INT-001',
      student_id: 'CS2021001',
      student_name: 'Aarav Sharma',
      type: 'Academic Tutoring',
      priority: 'critical',
      status: 'pending',
      assigned_to: 'Dr. Ramesh Shastri',
      created_at: '2026-09-20',
      target_follow_up_date: '2026-10-05', // Overdue relative to 2026-10-10
      notes: 'Urgent math tutoring required.',
    },
    {
      id: 'INT-002',
      student_id: 'EC2021015',
      student_name: 'Bhavna Sen',
      type: 'Attendance Counseling',
      priority: 'high',
      status: 'in_progress',
      assigned_to: 'Prof. Ananya Roy',
      created_at: '2026-10-01',
      target_follow_up_date: '2026-10-14', // Due soon (4 days from 2026-10-10)
      notes: 'Attendance review meeting scheduled.',
    },
    {
      id: 'INT-003',
      student_id: 'IS2021020',
      student_name: 'Chetan Patel',
      type: 'Placement Upskilling',
      priority: 'medium',
      status: 'resolved',
      assigned_to: 'Prof. Arvind Kumar',
      created_at: '2026-09-01',
      target_follow_up_date: '2026-09-15',
      notes: 'Coding clinic completed.',
      outcome_notes: 'Achieved 82/100 on coding assessment.',
    },
    {
      id: 'INT-004',
      student_id: 'ME2021030',
      student_name: 'Divya Nair',
      type: 'Wellness Check',
      priority: 'low',
      status: 'escalated',
      assigned_to: 'Dr. Ramesh Shastri',
      created_at: '2026-10-08',
      target_follow_up_date: '2026-10-25', // Not due soon
      notes: 'Dean referral.',
    },
  ];

  it('computes accurate operational metrics without fabrication', () => {
    const metrics = computeInterventionMetrics(testCases, referenceDate);
    expect(metrics.totalCases).toBe(4);
    expect(metrics.openCases).toBe(3); // pending, in_progress, escalated
    expect(metrics.awaitingAssignment).toBe(1); // pending
    expect(metrics.resolvedCases).toBe(1);
    expect(metrics.overdueCount).toBe(1); // INT-001 is overdue
    expect(metrics.dueSoonOrOverdue).toBe(2); // INT-001 (overdue) + INT-002 (due Oct 14, <= 7 days)
  });

  it('filters interventions by search query across multiple fields', () => {
    const byName = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, searchQuery: 'Aarav' });
    expect(byName.length).toBe(1);
    expect(byName[0].id).toBe('INT-001');

    const byUsn = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, searchQuery: 'EC2021015' });
    expect(byUsn.length).toBe(1);

    const byNotes = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, searchQuery: 'clinic' });
    expect(byNotes.length).toBe(1);
    expect(byNotes[0].id).toBe('INT-003');
  });

  it('filters by status, type, priority, and assignee', () => {
    const openOnly = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, status: 'in_progress' });
    expect(openOnly.length).toBe(1);
    expect(openOnly[0].id).toBe('INT-002');

    const rameshOnly = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, assignedTo: 'Dr. Ramesh Shastri' });
    expect(rameshOnly.length).toBe(2);

    const criticalOnly = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, priority: 'critical' });
    expect(criticalOnly.length).toBe(1);
  });

  it('filters by overdue and due_soon timelines', () => {
    const overdue = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, dueFilter: 'overdue' }, referenceDate);
    expect(overdue.length).toBe(1);
    expect(overdue[0].id).toBe('INT-001');

    const dueSoon = filterInterventions(testCases, { ...INITIAL_INTERVENTION_FILTERS, dueFilter: 'due_soon' }, referenceDate);
    expect(dueSoon.length).toBe(1);
    expect(dueSoon[0].id).toBe('INT-002');
  });

  it('sorts correctly by priority and follow-up dates', () => {
    const sortedByPriority = sortInterventions(testCases, { field: 'priority', direction: 'desc' });
    expect(sortedByPriority[0].priority).toBe('critical');
    expect(sortedByPriority[sortedByPriority.length - 1].priority).toBe('low');

    const sortedByDateAsc = sortInterventions(testCases, { field: 'target_follow_up_date', direction: 'asc' });
    expect(sortedByDateAsc[0].target_follow_up_date).toBe('2026-09-15');
    expect(sortedByDateAsc[sortedByDateAsc.length - 1].target_follow_up_date).toBe('2026-10-25');
  });

  it('paginates records cleanly with correct boundaries', () => {
    const p1 = paginateInterventions(testCases, 1, 2);
    expect(p1.paginated.length).toBe(2);
    expect(p1.totalRecords).toBe(4);
    expect(p1.totalPages).toBe(2);
    expect(p1.startIndex).toBe(0);
    expect(p1.endIndex).toBe(2);

    const p2 = paginateInterventions(testCases, 2, 2);
    expect(p2.paginated.length).toBe(2);
    expect(p2.startIndex).toBe(2);
    expect(p2.endIndex).toBe(4);
  });
});
