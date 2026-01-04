import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proctoring.settings')
django.setup()

from monitor.models import Exam, Question, StudentProfile, ExamAssignment

print("=" * 60)
print("DATABASE CHECK")
print("=" * 60)

# Count all records
print(f"\nTotal Exams: {Exam.objects.count()}")
print(f"Total Questions: {Question.objects.count()}")
print(f"Total Students: {StudentProfile.objects.count()}")
print(f"Total Assignments: {ExamAssignment.objects.count()}")

# Check first exam
exam = Exam.objects.first()
if exam:
    print(f"\n--- First Exam ---")
    print(f"ID: {exam.id}")
    print(f"Title: {exam.title}")
    print(f"Is Published: {exam.is_published}")
    print(f"Questions count: {exam.questions.count()}")
    
    # Show questions
    if exam.questions.exists():
        print(f"\nQuestions:")
        for i, q in enumerate(exam.questions.all()[:5], 1):
            print(f"  {i}. [{q.question_type}] {q.question_text[:60]}...")
    else:
        print("  ⚠️  NO QUESTIONS FOUND!")
    
    # Check assignments
    assignments = ExamAssignment.objects.filter(exam=exam)
    print(f"\nStudents assigned to this exam: {assignments.count()}")
    for assignment in assignments[:3]:
        print(f"  - {assignment.student.full_name} ({assignment.student.roll_number})")
else:
    print("\n⚠️  NO EXAMS FOUND IN DATABASE!")

# Check students
print(f"\n--- Students ---")
students = StudentProfile.objects.all()[:3]
for student in students:
    print(f"  - {student.full_name} ({student.roll_number})")

print("\n" + "=" * 60)
