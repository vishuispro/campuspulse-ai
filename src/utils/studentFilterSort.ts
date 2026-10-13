/**
 * CampusPulse - Pure Filter, Sort & Pagination Logic for Student Directory
 */

import { UnifiedStudent } from '../types/student';

export interface StudentFilterCriteria {
  searchQuery: string;
  department: string;
  semester: string;
  riskLevel: string;
  placementTier: string;
  needsReviewOnly: boolean;
}

export type StudentSortField =
  | 'name'
  | 'id'
  | 'department'
  | 'semester'
  | 'cgpa'
  | 'attendance'
  | 'academicRisk'
  | 'placementReadiness'
  | 'successScore';

export type SortDirection = 'asc' | 'desc';

export interface StudentSortConfig {
  field: StudentSortField;
  direction: SortDirection;
}

export const INITIAL_FILTERS: StudentFilterCriteria = {
  searchQuery: '',
  department: 'all',
  semester: 'all',
  riskLevel: 'all',
  placementTier: 'all',
  needsReviewOnly: false,
};

export const INITIAL_SORT: StudentSortConfig = {
  field: 'academicRisk',
  direction: 'desc', // Faculty priority: at-risk students on top
};

/**
 * Pure filtering function combining search, department, semester,
 * risk tier, placement tier, and "Needs Review" flag.
 */
export function filterStudents(
  students: UnifiedStudent[],
  filters: StudentFilterCriteria
): UnifiedStudent[] {
  return students.filter((student) => {
    // 1. Search Query (Name, ID, Mentor, or Department)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchName = student.name.toLowerCase().includes(q);
      const matchId = student.id.toLowerCase().includes(q);
      const matchDept = student.department.toLowerCase().includes(q);
      const matchMentor = student.mentorName.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDept && !matchMentor) {
        return false;
      }
    }

    // 2. Department Filter
    if (filters.department !== 'all' && student.department !== filters.department) {
      return false;
    }

    // 3. Semester Filter
    if (filters.semester !== 'all' && String(student.semester) !== filters.semester) {
      return false;
    }

    // 4. Academic Risk Tier
    if (filters.riskLevel !== 'all' && student.academicRisk.level !== filters.riskLevel) {
      return false;
    }

    // 5. Placement Readiness Tier
    if (filters.placementTier !== 'all' && student.placementReadiness.tier !== filters.placementTier) {
      return false;
    }

    // 6. "Needs Review Only" Toggle
    // Criteria: Critical/High Academic Risk OR Placement At Risk OR Active Backlogs OR Attendance < 75%
    if (filters.needsReviewOnly) {
      const isAcademicRisk =
        student.academicRisk.level === 'Critical' || student.academicRisk.level === 'High';
      const isPlacementBlocked = student.placementReadiness.isBacklogBlocked;
      const isAttendanceCritical =
        student.attendance !== null && student.attendance.overall_attendance_pct < 75;
      const hasBacklogs = student.academic !== null && student.academic.backlogs_count > 0;

      if (!isAcademicRisk && !isPlacementBlocked && !isAttendanceCritical && !hasBacklogs) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Pure sorting function for numeric and alphabetical student attributes.
 */
export function sortStudents(
  students: UnifiedStudent[],
  sort: StudentSortConfig
): UnifiedStudent[] {
  return [...students].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'department':
        comparison = a.department.localeCompare(b.department);
        break;
      case 'semester':
        comparison = a.semester - b.semester;
        break;
      case 'cgpa': {
        const valA = a.academic?.cgpa ?? -1;
        const valB = b.academic?.cgpa ?? -1;
        comparison = valA - valB;
        break;
      }
      case 'attendance': {
        const valA = a.attendance?.overall_attendance_pct ?? -1;
        const valB = b.attendance?.overall_attendance_pct ?? -1;
        comparison = valA - valB;
        break;
      }
      case 'academicRisk':
        comparison = a.academicRisk.score - b.academicRisk.score;
        break;
      case 'placementReadiness':
        comparison = a.placementReadiness.score - b.placementReadiness.score;
        break;
      case 'successScore':
        comparison = a.successScore.score - b.successScore.score;
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
export function paginateStudents(
  students: UnifiedStudent[],
  page: number,
  pageSize: number
): {
  paginated: UnifiedStudent[];
  totalPages: number;
  currentPage: number;
  startIndex: number;
  endIndex: number;
  totalRecords: number;
} {
  const totalRecords = students.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginated = students.slice(startIndex, endIndex);

  return {
    paginated,
    totalPages,
    currentPage: validPage,
    startIndex,
    endIndex,
    totalRecords,
  };
}
