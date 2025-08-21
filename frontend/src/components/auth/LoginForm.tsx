import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import TrackLogo from '../ui/TrackLogo';
import { 
  BarChart3, Calendar, CheckSquare, Clock, FileText, Folder, 
  Target, TrendingUp, Users, Zap, Settings, GitBranch,
  PieChart, Activity, Flag, Bookmark, Tag, MessageSquare,
  Monitor, Layers, Database, Cloud, Shield, Star,
  Play, Pause, FastForward, RotateCcw, Archive, Download,
  Upload, Share, Link2, Globe, Mail, Phone, Map,
  Search, Filter, Grid, List
} from 'lucide-react';

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Floating Lucide Project Management Icons */}
        {/* Row 1 */}
        <BarChart3 className="absolute top-16 left-8 w-8 h-8 text-blue-400 opacity-30 animate-pulse" style={{ animationDuration: '4s', animationDelay: '0s' }} />
        <Calendar className="absolute top-20 left-20 w-7 h-7 text-green-400 opacity-35 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }} />
        <CheckSquare className="absolute top-24 left-32 w-9 h-9 text-purple-400 opacity-30 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <Clock className="absolute top-12 left-44 w-7 h-7 text-orange-400 opacity-40 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
        <FileText className="absolute top-28 left-56 w-8 h-8 text-indigo-400 opacity-35 animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />
        <Folder className="absolute top-16 left-68 w-7 h-7 text-cyan-400 opacity-30 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2.5s' }} />
        <Target className="absolute top-32 left-80 w-8 h-8 text-pink-400 opacity-40 animate-pulse" style={{ animationDuration: '6s', animationDelay: '3s' }} />
        <TrendingUp className="absolute top-8 left-96 w-7 h-7 text-yellow-400 opacity-35 animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '3.5s' }} />
        
        {/* Row 2 */}
        <Users className="absolute top-48 left-12 w-7 h-7 text-teal-400 opacity-30 animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.2s' }} />
        <Zap className="absolute top-52 left-24 w-8 h-8 text-red-400 opacity-35 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.7s' }} />
        <Settings className="absolute top-44 left-36 w-7 h-7 text-emerald-400 opacity-40 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.2s' }} />
        <GitBranch className="absolute top-56 left-48 w-9 h-9 text-violet-400 opacity-30 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1.7s' }} />
        <PieChart className="absolute top-40 left-60 w-7 h-7 text-amber-400 opacity-35 animate-pulse" style={{ animationDuration: '8s', animationDelay: '2.2s' }} />
        <Activity className="absolute top-60 left-72 w-8 h-8 text-lime-400 opacity-40 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2.7s' }} />
        <Flag className="absolute top-36 left-84 w-7 h-7 text-sky-400 opacity-30 animate-pulse" style={{ animationDuration: '7s', animationDelay: '3.2s' }} />
        <Bookmark className="absolute top-64 left-96 w-7 h-7 text-rose-400 opacity-35 animate-bounce" style={{ animationDuration: '6s', animationDelay: '3.7s' }} />
        
        {/* Right Side */}
        <Tag className="absolute top-20 right-8 w-8 h-8 text-blue-500 opacity-30 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.3s' }} />
        <MessageSquare className="absolute top-32 right-16 w-7 h-7 text-green-500 opacity-35 animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.8s' }} />
        <Monitor className="absolute top-16 right-28 w-9 h-9 text-purple-500 opacity-40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1.3s' }} />
        <Layers className="absolute top-44 right-40 w-7 h-7 text-orange-500 opacity-30 animate-pulse" style={{ animationDuration: '7s', animationDelay: '1.8s' }} />
        <Database className="absolute top-28 right-52 w-8 h-8 text-indigo-500 opacity-35 animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '2.3s' }} />
        <Cloud className="absolute top-56 right-64 w-7 h-7 text-cyan-500 opacity-40 animate-pulse" style={{ animationDuration: '6.5s', animationDelay: '2.8s' }} />
        
        {/* Bottom Area */}
        <Shield className="absolute bottom-32 left-16 w-8 h-8 text-pink-500 opacity-30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.4s' }} />
        <Star className="absolute bottom-28 left-28 w-7 h-7 text-yellow-500 opacity-35 animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.9s' }} />
        <Play className="absolute bottom-44 left-40 w-9 h-9 text-teal-500 opacity-40 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1.4s' }} />
        <Pause className="absolute bottom-36 left-52 w-7 h-7 text-red-500 opacity-30 animate-pulse" style={{ animationDuration: '6s', animationDelay: '1.9s' }} />
        <FastForward className="absolute bottom-52 left-64 w-8 h-8 text-emerald-500 opacity-35 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2.4s' }} />
        <RotateCcw className="absolute bottom-20 left-76 w-7 h-7 text-violet-500 opacity-40 animate-pulse" style={{ animationDuration: '8s', animationDelay: '2.9s' }} />
        
        <Archive className="absolute bottom-40 right-12 w-8 h-8 text-amber-500 opacity-30 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.6s' }} />
        <Download className="absolute bottom-24 right-24 w-7 h-7 text-lime-500 opacity-35 animate-pulse" style={{ animationDuration: '6.5s', animationDelay: '1.1s' }} />
        <Upload className="absolute bottom-56 right-36 w-9 h-9 text-sky-500 opacity-40 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1.6s' }} />
        <Share className="absolute bottom-32 right-48 w-7 h-7 text-rose-500 opacity-30 animate-pulse" style={{ animationDuration: '7s', animationDelay: '2.1s' }} />
        <Link2 className="absolute bottom-48 right-60 w-8 h-8 text-blue-600 opacity-35 animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '2.6s' }} />
        
        {/* Center Area Icons */}
        <Globe className="absolute top-1/2 left-1/4 w-7 h-7 text-green-600 opacity-25 animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.8s' }} />
        <Mail className="absolute top-1/3 right-1/4 w-7 h-7 text-purple-600 opacity-30 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.3s' }} />
        <Phone className="absolute bottom-1/3 left-1/3 w-8 h-8 text-orange-600 opacity-35 animate-pulse" style={{ animationDuration: '7s', animationDelay: '1.8s' }} />
        <Map className="absolute top-2/3 right-1/3 w-7 h-7 text-indigo-600 opacity-40 animate-bounce" style={{ animationDuration: '5s', animationDelay: '2.3s' }} />
        <Search className="absolute bottom-1/4 right-1/5 w-9 h-9 text-cyan-600 opacity-25 animate-pulse" style={{ animationDuration: '6.5s', animationDelay: '2.8s' }} />
        <Filter className="absolute top-1/4 left-1/5 w-7 h-7 text-pink-600 opacity-30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '3.3s' }} />
        <Grid className="absolute top-1/5 right-1/5 w-7 h-7 text-emerald-600 opacity-35 animate-pulse" style={{ animationDuration: '5.5s', animationDelay: '3.8s' }} />
        <List className="absolute bottom-1/5 left-1/6 w-8 h-8 text-violet-600 opacity-30 animate-bounce" style={{ animationDuration: '6.5s', animationDelay: '4s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8 transform hover:scale-105 transition-transform duration-300">
              <TrackLogo size="large" variant="full" className="scale-150" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 animate-fade-in-up">
              Welcome back
            </h1>
            <p className="text-lg text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Sign in to your Track account to manage your projects
            </p>
            <p className="mt-4 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 transition-colors duration-200"
              >
                Create one here
              </Link>
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-gray-200/50 animate-fade-in-up" style={{ animationDelay: '0.6s', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)' }}>
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
                    className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300/60 placeholder-gray-500 text-gray-900 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
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
                    className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-300/60 placeholder-gray-500 text-gray-900 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
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
                    className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
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