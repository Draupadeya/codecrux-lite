import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { ActiveCourseCard } from '../components/Dashboard/ActiveCourseCard';
import { CourseCard } from '../components/Dashboard/CourseCard';
import { ExamCard } from '../components/Dashboard/ExamCard';
import { LearningChart } from '../components/Dashboard/LearningChart';
import { XPWidget } from '../components/Dashboard/XPWidget';
import { CreateCourseModal } from '../components/Dashboard/CreateCourseModal';
import { DeleteConfirmationModal } from '../components/Dashboard/DeleteConfirmationModal';
import { Plus, ArrowUpRight, Target, MessageSquare, BookOpen, ChevronRight } from 'lucide-react';
import { User, Course, Exam } from '../types';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const DashboardScreen: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  // Course State Management
  const [courses, setCourses] = useState<Course[]>([
    { 
        id: '2', 
        title: 'Color Theory & Accessibility', 
        instructor: 'Gary Simon', 
        progress: 64, 
        completedLessons: 8, 
        totalLessons: 12, 
        thumbnail: 'https://picsum.photos/seed/design/400/225', 
        difficulty: 'Beginner',
        category: 'Design'
    },
    { 
        id: '3', 
        title: 'System Design Interview Prep', 
        instructor: 'Alex Xu', 
        progress: 10, 
        completedLessons: 1, 
        totalLessons: 12, 
        thumbnail: 'https://picsum.photos/seed/system/400/225', 
        difficulty: 'Advanced',
        category: 'Coding'
    },
    { 
        id: '4', 
        title: 'Microbiology Society', 
        instructor: 'Dr. Sarah', 
        progress: 30, 
        completedLessons: 3, 
        totalLessons: 10, 
        thumbnail: 'https://picsum.photos/seed/bio/400/225', 
        difficulty: 'Intermediate',
        category: 'Science'
    },
    { 
        id: '5', 
        title: 'UI/UX Principles 2024', 
        instructor: 'Sarah D.', 
        progress: 0, 
        completedLessons: 0, 
        totalLessons: 8, 
        thumbnail: 'https://picsum.photos/seed/ui/400/225', 
        difficulty: 'Beginner',
        category: 'Design'
    },
  ]);

  // Delete State
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
  };

  const handleDeleteClick = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) {
        setCourseToDelete(course);
    }
  };

  const handleConfirmDelete = () => {
    if (courseToDelete) {
        setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
        setCourseToDelete(null);
    }
  };

  // User Data
  const user: User = {
    id: '1',
    name: 'Arka Maulana',
    email: 'arka.m@university.edu',
  };

  const exams: Exam[] = [
    { id: 'e1', title: 'Linear Algebra Final', date: new Date(Date.now() + 86400000 * 2), durationMinutes: 120, status: 'upcoming' },
    { id: 'e2', title: 'Biology Midterm', date: new Date(Date.now() + 86400000 * 5), durationMinutes: 90, status: 'upcoming' },
    { id: 'e3', title: 'Data Structures Quiz', date: new Date(Date.now() + 86400000 * 8), durationMinutes: 45, status: 'upcoming' },
    { id: 'e4', title: 'UX Research Presentation', date: new Date(Date.now() + 86400000 * 12), durationMinutes: 60, status: 'upcoming' },
  ];

  const filterOptions = ['All', 'Design', 'Science', 'Coding'];

  const filteredCourses = selectedFilter === 'All' 
    ? courses 
    : courses.filter(course => (course.category || 'General').toLowerCase().includes(selectedFilter.toLowerCase()) || 
                               (selectedFilter === 'Design' && course.category === 'Design & Creative'));

  return (
    <DashboardLayout currentUser={user} onNavigate={onNavigate}>
      <div className="animate-slide-up pb-24">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    Hello, {user.name.split(' ')[0]} <span className="animate-wave text-3xl">👋</span>
                </h1>
                <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
                    Nice to have you back! Get ready to continue your learning journey. 
                    You have <span className="font-semibold text-primary">{exams.length} exams</span> scheduled this week.
                </p>
            </div>
            <div className="hidden md:block">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1 text-right">Current Date</span>
                <span className="text-sm font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Column (Main Content) - Spans 8 cols */}
            <div className="xl:col-span-8 flex flex-col gap-8">
                
                {/* Active Course (Hero) */}
                <section>
                     <ActiveCourseCard 
                        title="Biology Molecular: Genetic Engineering"
                        progress={79}
                        totalLessons={21}
                        completedLessons={15}
                        timeLeft="50 min"
                        students={312}
                        image="https://picsum.photos/seed/dna/800/400"
                     />
                </section>

                {/* Your Class / Other Courses */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                         <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Your Courses <span className="text-slate-400 text-sm font-normal">({courses.length})</span>
                         </h2>
                         
                         {/* Filter Tabs */}
                         <div className="flex p-1 bg-slate-100/80 rounded-xl overflow-x-auto no-scrollbar">
                            {filterOptions.map(option => (
                                <button
                                    key={option}
                                    onClick={() => setSelectedFilter(option)}
                                    className={`
                                        px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
                                        ${selectedFilter === option 
                                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                                    `}
                                >
                                    {option}
                                </button>
                            ))}
                         </div>
                    </div>
                    
                    {filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {filteredCourses.map(course => (
                                <CourseCard 
                                    key={course.id} 
                                    course={course} 
                                    onDelete={handleDeleteClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center animate-fade-in">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-semibold mb-1">No courses found</h3>
                            <p className="text-slate-500 text-sm mb-4">Try selecting a different category or create a new one.</p>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="text-primary text-sm font-semibold hover:underline"
                            >
                                Create New Course
                            </button>
                        </div>
                    )}
                </section>
                
                {/* Learning Activity Chart (Mobile View) */}
                <section className="block xl:hidden">
                    <LearningChart />
                </section>
            </div>

            {/* Right Column (Widgets) - Spans 4 cols */}
            <div className="xl:col-span-4 flex flex-col gap-6">
                
                {/* Profile / Stats Widget */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/20">
                        <div className="w-full h-full rounded-2xl border-2 border-white overflow-hidden bg-white">
                             <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">Computer Science Student</p>
                        <div className="flex gap-4 mt-3">
                             <div className="flex flex-col">
                                 <span className="text-lg font-bold text-slate-900 leading-none">{courses.length}</span>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Courses</span>
                             </div>
                             <div className="w-px h-8 bg-slate-100"></div>
                             <div className="flex flex-col">
                                 <span className="text-lg font-bold text-slate-900 leading-none">18</span>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Certs</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Gamification Widget */}
                <XPWidget />

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#FFFAF0] border border-[#FEEBC8] rounded-2xl p-5 flex flex-col justify-between h-40 cursor-pointer hover:shadow-md hover:translate-y-[-2px] transition-all group">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                             <MessageSquare className="w-5 h-5 text-orange-500" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800 text-sm mb-1">Consultation</h4>
                             <p className="text-[10px] text-slate-500 leading-tight">Get a mentor to help your learning</p>
                         </div>
                         <div className="self-end bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                             <ArrowUpRight className="w-3 h-3 text-orange-500" />
                         </div>
                    </div>
                    <div className="bg-[#FDF4FF] border border-[#F5D0FE] rounded-2xl p-5 flex flex-col justify-between h-40 cursor-pointer hover:shadow-md hover:translate-y-[-2px] transition-all group">
                         <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2">
                             <Target className="w-5 h-5 text-purple-500" />
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800 text-sm mb-1">Set Target</h4>
                             <p className="text-[10px] text-slate-500 leading-tight">Plan your study timeline</p>
                         </div>
                         <div className="self-end bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                             <ArrowUpRight className="w-3 h-3 text-purple-500" />
                         </div>
                    </div>
                </div>

                {/* Chart (Desktop Only in Sidebar) */}
                <div className="hidden xl:block h-72">
                    <LearningChart />
                </div>

                {/* Upcoming Exams Carousel */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-bold text-slate-800">Upcoming Exams</h3>
                        <button 
                            onClick={() => onNavigate('/exams')}
                            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-dark transition-colors bg-indigo-50 px-2 py-1 rounded-md"
                        >
                            See All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {exams.map(exam => (
                            <ExamCard key={exam.id} exam={exam} />
                        ))}
                    </div>
                </div>

            </div>
        </div>

      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/30 flex items-center justify-center text-white hover:scale-105 hover:bg-primary transition-all duration-300 z-40 group"
        aria-label="Add New Course"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Course Creation Modal */}
      <CreateCourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCourseCreated={handleAddCourse}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
        courseTitle={courseToDelete?.title || ''}
      />

    </DashboardLayout>
  );
};