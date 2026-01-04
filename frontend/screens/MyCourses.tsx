import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { CourseCard } from '../components/Dashboard/CourseCard';
import { CreateCourseModal } from '../components/Dashboard/CreateCourseModal';
import { DeleteConfirmationModal } from '../components/Dashboard/DeleteConfirmationModal';
import { Button } from '../components/ui/Button';
import { Plus, BookOpen, Clock, CheckCircle, Flame, Trophy, Search } from 'lucide-react';
import { Course, User } from '../types';

interface MyCoursesScreenProps {
  onNavigate: (path: string) => void;
}

export const MyCoursesScreen: React.FC<MyCoursesScreenProps> = ({ onNavigate }) => {
  // User Data (Mock)
  const user: User = {
    id: '1',
    name: 'Arka Maulana',
    email: 'arka.m@university.edu',
  };

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'In Progress' | 'Completed'>('All');

  // Mock Courses Data
  const [courses, setCourses] = useState<Course[]>([
    { 
        id: '1', 
        title: 'Biology Molecular: Genetic Engineering', 
        instructor: 'Dr. Sarah', 
        progress: 79, 
        completedLessons: 15, 
        totalLessons: 21, 
        thumbnail: 'https://picsum.photos/seed/dna/800/400', 
        difficulty: 'Intermediate',
        category: 'Science'
    },
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
    { 
        id: '6', 
        title: 'Advanced React Patterns', 
        instructor: 'Kent C.', 
        progress: 100, 
        completedLessons: 15, 
        totalLessons: 15, 
        thumbnail: 'https://picsum.photos/seed/react/400/225', 
        difficulty: 'Advanced',
        category: 'Coding'
    },
  ]);

  // Derived State
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesTab = activeTab === 'All' 
        ? true 
        : activeTab === 'Completed' 
          ? course.progress === 100 
          : course.progress < 100 && course.progress > 0;

      return matchesTab;
    });
  }, [courses, activeTab]);

  const stats = {
    total: courses.length,
    inProgress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
    completed: courses.filter(c => c.progress === 100).length,
    streak: 12 // Mock value
  };

  // Handlers
  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
  };

  const handleDeleteClick = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (course) setCourseToDelete(course);
  };

  const handleConfirmDelete = () => {
    if (courseToDelete) {
        setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
        setCourseToDelete(null);
    }
  };

  return (
    <DashboardLayout currentUser={user} onNavigate={onNavigate} currentPath="/courses">
      <div className="animate-slide-up pb-12 max-w-[1400px] mx-auto">
        
        {/* Hero / Header Section */}
        <div className="relative mb-10">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-primary/10 to-purple-100/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">My Curriculum</h1>
                    <p className="text-slate-500 text-sm md:text-base max-w-2xl leading-relaxed">
                        Track your progress, manage your learning paths, and achieve your goals. 
                        You've been consistent for <span className="font-semibold text-primary">{stats.streak} days</span>!
                    </p>
                </div>
                
                <div className="w-full md:w-auto shrink-0">
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full md:w-auto shadow-xl shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all px-8 py-3.5"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Course
                    </Button>
                </div>
            </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatItem 
                label="Total Courses" 
                value={stats.total} 
                icon={BookOpen} 
                color="text-indigo-600" 
                bg="bg-indigo-50" 
            />
            <StatItem 
                label="In Progress" 
                value={stats.inProgress} 
                icon={Clock} 
                color="text-amber-600" 
                bg="bg-amber-50" 
            />
            <StatItem 
                label="Completed" 
                value={stats.completed} 
                icon={CheckCircle} 
                color="text-emerald-600" 
                bg="bg-emerald-50" 
            />
            <StatItem 
                label="Current Streak" 
                value={`${stats.streak} Days`} 
                icon={Flame} 
                color="text-orange-600" 
                bg="bg-orange-50" 
            />
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-slate-200">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                {(['All', 'In Progress', 'Completed'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            pb-4 text-sm font-medium transition-all relative whitespace-nowrap px-1
                            ${activeTab === tab 
                                ? 'text-primary font-bold' 
                                : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        {tab}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)]"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredCourses.map(course => (
                    <CourseCard 
                        key={course.id} 
                        course={course} 
                        onDelete={handleDeleteClick}
                    />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                    <Trophy className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No courses here yet</h3>
                <p className="text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
                    {activeTab === 'Completed' 
                        ? "You haven't completed any courses yet. Keep learning!" 
                        : "Start your learning journey by creating a new course from any YouTube content."}
                </p>
                {activeTab !== 'Completed' && (
                    <Button 
                        onClick={() => setIsCreateModalOpen(true)}
                        variant="secondary"
                        className="w-auto px-6"
                    >
                        Create Your First Course
                    </Button>
                )}
            </div>
        )}

      </div>

      {/* Modals */}
      <CreateCourseModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onCourseCreated={handleAddCourse}
      />

      <DeleteConfirmationModal
        isOpen={!!courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
        courseTitle={courseToDelete?.title || ''}
      />
    </DashboardLayout>
  );
};

// Helper Component for Stats
const StatItem = ({ label, value, icon: Icon, color, bg }: { label: string, value: string | number, icon: any, color: string, bg: string }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow flex items-center gap-4 group">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-xl font-bold text-slate-900 leading-none mb-1.5">{value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        </div>
    </div>
);
