# Exam Timing Feature - Start & End Dates

## Overview
Faculty can now set specific start and end dates/times for exams. Students can only attempt exams within these time windows, and the system will enforce these constraints.

## Features Implemented

### 1. Admin Dashboard - Exam Creation Form (Step 1: Details)

**New Fields Added:**
- **Start Date & Time** (Required): When the exam becomes available for students
- **End Date & Time** (Required): When the exam closes and becomes unavailable
- Validation: End date must be after start date

**UI Updates:**
- Replaced "Scheduled Date" with "Start Date & Time"
- Added "End Date & Time" field
- Added helper text for clarity
- Added "Difficulty Level" dropdown for better exam configuration

```html
<div class="form-group">
  <label>Start Date & Time *</label>
  <input type="datetime-local" id="exam-scheduled-date" required>
  <small>When exam becomes available</small>
</div>
<div class="form-group">
  <label>End Date & Time *</label>
  <input type="datetime-local" id="exam-end-date" required>
  <small>When exam closes</small>
</div>
```

### 2. Backend - Exam Model
The `Exam` model already has these fields:
- `scheduled_date` (DateTime): Exam start time
- `end_date` (DateTime): Exam end time

### 3. Backend - API Endpoints
The exam creation API already supports these fields:
```python
exam = Exam.objects.create(
    ...
    scheduled_date=data.get('scheduled_date'),
    end_date=data.get('end_date'),
    ...
)
```

### 4. Proctored Exam Page - Timing Validation

**Checks Performed:**
1. Checks if exam has not started yet
   - Shows alert with start time and time until exam starts
   - Redirects back to dashboard
   
2. Checks if exam has ended
   - Shows alert with end time
   - Redirects back to dashboard
   
3. If exam is active
   - Displays timing info in header
   - Shows time remaining until exam closes

**Code Added:**
```javascript
// Check exam timing
if (examData && examData.scheduled_date && examData.end_date) {
    const now = new Date();
    const startTime = new Date(examData.scheduled_date);
    const endTime = new Date(examData.end_date);
    
    if (now < startTime) {
        alert(`⏰ This exam has not started yet!\n\nExam starts: ${startTime.toLocaleString()}`);
        window.location.href = 'index.html';
        return;
    }
    
    if (now > endTime) {
        alert(`⏰ This exam has ended!\n\nExam ended: ${endTime.toLocaleString()}`);
        window.location.href = 'index.html';
        return;
    }
}
```

### 5. Exam Header - Timing Display

**New Info Display:**
Shows in exam header with:
- Start date and time
- End date and time  
- Time remaining (hours/minutes)

Example: `📅 Starts: Jan 04, 2026, 02:00 PM | Ends: Jan 04, 2026, 03:30 PM | 1h 30m remaining`

## User Experience Flow

### For Faculty:
1. Go to Admin Dashboard → Create New Exam → Step 1: Details
2. Fill in exam title, topic, course (optional)
3. **Set Start Date & Time** - When students can begin
4. **Set End Date & Time** - When exam window closes
5. Continue with questions and settings
6. Publish exam and assign students

### For Students:
1. Student sees exam in StudyMate dashboard
2. If they try to access BEFORE start time:
   - Alert shows: "Exam has not started yet - Available at [start time]"
   - Redirected to dashboard
3. If they try to access AFTER end time:
   - Alert shows: "Exam has ended - Closed at [end time]"
   - Redirected to dashboard
4. If they access DURING exam window:
   - Exam loads normally
   - Header shows: Start time, End time, Time remaining
   - Can attempt exam normally

## Technical Details

### Database Fields:
```python
class Exam(models.Model):
    ...
    scheduled_date = models.DateTimeField(null=True, blank=True)  # Exam start
    end_date = models.DateTimeField(null=True, blank=True)        # Exam end
    ...
```

### Validation in Frontend:
- Start date is required
- End date is required
- End date must be after start date
- Checks performed at exam load time

### Timing Checks:
- All times in browser's local timezone
- Compared with JavaScript Date objects
- Graceful handling if dates are not provided

## Examples

### Example 1: Timed Exam Window
- Start: January 4, 2026, 2:00 PM
- End: January 4, 2026, 3:30 PM  
- Duration per student: 60 minutes
- Result: 90-minute window for students to start and complete within their 60-min limit

### Example 2: Open Window
- Start: January 1, 2026, 12:00 AM
- End: January 31, 2026, 11:59 PM
- Duration per student: 60 minutes
- Result: Entire month available, each student gets 60 minutes once they start

### Example 3: Scheduled Exam
- Start: January 4, 2026, 10:00 AM (examination day)
- End: January 4, 2026, 12:30 PM (examination ends)
- Duration per student: 120 minutes
- Result: All students must attempt within this 2.5-hour window

## Files Modified

1. **Admin Dashboard Template**
   - `monitor/templates/monitor/admin_dashboard.html`
   - Updated Step 1 form with start/end date fields
   - Updated saveExam() function to include end_date

2. **Proctored Exam Page**
   - `frontend/proctored_exam.html`
   - Added timing validation checks
   - Added timing info display in header
   - Added datetime parsing and formatting

## Testing Checklist

- [ ] Faculty can create exam with start and end dates
- [ ] Faculty form validates end date > start date
- [ ] Student sees "exam not started" message before start time
- [ ] Student sees "exam ended" message after end time
- [ ] Student can access exam during valid window
- [ ] Exam header shows timing information
- [ ] Times display correctly in student's local timezone
- [ ] Multiple students can have different attempt times within the window

## Future Enhancements

1. **Timezone Support**: Display times in specific timezone (currently uses browser local time)
2. **Countdown Timer**: Add visual countdown to exam start/end
3. **Faculty Analytics**: Show which students attempted within/outside window
4. **Late Submission**: Option to allow late submissions with penalty
5. **Email Notifications**: Remind students before exam starts
6. **Calendar View**: Visual calendar of exam schedule
