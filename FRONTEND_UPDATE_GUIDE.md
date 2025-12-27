# Quick Frontend Update Guide

## Update Required: Frontend API URLs

The frontend (script.js) currently points to Flask server (port 5000).
Update all API calls to use the unified Django server (port 8000).

### Files to Update:
- `c:\sparkless\frontend\script.js`

### Search and Replace:

**Find:** `http://127.0.0.1:5000/`
**Replace:** `http://localhost:8000/courses/api/`

OR

**Use relative URLs (recommended):**
**Find:** `http://127.0.0.1:5000/`
**Replace:** `/courses/api/`

### Specific Changes:

1. **Line ~129** - Generate Plan:
   ```javascript
   // Before:
   const response = await fetch('http://127.0.0.1:5000/generate-plan', {
   
   // After:
   const response = await fetch('/courses/api/generate-plan', {
   ```

2. **Line ~508** - Get Motivation:
   ```javascript
   // Before:
   const response = await fetch('http://127.0.0.1:5000/get-motivation', {
   
   // After:
   const response = await fetch('/courses/api/get-motivation', {
   ```

3. **Line ~536** - Generate Quiz:
   ```javascript
   // Before:
   const response = await fetch('http://127.0.0.1:5000/generate-quiz', {
   
   // After:
   const response = await fetch('/courses/api/generate-quiz', {
   ```

4. **Line ~791** - Generate Notes Doc:
   ```javascript
   // Before:
   const response = await fetch('http://127.0.0.1:5000/generate-notes-doc', {
   
   // After:
   const response = await fetch('/courses/api/generate-notes-doc', {
   ```

5. **Line ~971** - Generate Challenge:
   ```javascript
   // Before:
   const response = await fetch('http://127.0.0.1:5000/generate-challenge', {
   
   // After:
   const response = await fetch('/courses/api/generate-challenge', {
   ```

6. **Line ~1120** - Get Hint:
   ```javascript
   // Before:
   const response = await fetch('http://127.0.0.1:5000/get-hint', {
   
   // After:
   const response = await fetch('/courses/api/get-hint', {
   ```

---

## Note:
Some endpoints (generate-notes-doc, generate-challenge, get-hint) need to be added to courses/views.py and courses/urls.py if they don't exist yet.

Check the backend/app.py file for these endpoint implementations and migrate them to Django.
