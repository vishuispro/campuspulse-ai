/**
 * CampusPulse - Pure Filter, Sort, Metrics & Pagination Logic for Interventions
 */

import {
  Intervention,
  InterventionPriority,
} from '../types/student';

export interface InterventionFilterCriteria {
  searchQuery: string;
  status: string; // 'all' | InterventionStatus
  type: string; // 'all' | InterventionType
  priority: string; // 'all' | InterventionPriority
  assignedTo: string; // 'all' | string
  dueFilter: 'all' | 'overdue' | 'due_soon';
}

export type InterventionSortField =
  | 'target_follow_up_date'
  | 'created_at'
  | 'priority'
  | 'student_name'
  | 'status'
  | 'type';

export interface InterventionSortConfig {
  field: InterventionSortField;
  direction: 'asc' | 'desc';
}

export interface InterventionMetrics {
  totalCases: number;
  openCases: number;
  awaitingAssignment: number;
  dueSoonOrOverdue: number;
  overdueCount: number;
  resolvedCases: number;
}

export const INITIAL_INTERVENTION_FILTERS: InterventionFilterCriteria = {
  searchQuery: '',
  status: 'all',
  type: 'all',
  priority: 'all',
  assignedTo: 'all',
  dueFilter: 'all',
};

export const INITIAL_INTERVENTION_SORT: InterventionSortConfig = {
  field: 'target_follow_up_date',
  direction: 'asc', // Follow-ups due earliest first
};

const PRIORITY_WEIGHTS: Record<InterventionPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Computes live summary metrics from actual intervention records.
 */
export function computeInterventionMetrics(
  interventions: Intervention[],
  referenceDateStr: string = new Date().toISOString().slice(0, 10)
): InterventionMetrics {
  let openCases = 0;
  let awaitingAssignment = 0;
  let dueSoonOrOverdue = 0;
  let overdueCount = 0;
  let resolvedCases = 0;

  const refTimestamp = Date.parse(referenceDateStr);
  const sevenDaysLaterTimestamp = refTimestamp + 7 * 24 * 60 * 60 * 1000;

  for (const item of interventions) {
    const isOpen = item.status === 'pending' || item.status === 'in_progress' || item.status === 'escalated';
    if (isOpen) {
      openCases++;

      if (item.status === 'pending') {
        awaitingAssignment++;
      }

      const followUpTimestamp = Date.parse(item.target_follow_up_date);
      if (!isNaN(followUpTimestamp)) {
        if (followUpTimestamp < refTimestamp) {
          overdueCount++;
          dueSoonOrOverdue++;
        } else if (followUpTimestamp <= sevenDaysLaterTimestamp) {
          dueSoonOrOverdue++;
        }
      }
    } else if (item.status === 'resolved') {
      resolvedCases++;
    }
  }

  return {
    totalCases: interventions.length,
    openCases,
    awaitingAssignment,
    dueSoonOrOverdue,
    overdueCount,
    resolvedCases,
  };
}

/**
 * Pure filtering for interventions.
 */
export function filterInterventions(
  interventions: Intervention[],
  filters: InterventionFilterCriteria,
  referenceDateStr: string = new Date().toISOString().slice(0, 10)
): Intervention[] {
  const refTimestamp = Date.parse(referenceDateStr);
  const sevenDaysLaterTimestamp = refTimestamp + 7 * 24 * 60 * 60 * 1000;

  return interventions.filter((item) => {
    // 1. Search Query (Student Name, Student ID, Notes, or ID)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = item.student_name.toLowerCase().includes(q);
      const matchStudentId = item.student_id.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      const matchAssignee = item.assigned_to.toLowerCase().includes(q);
      const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
      const matchOutcome = item.outcome_notes ? item.outcome_notes.toLowerCase().includes(q) : false;
      if (
        !matchName &&
        !matchStudentId &&
        !matchId &&
        !matchAssignee &&
        !matchNotes &&
        !matchOutcome
      ) {
        return false;
      }
    }

    // 2. Status Filter
    if (filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    // 3. Category / Type Filter
    if (filters.type !== 'all' && item.type !== filters.type) {
      return false;
    }

    // 4. Priority Filter
    if (filters.priority !== 'all' && item.priority !== filters.priority) {
      return false;
    }

    // 5. Assignee Filter
    if (filters.assignedTo !== 'all' && item.assigned_to !== filters.assignedTo) {
      return false;
    }

    // 6. Due Filter
    if (filters.dueFilter !== 'all') {
      if (item.status === 'resolved') return false;
      const followUpTimestamp = Date.parse(item.target_follow_up_date);
      if (isNaN(followUpTimestamp)) return false;

      if (filters.dueFilter === 'overdue' && followUpTimestamp >= refTimestamp) {
        return false;
      }
      if (filters.dueFilter === 'due_soon' && (followUpTimestamp < refTimestamp || followUpTimestamp > sevenDaysLaterTimestamp)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Pure sorting for interventions.
 */
export function sortInterventions(
  interventions: Intervention[],
  sort: InterventionSortConfig
): Intervention[] {
  return [...interventions].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'target_follow_up_date':
        comparison = a.target_follow_up_date.localeCompare(b.target_follow_up_date);
        break;
      case 'created_at':
        comparison = a.created_at.localeCompare(b.created_at);
        break;
      case 'priority': {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 0;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 0;
        comparison = weightA - weightB;
        break;
      }
      case 'student_name':
        comparison = a.student_name.localeCompare(b.student_name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      default:
        comparison = 0;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Pure pagination slice calculation.
 */
export function paginateInterventions(
  interventions: Intervention[],
  page: number,
  pageSize: number
): {
  paginated: Intervention[];
  totalPages: number;
  currentPage: number;
  startIndex: number;
  endIndex: number;
  totalRecords: number;
} {
  const totalRecords = interventions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginated = interventions.slice(startIndex, endIndex);

  return {
    paginated,
    totalPages,
    currentPage: validPage,
    startIndex,
    endIndex,
    totalRecords,
  };
}
