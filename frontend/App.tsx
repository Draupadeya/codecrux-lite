
import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/Login';
import { RegisterScreen } from './screens/Register';
import { DashboardScreen } from './screens/Dashboard';
import { MyCoursesScreen } from './screens/MyCourses';
import { CourseLearningScreen } from './screens/CourseLearning';
import { QuizScreen } from './screens/Quiz';
import { PracticeLabScreen } from './screens/PracticeLab';
import { ProctoringScreen } from './screens/Proctoring';
import { ExamResultsScreen } from './screens/ExamResults';
import { AnalyticsScreen } from './screens/Analytics';
import { LiveExamScreen } from './screens/LiveExam';
import { ExamsScreen } from './screens/Exams';

const App: React.FC = () => {
  // Using simple state-based routing since we can't use React Router DOM in this environment easily
  // In a real app, use react-router-dom
  const [currentPath, setCurrentPath] = useState<string>('/login');

  // Handle hash changes for simple navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/login';
      setCurrentPath(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  return (
    <div className="font-sans antialiased text-slate-900 bg-white min-h-screen">
      {currentPath === '/register' ? (
        <RegisterScreen onNavigate={navigate} />
      ) : currentPath === '/dashboard' ? (
        <DashboardScreen onNavigate={navigate} />
      ) : currentPath === '/courses' ? (
        <MyCoursesScreen onNavigate={navigate} />
      ) : currentPath === '/exams' ? (
        <ExamsScreen onNavigate={navigate} />
      ) : currentPath === '/analytics' ? (
        <AnalyticsScreen onNavigate={navigate} />
      ) : currentPath.startsWith('/learning') ? (
        <CourseLearningScreen onNavigate={navigate} />
      ) : currentPath === '/quiz' ? (
        <QuizScreen onNavigate={navigate} />
      ) : currentPath === '/lab' ? (
        <PracticeLabScreen onNavigate={navigate} />
      ) : currentPath === '/proctoring' ? (
        <ProctoringScreen onNavigate={navigate} />
      ) : currentPath === '/live-exam' ? (
        <LiveExamScreen onNavigate={navigate} />
      ) : currentPath === '/exam-results' ? (
        <ExamResultsScreen onNavigate={navigate} />
      ) : (
        <LoginScreen onNavigate={navigate} />
      )}
    </div>
  );
};

export default App;
