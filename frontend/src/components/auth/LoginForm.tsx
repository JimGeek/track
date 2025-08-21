import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import TrackLogo from '../ui/TrackLogo';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Circles - Updated to match logo colors */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400 opacity-8 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-300 opacity-4 rounded-full animate-bounce" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-yellow-500 opacity-10 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 right-10 w-48 h-48 bg-yellow-400 opacity-6 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(234,179,8,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* Animated Geometric Shapes - Softer animations */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 border-2 border-yellow-400 opacity-15 rotate-45 animate-spin" style={{ animationDuration: '25s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 border-2 border-yellow-300 opacity-12 rotate-12 animate-bounce" style={{ animationDuration: '10s' }}></div>
        <div className="absolute top-10 left-1/2 w-16 h-16 border border-yellow-500 opacity-10 rotate-45 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-300">
              <TrackLogo size="large" variant="full" className="scale-150" isDark={true} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 animate-fade-in-up">
              Welcome back
            </h1>
            <p className="text-lg text-gray-300 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Sign in to your Track account to manage your projects
            </p>
            <p className="mt-4 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-yellow-400 hover:text-yellow-300 underline underline-offset-4 transition-colors duration-200"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-yellow-200/30 animate-fade-in-up" style={{ animationDelay: '0.6s', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(234, 179, 8, 0.1)' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h2>
        
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
              
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300/60 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300/60 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-yellow-600 hover:text-yellow-700 transition-colors duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;