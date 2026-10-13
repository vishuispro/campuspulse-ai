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
} from './types/student';
import { NavigationPage, UserRole } from './types/navigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/overview/OverviewView';
import { PagePlaceholder } from './components/common/PagePlaceholder';

export default function App() {
  const [dataResult, setDataResult] = useState<ReconciliationResult | null>(null);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('overview');
  const [currentRole, setCurrentRole] = useState<UserRole>('administrator');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setSelectedStudent] = useState<UnifiedStudent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize synthetic dataset and domain engine
  useEffect(() => {
    const bundle = generateSyntheticDataset(150);

    const academics = parseCsvString<RawAcademicRecord>(bundle.academicsCsv).data;
    const attendance = parseCsvString<RawAttendanceRecord>(bundle.attendanceCsv).data;
    const lms = parseCsvString<RawLMSActivityRecord>(bundle.lmsCsv).data;
    const placement = parseCsvString<RawPlacementRecord>(bundle.placementCsv).data;
    const interventions = parseCsvString<RawInterventionRecord>(bundle.interventionsCsv).data;

    const reconciled = reconcileCampusData({
      academics,
      attendance,
      lms,
      placement,
      interventions,
    });

    setDataResult(reconciled);
    if (reconciled.students.length > 0) {
      setSelectedStudent(reconciled.students[0]);
    }
    setIsLoading(false);
  }, []);

  const openInterventionsCount = useMemo(() => {
    if (!dataResult) return 0;
    return dataResult.students
      .flatMap((s) => s.interventions)
      .filter((i) => i.status === 'pending' || i.status === 'in_progress').length;
  }, [dataResult]);

  const criticalRiskCount = useMemo(() => {
    if (!dataResult) return 0;
    return dataResult.students.filter((s) => s.academicRisk.level === 'Critical').length;
  }, [dataResult]);

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

  const { students } = dataResult;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#172B4D] flex flex-col font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
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
          onNavigateToStudents={() => setCurrentPage('students')}
        />

        {/* Page Content Region */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'overview' ? (
            <OverviewView
              students={students}
              currentRole={currentRole}
              onNavigate={(page) => setCurrentPage(page)}
              onSelectStudent={(stu) => setSelectedStudent(stu)}
            />
          ) : (
            <PagePlaceholder
              page={currentPage}
              onNavigateToOverview={() => setCurrentPage('overview')}
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
