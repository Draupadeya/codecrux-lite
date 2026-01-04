import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proctoring.settings')
django.setup()

from monitor.models import Exam

exam = Exam.objects.get(id=2)
exam.is_published = True
exam.save()

print(f'✅ Exam "{exam.title}" is now published!')
print(f'Published status: {exam.is_published}')
