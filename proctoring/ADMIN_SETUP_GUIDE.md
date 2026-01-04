# SparkLess Admin Portal - User Setup Guide

## Overview
This guide explains how to create and manage user accounts in the SparkLess Admin Portal.

### Account Types:

#### 1. **Student Accounts**
- **Username**: Roll Number (e.g., "CS2024001")
- **Password**: Date of Birth (YYYYMMDD format, e.g., "19990615" for June 15, 1999)
- Created via Django management command

#### 2. **Faculty/Admin Accounts**
- **Username & Password**: Custom (created manually in admin panel)
- Have staff/admin privileges
- Can access the full admin portal

---

## Commands to Setup Students

### Option 1: Delete All Existing Users (Except Superuser)
```bash
python manage.py setup_students --delete-all
```
⚠️ This will delete all non-superuser accounts. Confirm when prompted.

### Option 2: Add Single Student
```bash
python manage.py setup_students --add-student "ROLL_NO,FullName,YYYY-MM-DD"
```

**Example:**
```bash
python manage.py setup_students --add-student "CS2024001,Raj Kumar,1999-06-15"
```

### Option 3: Load Students from CSV File
```bash
python manage.py setup_students --file students.csv
```

**CSV Format (students.csv):**
```
roll_number,name,dob
CS2024001,Raj Kumar,1999-06-15
CS2024002,Priya Singh,2000-03-22
CS2024003,Arjun Patel,1998-11-08
```

---

## Admin Panel Access

### 1. Access Django Admin
- URL: `http://localhost:8000/admin/`
- Use superuser credentials

### 2. Create Faculty/Admin Accounts
1. Go to **Users** section in admin
2. Click **Add User**
3. Enter:
   - **Username**: Faculty member's identifier
   - **Password**: Create strong password
4. Set **Staff status** and **Superuser status** as needed
5. Click Save

### 3. Student Profile Management
1. Go to **Student Profiles** section
2. View all enrolled students with:
   - Full Name
   - Roll Number (Username)
   - Date of Birth
   - Linked User Account

---

## Example Workflow

```bash
# 1. Start fresh - delete all existing users
python manage.py setup_students --delete-all

# 2. Create superuser (if needed)
python manage.py createsuperuser

# 3. Create faculty member via admin panel
# (Login to /admin/ and add manually)

# 4. Bulk load students from CSV
python manage.py setup_students --file students.csv

# 5. Or add individual students
python manage.py setup_students --add-student "CS2024001,Raj Kumar,1999-06-15"
```

---

## Student Login Example

**User:** CS2024001  
**Password:** 19990615 (Date of Birth: June 15, 1999)

---

## Troubleshooting

### Error: "roll_number already exists"
- The student with that roll number is already in the system
- Delete and recreate, or use a different roll number

### Error: "Invalid date format"
- Ensure date is in format: **YYYY-MM-DD**
- Example: 1999-06-15 ✓ (not 06/15/1999)

### Password not working?
- Student password is DOB in format: **YYYYMMDD**
- Example: June 15, 1999 = Password: **19990615**

---

## Admin Features

### User Management
- ✓ Create/Edit/Delete users
- ✓ Reset passwords
- ✓ Manage staff/admin privileges
- ✓ View all student profiles with credentials

### Candidate Management
- ✓ Register exam candidates
- ✓ Upload candidate photos
- ✓ Generate face embeddings
- ✓ Block/Unblock students from exams

### Session & Event Tracking
- ✓ Monitor exam sessions
- ✓ View proctoring events
- ✓ Check suspicion scores
- ✓ Review evidence (frames, audio)

---

## Security Notes

⚠️ **Important:**
- Never share student DOBs as passwords in plain text
- Use HTTPS in production
- Regularly backup your database
- Change default admin credentials
- Use strong passwords for staff accounts

