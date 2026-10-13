import { useState, useMemo } from 'react';
import { UnifiedStudent } from '../../types/student';
import {
  StudentFilterCriteria,
  StudentSortConfig,
  INITIAL_FILTERS,
  INITIAL_SORT,
  filterStudents,
  sortStudents,
} from '../../utils/studentFilterSort';
import { StudentFilters } from './StudentFilters';
import { StudentTable } from './StudentTable';
import { StudentDetailDrawer } from './StudentDetailDrawer';

interface StudentDirectoryViewProps {
  students: UnifiedStudent[];
  initialSearchQuery?: string;
  selectedStudent: UnifiedStudent | null;
  onSelectStudent: (student: UnifiedStudent | null) => void;
  onNavigateToInterventions?: () => void;
  onTriggerIntervention?: (student: UnifiedStudent) => void;
}

export function StudentDirectoryView({
  students,
  initialSearchQuery = '',
  selectedStudent,
  onSelectStudent,
  onNavigateToInterventions,
  onTriggerIntervention,
}: StudentDirectoryViewProps) {
  // Filters State
  const [filters, setFilters] = useState<StudentFilterCriteria>(() => ({
    ...INITIAL_FILTERS,
    searchQuery: initialSearchQuery,
  }));

  // Sorting State
  const [sort, setSort] = useState<StudentSortConfig>(INITIAL_SORT);

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Filter students
  const filteredStudents = useMemo(() => {
    return filterStudents(students, filters);
  }, [students, filters]);

  // Sort students
  const sortedStudents = useMemo(() => {
    return sortStudents(filteredStudents, sort);
  }, [filteredStudents, sort]);

  // Handle Sort Change (toggle direction or set field)
  const handleSortChange = (field: StudentSortConfig['field']) => {
    setSort((prevSort) => {
      if (prevSort.field === field) {
        return {
          field,
          direction: prevSort.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        field,
        direction: field === 'academicRisk' ? 'desc' : 'asc',
      };
    });
  };

  // When filters change, reset page to 1
  const handleFiltersChange = (updatedFilters: StudentFilterCriteria) => {
    setFilters(updatedFilters);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Students</h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Find students, review their progress, and identify where support is needed. Filter by academic risk, placement readiness, or attendance to prioritize advising sessions.
          </p>
        </div>

        {/* Demo Record Notice */}
        <div className="flex items-center gap-2 text-xs font-medium text-amber-900 bg-amber-50 px-3 py-1.5 rounded border border-amber-200/80 shrink-0 self-start md:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Synthetic Student Roster (150 Records)</span>
        </div>
      </div>

      {/* Filter Controls */}
      <StudentFilters
        filters={filters}
        onChange={handleFiltersChange}
        totalStudents={students.length}
        filteredCount={filteredStudents.length}
      />

      {/* Student Table */}
      <StudentTable
        students={sortedStudents}
        sort={sort}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
        onSelectStudent={(stu) => onSelectStudent(stu)}
        onResetFilters={() => handleFiltersChange(INITIAL_FILTERS)}
      />

      {/* Inspection Drawer */}
      <StudentDetailDrawer
        student={selectedStudent}
        isOpen={selectedStudent !== null}
        onClose={() => onSelectStudent(null)}
        onTriggerIntervention={(stu) => {
          if (onTriggerIntervention) {
            onTriggerIntervention(stu);
          } else {
            onSelectStudent(null);
            onNavigateToInterventions?.();
          }
        }}
      />
    </div>
  );
}
