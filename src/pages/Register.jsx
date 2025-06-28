import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    clearErrors();
    try {
      const response = await fetch('https://z9fgkcyo7l.execute-api.us-east-1.amazonaws.com/prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });

      const result = await response.json();
      const parsedBody = JSON.parse(result.body);

      if (response.ok && parsedBody === 'User registered successfully') {
        setUser({ email: data.email });
        localStorage.setItem('nexly_user', JSON.stringify({ email: data.email }));
        navigate('/dashboard');
      } else {
        setError('root', { message: parsedBody || 'Registration failed. Please try again.' });
      }
    } catch (error) {
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
            <motion.div className="w-16 h-16 rounded-2xl bg-indigo-600 inline-flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join NEXLY</h1>
            <p className="text-gray-600 dark:text-gray-400">Create your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm text-gray-700 dark:text-gray-300">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Full name"
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2 ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  className={`block w-full rounded-lg border pl-10 pr-12 py-2 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-gray-700 dark:text-gray-300">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  className={`block w-full rounded-lg border pl-10 pr-12 py-2 ${
                    errors.confirmPassword ? 'border-red-500' : ''
                  }`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {errors.root && <div className="text-sm text-red-600">{errors.root.message}</div>}

            <Button type="submit" loading={isLoading} className="w-full" size="lg">Create Account</Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button onClick={toggleTheme} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Switch to {isDark ? 'light' : 'dark'} mode
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
