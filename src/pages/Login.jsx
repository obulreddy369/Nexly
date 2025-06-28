import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    clearErrors();
    try {
      const res = await fetch('https://g5mn64krl5.execute-api.us-east-1.amazonaws.com/prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      const parsed = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

      if (res.ok && parsed.message === 'Login successful') {
        // ✅ Store name from parsed response
        setUser({ email: parsed.email, name: parsed.name });
        localStorage.setItem('nexly_user', JSON.stringify({ email: parsed.email, name: parsed.name }));
        navigate('/dashboard');
      } else {
        setError('root', { message: parsed.message || 'Invalid email or password' });
      }
    } catch (err) {
      setError('root', { message: 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to NEXLY</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className={`block w-full rounded-lg border pl-10 pr-12 py-2 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {errors.root && <div className="text-sm text-red-600">{errors.root.message}</div>}

            <Button type="submit" loading={isLoading} className="w-full" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
              >
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={toggleTheme}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Switch to {isDark ? 'light' : 'dark'} mode
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
