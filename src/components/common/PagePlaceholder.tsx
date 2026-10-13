import { Construction, ArrowLeft } from 'lucide-react';
import { NavigationPage } from '../../types/navigation';
import { Button } from '../ui/Button';

interface PagePlaceholderProps {
  page: NavigationPage;
  onNavigateToOverview: () => void;
  onNavigateToDiagnostic?: () => void;
}

export function PagePlaceholder({
  page,
  onNavigateToOverview,
}: PagePlaceholderProps) {
  const pageDetails: Record<NavigationPage, { title: string; phase: string; summary: string }> = {
    overview: {
      title: 'Student Success Overview',
      phase: 'Phase 3 (Active)',
      summary: 'Executive monitoring and departmental risk distributions.',
    },
    students: {
      title: 'Student Directory & Risk Matrix',
      phase: 'Scheduled for Phase 4',
      summary: 'High-density student directory table with multi-attribute filtering, sorting, and full 360° student diagnostic drawers.',
    },
    interventions: {
      title: 'Intervention Workflow Management',
      phase: 'Scheduled for Phase 4',
      summary: 'Case management workflow for assigning, updating, and documenting outcomes for academic and placement counseling.',
    },
    placement: {
      title: 'Placement Readiness Insights',
      phase: 'Scheduled for Phase 5',
      summary: 'Skills assessment radar, corporate hiring eligibility funnels, and remedial coding sprint cohorts.',
    },
    data: {
      title: 'Data Integration & Management Studio',
      phase: 'Scheduled for Phase 5',
      summary: 'Drag-and-drop CSV upload studio with schema validator, duplicate detection, and synthetic benchmark dataset injection.',
    },
  };

  const info = pageDetails[page];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto mb-4">
        <Construction className="w-6 h-6 text-teal-700" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 inline-block mb-2">
        {info.phase}
      </span>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{info.title}</h3>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        {info.summary}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={onNavigateToOverview}
        >
          Return to Overview
        </Button>
      </div>
    </div>
  );
}
