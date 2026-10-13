import { useState, useEffect, useMemo } from 'react';
import { generateSyntheticDataset } from './data/syntheticDataGenerator';
import { parseCsvString } from './services/csvParser';
import { reconcileCampusData, ReconciliationResult } from './services/dataReconciler';
import {
  RawAcademicRecord,
  RawAttendanceRecord,
  RawLMSActivityRecord,
  RawPlacementRecord,
  RawInterventionRecord,
  UnifiedStudent,
  Intervention,
  InterventionStatus,
} from './types/student';
import {
  CreateInterventionInput,
  loadInterventionsFromStorage,
  createInterventionRecord,
  updateInterventionLifecycleStatus,
  updateInterventionFollowUp,
} from './services/interventionStore';
import { NavigationPage, UserRole } from './types/navigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/overview/OverviewView';
import { StudentDirectoryView } from './components/students/StudentDirectoryView';
import { InterventionManagementView } from './components/interventions/InterventionManagementView';
import { PagePlaceholder } from './components/common/PagePlaceholder';

const getInitialPage = (): NavigationPage => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('page');
    if (p && ['overview', 'students', 'interventions', 'placement', 'data'].includes(p)) {
      return p as NavigationPage;
    }
  }
  return 'overview';
};

export default function App() {
  const [dataResult, setDataResult] = useState<ReconciliationResult | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [prefilledStudentForIntervention, setPrefilledStudentForIntervention] = useState<UnifiedStudent | null>(null);
  const [autoOpenCreateIntervention, setAutoOpenCreateIntervention] = useState(false);
  const [currentPage, setCurrentPage] = useState<NavigationPage>(getInitialPage);
  const [currentRole, setCurrentRole] = useState<UserRole>('administrator');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<UnifiedStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Initialize synthetic dataset and domain engine
  useEffect(() => {
    const bundle = generateSyntheticDataset(150);

    const academics = parseCsvString<RawAcademicRecord>(bundle.academicsCsv).data;
    const attendance = parseCsvString<RawAttendanceRecord>(bundle.attendanceCsv).data;
    const lms = parseCsvString<RawLMSActivityRecord>(bundle.lmsCsv).data;
    const placement = parseCsvString<RawPlacementRecord>(bundle.placementCsv).data;
    const rawInterventions = parseCsvString<RawInterventionRecord>(bundle.interventionsCsv).data;

    const reconciled = reconcileCampusData({
      academics,
      attendance,
      lms,
      placement,
      interventions: rawInterventions,
    });

    // Extract seed interventions and load from localStorage
    const seedInterventions = reconciled.students.flatMap((s) => s.interventions);
    const storedInterventions = loadInterventionsFromStorage(seedInterventions);

    setInterventions(storedInterventions);
    setDataResult(reconciled);
    setIsLoading(false);
  }, []);

  // Sync unified students with reactive interventions
  const studentsWithInterventions = useMemo(() => {
    if (!dataResult) return [];
    const interventionsByStudent = new Map<string, Intervention[]>();
    for (const item of interventions) {
      const list = interventionsByStudent.get(item.student_id) || [];
      list.push(item);
      interventionsByStudent.set(item.student_id, list);
    }

    return dataResult.students.map((student) => ({
      ...student,
      interventions: interventionsByStudent.get(student.id) || [],
    }));
  }, [dataResult, interventions]);

  // Keep selected student synced with updated interventions
  const activeSelectedStudent = useMemo(() => {
    if (!selectedStudent) return null;
    return studentsWithInterventions.find((s) => s.id === selectedStudent.id) || selectedStudent;
  }, [selectedStudent, studentsWithInterventions]);

  const openInterventionsCount = useMemo(() => {
    return interventions.filter((i) => i.status === 'pending' || i.status === 'in_progress').length;
  }, [interventions]);

  const criticalRiskCount = useMemo(() => {
    if (!dataResult) return 0;
    return studentsWithInterventions.filter((s) => s.academicRisk.level === 'Critical').length;
  }, [dataResult, studentsWithInterventions]);

  // Intervention Operations
  const handleCreateIntervention = (input: CreateInterventionInput) => {
    const res = createInterventionRecord(interventions, input);
    setInterventions(res.updatedList);
  };

  const handleUpdateInterventionStatus = (
    id: string,
    newStatus: InterventionStatus,
    resolutionNote?: string
  ) => {
    const actor =
      currentRole === 'faculty_advisor'
        ? 'Faculty Advisor'
        : currentRole === 'placement_officer'
        ? 'Placement Officer'
        : 'Campus Administrator';
    const res = updateInterventionLifecycleStatus(
      interventions,
      id,
      newStatus,
      actor,
      resolutionNote
    );
    setInterventions(res.updatedList);
  };

  const handleUpdateFollowUp = (
    id: string,
    newFollowUpDate: string,
    newNoteText?: string
  ) => {
    const actor =
      currentRole === 'faculty_advisor'
        ? 'Faculty Advisor'
        : currentRole === 'placement_officer'
        ? 'Placement Officer'
        : 'Campus Administrator';
    const res = updateInterventionFollowUp(
      interventions,
      id,
      newFollowUpDate,
      newNoteText,
      actor
    );
    setInterventions(res.updatedList);
  };

  const handleTriggerInterventionFromStudent = (student: UnifiedStudent) => {
    setPrefilledStudentForIntervention(student);
    setAutoOpenCreateIntervention(true);
    setSelectedStudent(null);
    setCurrentPage('interventions');
  };

  // Loading Screen
  if (isLoading || !dataResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] text-[#172B4D]">
        <div className="text-center p-6 bg-white rounded-lg border border-slate-200 shadow-sm max-w-sm">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">CampusPulse</h2>
          <p className="text-xs text-slate-500 mt-1">
            Loading institutional analytics and reconciling multi-stream data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D] flex flex-col font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentRole={currentRole}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        openInterventionCount={openInterventionsCount}
        criticalRiskCount={criticalRiskCount}
      />

      {/* Main Content Area (Offset for sidebar on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          currentRole={currentRole}
          onRoleChange={(role) => setCurrentRole(role)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onNavigateToStudents={() => handleNavigate('students')}
        />

        {/* Page Content Region */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'overview' ? (
            <OverviewView
              students={studentsWithInterventions}
              currentRole={currentRole}
              onNavigate={handleNavigate}
              onSelectStudent={(stu) => {
                setSelectedStudent(stu);
                handleNavigate('students');
              }}
            />
          ) : currentPage === 'students' ? (
            <StudentDirectoryView
              students={studentsWithInterventions}
              initialSearchQuery={searchQuery}
              selectedStudent={activeSelectedStudent}
              onSelectStudent={setSelectedStudent}
              onNavigateToInterventions={() => handleNavigate('interventions')}
              onTriggerIntervention={handleTriggerInterventionFromStudent}
            />
          ) : currentPage === 'interventions' ? (
            <InterventionManagementView
              interventions={interventions}
              students={studentsWithInterventions}
              onCreateIntervention={handleCreateIntervention}
              onUpdateStatus={handleUpdateInterventionStatus}
              onUpdateFollowUp={handleUpdateFollowUp}
              initialStudent={prefilledStudentForIntervention}
              autoOpenCreateModal={autoOpenCreateIntervention}
              onClearInitialStudent={() => {
                setPrefilledStudentForIntervention(null);
                setAutoOpenCreateIntervention(false);
              }}
            />
          ) : (
            <PagePlaceholder
              page={currentPage}
              onNavigateToOverview={() => handleNavigate('overview')}
            />
          )}
        </main>

        {/* Institutional Application Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-4 sm:px-6 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">CampusPulse</span> • Student Success Intelligence Platform
          </div>
          <div className="mt-1 sm:mt-0 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Synthetic Demonstration Dataset (150 students across 4 departments)</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
