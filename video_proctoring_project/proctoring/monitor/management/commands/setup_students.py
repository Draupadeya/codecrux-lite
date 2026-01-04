from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from monitor.models import StudentProfile
from datetime import datetime
import csv
import os


class Command(BaseCommand):
    help = 'Setup student accounts with roll number as username and DOB as password'

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete-all',
            action='store_true',
            help='Delete all existing users except superuser',
        )
        parser.add_argument(
            '--file',
            type=str,
            help='CSV file path with student data (roll_number, name, dob)',
        )
        parser.add_argument(
            '--add-student',
            type=str,
            help='Add single student: --add-student "ROLL_NO,FullName,YYYY-MM-DD"',
        )

    def handle(self, *args, **options):
        # Delete all users if requested
        if options['delete_all']:
            confirm = input("Are you sure you want to delete all users except superuser? (yes/no): ")
            if confirm.lower() == 'yes':
                superusers = User.objects.filter(is_superuser=True).values_list('id', flat=True)
                User.objects.exclude(id__in=superusers).delete()
                self.stdout.write(self.style.SUCCESS("All users deleted except superuser"))
            return

        # Add single student
        if options['add_student']:
            data = options['add_student'].split(',')
            if len(data) != 3:
                self.stdout.write(self.style.ERROR("Format: ROLL_NO,FullName,YYYY-MM-DD"))
                return
            
            roll_no, name, dob_str = data[0].strip(), data[1].strip(), data[2].strip()
            self.create_student(roll_no, name, dob_str)
            return

        # Load from CSV file
        if options['file']:
            self.load_from_csv(options['file'])
            return

        self.stdout.write(self.style.WARNING("No action specified. Use --help for options"))

    def create_student(self, roll_number, full_name, dob_str):
        """Create a student user with roll number as username and DOB as password"""
        try:
            # Parse DOB
            dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
            
            # Check if student already exists
            if User.objects.filter(username=roll_number).exists():
                self.stdout.write(self.style.WARNING(f"Student {roll_number} already exists"))
                return
            
            # Create user with roll_number as username and DOB as password
            dob_password = dob.strftime('%Y%m%d')  # YYYYMMDD format
            user = User.objects.create_user(
                username=roll_number,
                password=dob_password,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else ''
            )
            
            # Create student profile
            StudentProfile.objects.create(
                user=user,
                full_name=full_name,
                dob=dob,
                roll_number=roll_number
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Student created: {roll_number} | Password: {dob_password}"
                )
            )
        except ValueError as e:
            self.stdout.write(self.style.ERROR(f"Invalid date format for {roll_number}: {e}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating {roll_number}: {e}"))

    def load_from_csv(self, filepath):
        """Load students from CSV file"""
        if not os.path.exists(filepath):
            self.stdout.write(self.style.ERROR(f"File not found: {filepath}"))
            return
        
        count = 0
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            # Skip header if exists
            headers = next(reader, None)
            
            for row in reader:
                if len(row) < 3:
                    self.stdout.write(self.style.WARNING(f"Skipping invalid row: {row}"))
                    continue
                
                roll_no, name, dob = row[0].strip(), row[1].strip(), row[2].strip()
                self.create_student(roll_no, name, dob)
                count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f"\nTotal {count} students processed from {filepath}")
        )
