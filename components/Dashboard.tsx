import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  Users, 
  User, 
  LogOut, 
  GraduationCap, 
  Plus, 
  BookOpen, 
  Calendar, 
  Menu, 
  X, 
  Loader2,
  Edit3,
  Trash2,
  AlertTriangle,
  Search,
  Sparkles,
  Layers,
  FileText,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Pin
} from 'lucide-react';
import { supabase } from '../services/supabaseClient.ts';
import { AddCourseModal } from './AddCourseModal.tsx';
import { EditCourseModal } from './EditCourseModal.tsx';
import { AccountSettings } from './AccountSettings.tsx';
import { CommunityTab } from './CommunityTab.tsx';
import { QuickReviewPanel } from './QuickReviewPanel.tsx';
import { NotificationBell } from './NotificationBell.tsx';
import { CourseDetail } from './CourseDetail.tsx';

interface DashboardProps {
  onSignOut: () => void;
  isPasswordRecovery?: boolean;
}

type Tab = 'dashboard' | 'community' | 'account';

export interface Course {
  id: string;
  name: string;
  degree: string;
  academic_structure: string;
  current_value: string;
  join_date: string;
  end_date?: string | null;
  subjects?: { id: string; name: string }[];
}

export const Dashboard: React.FC<DashboardProps> = ({ onSignOut, isPasswordRecovery }) => {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('studypro_active_tab');
    return (saved as Tab) || 'dashboard';
  });
  
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);

  // Search and Filter state
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [degreeFilter, setDegreeFilter] = useState<string>('ALL');

  // Edit/Delete States for Dashboard Cards
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // State to handle navigation from notification to specific chat
  const [chatUserId, setChatUserId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('studypro_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (isPasswordRecovery) {
      setActiveTab('account');
      setIsSidebarOpen(false);
    }
  }, [isPasswordRecovery]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          subjects (id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
      
      // If a course is currently selected, update its data in view
      if (selectedCourse) {
        const updatedSelected = (data || []).find(c => c.id === selectedCourse.id);
        if (updatedSelected) {
          setSelectedCourse(updatedSelected);
        }
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('avatar_url, full_name').eq('id', user.id).single();
      if (profile) {
        setProfilePic(profile.avatar_url || null);
        setUserName(profile.full_name || 'User');
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchCourses();
    fetchUserData();
  }, [activeTab]);

  useEffect(() => {
    if (!loading && courses.length > 0 && !hasAttemptedRestore) {
      const savedCourseId = localStorage.getItem('studypro_active_course_id');
      if (savedCourseId) {
        const found = courses.find(c => c.id === savedCourseId);
        if (found) {
          setSelectedCourse(found);
        }
      }
      setHasAttemptedRestore(true);
    }
  }, [loading, courses, hasAttemptedRestore]);

  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem('studypro_active_course_id', selectedCourse.id);
    }
  }, [selectedCourse]);

  const handleBackToDashboard = () => {
    localStorage.removeItem('studypro_active_course_id');
    setSelectedCourse(null);
  };

  const handleSignOut = async () => {
    localStorage.removeItem('studypro_active_tab');
    localStorage.removeItem('studypro_active_course_id');
    await supabase.auth.signOut();
    onSignOut();
  };

  const extractPathFromUrl = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      const BUCKET_NAME = 'course-multimedia';
      const parts = url.pathname.split(`/${BUCKET_NAME}/`);
      if (parts.length < 2) return null;
      return decodeURIComponent(parts[1]);
    } catch (e) {
      console.error('Error extracting path from URL:', e);
      return null;
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeletingCourse(true);
    try {
       // 1. Cleanup Storage
       const subjectIds = courseToDelete.subjects?.map(s => s.id) || [];
       
       if (subjectIds.length > 0) {
         const { data: mediaFiles } = await supabase
           .from('course_media')
           .select('url')
           .in('subject_id', subjectIds);

         if (mediaFiles && mediaFiles.length > 0) {
           const pathsToDelete = mediaFiles
             .map(m => extractPathFromUrl(m.url))
             .filter((p): p is string => !!p);

           if (pathsToDelete.length > 0) {
             const { error: storageError } = await supabase.storage
               .from('course-multimedia')
               .remove(pathsToDelete);
             
             if (storageError) {
               console.error('Failed to delete files from storage:', storageError);
             }
           }
         }
       }

       // 2. Delete Course Record
       const { error } = await supabase.from('courses').delete().eq('id', courseToDelete.id);
       if(error) throw error;
       
       // 3. Update Profile
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         const { data: allCourses } = await supabase
           .from('courses')
           .select('name')
           .eq('user_id', user.id);
           
         if (allCourses && allCourses.length > 0) {
           const courseNames = allCourses.map(c => c.name).join(', ');
           await supabase
             .from('profiles')
             .update({ coursename: courseNames })
             .eq('id', user.id);
         } else {
             await supabase
              .from('profiles')
              .update({ coursename: null })
              .eq('id', user.id);
         }
       }

       setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
       setCourseToDelete(null);
    } catch (error: any) {
       alert('Error deleting course: ' + error.message);
    } finally {
       setIsDeletingCourse(false);
    }
  };

  const handleClearEndDate = async (courseToClear: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ end_date: null })
        .eq('id', courseToClear.id);

      if (error) throw error;
      fetchCourses();
    } catch (error: any) {
      alert('Failed to clear end date: ' + (error.message || 'Unknown error'));
    }
  };

  const handleNotificationClick = (senderId: string) => {
    setChatUserId(senderId);
    setActiveTab('community');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'community', label: 'Community', icon: <Users size={20} /> },
    { id: 'account', label: 'Account', icon: <User size={20} /> },
  ];

  // Quick stats calculations
  const totalCoursesCount = courses.length;
  const totalSubjectsCount = courses.reduce((acc, c) => acc + (c.subjects?.length || 0), 0);
  const degreesAvailable = Array.from(new Set(courses.map(c => c.degree).filter(Boolean)));

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      course.degree.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      course.subjects?.some(s => s.name.toLowerCase().includes(courseSearchQuery.toLowerCase()));
    
    const matchesDegree = degreeFilter === 'ALL' || course.degree === degreeFilter;
    
    return matchesSearch && matchesDegree;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDegreeBadgeColor = (degree: string) => {
    switch(degree?.toUpperCase()) {
      case 'BACHELOR':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-200/60';
      case 'MASTER':
        return 'bg-purple-500/10 text-purple-600 border-purple-200/60';
      case '+2':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60';
      case 'SEE':
        return 'bg-amber-500/10 text-amber-600 border-amber-200/60';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-200/60';
    }
  };

  const handleToggleSidebarPin = () => {
    setIsSidebarPinned(prev => !prev);
    setIsSidebarOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden w-full fixed inset-0 font-sans">
      {showAddModal && (
        <AddCourseModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => { setShowAddModal(false); fetchCourses(); }}
        />
      )}

      {courseToEdit && (
        <EditCourseModal 
          course={courseToEdit}
          onClose={() => setCourseToEdit(null)}
          onSuccess={() => {
            setCourseToEdit(null);
            fetchCourses();
          }}
        />
      )}

      {courseToDelete && createPortal(
        <div className="fixed inset-0 z-[9500] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 border border-slate-100 relative text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100/50 shadow-sm">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Delete Course?</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-900">{courseToDelete.name}</span>?<br/>
              This will remove all associated notes and files permanently.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteCourse}
                disabled={isDeletingCourse}
                className="w-full py-3.5 bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDeletingCourse ? <Loader2 className="animate-spin" size={20} /> : 'Yes, Delete Course'}
              </button>
              <button 
                onClick={() => setCourseToDelete(null)}
                disabled={isDeletingCourse}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isSidebarOpen && !isSidebarPinned && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[900] transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Desktop Sidebar Spacer to preserve layout */}
      <div className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${isSidebarPinned ? 'w-[280px]' : 'w-0'}`} />

      {/* Sleek Dark Modern Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[1000] bg-[#4e46e5] transition-all duration-300 ease-in-out flex flex-col text-white border-r border-indigo-700/50 shrink-0 overflow-hidden w-[280px]
        ${isSidebarPinned ? 'translate-x-0 shadow-none' : (isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')}
      `}>
        <div className="w-[280px] h-full flex flex-col min-w-[280px]">
          {/* Brand Header */}
          <div className="p-7 flex items-center justify-between border-b border-white/10 shrink-0 h-20">
            <div className="flex items-center gap-3.5">
              <div className="bg-white p-2.5 rounded-2xl text-indigo-600 shadow-lg shadow-black/5">
                <GraduationCap size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black text-white tracking-tight block">StudyPro</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="hidden lg:block text-indigo-200 hover:text-white transition-colors" 
                onClick={handleToggleSidebarPin}
                title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
              >
                <Pin size={20} className={isSidebarPinned ? 'rotate-45' : ''} />
              </button>
              <button className="lg:hidden text-indigo-200 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="px-4 py-6 flex-1 overflow-y-auto no-scrollbar">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as Tab);
                    if (!isSidebarPinned) setIsSidebarOpen(false);
                    handleBackToDashboard();
                    if (item.id === 'community') setChatUserId(null);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold transition-all duration-200 group/nav
                    ${isActive 
                      ? 'bg-white text-indigo-600 shadow-lg shadow-black/5' 
                      : 'text-indigo-100 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`transition-transform duration-200 group-hover/nav:scale-110 ${isActive ? 'text-indigo-600' : 'text-indigo-200 group-hover/nav:text-white'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-bold tracking-wide">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={16} className="text-indigo-400" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer User & Logout */}
        <div className="mt-auto p-4 border-t border-white/10 bg-black/10 shrink-0">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all text-sm tracking-wide shadow-md shadow-rose-500/20"
          >
            <div className="flex items-center gap-2.5">
              <LogOut size={20} className="text-white" />
              <span className="text-sm font-bold tracking-wide">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
      </aside>

      {/* Main Layout Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] relative">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 md:px-10 shrink-0 z-[200]">
          <div className="flex items-center gap-4">
            {!isSidebarPinned && (
              <button 
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" 
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={22} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 capitalize tracking-tight">
                {activeTab}
              </h1>
              {activeTab === 'dashboard' && selectedCourse && (
                <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm font-semibold">
                  <span>/</span>
                  <span className="text-indigo-600 font-bold">{selectedCourse.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            {currentUserId && <NotificationBell userId={currentUserId} onNotificationClick={handleNotificationClick} />}
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-1.5 pr-4 rounded-2xl shadow-sm hover:border-slate-300 transition-all">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-sm text-white font-bold text-sm">
                {profilePic ? (
                  <img src={profilePic} className="w-full h-full object-cover" alt={userName} />
                ) : (
                  userName ? userName.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 tracking-tight capitalize leading-tight">{userName || 'Student'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic Content View */}
        <div className={`flex-1 min-w-0 ${activeTab === 'community' ? 'overflow-hidden flex flex-col p-2 md:p-8' : 'overflow-y-auto p-4 sm:p-6 lg:p-6 custom-scrollbar'}`}>
          <div className={`max-w-[1400px] mx-auto w-full ${activeTab === 'community' ? 'h-full flex flex-col' : ''}`}>
            {activeTab === 'dashboard' && (
              <>
                {selectedCourse ? (
                  <CourseDetail 
                    course={selectedCourse} 
                    onBack={handleBackToDashboard} 
                    profilePic={profilePic}
                    userName={userName}
                    onSignOut={handleSignOut}
                    onCourseUpdated={fetchCourses}
                    onCourseDeleted={() => {
                      handleBackToDashboard();
                      fetchCourses();
                    }}
                  />
                ) : (
                  <div className="flex flex-col xl:flex-row gap-6 items-start animate-in fade-in duration-500 w-full min-w-0">
                    <div className="flex-1 min-w-0 w-full space-y-6">
                    
                    {/* Courses Section Header & Search/Filter Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Courses</h3>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                          Click any course to manage subjects, upload notes, and view study logs.
                        </p>
                      </div>

                      {/* Filter & Search Bar */}
                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text"
                            placeholder="Search course or subject..."
                            value={courseSearchQuery}
                            onChange={(e) => setCourseSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-48 md:w-56 shadow-sm transition-all"
                          />
                          {courseSearchQuery && (
                            <button 
                              onClick={() => setCourseSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>

                        <button 
                          onClick={() => setShowAddModal(true)}
                          className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all duration-200 active:scale-95 group shrink-0 text-sm"
                        >
                          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                          <span>Add New Course</span>
                        </button>
                      </div>
                    </div>

                    {/* Courses Grid */}
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm">
                        <Loader2 size={36} className="text-indigo-600 animate-spin mb-4" />
                        <p className="text-slate-500 font-bold text-sm">Loading your academic space...</p>
                      </div>
                    ) : (
                      <div className={`grid gap-6 ${isSidebarPinned ? 'grid-cols-1 2xl:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {filteredCourses.length > 0 ? (
                          <>
                            {filteredCourses.map((course) => {
                          const badgeClass = getDegreeBadgeColor(course.degree);
                          const subjectCount = course.subjects?.length || 0;

                          return (
                            <div 
                              key={course.id} 
                              onClick={() => setSelectedCourse(course)}
                              className="bg-white rounded-[2.5rem] p-6 md:p-7 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-500/40 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                            >
                              {/* Top Card Row */}
                              <div>
                                <div className="flex items-start justify-between mb-5">
                                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3.5 rounded-2xl text-indigo-600 border border-indigo-100/60 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <GraduationCap size={28} />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-[11px] font-black rounded-xl border tracking-wide uppercase ${badgeClass}`}>
                                      {course.degree}
                                    </span>

                                    {/* Action Edit & Delete Buttons */}
                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setCourseToEdit(course); }}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                                        title="Edit Course Name"
                                      >
                                        <Edit3 size={15} />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                                        title="Delete Course"
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Course Name */}
                                <h4 className="text-2xl font-black text-slate-900 mb-1.5 truncate group-hover:text-indigo-600 transition-colors tracking-tight">
                                  {course.name}
                                </h4>
                                
                                {/* Date Joined & Finish Date */}
                                <div className="flex flex-col gap-1.5 mb-5">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 flex-wrap">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <Calendar size={13} className="text-slate-400" />
                                      <span>Enrolled {new Date(course.join_date).toLocaleDateString()}</span>
                                    </div>
                                    {course.academic_structure && course.current_value && (
                                      <>
                                        <span>•</span>
                                        <span className="text-indigo-600 font-bold uppercase text-[10px]">
                                          {course.academic_structure === 'semester_wise' ? 'Sem' : 'Year'} {course.current_value}
                                        </span>
                                      </>
                                    )}
                                  </div>

                                  {course.end_date && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50/80 pl-2.5 pr-2 py-1 rounded-xl border border-indigo-100/80 w-fit max-w-full">
                                      <Calendar size={12} className="text-indigo-600 shrink-0" />
                                      <span className="truncate">Ends: {new Date(course.end_date).toLocaleDateString()}</span>
                                      <button
                                        type="button"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          await handleClearEndDate(course);
                                        }}
                                        title="Clear end date (keep course active)"
                                        className="ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded-lg border border-transparent hover:border-rose-200 transition-all flex items-center gap-0.5 text-[10px] font-bold cursor-pointer shrink-0"
                                      >
                                        <X size={11} />
                                        <span>Clear</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Subjects Tags */}
                                <div className="space-y-3 mb-6">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-black text-slate-400 tracking-wider uppercase">
                                      Subjects ({subjectCount})
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-hidden">
                                    {course.subjects && course.subjects.length > 0 ? (
                                      course.subjects.map((s, i) => (
                                        <span 
                                          key={i} 
                                          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-colors border border-slate-200/50"
                                        >
                                          {s.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs italic text-slate-400">No subjects added</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer Button */}
                              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                                <span className="flex items-center gap-1">
                                  Open Course Workspace
                                </span>
                                <div className="w-8 h-8 rounded-full bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                                  <ArrowUpRight size={16} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                          </>
                        ) : (
                          /* Empty State */
                          <div className="bg-white rounded-[2.5rem] p-16 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center text-center col-span-1 md:col-span-2 h-full">
                            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-3xl flex items-center justify-center mb-6 border border-indigo-100">
                              <BookOpen size={40} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">No courses found</h4>
                            <p className="text-slate-500 max-w-md mt-2 mb-8 font-medium text-sm leading-relaxed">
                              {courseSearchQuery || degreeFilter !== 'ALL' 
                                ? 'No courses match your active search or filter. Try clearing the search query.'
                                : 'Start structuring your study schedule by adding your first academic course and subjects.'}
                            </p>
                            
                            {courseSearchQuery || degreeFilter !== 'ALL' ? (
                              <button 
                                onClick={() => { setCourseSearchQuery(''); setDegreeFilter('ALL'); }}
                                className="px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm"
                              >
                                Reset Filters
                              </button>
                            ) : (
                              <button 
                                onClick={() => setShowAddModal(true)} 
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all text-sm active:scale-95"
                              >
                                Add Your First Course
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    {/* Quick Review Side Part */}
                    <div className={`w-full ${isSidebarPinned ? 'xl:w-[280px] 2xl:w-[320px]' : 'xl:w-[300px] 2xl:w-[330px]'} shrink-0 min-w-0 xl:sticky xl:top-2 self-start`}>
                       <QuickReviewPanel courses={courses} />
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'community' && <CommunityTab forceChatUserId={chatUserId} />}
            {activeTab === 'account' && <AccountSettings isPasswordRecovery={isPasswordRecovery} />}
          </div>
        </div>
      </main>
    </div>
  );
};
