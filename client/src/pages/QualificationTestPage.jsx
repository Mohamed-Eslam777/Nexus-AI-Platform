import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { getSingleQualificationTest, submitQualificationTest } from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoader';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

const secondaryButtonClasses =
  'inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-800/50 px-4 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-all duration-300 hover:border-slate-500 hover:bg-slate-700/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500/30';

const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const QualificationTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const data = await getSingleQualificationTest(id);
        setTest(data);
      } catch (error) {
        console.error('Failed to fetch test', error);
        toast.error(error.response?.data?.message || 'Failed to load the test.');
        navigate('/qualification-center');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionContent.trim()) {
      return toast.error('Submission content cannot be empty.');
    }
    setSubmitting(true);
    try {
      const submissionData = {
        testId: id,
        submissionContent: submissionContent,
      };
      const res = await submitQualificationTest(submissionData);
      toast.success(res.message || 'Test submitted successfully! Awaiting review.');
      navigate('/qualification-center');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting test.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="mx-auto max-w-4xl px-4 space-y-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-12 shadow-2xl shadow-black/30 text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Test Not Found</h2>
            <p className="text-slate-400 mb-6">The test you're looking for doesn't exist or is no longer available.</p>
            <button
              onClick={() => navigate('/qualification-center')}
              className={primaryButtonClasses}
            >
              Back to Qualification Center
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-4xl px-4 space-y-8"
      >
        {/* Header */}
        <motion.div variants={sectionVariants} className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/qualification-center')}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors duration-200 mb-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Qualification Center
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Qualification Test</p>
            <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {test.title}
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              {test.description}
            </p>
          </div>
        </motion.div>

        {/* Test Tasks Section */}
        <motion.section
          variants={sectionVariants}
          className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Test Tasks</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Instructions</h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold text-emerald-300">
                {test.tasks?.length || 0} Task{test.tasks?.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4">
              {test.tasks && test.tasks.length > 0 ? (
                test.tasks.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-emerald-300">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white leading-relaxed whitespace-pre-wrap">{task.content}</p>
                        {task.imageUrl && (
                          <div className="mt-4">
                            <img
                              src={task.imageUrl}
                              alt={`Task ${index + 1} visual`}
                              className="w-full max-w-2xl rounded-lg border border-slate-700/50"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No tasks available for this test.</p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Submission Form Section */}
        <motion.section
          variants={sectionVariants}
          className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="relative space-y-6">
            <div>
              <label htmlFor="submissionContent" className="block text-sm font-medium text-slate-300 mb-2">
                Your Submission
              </label>
              <p className="text-xs text-slate-400 mb-4">
                Provide your complete answer to all the test tasks above. Be thorough and detailed in your response.
              </p>
              <textarea
                id="submissionContent"
                className={`${inputClasses} min-h-[300px] resize-y font-mono text-sm`}
                placeholder="Enter your complete answer here..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
              <button
                type="button"
                onClick={() => navigate('/qualification-center')}
                disabled={submitting}
                className={secondaryButtonClasses}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !submissionContent.trim()}
                className={primaryButtonClasses}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Submitting...
                  </span>
                ) : (
                  'Submit Test for Review'
                )}
              </button>
            </div>
          </form>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default QualificationTestPage;

