import { describe, it, expect, beforeAll } from 'vitest';
import { generateSyntheticDataset } from '../data/syntheticDataGenerator';
import { parseCsvString } from '../services/csvParser';
import { reconcileCampusData } from '../services/dataReconciler';
import {
  RawAcademicRecord,
  RawAttendanceRecord,
  RawLMSActivityRecord,
  RawPlacementRecord,
  UnifiedStudent,
} from '../types/student';
import {
  filterStudents,
  sortStudents,
  paginateStudents,
  INITIAL_FILTERS,
} from '../utils/studentFilterSort';

describe('Student Directory - Filter, Sort & Pagination Logic', () => {
  let students: UnifiedStudent[];

  beforeAll(() => {
    const bundle = generateSyntheticDataset(150);
    const academics = parseCsvString<RawAcademicRecord>(bundle.academicsCsv).data;
    const attendance = parseCsvString<RawAttendanceRecord>(bundle.attendanceCsv).data;
    const lms = parseCsvString<RawLMSActivityRecord>(bundle.lmsCsv).data;
    const placement = parseCsvString<RawPlacementRecord>(bundle.placementCsv).data;

    const reconciled = reconcileCampusData({
      academics,
      attendance,
      lms,
      placement,
    });
    students = reconciled.students;
  });

  it('loads all 151 students initially with default filters', () => {
    const filtered = filterStudents(students, INITIAL_FILTERS);
    expect(filtered.length).toBe(151); // 150 + 1 intentional unmatched record
  });

  it('filters students by search query (name or student ID)', () => {
    // Search by specific ID
    const byId = filterStudents(students, {
      ...INITIAL_FILTERS,
      searchQuery: '1MS22CS001',
    });
    expect(byId.length).toBe(1);
    expect(byId[0].id).toBe('1MS22CS001');

    // Search by partial name
    const byName = filterStudents(students, {
      ...INITIAL_FILTERS,
      searchQuery: 'Dev',
    });
    expect(byName.length).toBeGreaterThan(0);
    expect(byName.every((s) => s.name.toLowerCase().includes('dev'))).toBe(true);
  });

  it('filters students by department accurately', () => {
    const cseStudents = filterStudents(students, {
      ...INITIAL_FILTERS,
      department: 'Computer Science',
    });
    expect(cseStudents.length).toBeGreaterThan(30);
    expect(cseStudents.every((s) => s.department === 'Computer Science')).toBe(true);
  });

  it('filters students by semester accurately', () => {
    const sem6 = filterStudents(students, {
      ...INITIAL_FILTERS,
      semester: '6',
    });
    expect(sem6.length).toBeGreaterThan(0);
    expect(sem6.every((s) => s.semester === 6)).toBe(true);
  });

  it('filters students by academic risk tier', () => {
    const criticalStudents = filterStudents(students, {
      ...INITIAL_FILTERS,
      riskLevel: 'Critical',
    });
    expect(criticalStudents.length).toBeGreaterThan(0);
    expect(criticalStudents.every((s) => s.academicRisk.level === 'Critical')).toBe(true);
  });

  it('filters students by placement readiness tier', () => {
    const tier1Students = filterStudents(students, {
      ...INITIAL_FILTERS,
      placementTier: 'Tier-1 Ready',
    });
    expect(tier1Students.length).toBeGreaterThan(0);
    expect(tier1Students.every((s) => s.placementReadiness.tier === 'Tier-1 Ready')).toBe(true);
  });

  it('filters students by "Needs Review" toggle', () => {
    const needsReview = filterStudents(students, {
      ...INITIAL_FILTERS,
      needsReviewOnly: true,
    });
    expect(needsReview.length).toBeGreaterThan(0);
    // Every student in needsReview must satisfy at least one priority review criterion
    expect(
      needsReview.every(
        (s) =>
          s.academicRisk.level === 'Critical' ||
          s.academicRisk.level === 'High' ||
          s.placementReadiness.isBacklogBlocked ||
          (s.attendance && s.attendance.overall_attendance_pct < 75) ||
          (s.academic && s.academic.backlogs_count > 0)
      )
    ).toBe(true);
  });

  it('combines multiple filters correctly without unexpected overrides', () => {
    const combined = filterStudents(students, {
      searchQuery: '',
      department: 'Computer Science',
      semester: '6',
      riskLevel: 'all',
      placementTier: 'all',
      needsReviewOnly: false,
    });

    expect(combined.length).toBeGreaterThan(0);
    expect(combined.every((s) => s.department === 'Computer Science' && s.semester === 6)).toBe(true);
  });

  it('sorts students correctly in ascending and descending order', () => {
    // Sort by Academic Risk Score descending (faculty priority)
    const sortedDesc = sortStudents(students, {
      field: 'academicRisk',
      direction: 'desc',
    });
    expect(sortedDesc[0].academicRisk.score).toBeGreaterThanOrEqual(
      sortedDesc[sortedDesc.length - 1].academicRisk.score
    );

    // Sort by CGPA ascending
    const sortedCgpaAsc = sortStudents(students, {
      field: 'cgpa',
      direction: 'asc',
    });
    const firstCgpa = sortedCgpaAsc[0].academic?.cgpa ?? 0;
    const lastCgpa = sortedCgpaAsc[sortedCgpaAsc.length - 1].academic?.cgpa ?? 10;
    expect(firstCgpa).toBeLessThanOrEqual(lastCgpa);
  });

  it('paginates records correctly without data loss', () => {
    const pageSize = 10;
    const page1 = paginateStudents(students, 1, pageSize);
    expect(page1.paginated.length).toBe(10);
    expect(page1.totalPages).toBe(Math.ceil(students.length / pageSize));
    expect(page1.currentPage).toBe(1);
    expect(page1.startIndex).toBe(0);
    expect(page1.endIndex).toBe(10);

    const page2 = paginateStudents(students, 2, pageSize);
    expect(page2.paginated.length).toBe(10);
    expect(page2.startIndex).toBe(10);
    expect(page2.endIndex).toBe(20);
    expect(page1.paginated[0].id).not.toBe(page2.paginated[0].id);
  });

  it('handles missing components cleanly without throwing or fabricating zeros', () => {
    const missingLmsStudent = students.find((s) => s.missingStreams.includes('LMS Activity'));
    expect(missingLmsStudent).toBeDefined();
    expect(missingLmsStudent?.lms).toBeNull();
    // Scoring confidence reflects missing component
    expect(missingLmsStudent?.academicRisk.missingComponents).toContain('LMS Engagement');

    const missingPlacementStudent = students.find((s) => s.missingStreams.includes('Placement Assessments'));
    expect(missingPlacementStudent).toBeDefined();
    expect(missingPlacementStudent?.placement).toBeNull();
    expect(missingPlacementStudent?.placementReadiness.missingComponents).toContain('Placement Assessments');
  });
});
