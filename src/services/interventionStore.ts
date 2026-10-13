/**
 * CampusPulse - Intervention Storage, Lifecycle & Validation Engine
 * 
 * Provides:
 * - LocalStorage persistence with schema validation & corruption recovery
 * - Controlled status lifecycle transitions (Pending -> In Progress -> Resolved / Escalated)
 * - Required resolution notes enforcement
 * - Pure creation and update operations
 */

import {
  Intervention,
  InterventionType,
  InterventionPriority,
  InterventionStatus,
} from '../types/student';

export const STORAGE_KEY = 'campuspulse_interventions_v1';

export interface CreateInterventionInput {
  student_id: string;
  student_name: string;
  type: InterventionType;
  priority: InterventionPriority;
  assigned_to: string;
  action_plan: string;
  created_at: string; // YYYY-MM-DD
  target_follow_up_date: string; // YYYY-MM-DD
  initial_status?: InterventionStatus;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const VALID_INTERVENTION_TYPES: InterventionType[] = [
  'Academic Tutoring',
  'Attendance Counseling',
  'Placement Upskilling',
  'Dean Advisory',
  'Wellness Check',
];

export const VALID_PRIORITIES: InterventionPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
];

export const VALID_STATUSES: InterventionStatus[] = [
  'pending',
  'in_progress',
  'resolved',
  'escalated',
];

/**
 * Validates date string in YYYY-MM-DD format
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const timestamp = Date.parse(dateStr);
  return !isNaN(timestamp);
}

/**
 * Validates intervention creation input
 */
export function validateInterventionInput(input: CreateInterventionInput): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.student_id || !input.student_id.trim()) {
    errors.student_id = 'A student must be selected for the intervention.';
  }

  if (!input.student_name || !input.student_name.trim()) {
    errors.student_name = 'Student name is required.';
  }

  if (!VALID_INTERVENTION_TYPES.includes(input.type)) {
    errors.type = 'A valid intervention category must be specified.';
  }

  if (!VALID_PRIORITIES.includes(input.priority)) {
    errors.priority = 'A valid priority level must be selected.';
  }

  if (!input.assigned_to || input.assigned_to.trim().length < 2) {
    errors.assigned_to = 'An assigned faculty advisor or mentor name is required (min 2 characters).';
  }

  if (!input.action_plan || input.action_plan.trim().length < 5) {
    errors.action_plan = 'A clear action plan or counseling note is required (min 5 characters).';
  }

  if (!isValidDateString(input.created_at)) {
    errors.created_at = 'Created date must be a valid date in YYYY-MM-DD format.';
  }

  if (!isValidDateString(input.target_follow_up_date)) {
    errors.target_follow_up_date = 'Target follow-up date must be a valid date in YYYY-MM-DD format.';
  } else if (isValidDateString(input.created_at) && input.target_follow_up_date < input.created_at) {
    errors.target_follow_up_date = 'Target follow-up date cannot be earlier than the creation date.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Determines whether a status transition is legally permitted in the lifecycle.
 * Enforces controlled workflow:
 * - Pending -> In Progress, Escalated, Resolved
 * - In Progress -> Resolved, Escalated
 * - Escalated -> In Progress, Resolved
 * - Resolved -> In Progress (Re-opening)
 * Arbitrary transitions (e.g. Resolved -> Pending) are rejected.
 */
export function canTransitionStatus(
  currentStatus: InterventionStatus,
  targetStatus: InterventionStatus
): boolean {
  if (currentStatus === targetStatus) return false;

  switch (currentStatus) {
    case 'pending':
      return targetStatus === 'in_progress' || targetStatus === 'escalated' || targetStatus === 'resolved';
    case 'in_progress':
      return targetStatus === 'resolved' || targetStatus === 'escalated';
    case 'escalated':
      return targetStatus === 'in_progress' || targetStatus === 'resolved';
    case 'resolved':
      // Re-opening: Allowed to transition back to in_progress with notes
      return targetStatus === 'in_progress';
    default:
      return false;
  }
}

/**
 * Validates a single Intervention record loaded from localStorage.
 */
export function isValidInterventionRecord(record: unknown): record is Intervention {
  if (!record || typeof record !== 'object') return false;
  const item = record as Partial<Intervention>;

  return (
    typeof item.id === 'string' &&
    typeof item.student_id === 'string' &&
    typeof item.student_name === 'string' &&
    VALID_INTERVENTION_TYPES.includes(item.type as InterventionType) &&
    VALID_PRIORITIES.includes(item.priority as InterventionPriority) &&
    VALID_STATUSES.includes(item.status as InterventionStatus) &&
    typeof item.assigned_to === 'string' &&
    typeof item.created_at === 'string' &&
    typeof item.target_follow_up_date === 'string' &&
    typeof item.notes === 'string'
  );
}

/**
 * Loads stored interventions from localStorage.
 * If empty or corrupt, initializes with seed interventions.
 */
export function loadInterventionsFromStorage(seedInterventions: Intervention[]): Intervention[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveInterventionsToStorage(seedInterventions);
      return seedInterventions;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      saveInterventionsToStorage(seedInterventions);
      return seedInterventions;
    }

    // Filter and sanitize valid records
    const validRecords = parsed.filter(isValidInterventionRecord);
    if (validRecords.length === 0) {
      saveInterventionsToStorage(seedInterventions);
      return seedInterventions;
    }

    return validRecords;
  } catch (err) {
    console.warn('Failed to parse interventions from localStorage, falling back to seed data:', err);
    saveInterventionsToStorage(seedInterventions);
    return seedInterventions;
  }
}

/**
 * Saves interventions list to localStorage.
 */
export function saveInterventionsToStorage(interventions: Intervention[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interventions));
  } catch (err) {
    console.warn('Failed to write interventions to localStorage:', err);
  }
}

/**
 * Creates and appends a new intervention record.
 */
export function createInterventionRecord(
  currentList: Intervention[],
  input: CreateInterventionInput
): { updatedList: Intervention[]; newIntervention: Intervention } {
  const validation = validateInterventionInput(input);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Validation failed: ${firstError}`);
  }

  const newId = `INT-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

  const newIntervention: Intervention = {
    id: newId,
    student_id: input.student_id.trim().toUpperCase(),
    student_name: input.student_name.trim(),
    type: input.type,
    priority: input.priority,
    status: input.initial_status || 'pending',
    assigned_to: input.assigned_to.trim(),
    created_at: input.created_at,
    target_follow_up_date: input.target_follow_up_date,
    notes: input.action_plan.trim(),
    is_user_created: true,
    status_history: [
      {
        from_status: 'pending',
        to_status: input.initial_status || 'pending',
        timestamp: new Date().toISOString(),
        changed_by: input.assigned_to.trim(),
        notes: 'Intervention case created.',
      },
    ],
  };

  const updatedList = [newIntervention, ...currentList];
  saveInterventionsToStorage(updatedList);

  return { updatedList, newIntervention };
}

/**
 * Updates status of an intervention according to lifecycle rules.
 * Requires resolution notes when target status is 'resolved'.
 */
export function updateInterventionLifecycleStatus(
  currentList: Intervention[],
  id: string,
  targetStatus: InterventionStatus,
  changedBy: string,
  resolutionNote?: string
): { updatedList: Intervention[]; updatedRecord: Intervention } {
  const index = currentList.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Intervention with ID "${id}" was not found.`);
  }

  const existing = currentList[index];

  if (!canTransitionStatus(existing.status, targetStatus)) {
    throw new Error(
      `Illegal status transition: cannot change status from "${existing.status}" to "${targetStatus}".`
    );
  }

  if (targetStatus === 'resolved') {
    if (!resolutionNote || resolutionNote.trim().length < 5) {
      throw new Error(
        'A concise resolution note explaining the actions taken and student response is required when resolving a case.'
      );
    }
  }

  const historyEntry = {
    from_status: existing.status,
    to_status: targetStatus,
    timestamp: new Date().toISOString(),
    changed_by: changedBy.trim() || 'Faculty Advisor',
    notes: resolutionNote ? resolutionNote.trim() : `Status transitioned to ${targetStatus}.`,
  };

  const updatedRecord: Intervention = {
    ...existing,
    status: targetStatus,
    outcome_notes: targetStatus === 'resolved' ? resolutionNote?.trim() : existing.outcome_notes,
    status_history: [...(existing.status_history || []), historyEntry],
  };

  const updatedList = [...currentList];
  updatedList[index] = updatedRecord;
  saveInterventionsToStorage(updatedList);

  return { updatedList, updatedRecord };
}

/**
 * Updates follow-up date and appends notes to an existing intervention.
 */
export function updateInterventionFollowUp(
  currentList: Intervention[],
  id: string,
  newFollowUpDate: string,
  newNoteText?: string,
  changedBy?: string
): { updatedList: Intervention[]; updatedRecord: Intervention } {
  const index = currentList.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error(`Intervention with ID "${id}" was not found.`);
  }

  if (!isValidDateString(newFollowUpDate)) {
    throw new Error('New follow-up date must be a valid date in YYYY-MM-DD format.');
  }

  const existing = currentList[index];
  let combinedNotes = existing.notes;
  if (newNoteText && newNoteText.trim()) {
    const timestampHeader = `\n[Follow-up ${new Date().toISOString().slice(0, 10)}${changedBy ? ` by ${changedBy}` : ''}]: `;
    combinedNotes += timestampHeader + newNoteText.trim();
  }

  const updatedRecord: Intervention = {
    ...existing,
    target_follow_up_date: newFollowUpDate,
    notes: combinedNotes,
  };

  const updatedList = [...currentList];
  updatedList[index] = updatedRecord;
  saveInterventionsToStorage(updatedList);

  return { updatedList, updatedRecord };
}
