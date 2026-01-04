import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proctoring.settings')
django.setup()

from monitor.models import StudentProfile, ExamAssignment, Exam
import json

# Get the student
student = StudentProfile.objects.first()
print(f"\n{'='*60}")
print(f"Student: {student.full_name}")
print(f"Roll Number: {student.roll_number}")

# Get assignments
assignments = ExamAssignment.objects.filter(student=student)
print(f"\nExam Assignments: {assignments.count()}")

for assignment in assignments:
    exam = assignment.exam
    print(f"\n--- Exam Assignment ---")
    print(f"Exam ID: {exam.id}")
    print(f"Exam Title: {exam.title}")
    print(f"Is Published: {exam.is_published}")
    print(f"Questions: {exam.questions.count()}")
    print(f"Course: {exam.course.title if exam.course else 'No course'}")
    print(f"Faculty: {exam.faculty.full_name}")

# Now simulate the API call
from django.test import RequestFactory
from monitor.views import get_student_exams_by_roll

factory = RequestFactory()
request = factory.get(f'/api/student/exams/{student.roll_number}/')

response = get_student_exams_by_roll(request, student.roll_number)
print(f"\n{'='*60}")
print("API Response:")
print(f"Status: {response.status_code}")

import json
response_data = json.loads(response.content)
print(f"\nUpcoming exams: {len(response_data.get('upcoming', []))}")
print(f"Completed exams: {len(response_data.get('completed', []))}")

if response_data.get('upcoming'):
    print("\n--- Upcoming Exam Data ---")
    for exam in response_data['upcoming']:
        print(f"ID: {exam['id']}")
        print(f"Title: {exam['title']}")
        print(f"Questions: {len(exam.get('questions', []))}")

print(f"\n{'='*60}")
