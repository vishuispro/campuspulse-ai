import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const DEPARTMENTS = [
  'Computer Science',
  'Information Science',
  'Electronics & Communication',
  'Mechanical Engineering',
];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Bhavya', 'Chetan', 'Deepika', 'Dev', 'Diya', 'Gaurav',
  'Harsh', 'Ishaan', 'Jaya', 'Kavya', 'Kiran', 'Madhav', 'Manish', 'Neha', 'Nikhil', 'Pooja',
  'Pranav', 'Priya', 'Rahul', 'Rhea', 'Rohan', 'Ruchi', 'Sahil', 'Sanjay', 'Shreya', 'Sneha',
  'Siddharth', 'Tanvi', 'Tarun', 'Varun', 'Vandana', 'Vikram', 'Yash', 'Zara', 'Meera', 'Rishi',
  'Naveen', 'Karthik', 'Swati', 'Akash', 'Shruti', 'Abhishek', 'Pallavi', 'Suresh', 'Divya', 'Rajesh'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Rao', 'Iyer', 'Reddy', 'Nair', 'Kulkarni', 'Deshmukh', 'Gupta',
  'Bhat', 'Hegde', 'Shetty', 'Menon', 'Pillai', 'Joshi', 'Chakraborty', 'Banerjee', 'Mishra', 'Pandey',
  'Choudhury', 'Singh', 'Kumar', 'Gowda', 'Prasad', 'Das', 'Sen', 'Mukherjee', 'Mehta', 'Shah'
];

const MENTORS = [
  'Dr. Ramesh Shastri',
  'Prof. Lakshmi Narayanan',
  'Dr. Aniruddha Roy',
  'Prof. Sunita Deshpande',
  'Dr. K. V. Ramanathan',
  'Prof. Meenakshi Sundaram',
];

function generateDataset(totalStudents = 150) {
  const DISCLAIMER = '# CampusPulse Synthetic Demo Dataset - For Institutional Simulation & Testing Only\n';

  const academicRows = [];
  const attendanceRows = [];
  const lmsRows = [];
  const placementRows = [];
  const interventionRows = [];

  academicRows.push('student_id,name,department,semester,cgpa,internal_midterm_pct,backlogs_count,mentor_name');
  attendanceRows.push('student_id,overall_attendance_pct,lab_attendance_pct,trend_last_30_days,days_absent_consecutive');
  lmsRows.push('student_id,weekly_login_frequency,assignment_submission_rate,forum_engagement_score,video_lecture_completion_pct');
  placementRows.push('student_id,coding_assessment_score,aptitude_reasoning_score,mock_interview_rating,projects_count,resume_verified,opt_in_placement');
  interventionRows.push('intervention_id,student_id,student_name,type,priority,status,assigned_to,created_at,target_follow_up_date,notes');

  let interventionCount = 1;

  for (let i = 1; i <= totalStudents; i++) {
    const deptIndex = (i - 1) % DEPARTMENTS.length;
    const dept = DEPARTMENTS[deptIndex];
    const deptCode = deptIndex === 0 ? 'CS' : deptIndex === 1 ? 'IS' : deptIndex === 2 ? 'EC' : 'ME';
    const numStr = String(i).padStart(3, '0');
    const studentId = `1MS22${deptCode}${numStr}`;

    const firstName = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 11) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const mentor = MENTORS[(i + deptIndex) % MENTORS.length];
    const semester = 6 + (i % 2);

    const archetype = i % 20;

    let cgpa, midterm, backlogs, attendancePct, labAttendancePct, trend, absentConsecutive;
    let lmsLogins, lmsSubmissions, lmsForum, codingScore, aptitudeScore, mockRating, projects, resumeVerified;

    if (archetype < 5) {
      cgpa = 8.6 + ((i * 3) % 13) / 10;
      midterm = 85 + (i % 14);
      backlogs = 0;
      attendancePct = 88 + (i % 11);
      labAttendancePct = 90 + (i % 10);
      trend = 'improving';
      absentConsecutive = 0;
      lmsLogins = 5 + (i % 4);
      lmsSubmissions = 92 + (i % 8);
      lmsForum = 80 + (i % 18);
      codingScore = 82 + (i % 16);
      aptitudeScore = 80 + (i % 18);
      mockRating = 4.0 + (i % 10) / 10;
      projects = 3 + (i % 3);
      resumeVerified = true;
    } else if (archetype < 12) {
      cgpa = 7.2 + ((i * 2) % 12) / 10;
      midterm = 70 + (i % 15);
      backlogs = 0;
      attendancePct = 78 + (i % 10);
      labAttendancePct = 80 + (i % 12);
      trend = 'stable';
      absentConsecutive = 1;
      lmsLogins = 3 + (i % 3);
      lmsSubmissions = 75 + (i % 15);
      lmsForum = 60 + (i % 20);
      codingScore = 65 + (i % 15);
      aptitudeScore = 68 + (i % 15);
      mockRating = 3.2 + (i % 8) / 10;
      projects = 2 + (i % 2);
      resumeVerified = (i % 3) !== 0;
    } else if (archetype < 15) {
      cgpa = 7.5 + ((i * 3) % 10) / 10;
      midterm = 68 + (i % 12);
      backlogs = 0;
      attendancePct = 58 + (i % 15);
      labAttendancePct = 65 + (i % 10);
      trend = 'declining';
      absentConsecutive = 4 + (i % 4);
      lmsLogins = 2;
      lmsSubmissions = 62 + (i % 10);
      lmsForum = 40 + (i % 15);
      codingScore = 62 + (i % 14);
      aptitudeScore = 70 + (i % 12);
      mockRating = 3.4;
      projects = 2;
      resumeVerified = true;

      if (i % 2 === 0) {
        interventionRows.push(
          `INT-${String(interventionCount++).padStart(3, '0')},${studentId},${fullName},Attendance Counseling,high,in_progress,${mentor},2026-10-01,2026-10-20,Parent notified of 62% attendance. Weekly counseling scheduled.`
        );
      }
    } else if (archetype < 18) {
      cgpa = 5.4 + ((i * 2) % 11) / 10;
      midterm = 35 + (i % 15);
      backlogs = 1 + (i % 3);
      attendancePct = 65 + (i % 10);
      labAttendancePct = 70;
      trend = 'declining';
      absentConsecutive = 3;
      lmsLogins = 1;
      lmsSubmissions = 45 + (i % 12);
      lmsForum = 25;
      codingScore = 42 + (i % 12);
      aptitudeScore = 48 + (i % 10);
      mockRating = 2.2 + (i % 6) / 10;
      projects = 1;
      resumeVerified = false;

      interventionRows.push(
        `INT-${String(interventionCount++).padStart(3, '0')},${studentId},${fullName},Academic Tutoring,high,pending,Dr. Ramesh Shastri,2026-10-05,2026-10-25,Assigned senior student peer mentor for Data Structures backlog remediation.`
      );
    } else {
      cgpa = 8.8 + ((i * 2) % 8) / 10;
      midterm = 88;
      backlogs = 0;
      attendancePct = 92;
      labAttendancePct = 95;
      trend = 'stable';
      absentConsecutive = 0;
      lmsLogins = 4;
      lmsSubmissions = 95;
      lmsForum = 75;
      codingScore = 38 + (i % 10);
      aptitudeScore = 78;
      mockRating = 2.5;
      projects = 1;
      resumeVerified = true;

      if (i % 2 === 1) {
        interventionRows.push(
          `INT-${String(interventionCount++).padStart(3, '0')},${studentId},${fullName},Placement Upskilling,medium,in_progress,Placement Training Cell,2026-10-08,2026-10-28,Enrolled in LeetCode 30-day DSA bootcamp to bridge coding gap.`
        );
      }
    }

    cgpa = Math.min(10.0, Math.max(0.0, Number(cgpa.toFixed(2))));
    midterm = Math.min(100, Math.max(0, midterm));
    attendancePct = Math.min(100, Math.max(0, attendancePct));
    labAttendancePct = Math.min(100, Math.max(0, labAttendancePct));
    codingScore = Math.min(100, Math.max(0, codingScore));
    aptitudeScore = Math.min(100, Math.max(0, aptitudeScore));
    mockRating = Math.min(5.0, Math.max(1.0, Number(mockRating.toFixed(1))));

    if (i !== 148) {
      lmsRows.push(`${studentId},${lmsLogins},${lmsSubmissions},${lmsForum},80`);
    }

    if (i !== 149) {
      placementRows.push(`${studentId},${codingScore},${aptitudeScore},${mockRating},${projects},${resumeVerified},true`);
    }

    academicRows.push(`${studentId},"${fullName}",${dept},${semester},${cgpa},${midterm},${backlogs},"${mentor}"`);
    attendanceRows.push(`${studentId},${attendancePct},${labAttendancePct},${trend},${absentConsecutive}`);
  }

  // Intentional edge case: Unmatched ID in attendance
  attendanceRows.push(`1MS22CS999,65,70,declining,3`);

  return {
    'academics.csv': DISCLAIMER + academicRows.join('\n'),
    'attendance.csv': DISCLAIMER + attendanceRows.join('\n'),
    'lms_activity.csv': DISCLAIMER + lmsRows.join('\n'),
    'placement_skills.csv': DISCLAIMER + placementRows.join('\n'),
    'interventions.csv': DISCLAIMER + interventionRows.join('\n'),
  };
}

const files = generateDataset(150);

const dirs = [
  path.join(rootDir, 'public', 'data', 'synthetic'),
  path.join(rootDir, 'src', 'data', 'synthetic'),
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filename), content, 'utf8');
  }
}

console.log('Generated 150 synthetic records across all 5 CSV files in public/ and src/ directories.');
