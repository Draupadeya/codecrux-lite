# Troubleshooting: Courses and Exams Not Showing

## Debug Steps Added

I've added comprehensive console logging to help diagnose why faculty-created courses and exams aren't appearing in the student dashboard.

### What to Check

1. **Open the Student Dashboard** (`frontend/index.html`)
2. **Open Browser Console** (Press F12, go to Console tab)
3. **Look for these debug messages:**

#### Student Info Loading:
```
🔍 Fetching current student from: http://127.0.0.1:786/studymate/api/get-current-student/
📡 Student API response status: 200
✅ Student data received: {full_name: "...", roll_number: "..."}
💾 Student roll number stored: 21BCE1234
```

#### Courses Loading:
```
🔍 Loading enrolled courses...
📋 Roll number from localStorage: 21BCE1234
📡 Fetching courses from: http://127.0.0.1:786/api/student/courses/21BCE1234/
📡 Courses API response status: 200
✅ Backend courses loaded: 3 courses
📚 Course details: [{...}, {...}, {...}]
💾 Local courses: 0 courses
📊 Total courses after merge: 3
```

#### Exams Loading:
```
🔍 Loading student exams...
📋 Roll number from localStorage: 21BCE1234
📡 Fetching exams from: http://127.0.0.1:786/api/student/exams/21BCE1234/
📡 Exams API response status: 200
📋 Exams API response: {upcoming: [...], completed: [...]}
✅ Exams loaded. Upcoming: 2 Completed: 0
```

## Common Issues and Solutions

### Issue 1: No Roll Number Found
**Symptoms:**
```
⚠️ No roll number in localStorage, fetching student info...
⚠️ Student info received but no roll_number
❌ No roll number found - cannot load exams
```

**Solution:**
- The student profile in the Django backend doesn't have a `roll_number` field set
- Go to Django Admin: http://127.0.0.1:786/admin/
- Navigate to Students
- Ensure the student has a roll_number assigned

### Issue 2: Student Not Enrolled
**Symptoms:**
```
✅ Backend courses loaded: 0 courses
📚 Course details: []
```

**Solution:**
- The student isn't enrolled in any courses
- In the Faculty Admin Dashboard:
  1. Go to "Courses" section
  2. Click on a course
  3. Click "Enroll Students"
  4. Add the student by roll number or upload CSV

### Issue 3: No Exams Assigned
**Symptoms:**
```
✅ Exams loaded. Upcoming: 0 Completed: 0
```

**Solution:**
- No exams are assigned to the student
- In the Faculty Admin Dashboard:
  1. Go to "Exams" section
  2. Click on an exam
  3. Click "Assign to Students"
  4. Add the student by roll number or select enrolled students

### Issue 4: Courses/Exams Not Published
**Solution:**
- Courses and exams must be marked as "Published" to show up
- In the Faculty Admin Dashboard:
  1. Edit the course/exam
  2. Check the "Published" checkbox
  3. Save

### Issue 5: API Connection Error
**Symptoms:**
```
❌ Failed to load enrolled courses. Status: 404
```

**Solution:**
- Django backend not running on port 786
- Run the backend:
  ```bash
  cd video_proctoring_project/proctoring
  python manage.py runserver 786
  ```

### Issue 6: Wrong Roll Number
**Solution:**
- Clear localStorage and re-login:
  1. Open Console (F12)
  2. Run: `localStorage.clear()`
  3. Refresh page
  4. Check if correct roll number is detected

## Manual Testing

### Test Roll Number Storage:
```javascript
// In browser console:
localStorage.getItem('studentRollNumber')
// Should return something like: "21BCE1234"
```

### Test API Endpoints Directly:
```javascript
// In browser console (replace with your roll number):
fetch('http://127.0.0.1:786/api/student/courses/21BCE1234/')
  .then(r => r.json())
  .then(console.log)
  
fetch('http://127.0.0.1:786/api/student/exams/21BCE1234/')
  .then(r => r.json())
  .then(console.log)
```

### Check Student Profile:
```javascript
// In browser console:
fetch('http://127.0.0.1:786/studymate/api/get-current-student/')
  .then(r => r.json())
  .then(console.log)
// Should show: {full_name: "...", roll_number: "...", ...}
```

## Next Steps

1. **Open the student dashboard**
2. **Check the console** for debug messages
3. **Identify which step is failing** using the messages above
4. **Apply the appropriate solution**

If you see `⚠️ Student info received but no roll_number`, the issue is that the student profile doesn't have a roll number set in the database.

If you see `✅ Backend courses loaded: 0 courses`, the issue is that the student isn't enrolled in any courses.

Let me know what console messages you see and I can help you fix it!
