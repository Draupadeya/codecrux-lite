import React, { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ValidationStatus } from '../types';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onNavigate: (path: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/monitor/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login success:', data);
        // Store token if needed, or rely on session cookie
        onNavigate('/dashboard');
      } else {
        console.error('Login failed:', data);
        alert('Login failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      imageSrc="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop"
      testimonialQuote="SparkLess transformed how I learn. The AI-driven insights helped me master complex topics in half the time."
      testimonialAuthor="Sarah Chen, Computer Science Student"
    >
      <div className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          Welcome back
        </h1>
        <p className="text-slate-500 text-sm md:text-base leading-relaxed">
          Enter your details to access your personalized learning workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={<Mail className="w-5 h-5" />}
            status={email.length > 0 && !email.includes('@') ? ValidationStatus.Invalid : ValidationStatus.Idle}
            errorMessage="Please enter a valid email address"
          />
          
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-5 h-5" />}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Remember me</span>
          </label>
          <button 
            type="button"
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" isLoading={isLoading} className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
          Sign In <ArrowRight className="w-4 h-4 ml-2 opacity-80" />
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
          <span className="px-4 bg-[#FAFAFA] text-slate-400">Or continue with</span>
        </div>
      </div>

      <Button variant="google" onClick={() => console.log('Google Auth')} className="hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all">
        <img 
          src="https://www.svgrepo.com/show/475656/google-color.svg" 
          alt="Google" 
          className="w-5 h-5"
        />
        Sign in with Google
      </Button>

      <p className="text-center mt-8 text-sm text-slate-600">
        Don't have an account?{' '}
        <button 
          onClick={() => onNavigate('/register')}
          className="text-primary font-semibold hover:text-primary-dark hover:underline transition-all"
        >
          Create account
        </button>
      </p>
    </AuthLayout>
  );
};