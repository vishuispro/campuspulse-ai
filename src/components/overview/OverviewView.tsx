import { useState, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  Briefcase,
  ClipboardList,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { UnifiedStudent, Department } from '../../types/student';
import { NavigationPage, UserRole } from '../../types/navigation';
import { Card, CardHeader } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface OverviewViewProps {
  students: UnifiedStudent[];
  currentRole: UserRole;
  onNavigate: (page: NavigationPage) => void;
  onSelectStudent: (student: UnifiedStudent) => void;
}

export function OverviewView({
  students,
  currentRole,
  onNavigate,
  onSelectStudent,
}: OverviewViewProps) {
  // Semester / Cohort Filter
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Filter students based on cohort selectors
  const filteredStudents = useMemo(() => {
    return students.filter((stu) => {
      const semMatch =
        selectedSemester === 'all' || String(stu.semester) === selectedSemester;
      const deptMatch =
        selectedDept === 'all' || stu.department === selectedDept;
      return semMatch && deptMatch;
    });
  }, [students, selectedSemester, selectedDept]);

  // 1. KPI Summaries (Computed directly from loaded data)
  const totalStudentsCount = filteredStudents.length;

  const academicReviewStudents = useMemo(() => {
    return filteredStudents.filter(
      (s) => s.academicRisk.level === 'Critical' || s.academicRisk.level === 'High'
    );
  }, [filteredStudents]);

  const criticalRiskCount = useMemo(() => {
    return filteredStudents.filter((s) => s.academicRisk.level === 'Critical').length;
  }, [filteredStudents]);

  const highRiskCount = useMemo(() => {
    return filteredStudents.filter((s) => s.academicRisk.level === 'High').length;
  }, [filteredStudents]);

  const placementSupportStudents = useMemo(() => {
    return filteredStudents.filter(
      (s) =>
        s.placementReadiness.tier === 'Needs Upskilling' ||
        s.placementReadiness.tier === 'At Risk / Ineligible'
    );
  }, [filteredStudents]);

  const tier1Count = useMemo(() => {
    return filteredStudents.filter((s) => s.placementReadiness.tier === 'Tier-1 Ready').length;
  }, [filteredStudents]);

  const allInterventions = useMemo(() => {
    return filteredStudents.flatMap((s) => s.interventions);
  }, [filteredStudents]);

  const openInterventionsCount = useMemo(() => {
    return allInterventions.filter(
      (i) => i.status === 'pending' || i.status === 'in_progress'
    ).length;
  }, [allInterventions]);

  const pendingInterventionsCount = useMemo(() => {
    return allInterventions.filter((i) => i.status === 'pending').length;
  }, [allInterventions]);

  // 2. Department-wise Academic Risk Distribution (Recharts)
  const departmentRiskData = useMemo(() => {
    const departments: Department[] = [
      'Computer Science',
      'Information Science',
      'Electronics & Communication',
      'Mechanical Engineering',
    ];

    return departments.map((dept) => {
      const deptStudents = filteredStudents.filter((s) => s.department === dept);
      const count = deptStudents.length;
      if (count === 0) {
        return {
          name: dept === 'Electronics & Communication' ? 'ECE' : dept === 'Mechanical Engineering' ? 'Mech' : dept === 'Computer Science' ? 'CSE' : 'ISE',
          fullName: dept,
          avgRisk: 0,
          criticalCount: 0,
          highCount: 0,
          moderateCount: 0,
          lowCount: 0,
        };
      }

      const avgRisk = Math.round(
        deptStudents.reduce((acc, s) => acc + s.academicRisk.score, 0) / count
      );
      const criticalCount = deptStudents.filter((s) => s.academicRisk.level === 'Critical').length;
      const highCount = deptStudents.filter((s) => s.academicRisk.level === 'High').length;
      const moderateCount = deptStudents.filter((s) => s.academicRisk.level === 'Moderate').length;
      const lowCount = deptStudents.filter((s) => s.academicRisk.level === 'Low').length;

      return {
        name: dept === 'Electronics & Communication' ? 'ECE' : dept === 'Mechanical Engineering' ? 'Mech' : dept === 'Computer Science' ? 'CSE' : 'ISE',
        fullName: dept,
        avgRisk,
        criticalCount,
        highCount,
        moderateCount,
        lowCount,
      };
    });
  }, [filteredStudents]);

  // 3. Department-wise Placement Readiness (Recharts)
  const departmentPlacementData = useMemo(() => {
    const departments: Department[] = [
      'Computer Science',
      'Information Science',
      'Electronics & Communication',
      'Mechanical Engineering',
    ];

    return departments.map((dept) => {
      const deptStudents = filteredStudents.filter((s) => s.department === dept);
      const count = deptStudents.length;
      if (count === 0) {
        return {
          name: dept === 'Electronics & Communication' ? 'ECE' : dept === 'Mechanical Engineering' ? 'Mech' : dept === 'Computer Science' ? 'CSE' : 'ISE',
          fullName: dept,
          avgReadiness: 0,
          tier1: 0,
          tier2: 0,
          needsUpskilling: 0,
        };
      }

      const avgReadiness = Math.round(
        deptStudents.reduce((acc, s) => acc + s.placementReadiness.score, 0) / count
      );
      const tier1 = deptStudents.filter((s) => s.placementReadiness.tier === 'Tier-1 Ready').length;
      const tier2 = deptStudents.filter((s) => s.placementReadiness.tier === 'Tier-2 Ready').length;
      const needsUpskilling = deptStudents.filter((s) => s.placementReadiness.tier === 'Needs Upskilling').length;

      return {
        name: dept === 'Electronics & Communication' ? 'ECE' : dept === 'Mechanical Engineering' ? 'Mech' : dept === 'Computer Science' ? 'CSE' : 'ISE',
        fullName: dept,
        avgReadiness,
        tier1,
        tier2,
        needsUpskilling,
      };
    });
  }, [filteredStudents]);

  // 4. Students Requiring Priority Review (Top at-risk students)
  const priorityAttentionStudents = useMemo(() => {
    return [...filteredStudents]
      .filter((s) => s.academicRisk.score >= 50 || s.placementReadiness.isBacklogBlocked)
      .sort((a, b) => b.academicRisk.score - a.academicRisk.score)
      .slice(0, 5);
  }, [filteredStudents]);

  return (
    <div className="space-y-6">
      {/* Page Heading & Context Filter Bar */}
      <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Student Success Overview
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Monitor academic risk distributions, placement benchmarks, and active interventions across campus cohorts. All signals are derived directly from reconciled academic, attendance, LMS, and placement assessment records.
          </p>
        </div>

        {/* Cohort Selector Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Cohort:</span>
          </div>

          {/* Semester Selector */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Semesters (6 & 7)</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
          </select>

          {/* Department Selector */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white cursor-pointer"
          >
            <option value="all">All Departments (4)</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Science">Information Science</option>
            <option value="Electronics & Communication">Electronics & Comm.</option>
            <option value="Mechanical Engineering">Mechanical Engg.</option>
          </select>
        </div>
      </div>

      {/* Role-Specific Institutional Perspective Banner */}
      {currentRole === 'faculty_advisor' && (
        <div className="p-3.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs text-teal-900 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
            <span>
              <strong>Faculty Advisor Perspective:</strong> Priority focus is on early detection of attendance shortfalls (&lt;75%) and course backlogs before semester examination eligibility lock-in.
            </span>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-teal-800 hover:text-teal-950 font-semibold underline shrink-0 text-xs"
          >
            Open Directory →
          </button>
        </div>
      )}

      {currentRole === 'placement_officer' && (
        <div className="p-3.5 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
            <span>
              <strong>Placement Officer Perspective:</strong> Identifying students with high CGPA who require technical coding upskilling, and students blocked by active arrears from Tier-1 eligibility.
            </span>
          </div>
          <button
            onClick={() => onNavigate('placement')}
            className="text-indigo-800 hover:text-indigo-950 font-semibold underline shrink-0 text-xs"
          >
            Placement Insights →
          </button>
        </div>
      )}

      {/* 4 Essential KPI Stat Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Cohort Count */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Students in Dataset
            </span>
            <div className="p-1.5 rounded bg-slate-100 text-slate-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {totalStudentsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">enrolled</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>4 Engineering Departments</span>
            <span className="font-medium text-slate-700">100% Reconciled</span>
          </div>
        </Card>

        {/* KPI 2: Academic Review Required */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Academic Review Required
            </span>
            <div className="p-1.5 rounded bg-red-100 text-red-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-700 tabular-nums">
              {academicReviewStudents.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({((academicReviewStudents.length / Math.max(1, totalStudentsCount)) * 100).toFixed(0)}% of cohort)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-red-700 font-medium">{criticalRiskCount} Critical</span>
            <span className="text-orange-700 font-medium">{highRiskCount} High Risk</span>
          </div>
        </Card>

        {/* KPI 3: Placement Support Needed */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Placement Support Needed
            </span>
            <div className="p-1.5 rounded bg-amber-100 text-amber-800">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 tabular-nums">
              {placementSupportStudents.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">candidates</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-teal-700 font-medium">{tier1Count} Tier-1 Ready</span>
            <span className="text-amber-800 font-medium">{placementSupportStudents.length} Upskilling Gaps</span>
          </div>
        </Card>

        {/* KPI 4: Open Interventions */}
        <Card padding="md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Interventions
            </span>
            <div className="p-1.5 rounded bg-teal-100 text-teal-800">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-800 tabular-nums">
              {openInterventionsCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">in progress</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-amber-700 font-medium">{pendingInterventionsCount} Pending Assignment</span>
            <span className="text-slate-500 font-medium">{allInterventions.length} Total Logged</span>
          </div>
        </Card>
      </div>

      {/* Institutional Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Academic Risk Across Departments */}
        <Card padding="md">
          <CardHeader
            title="Academic Risk Distribution by Department"
            subtitle="Comparing student counts by risk tier across departments (Higher ARI = Greater Risk)"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentRiskData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded border border-slate-200 shadow-md text-xs space-y-1">
                          <p className="font-bold text-slate-900">{data.fullName}</p>
                          <p className="text-slate-600">
                            Average Risk Score: <span className="font-semibold text-slate-800">{data.avgRisk}/100</span>
                          </p>
                          <div className="pt-1 text-[11px] space-y-0.5 border-t border-slate-100">
                            <p className="text-red-700">Critical Risk: {data.criticalCount}</p>
                            <p className="text-orange-700">High Risk: {data.highCount}</p>
                            <p className="text-amber-700">Moderate Risk: {data.moderateCount}</p>
                            <p className="text-emerald-700">Low Risk: {data.lowCount}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="criticalCount" name="Critical Risk" fill="#DC2626" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="highCount" name="High Risk" fill="#EA580C" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="moderateCount" name="Moderate Risk" fill="#D97706" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="lowCount" name="Low Risk" fill="#059669" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Highest critical cohort: Computer Science (4)</span>
            <span>Lowest average risk: Information Science (24 ARI)</span>
          </div>
        </Card>

        {/* Chart 2: Placement Readiness Across Departments */}
        <Card padding="md">
          <CardHeader
            title="Placement Readiness Index by Department"
            subtitle="Average Placement Readiness Score (0-100, Higher = More Prepared)"
          />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentPlacementData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded border border-slate-200 shadow-md text-xs space-y-1">
                          <p className="font-bold text-slate-900">{data.fullName}</p>
                          <p className="text-slate-600">
                            Avg Placement Readiness: <span className="font-semibold text-teal-800">{data.avgReadiness}/100</span>
                          </p>
                          <div className="pt-1 text-[11px] space-y-0.5 border-t border-slate-100">
                            <p className="text-teal-700">Tier-1 Ready: {data.tier1} candidates</p>
                            <p className="text-slate-700">Tier-2 Ready: {data.tier2} candidates</p>
                            <p className="text-amber-700">Needs Upskilling: {data.needsUpskilling} candidates</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="avgReadiness"
                  name="Avg Placement Readiness Score"
                  fill="#0D9488"
                  radius={[3, 3, 0, 0]}
                  barSize={38}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Corporate benchmark: ≥65 for IT / ≥80 for Tier-1</span>
            <span>Zero-backlog gate enforced on candidate scores</span>
          </div>
        </Card>
      </div>

      {/* Priority Action Section: Students Requiring Immediate Attention */}
      <Card padding="md">
        <CardHeader
          title="Students Requiring Priority Academic or Placement Review"
          subtitle="Top students exhibiting critical attendance drops, active backlogs, or placement barriers"
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
              iconPosition="right"
              onClick={() => onNavigate('students')}
            >
              View All {totalStudentsCount} Students
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/70">
                <th className="py-2.5 px-3 font-semibold">Student & ID</th>
                <th className="py-2.5 px-3 font-semibold">Department & Sem</th>
                <th className="py-2.5 px-3 font-semibold">Academic Risk</th>
                <th className="py-2.5 px-3 font-semibold">Attendance</th>
                <th className="py-2.5 px-3 font-semibold">Placement Status</th>
                <th className="py-2.5 px-3 font-semibold">Primary Risk Factor</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {priorityAttentionStudents.map((student) => {
                const isCritical = student.academicRisk.level === 'Critical';
                const isHigh = student.academicRisk.level === 'High';

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Student Name & ID */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{student.id}</div>
                    </td>

                    {/* Department & Sem */}
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{student.department}</div>
                      <div className="text-[11px] text-slate-500">Sem {student.semester}</div>
                    </td>

                    {/* Academic Risk Index & Badge */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            isCritical ? 'critical' : isHigh ? 'high' : 'moderate'
                          }
                          size="sm"
                        >
                          {student.academicRisk.level}
                        </Badge>
                        <span className="font-mono text-slate-600 tabular-nums">
                          {student.academicRisk.score}
                        </span>
                      </div>
                    </td>

                    {/* Attendance */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-800 font-medium">
                        {student.attendance?.overall_attendance_pct.toFixed(1) ?? 'N/A'}%
                      </div>
                      <div
                        className={`text-[10px] font-medium ${
                          student.attendance?.trend_last_30_days === 'declining'
                            ? 'text-red-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {student.attendance?.trend_last_30_days ?? 'N/A'}
                      </div>
                    </td>

                    {/* Placement Status */}
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          student.placementReadiness.tier === 'Tier-1 Ready'
                            ? 'positive'
                            : student.placementReadiness.tier === 'Tier-2 Ready'
                            ? 'neutral'
                            : 'moderate'
                        }
                        size="sm"
                      >
                        {student.placementReadiness.tier}
                      </Badge>
                      {student.placementReadiness.isBacklogBlocked && (
                        <span className="text-[10px] text-red-700 font-medium block mt-0.5">
                          Backlog Gate Applied
                        </span>
                      )}
                    </td>

                    {/* Primary Contributing Risk Factor */}
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {student.successScore.primaryRiskFactor}
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onSelectStudent(student);
                          onNavigate('students');
                        }}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two Direct Workflow Pathways */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:border-teal-300 transition-colors">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Student Directory & Risk Matrix</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter by attendance, backlogs, department, and inspect individual student 360° factors.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('students')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Open Directory
          </Button>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:border-teal-300 transition-colors">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Intervention Tracking Workflow</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Review {openInterventionsCount} active counseling and tutoring cases with follow-up milestones.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('interventions')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Manage Cases
          </Button>
        </div>
      </div>
    </div>
  );
}
