# Exam Monitoring with Student Scores - Implementation Guide

## Overview
Faculty can now view live exam monitoring with real-time student scores, performance metrics, and detailed analytics directly from the admin dashboard eye icon (👁️).

## Features Implemented

### 1. Live Exam Monitoring Modal
When faculty clicks the eye icon next to an exam in the Exams section, they see:

**Statistics Cards:**
- Total Assigned: Number of students assigned to exam
- Attempting: Students currently taking the exam
- Not Started: Students who haven't begun yet
- Blocked: Students blocked for proctoring violations
- Completed: Students who finished the exam

**Filter Tabs:**
- ALL: Show all students
- ATTEMPTING: Only students currently taking exam
- BLOCKED: Only blocked students
- COMPLETED: Only completed attempts

**Student List with Scores:**
For each student, displays:
- Student name and roll number
- Current status badge (Attempting/Blocked/Completed/Not Started)
- **Score & Result** (New):
  - For completed: Shows percentage (color-coded: green ≥70%, orange ≥40%, red <40%)
  - Shows actual marks obtained vs total marks
  - Pass/Fail indicator with emoji
  - For attempting: Shows "In Progress" with time elapsed
  - For not started: Shows "Not Started"
- Progress bar showing completion percentage
- Violations count for blocked students
- "Details" button to view answer details

### 2. Student Details Modal (Enhanced)
Clicking "Details" on a student shows:

**Score Summary Section:**
- Large score percentage (color-coded)
- Pass/Fail status
- Time taken on exam
- Number of suspicious activities/violations

**Answer Details Section:**
- Question-by-question breakdown
- Marks obtained vs marks per question
- Correct/Wrong status with color coding
- For coding questions:
  - Shows test cases passed/total
  - Displays code snippet submitted
- For MCQ questions:
  - Shows selected option
  - Shows correct option
  - Indicates if answer is correct/incorrect

**Actions:**
- Close button
- Export button (for future CSV export)

### 3. Backend API Endpoints

#### GET /api/exams/<exam_id>/submissions/
Returns all submissions for an exam with scores.

**Response:**
```json
{
  "exam_title": "Python Programming Final",
  "course_name": "CS101",
  "total_assigned": 10,
  "submissions": [
    {
      "student_name": "John Doe",
      "roll_number": "21BCE1001",
      "status": "completed",
      "progress": 100,
      "score": 75.5,
      "percentage": 75.5,
      "total_marks_obtained": 75.5,
      "time_taken": 3600,
      "passed": true,
      "violation_count": 0,
      "submitted_at": "2026-01-04T10:30:00Z"
    }
  ]
}
```

#### GET /api/exams/<exam_id>/submission/<roll_number>/
Returns detailed submission data for a specific student.

**Response:**
```json
{
  "student_name": "John Doe",
  "roll_number": "21BCE1001",
  "status": "completed",
  "score": 75.5,
  "percentage": 75.5,
  "total_marks_obtained": 75.5,
  "passed": true,
  "started_at": "2026-01-04T10:00:00Z",
  "submitted_at": "2026-01-04T10:30:00Z",
  "tab_switches": 2,
  "suspicious_activities": 0,
  "answers": [
    {
      "question_id": 1,
      "question_text": "What is a variable?",
      "question_type": "mcq",
      "marks": 2,
      "marks_obtained": 2,
      "is_correct": true,
      "selected_option": "A",
      "correct_option": "A"
    },
    {
      "question_id": 2,
      "question_text": "Write a function to find fibonacci number",
      "question_type": "coding",
      "marks": 10,
      "marks_obtained": 8,
      "is_correct": false,
      "test_cases_passed": 8,
      "total_test_cases": 10,
      "submitted_code": "def fib(n):\n  if n <= 1: ..."
    }
  ]
}
```

#### GET /api/exams/<exam_id>/export/
Downloads exam results as CSV file.

**CSV Format:**
```
Student Name,Roll Number,Status,Score,Percentage,Passed,Submitted At
John Doe,21BCE1001,Completed,75.5,75.5%,Yes,2026-01-04 10:30:00
Jane Smith,21BCE1002,Not Completed,N/A,N/A,N/A,
```

### 4. Frontend Changes

**Admin Dashboard (admin_dashboard.html):**
- Updated `renderStudentList()` to show scores and results
- Enhanced `viewExamDetails()` to fetch exam submissions via API
- Added `viewStudentDetails()` to show detailed answer breakdown
- Added `exportExamData()` for CSV export
- Color-coded scores based on performance

**Colors Used:**
- Green (#10b981): Score ≥ 70% or Passed
- Orange (#f59e0b): Score ≥ 40% but < 70%
- Red (#ef4444): Score < 40% or Failed
- Blue (#3b82f6): Completed status

### 5. Database Integration

**Models Used:**
- `Exam`: Exam details
- `ExamAssignment`: Which students are assigned to an exam
- `ExamAttempt`: Student's exam attempt with score data
- `StudentAnswer`: Individual question answers with marks
- `Question`: Question details with correct answers
- `StudentProfile`: Student information

**Fields Used from ExamAttempt:**
- `score`: Total score obtained
- `total_marks_obtained`: Marks calculation
- `percentage`: Score percentage
- `passed`: Pass/Fail flag
- `status`: Attempt status (in_progress, submitted, evaluated)
- `started_at`: When student started exam
- `submitted_at`: When student submitted exam
- `tab_switches`: Number of tab switches (violation indicator)
- `suspicious_activities`: Violation count

## How Faculty Uses It

1. **Go to Admin Dashboard**
2. **Navigate to "Exams" section**
3. **Click the eye icon (👁️) next to an exam**
4. **View Live Monitoring Modal showing:**
   - Statistics cards with status distribution
   - Student list with scores and progress
   - Filter by status (All/Attempting/Blocked/Completed)
5. **Click "Details" on any student to see:**
   - Detailed score breakdown
   - Question-by-question performance
   - Answer details for each question
   - MCQ options selected vs correct
   - Coding test cases passed
6. **Click "Export Data" to download CSV file**

## Score Display Examples

**Completed Exam:**
```
John Doe (21BCE1001)
✅ Completed
75% | 75/100 marks
✅ Passed
```

**Attempting Exam:**
```
Jane Smith (21BCE1002)
🟢 Attempting
In Progress
⏱️ 23m 45s
```

**Blocked Exam:**
```
Bob Johnson (21BCE1003)
🔴 Blocked
⚠️ 2 violations
Phone Detected (98% conf...)
```

**Not Started:**
```
Alice Brown (21BCE1004)
⏰ Not Started
Awaiting attempt
```

## Technical Implementation

### Backend Flow:
1. Faculty requests exam submissions: `GET /api/exams/{id}/submissions/`
2. Backend queries:
   - All `ExamAssignment` records for the exam
   - For each student, gets their `ExamAttempt` (if exists)
   - Extracts score, percentage, status, violation count
3. Returns JSON with all submission data
4. Frontend renders student list with scores

### Frontend Flow:
1. Faculty clicks eye icon
2. `viewExamDetails(examId)` called
3. Fetches from `/api/exams/{id}/submissions/`
4. Creates modal with stats and student list
5. `renderStudentList()` displays students with scores
6. Color-coding applied based on percentage
7. On "Details" click, fetches `/api/exams/{id}/submission/{roll}/`
8. Shows detailed answer breakdown

## Files Modified

1. **Backend:**
   - `monitor/urls.py`: Added 3 new API endpoints
   - `monitor/views.py`: Added `get_exam_submissions()`, `get_student_exam_submission()`, `export_exam_results()`

2. **Frontend:**
   - `monitor/templates/monitor/admin_dashboard.html`:
     - Updated `viewExamDetails()` with score display
     - Updated `renderStudentList()` to show scores
     - Enhanced `viewStudentDetails()` with detailed modal
     - Added `formatTime()` helper for time formatting

## Security Features

- Only faculty can view exam submissions (login required)
- Faculty can only view exams they created
- Student data is protected and only shown to their faculty
- No sensitive data exposed in API responses

## Future Enhancements

1. **Real-time Updates**: Use WebSocket for live score updates
2. **Analytics**: Charts showing score distribution
3. **Email Notifications**: Notify students when results are available
4. **Detailed Analytics**: Time-per-question analysis
5. **Custom Columns**: Faculty can choose which metrics to display
6. **Batch Operations**: Select multiple students for bulk actions
7. **Leaderboard**: Show top performers (with privacy controls)
8. **Comparison**: Compare student performance across exams
9. **Flagged Answers**: Mark certain answers for faculty review
10. **Comments**: Faculty can add comments to student answers

## Testing Checklist

- [ ] Faculty can see exam submissions in modal
- [ ] Stats cards show correct counts (Attempting, Completed, etc.)
- [ ] Filter tabs work correctly (All/Attempting/Blocked/Completed)
- [ ] Student scores display with correct color coding
- [ ] Pass/Fail indicator shows correctly
- [ ] Time taken displays correctly for completed exams
- [ ] "Details" button opens detailed modal
- [ ] Detailed modal shows all answers with marks
- [ ] MCQ answers show selected vs correct option
- [ ] Coding answers show test cases passed
- [ ] Export button downloads CSV (when implemented)
- [ ] Only faculty can view their exams' submissions
