import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../services/supabaseClient.ts';
import { Course } from './Dashboard.tsx';

interface QuickReviewPanelProps {
  courses: Course[];
}

export const QuickReviewPanel: React.FC<QuickReviewPanelProps> = ({ courses }) => {
  const [stats, setStats] = useState<{ totalExpected: number, totalFilled: number } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      // Find all active courses
      const activeCourses = courses.filter(c => !c.end_date || new Date(c.end_date) >= new Date(new Date().setHours(0,0,0,0)));
      
      if (activeCourses.length === 0) {
        setStats({ totalExpected: 0, totalFilled: 0 });
        return;
      }
      
      const allSubjectIds = activeCourses.flatMap(c => c.subjects?.map(s => s.id) || []);
      
      let notesData: any[] = [];
      if (allSubjectIds.length > 0) {
        // Fetch all notes for active subjects
        const { data } = await supabase.from('notes').select('subject_id, day_number').in('subject_id', allSubjectIds);
        notesData = data || [];
      }
      
      let totalExpected = 0;
      let totalFilled = 0;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      for (const course of activeCourses) {
        const joinDate = new Date(course.join_date);
        joinDate.setHours(0,0,0,0);
        
        let diffDays = 0;
        if (joinDate <= today) {
          const diffTime = today.getTime() - joinDate.getTime();
          diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of join day
        }
        
        totalExpected += diffDays;
        
        const courseSubjectIds = new Set(course.subjects?.map(s => s.id) || []);
        
        // Find distinct filled days for this course
        const filledDayNumbers = new Set(
          notesData
            .filter(n => courseSubjectIds.has(n.subject_id))
            .map(n => n.day_number)
        );
        
        let filledCount = 0;
        for (const day of filledDayNumbers) {
          // A day is only valid if it's within the elapsed time (or ahead, but realistically shouldn't be ahead if they fill sequentially)
          // We count any filled day up to the diffDays
          if (day <= diffDays && day > 0) {
            filledCount++;
          }
        }
        totalFilled += filledCount;
      }
      
      setStats({ totalExpected, totalFilled });
    };
    
    fetchStats();
  }, [courses]);
  
  const activeCount = courses.filter(c => !c.end_date || new Date(c.end_date) >= new Date(new Date().setHours(0,0,0,0))).length;
  const completedCount = courses.filter(c => c.end_date && new Date(c.end_date) < new Date(new Date().setHours(0,0,0,0))).length;

  const percentage = stats && stats.totalExpected > 0 ? Math.round((stats.totalFilled / stats.totalExpected) * 100) : 0;
  
  // If there are no expected days (e.g. all courses start in future), just show empty
  const hasExpected = stats && stats.totalExpected > 0;
  
  const chartData = hasExpected ? [
    { name: 'Filled Days', value: stats.totalFilled, color: '#4e46e5' },
    { name: 'Missed Days', value: Math.max(0, stats.totalExpected - stats.totalFilled), color: '#e2e8f0' }
  ] : [
    { name: 'No Data', value: 1, color: '#f1f5f9' }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col w-full max-w-full">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PieChartIcon size={18} className="text-indigo-600" />
          Quick Review
        </h3>
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex gap-2.5 sm:gap-3">
          <div className="flex-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase font-black text-indigo-500 tracking-widest mb-1">Active</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-900 leading-none">{activeCount}</p>
          </div>
          <div className="flex-1 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 sm:p-3.5 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] uppercase font-black text-emerald-500 tracking-widest mb-1">Completed</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900 leading-none">{completedCount}</p>
          </div>
        </div>
        
        <div className="bg-slate-50/50 rounded-2xl p-3.5 sm:p-4 border border-slate-100 w-full min-w-0">
          <h4 className="text-xs font-bold text-slate-800 mb-5 text-center uppercase tracking-widest">Notes Consistency</h4>
          <div className="h-[170px] w-full min-w-0 relative flex items-center justify-center overflow-hidden">
            {stats ? (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={8}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} days`, name]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{hasExpected ? percentage + '%' : '0%'}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filled</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
