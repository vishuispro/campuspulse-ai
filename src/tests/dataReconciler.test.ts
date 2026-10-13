import { describe, it, expect } from 'vitest';
import { reconcileCampusData } from '../services/dataReconciler';
import { parseCsvString } from '../services/csvParser';
import { generateSyntheticDataset } from '../data/syntheticDataGenerator';
import {
  RawAcademicRecord,
  RawAttendanceRecord,
  RawLMSActivityRecord,
  RawPlacementRecord,
} from '../types/student';

describe('Data Reconciler - Cross-Stream Integration & Validation', () => {
  it('successfully parses and reconciles the 150 synthetic students dataset', () => {
    const bundle = generateSyntheticDataset(150);

    const parsedAcademics = parseCsvString<RawAcademicRecord>(bundle.academicsCsv);
    const parsedAttendance = parseCsvString<RawAttendanceRecord>(bundle.attendanceCsv);
    const parsedLms = parseCsvString<RawLMSActivityRecord>(bundle.lmsCsv);
    const parsedPlacement = parseCsvString<RawPlacementRecord>(bundle.placementCsv);

    expect(parsedAcademics.data.length).toBe(150);
    expect(parsedAttendance.data.length).toBe(151); // 150 + 1 intentional unmatched record

    const result = reconcileCampusData({
      academics: parsedAcademics.data,
      attendance: parsedAttendance.data,
      lms: parsedLms.data,
      placement: parsedPlacement.data,
    });

    expect(result.students.length).toBe(151);
    expect(result.report.totalUniqueStudents).toBe(151);

    // Verify unmatched record detection (1MS22CS999 in attendance but not in academics)
    const unmatched = result.report.unmatchedRecords.find((u) => u.student_id === '1MS22CS999');
    expect(unmatched).toBeDefined();
    expect(unmatched?.file).toBe('attendance.csv');

    // Verify intentional missing data cases (1MS22CS148 missing LMS, 1MS22CS149 missing placement)
    const stu148 = result.students.find((s) => s.id === '1MS22ME148' || s.id.includes('148'));
    expect(stu148).toBeDefined();
    expect(stu148?.missingStreams).toContain('LMS Activity');

    const stu149 = result.students.find((s) => s.id === '1MS22CS149' || s.id.includes('149'));
    expect(stu149).toBeDefined();
    expect(stu149?.missingStreams).toContain('Placement Assessments');
  });

  it('detects duplicate student IDs within a single file', () => {
    const academicsWithDup: RawAcademicRecord[] = [
      {
        student_id: '1MS22CS001',
        name: 'Alice',
        department: 'Computer Science',
        semester: 6,
        cgpa: 8.5,
        internal_midterm_pct: 80,
        backlogs_count: 0,
        mentor_name: 'Dr. A',
      },
      {
        student_id: '1MS22CS001', // duplicate
        name: 'Alice Duplicate',
        department: 'Computer Science',
        semester: 6,
        cgpa: 8.5,
        internal_midterm_pct: 80,
        backlogs_count: 0,
        mentor_name: 'Dr. A',
      },
    ];

    const result = reconcileCampusData({
      academics: academicsWithDup,
      attendance: [],
      lms: [],
      placement: [],
    });

    const dup = result.report.duplicateIds.find((d) => d.student_id === '1MS22CS001');
    expect(dup).toBeDefined();
    expect(dup?.file).toBe('academics.csv');
  });

  it('detects out-of-range fields and logs validation warnings without crashing', () => {
    const invalidRecords: RawAcademicRecord[] = [
      {
        student_id: '1MS22CS010',
        name: 'Invalid Marks Student',
        department: 'Computer Science',
        semester: 6,
        cgpa: 14.5, // Out of bounds (> 10.0)
        internal_midterm_pct: -20, // Out of bounds (< 0)
        backlogs_count: 0,
        mentor_name: 'Dr. B',
      },
    ];

    const result = reconcileCampusData({
      academics: invalidRecords,
      attendance: [],
      lms: [],
      placement: [],
    });

    const cgpaIssue = result.report.validationIssues.find((i) => i.field === 'cgpa');
    const marksIssue = result.report.validationIssues.find((i) => i.field === 'internal_midterm_pct');

    expect(cgpaIssue).toBeDefined();
    expect(cgpaIssue?.severity).toBe('warning');
    expect(marksIssue).toBeDefined();

    // Student should still be created with clamped/sanitized values
    const student = result.students.find((s) => s.id === '1MS22CS010');
    expect(student).toBeDefined();
    expect(student?.academic?.cgpa).toBeLessThanOrEqual(10.0);
  });
});
