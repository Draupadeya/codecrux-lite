# SparkLess Admin Portal - Quick Start

## Quick Commands

### Clean Slate (Delete All Users)
```bash
cd d:\sparkless_1\video_proctoring_project\proctoring
python manage.py setup_students --delete-all
```

### Load Sample Students
```bash
python manage.py setup_students --file sample_students.csv
```

### Add One Student
```bash
python manage.py setup_students --add-student "CS2024011,Test Student,1999-05-10"
```

---

## Admin Panel URL
```
http://localhost:786/admin/
```

---

## Default Accounts Created

After running the sample CSV:

| Roll Number | Name | Password (DOB) | Role |
|---|---|---|---|
| CS2024001 | Raj Kumar | 19990615 | Student |
| CS2024002 | Priya Singh | 20000322 | Student |
| CS2024003 | Arjun Patel | 19981108 | Student |
| ... | ... | ... | ... |

---

## Faculty Setup (Manual)

1. Go to `/admin/`
2. Click **Users** → **Add User**
3. Enter username (e.g., "faculty_john")
4. Set password
5. Enable **Staff status** ✓
6. Click **Save**

---

## Student Login Test

**Username:** CS2024001  
**Password:** 19990615

---

## Admin Features Available

✅ **User Management**
- Add/Edit/Delete users
- Reset passwords
- Manage permissions

✅ **Student Management**
- View all student profiles
- See credentials (Roll Number = Username)
- Track registration status

✅ **Exam Management**
- Register candidates
- Manage exam sessions
- View proctoring events

✅ **Reports**
- Session logs
- Suspicious events
- Student performance

---

## Important Notes

⚠️ Student Password = Date of Birth (YYYYMMDD)
⚠️ Keep the CSV file for reference
⚠️ Backup database regularly
⚠️ Don't share credentials in emails

