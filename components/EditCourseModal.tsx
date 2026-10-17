import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Save, 
  Calendar, 
  GraduationCap, 
  Banknote, 
  Loader2, 
  Edit3, 
  BookOpen, 
  CheckCircle, 
  Plus, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '../services/supabaseClient.ts';
import { Course } from './Dashboard.tsx';

interface EditCourseModalProps {
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubjectItem {
  id?: string;
  name: string;
  originalName?: string;
}

export const EditCourseModal: React.FC<EditCourseModalProps> = ({ course, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Editable course fields
  const [courseName, setCourseName] = useState(course.name || '');
  const [degree, setDegree] = useState(course.degree || '');
  const [structure, setStructure] = useState(course.academic_structure || '');
  const [currentValue, setCurrentValue] = useState(course.current_value || '');

  // Editable subjects list (unlocked system)
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(() => 
    (course.subjects || []).map(s => ({
      id: s.id,
      name: s.name,
      originalName: s.name,
    }))
  );
  const [deletedSubjectIds, setDeletedSubjectIds] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [subjectToDeleteConfirm, setSubjectToDeleteConfirm] = useState<{ index: number; name: string; id?: string } | null>(null);

  // Convert ISO / DB date to local YYYY-MM-DD format for HTML date inputs
  const formatForDateInput = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    } catch {
      return dateStr.includes('T') ? dateStr.split('T')[0] : (dateStr || '');
    }
  };

  const [joinDate, setJoinDate] = useState(formatForDateInput(course.join_date));
  const [endDate, setEndDate] = useState(formatForDateInput(course.end_date));

  const needsStructure = degree === 'Bachelor' || degree === 'Master';

  const extractPathFromUrl = (urlStr: string) => {
    try {
      const url = new URL(urlStr);
      const BUCKET_NAME = 'course-multimedia';
      const parts = url.pathname.split(`/${BUCKET_NAME}/`);
      if (parts.length < 2) return null;
      return decodeURIComponent(parts[1]);
    } catch {
      return null;
    }
  };

  const handleSubjectNameChange = (index: number, newName: string) => {
    setSubjectsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  };

  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    setSubjectsList(prev => [...prev, { name: trimmed }]);
    setNewSubjectInput('');
  };

  const handleRequestRemoveSubject = (index: number) => {
    const sub = subjectsList[index];
    if (!sub) return;

    if (!sub.id) {
      // Newly added subject not saved to DB yet, can be dropped immediately
      setSubjectsList(prev => prev.filter((_, i) => i !== index));
    } else {
      // Existing DB subject - ask confirmation to protect against accidental loss
      setSubjectToDeleteConfirm({ index, name: sub.name, id: sub.id });
    }
  };

  const confirmRemoveSubject = () => {
    if (!subjectToDeleteConfirm) return;
    if (subjectToDeleteConfirm.id) {
      setDeletedSubjectIds(prev => [...prev, subjectToDeleteConfirm.id!]);
    }
    setSubjectsList(prev => prev.filter((_, i) => i !== subjectToDeleteConfirm.index));
    setSubjectToDeleteConfirm(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare subject list, including any typed text in newSubjectInput
    let combinedSubjects = [...subjectsList];
    if (newSubjectInput.trim()) {
      combinedSubjects.push({ name: newSubjectInput.trim() });
    }

    const validSubjects = combinedSubjects
      .map(s => ({ ...s, name: s.name.trim() }))
      .filter(s => s.name.length > 0);

    if (validSubjects.length === 0) {
      alert('Please have at least one subject for this course.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update Course record
      const updatePayload: Record<string, any> = {
        name: courseName.trim(),
        degree,
        academic_structure: needsStructure ? structure : null,
        current_value: needsStructure ? currentValue : null,
        join_date: joinDate,
        end_date: endDate ? new Date(endDate).toISOString() : null,
      };

      const { error: courseError } = await supabase
        .from('courses')
        .update(updatePayload)
        .eq('id', course.id);

      if (courseError) throw courseError;

      // 2. Remove deleted subjects & associated study records
      if (deletedSubjectIds.length > 0) {
        // Find and clean up any media storage files
        const { data: mediaFiles } = await supabase
          .from('course_media')
          .select('url')
          .in('subject_id', deletedSubjectIds);

        if (mediaFiles && mediaFiles.length > 0) {
          const pathsToDelete = mediaFiles
            .map(m => extractPathFromUrl(m.url))
            .filter((p): p is string => !!p);

          if (pathsToDelete.length > 0) {
            try {
              await supabase.storage.from('course-multimedia').remove(pathsToDelete);
            } catch (storageErr) {
              console.error('Storage deletion cleanup notice:', storageErr);
            }
          }
        }

        // Delete notes & media records for deleted subjects
        await supabase.from('course_media').delete().in('subject_id', deletedSubjectIds);
        await supabase.from('notes').delete().in('subject_id', deletedSubjectIds);
        
        // Delete subject records
        const { error: delSubErr } = await supabase
          .from('subjects')
          .delete()
          .in('id', deletedSubjectIds);

        if (delSubErr) throw delSubErr;
      }

      // 3. Update renamed existing subjects
      for (const sub of validSubjects) {
        if (sub.id && sub.name !== sub.originalName) {
          const { error: updateSubErr } = await supabase
            .from('subjects')
            .update({ name: sub.name })
            .eq('id', sub.id);
          if (updateSubErr) throw updateSubErr;
        }
      }

      // 4. Insert newly added subjects
      const newSubjects = validSubjects.filter(sub => !sub.id);
      if (newSubjects.length > 0) {
        const { error: insertSubErr } = await supabase
          .from('subjects')
          .insert(newSubjects.map(sub => ({
            course_id: course.id,
            name: sub.name
          })));

        if (insertSubErr) throw insertSubErr;
      }

      // 5. Update Profile with combined course names
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: allCourses } = await supabase
          .from('courses')
          .select('name')
          .eq('user_id', user.id);
          
        if (allCourses) {
          const courseNames = allCourses.map(c => c.name).join(', ');
          await supabase
            .from('profiles')
            .update({ coursename: courseNames })
            .eq('id', user.id);
        }
      }

      onSuccess();
    } catch (error: any) {
      alert(error.message || 'Failed to update course details.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
              <Edit3 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Edit Course Details</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Course Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap size={18} />
                </div>
                <input
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-bold"
                  placeholder="e.g. Computer Science & Engineering"
                  value={courseName}
                  onChange={e => setCourseName(e.target.value)}
                />
              </div>
            </div>

            {/* Degree Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Degree Level</label>
              <select
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-semibold appearance-none cursor-pointer"
                value={degree}
                onChange={e => {
                  setDegree(e.target.value);
                  if (e.target.value !== 'Bachelor' && e.target.value !== 'Master') {
                    setStructure('');
                    setCurrentValue('');
                  }
                }}
              >
                <option value="">Select Degree</option>
                <option value="SEE">SEE</option>
                <option value="+2">+2</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Join / Start Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Start / Join Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={18} />
                </div>
                <input
                  required
                  type="date"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-semibold cursor-pointer"
                  value={joinDate}
                  onChange={e => setJoinDate(e.target.value)}
                />
              </div>
            </div>

            {/* Academic Structure & Current Value (if Bachelor/Master) */}
            {needsStructure && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Academic Structure</label>
                  <select
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-semibold appearance-none cursor-pointer"
                    value={structure}
                    onChange={e => setStructure(e.target.value)}
                  >
                    <option value="">Select Structure</option>
                    <option value="semester_wise">Semester Wise</option>
                    <option value="yearly_wise">Yearly Wise</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Current Year / Semester</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Banknote size={18} />
                    </div>
                    <input
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-semibold"
                      placeholder="e.g. 1, 2, 3..."
                      value={currentValue}
                      onChange={e => setCurrentValue(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* End / Finish Enroll Date */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-600" />
                  Finish / End Enroll Date
                </label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 border border-rose-200/60 shadow-xs active:scale-95 cursor-pointer"
                    title="Clear end date so this course remains active"
                  >
                    <X size={13} />
                    Clear End Date
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  className={`w-full pl-11 ${endDate ? 'pr-20' : 'pr-4'} py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-900 font-semibold cursor-pointer`}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                    title="Clear end date"
                  >
                    <X size={12} />
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 ml-1">
                {endDate ? (
                  <span className="text-amber-600 font-medium">
                    This course will be marked as finished on this date. Click <strong>Clear End Date</strong> if updated by mistake to keep it currently enrolled.
                  </span>
                ) : (
                  <span>Leave blank for an ongoing active enrolled course.</span>
                )}
              </p>
            </div>
          </div>

          {/* Course Subjects - Finely Editable Unlocked System */}
          <div className="space-y-3.5 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-600" />
                Course Subjects ({subjectsList.length})
              </label>

              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
                {subjectsList.length} {subjectsList.length === 1 ? 'Subject' : 'Subjects'}
              </span>
            </div>

            {/* Deletion confirmation banner for existing subjects */}
            {subjectToDeleteConfirm && (
              <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2 text-rose-800 font-medium">
                  <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                  <span>
                    Remove <strong>"{subjectToDeleteConfirm.name}"</strong>? Associated notes and media will be permanently deleted.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSubjectToDeleteConfirm(null)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmRemoveSubject}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Yes, Remove
                  </button>
                </div>
              </div>
            )}

            {/* Editable Subjects List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {subjectsList.length === 0 ? (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-center">
                  <p className="text-xs font-bold text-amber-700">No subjects currently linked. Please add at least one subject below.</p>
                </div>
              ) : (
                subjectsList.map((sub, idx) => {
                  const isRenamed = sub.id && sub.name.trim() !== sub.originalName;
                  return (
                    <div
                      key={sub.id || `new-${idx}`}
                      className="flex items-center gap-2 p-2 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl transition-all group"
                    >
                      <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => handleSubjectNameChange(idx, e.target.value)}
                          placeholder="Subject name..."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                        />
                      </div>

                      {sub.id && (
                        <span 
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 transition-colors ${
                            isRenamed 
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80' 
                              : 'bg-white text-slate-400 border-slate-200/70 hidden sm:inline-block'
                          }`}
                        >
                          {isRenamed ? 'Renamed' : 'Saved'}
                        </span>
                      )}

                      {!sub.id && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 uppercase tracking-wider px-2 py-1 rounded-lg shrink-0">
                          New
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRequestRemoveSubject(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0 cursor-pointer"
                        title={`Remove ${sub.name || 'subject'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add New Subject Input Row */}
            <div className="pt-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newSubjectInput}
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubject();
                      }
                    }}
                    placeholder="Enter new subject name..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {newSubjectInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setNewSubjectInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  disabled={!newSubjectInput.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  Add Subject
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Course Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
