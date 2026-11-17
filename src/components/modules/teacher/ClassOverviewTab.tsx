import React, { useState } from 'react';
import {
  Users,
  Award,
  BookOpen,
  ClipboardList,
  CalendarCheck,
  Clock,
  Send,
  Pin,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  FileText,
  PlaySquare,
  Sparkles,
  ChevronRight,
  Trash2,
  Share2,
  Megaphone,
  Percent,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { ClassRoom, Assessment, Assignment, Lesson } from '../../../types';
import {
  ClassAnnouncement,
  getStoredAnnouncements,
  saveStoredAnnouncements,
} from './teacherData';
import {
  ASSESSMENT_TEMPLATES,
  getDefaultAssessmentConfig,
} from '../../../lib/assessmentTemplates';
import { ClassSubTab } from './ClassHeader';

interface ClassOverviewTabProps {
  selectedClass: ClassRoom;
  studentsCount: number;
  classAssessments: Assessment[];
  classAssignments: Assignment[];
  classLessons: Lesson[];
  pendingSubmissionsCount: number;
  attendanceRatePercent: number;
  onNavigateToTab: (tab: ClassSubTab) => void;
  onOpenExamDetails?: (exam: Assessment) => void;
  onOpenNewLesson?: () => void;
  onOpenNewAssignment?: () => void;
  onOpenNewExam?: () => void;
}

export const ClassOverviewTab: React.FC<ClassOverviewTabProps> = ({
  selectedClass,
  studentsCount,
  classAssessments,
  classAssignments,
  classLessons,
  pendingSubmissionsCount,
  attendanceRatePercent,
  onNavigateToTab,
  onOpenExamDetails,
  onOpenNewLesson,
  onOpenNewAssignment,
  onOpenNewExam,
}) => {
  const [announcements, setAnnouncements] = useState<ClassAnnouncement[]>(() =>
    getStoredAnnouncements()
  );
  const [newNoticeText, setNewNoticeText] = useState('');
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeType, setNewNoticeType] = useState<'AVISO' | 'COMUNICADO' | 'MATERIAL'>('AVISO');
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter announcements for this class
  const classAnnouncements = announcements.filter(
    (a) => a.classId === selectedClass.id || a.classId === 'all'
  );

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeText.trim()) return;

    const newPost: ClassAnnouncement = {
      id: `ann_${Date.now()}`,
      classId: selectedClass.id,
      authorName: selectedClass.teacherName || 'Teacher',
      authorRole: 'Docente Titular',
      title: newNoticeTitle.trim() || undefined,
      content: newNoticeText.trim(),
      createdAt: 'Just now',
      type: newNoticeType,
      pinned: false,
    };

    const updated = [newPost, ...announcements];
    setAnnouncements(updated);
    saveStoredAnnouncements(updated);
    setNewNoticeText('');
    setNewNoticeTitle('');
    setIsPublishing(false);
  };

  const handleDeleteNotice = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    saveStoredAnnouncements(updated);
  };

  // Compile chronological system updates from lessons, assignments, exams
  const feedItems = React.useMemo(() => {
    const items: {
      id: string;
      type: 'ANNOUNCEMENT' | 'ASSIGNMENT' | 'LESSON' | 'EXAM';
      title: string;
      subtitle: string;
      meta: string;
      date: string;
      pinned?: boolean;
      data?: any;
    }[] = [];

    // Announcements
    classAnnouncements.forEach((a) => {
      items.push({
        id: a.id,
        type: 'ANNOUNCEMENT',
        title: a.title || (a.type === 'AVISO' ? 'Class Announcement' : a.type === 'MATERIAL' ? 'Course Material' : 'Official Notice'),
        subtitle: a.content,
        meta: `${a.authorName} (${a.authorRole === 'Docente Titular' ? 'Lead Teacher' : a.authorRole})`,
        date: a.createdAt,
        pinned: a.pinned,
        data: a,
      });
    });

    // Assignments
    classAssignments.forEach((assign) => {
      items.push({
        id: `feed_assign_${assign.id}`,
        type: 'ASSIGNMENT',
        title: `New assignment published: ${assign.title}`,
        subtitle: assign.instructions || 'Assignment available for submission on the LMS.',
        meta: `Due: ${assign.dueDate} • Worth: ${assign.maxScore} pts`,
        date: assign.createdAt || 'Posted recently',
        data: assign,
      });
    });

    // Lessons
    classLessons.forEach((les) => {
      items.push({
        id: `feed_lesson_${les.id}`,
        type: 'LESSON',
        title: `New lesson on the LMS: ${les.title}`,
        subtitle: les.description || 'Support materials and content available.',
        meta: les.materials?.length ? `📎 ${les.materials.length} attachment(s)` : 'Recorded lesson and text content',
        date: les.date || 'Available on the LMS',
        data: les,
      });
    });

    // Assessments
    classAssessments.forEach((exam) => {
      items.push({
        id: `feed_exam_${exam.id}`,
        type: 'EXAM',
        title: `Assessment scheduled: ${exam.title}`,
        subtitle: exam.description || exam.content || 'Official term assessment for the class.',
        meta: `Date: ${exam.date} • Weight: ${exam.weight}% • Maximum Grade: ${exam.maxScore} pts`,
        date: `Scheduled for ${exam.date}`,
        data: exam,
      });
    });

    return items;
  }, [classAnnouncements, classAssignments, classLessons, classAssessments]);

  return (
    <div className="space-y-6">
      {/* 5 indicator summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Students */}
        <div
          onClick={() => onNavigateToTab('pessoas')}
          className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Students
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {studentsCount}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Active enrollments
          </p>
        </div>

        {/* Card 2: Assignments */}
        <div
          onClick={() => onNavigateToTab('conteudos')}
          className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assignments
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {classAssignments.length}
          </div>
          <p className="text-[11px] text-amber-700 font-bold mt-0.5">
            {pendingSubmissionsCount > 0 ? `${pendingSubmissionsCount} to grade` : 'Up to date'}
          </p>
        </div>

        {/* Card 3: Assessments */}
        <div
          onClick={() => onNavigateToTab('conteudos')}
          className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assessments
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {classAssessments.length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Registered
          </p>
        </div>

        {/* Card 4: Lessons */}
        <div
          onClick={() => onNavigateToTab('conteudos')}
          className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Lessons on the LMS
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 leading-tight">
            {classLessons.length}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Modules released
          </p>
        </div>

        {/* Card 5: Attendance */}
        <div
          onClick={() => onNavigateToTab('chamada')}
          className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Attendance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#075e38] flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#075e38] leading-tight">
            {attendanceRatePercent}%
          </div>
          <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
            Class average
          </p>
        </div>
      </div>

      {/* Main Stream / Wall layout (2 columns: feed on the left, upcoming tasks sidebar on the right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols): Wall / Stream feed */}
        <div className="lg:col-span-8 space-y-5">
          {/* Wall publisher box */}
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#075e38] flex items-center justify-center font-bold text-xs">
                  PL
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Class Wall
                  </h3>
                  <p className="text-xs text-slate-500">
                    Share announcements, news or notices with your students
                  </p>
                </div>
              </div>

              {!isPublishing && (
                <button
                  onClick={() => setIsPublishing(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075e38] text-xs font-bold transition-colors cursor-pointer"
                >
                  New Announcement
                </button>
              )}
            </div>

            {isPublishing ? (
              <form onSubmit={handlePublishNotice} className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Type:</span>
                  <div className="flex items-center gap-1.5">
                    {(['AVISO', 'COMUNICADO', 'MATERIAL'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewNoticeType(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          newNoticeType === t
                            ? 'bg-[#075e38] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t === 'AVISO' ? '📢 Announcement' : t === 'COMUNICADO' ? '📋 Notice' : '📎 Material'}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Announcement title (optional)"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20 focus:bg-white"
                />

                <textarea
                  rows={3}
                  placeholder="Write your notice to the students in this class..."
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#075e38]/20 focus:bg-white resize-none"
                  required
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPublishing(false);
                      setNewNoticeText('');
                      setNewNoticeTitle('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#075e38] hover:bg-[#064e2e] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post to Wall</span>
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => setIsPublishing(true)}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 hover:border-slate-400 transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-between"
              >
                <span>Write a notice for the class...</span>
                <Send className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>

          {/* Chronological feed items */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Class Updates
              </h4>
              <span className="text-xs text-slate-400">
                {feedItems.length} entries on the wall
              </span>
            </div>

            {feedItems.map((item) => {
              if (item.type === 'ANNOUNCEMENT') {
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs p-5 space-y-3 transition-all hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#075e38] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">
                              {item.title}
                            </h4>
                            {item.pinned && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <Pin className="w-2.5 h-2.5" /> Pinned
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {item.meta} • {item.date}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteNotice(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove announcement from the wall"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-13">
                      {item.subtitle}
                    </p>
                  </div>
                );
              }

              if (item.type === 'ASSIGNMENT') {
                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigateToTab('conteudos')}
                    className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs p-4.5 flex items-start justify-between gap-4 hover:border-amber-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {item.subtitle}
                        </p>
                        <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          {item.meta}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-amber-700">
                      <span>View assignment</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              }

              if (item.type === 'LESSON') {
                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigateToTab('conteudos')}
                    className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs p-4.5 flex items-start justify-between gap-4 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <PlaySquare className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-800 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {item.subtitle}
                        </p>
                        <span className="inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {item.meta}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-blue-700">
                      <span>Open lesson</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              }

              // Exam item
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onOpenExamDetails && item.data) {
                      onOpenExamDetails(item.data);
                    } else {
                      onNavigateToTab('conteudos');
                    }
                  }}
                  className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs p-4.5 flex items-start justify-between gap-4 hover:border-purple-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {item.subtitle}
                      </p>
                      <span className="inline-block text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                        {item.meta}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-purple-700">
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols): Upcoming assignments & shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming submissions / due dates */}
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#075e38]" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Upcoming Assignments
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('conteudos')}
                className="text-[11px] font-bold text-[#075e38] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {classAssignments.slice(0, 3).map((assign) => (
                <div
                  key={assign.id}
                  onClick={() => onNavigateToTab('conteudos')}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {assign.title}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                      {assign.maxScore} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Due date: {assign.dueDate}
                  </p>
                </div>
              ))}

              {classAssignments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No assignments due soon.
                </p>
              )}
            </div>

            {onOpenNewAssignment && (
              <button
                onClick={onOpenNewAssignment}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#075e38] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>+ Create New Assignment</span>
              </button>
            )}
          </div>

          {/* Upcoming class assessments */}
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Scheduled Assessments
                </h3>
              </div>
              <button
                onClick={() => onNavigateToTab('conteudos')}
                className="text-[11px] font-bold text-purple-700 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {classAssessments.slice(0, 3).map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => {
                    if (onOpenExamDetails) onOpenExamDetails(exam);
                    else onNavigateToTab('conteudos');
                  }}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50/50 border border-slate-100 hover:border-purple-200 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {exam.title}
                    </span>
                    <span className="text-[10px] font-extrabold text-purple-800 bg-purple-100/70 px-1.5 py-0.2 rounded">
                      Weight {exam.weight}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Date: {exam.date} • Max Grade: {exam.maxScore}
                  </p>
                </div>
              ))}

              {classAssessments.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No assessments scheduled for this class.
                </p>
              )}
            </div>

            {onOpenNewExam && (
              <button
                onClick={onOpenNewExam}
                className="w-full py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>+ Schedule New Assessment</span>
              </button>
            )}
          </div>

          {/* Card: Lesson Plan */}
          <div className="bg-gradient-to-br from-[#2e1065] via-[#3b0764] to-[#4c1d95] text-white rounded-3xl p-6 space-y-3.5 shadow-md border border-purple-800 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-purple-100 border border-white/20">
                Academic Planning
              </span>
              <FileSpreadsheet className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-base leading-snug">
                Lesson Plan
              </h4>
              <p className="text-xs text-purple-200/90 leading-relaxed mt-1">
                Open the detailed lesson-by-lesson plan with the official 8 dimensions (Unit Content, Handwriting, Reading, Writing, Speaking, Homework and Materials).
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('plano_aula')}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-purple-50 text-[#533499] font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              <span>Open Lesson Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Class grading criteria & weights (official matrix) */}
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xs p-6 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Grading Criteria & Weights
                </h3>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                {selectedClass.assessmentTemplate || 'ADULT_A1'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Official weight distribution set by the Academic Office to calculate student averages:
            </p>

            <div className="space-y-2 pt-1">
              {(selectedClass.assessmentConfig || getDefaultAssessmentConfig(selectedClass.assessmentTemplate || 'ADULT_A1')).map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-800 block truncate">{it.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{it.description || it.type}</span>
                  </div>
                  <span className="font-mono font-black text-purple-700 ml-2 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {it.weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
