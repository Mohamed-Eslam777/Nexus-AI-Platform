import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import * as api from '../services/api';

// --- Dark Theme Design Tokens ---
const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

const inputClasses =
  'block w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all duration-200';

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

const ChatMessage = ({ text, sender }) => (
  <motion.div
    initial={{ opacity: 0, x: sender === 'User' ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className={`flex ${sender === 'User' ? 'justify-start' : 'justify-end'}`}
  >
    <div
      className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-lg transition-all duration-200 ${
        sender === 'User'
          ? 'bg-slate-700/80 text-slate-200 border border-slate-600/50'
          : 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
      }`}
    >
      <span className="font-semibold">{sender}:</span>
      <span className="ml-2 leading-relaxed">{text}</span>
    </div>
  </motion.div>
);

const TextCodeTaskInterface = ({ project, annotation, setAnnotation, timeSpentMinutes, setTimeSpentMinutes, onSubmit }) => (
  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
    <motion.section
      variants={sectionVariants}
      className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
      
      <div className="relative flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Brief</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Review this content</h2>
        </div>
      </div>
      <div className="relative mt-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 space-y-4">
        {project.taskImageUrl && (
          <div className="w-full">
            <img 
              src={project.taskImageUrl} 
              alt="Task image" 
              className="w-full h-auto rounded-lg border border-slate-700/50 max-h-96 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-300 font-mono">{project.taskContent}</pre>
      </div>
    </motion.section>

    <motion.section
      variants={sectionVariants}
      className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
      
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Your evaluation</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Required</span>
      </div>
      <form onSubmit={onSubmit} className="relative mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="annotation">
            Detailed notes
          </label>
          <textarea
            id="annotation"
            rows="5"
            className={`${inputClasses} min-h-[140px] resize-y`}
            placeholder="Note the strengths, weaknesses, or corrections you would make."
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
          />
        </div>
        
        {(project.paymentType || 'PER_TASK') === 'HOURLY' && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="timeSpentMinutes">
              Time Spent (in minutes)
            </label>
            <input
              type="number"
              id="timeSpentMinutes"
              name="timeSpentMinutes"
              value={timeSpentMinutes}
              onChange={(e) => setTimeSpentMinutes(e.target.value)}
              className={inputClasses}
              required
              min="1"
              placeholder="Enter time spent in minutes"
            />
          </div>
        )}
        
        <div className="flex justify-end pt-4">
          <motion.button
            type="submit"
            disabled={!annotation || ((project.paymentType || 'PER_TASK') === 'HOURLY' && !timeSpentMinutes)}
            whileHover={annotation && ((project.paymentType || 'PER_TASK') !== 'HOURLY' || timeSpentMinutes) ? { scale: 1.05 } : {}}
            whileTap={annotation && ((project.paymentType || 'PER_TASK') !== 'HOURLY' || timeSpentMinutes) ? { scale: 0.95 } : {}}
            className={primaryButtonClasses}
          >
            Submit evaluation
          </motion.button>
        </div>
      </form>
    </motion.section>
  </motion.div>
);

const ModelComparisonInterface = ({ 
  project, 
  formData, 
  setFormData, 
  timeSpentMinutes, 
  setTimeSpentMinutes, 
  onSubmit 
}) => {
  const {
    chatGptInput1,
    chatGptResponse1,
    geminiInput1,
    geminiResponse1,
    chatGptRating,
    geminiRating,
    finalComparisonReason,
    bestModel
  } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid = () => {
    return (
      chatGptInput1 &&
      chatGptResponse1 &&
      geminiInput1 &&
      geminiResponse1 &&
      chatGptRating &&
      geminiRating &&
      finalComparisonReason &&
      bestModel &&
      ((project.paymentType || 'PER_TASK') !== 'HOURLY' || timeSpentMinutes)
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Instructions Section */}
      <motion.section
        variants={sectionVariants}
        className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 opacity-50 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Model Comparison Task</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Compare ChatGPT vs Gemini</h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Test both AI models with the same prompts and compare their responses. Provide detailed ratings and explain which model performs better.
          </p>
          
          {/* Prompt Display Section */}
          {project.taskContent && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 p-4 rounded-xl border border-emerald-500/30 bg-slate-900/60 backdrop-blur-sm"
            >
              <h3 className="text-lg font-bold text-emerald-400 mb-3">Your Prompt / السؤال المطلوب:</h3>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{project.taskContent}</p>
            </motion.div>
          )}
          
          {project.taskImageUrl && (
            <div className="mt-4 w-full">
              <img 
                src={project.taskImageUrl} 
                alt="Task image" 
                className="w-full h-auto rounded-lg border border-slate-700/50 max-h-96 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </motion.section>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* ChatGPT Section */}
        <motion.section
          variants={sectionVariants}
          className="relative rounded-3xl border border-blue-500/30 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10 opacity-50 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">Model 1</p>
                <h2 className="mt-1 text-xl font-semibold text-white">ChatGPT</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="chatGptInput1">
                  Input/Prompt <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="chatGptInput1"
                  name="chatGptInput1"
                  rows="3"
                  className={`${inputClasses} min-h-[80px] resize-y`}
                  placeholder="Enter the prompt or input you gave to ChatGPT..."
                  value={chatGptInput1}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="chatGptResponse1">
                  ChatGPT Response <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="chatGptResponse1"
                  name="chatGptResponse1"
                  rows="5"
                  className={`${inputClasses} min-h-[120px] resize-y`}
                  placeholder="Paste ChatGPT's response here..."
                  value={chatGptResponse1}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="chatGptRating">
                  Rating (1-5) <span className="text-rose-400">*</span>
                </label>
                <select
                  id="chatGptRating"
                  name="chatGptRating"
                  value={chatGptRating}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                >
                  <option value="">Select rating...</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Below Average</option>
                  <option value="3">3 - Average</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Gemini Section */}
        <motion.section
          variants={sectionVariants}
          className="relative rounded-3xl border border-purple-500/30 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 opacity-50 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-purple-400">Model 2</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Gemini</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="geminiInput1">
                  Input/Prompt <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="geminiInput1"
                  name="geminiInput1"
                  rows="3"
                  className={`${inputClasses} min-h-[80px] resize-y`}
                  placeholder="Enter the same prompt you gave to Gemini..."
                  value={geminiInput1}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="geminiResponse1">
                  Gemini Response <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="geminiResponse1"
                  name="geminiResponse1"
                  rows="5"
                  className={`${inputClasses} min-h-[120px] resize-y`}
                  placeholder="Paste Gemini's response here..."
                  value={geminiResponse1}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="geminiRating">
                  Rating (1-5) <span className="text-rose-400">*</span>
                </label>
                <select
                  id="geminiRating"
                  name="geminiRating"
                  value={geminiRating}
                  onChange={handleChange}
                  className={inputClasses}
                  required
                >
                  <option value="">Select rating...</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Below Average</option>
                  <option value="3">3 - Average</option>
                  <option value="4">4 - Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Comparison Section */}
        <motion.section
          variants={sectionVariants}
          className="relative rounded-3xl border border-emerald-500/30 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Final Comparison</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Which Model is Better?</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="bestModel">
                  Best Model <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {['ChatGPT', 'Gemini', 'Tie'].map((model) => {
                    const isActive = bestModel === model;
                    return (
                      <motion.button
                        key={model}
                        type="button"
                        onClick={() => setFormData({ ...formData, bestModel: model })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          isActive
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-500/50 focus:ring-emerald-500/40'
                            : 'border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-700/50 hover:text-emerald-400 focus:ring-slate-500/30'
                        }`}
                      >
                        {model}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="finalComparisonReason">
                  Comparison Reasoning <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="finalComparisonReason"
                  name="finalComparisonReason"
                  rows="6"
                  className={`${inputClasses} min-h-[150px] resize-y`}
                  placeholder="Explain why one model is better than the other. Consider factors like accuracy, clarity, relevance, creativity, etc..."
                  value={finalComparisonReason}
                  onChange={handleChange}
                  required
                />
              </div>

              {(project.paymentType || 'PER_TASK') === 'HOURLY' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="timeSpentMinutes">
                    Time Spent (in minutes) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    id="timeSpentMinutes"
                    name="timeSpentMinutes"
                    value={timeSpentMinutes}
                    onChange={(e) => setTimeSpentMinutes(e.target.value)}
                    className={inputClasses}
                    required
                    min="1"
                    placeholder="Enter time spent in minutes"
                  />
                </div>
              )}

              <div className="flex justify-end pt-4">
                <motion.button
                  type="submit"
                  disabled={!isFormValid()}
                  whileHover={isFormValid() ? { scale: 1.05 } : {}}
                  whileTap={isFormValid() ? { scale: 0.95 } : {}}
                  className={primaryButtonClasses}
                >
                  Submit Comparison
                </motion.button>
              </div>
            </div>
          </div>
        </motion.section>
      </form>
    </motion.div>
  );
};

const ChatTaskInterface = ({ project, annotation, handleAnnotation, timeSpentMinutes, setTimeSpentMinutes, onSubmit }) => {
  const taskContent = project.taskContent || '';
  const chatLines = taskContent ? taskContent.split(/(User:|AI:)/).filter((line) => line.trim()) : [];
  let currentSender = '';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.section
        variants={sectionVariants}
        className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
        
        <div className="relative flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Dialogue</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Review the interaction</h2>
          </div>
        </div>
        <div className="relative mt-4 max-h-96 space-y-4 overflow-y-auto rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6">
          {chatLines.map((line, index) => {
            if (line === 'User:') {
              currentSender = 'User';
              return null;
            }
            if (line === 'AI:') {
              currentSender = 'AI';
              return null;
            }
            if (currentSender) {
              return <ChatMessage key={`${currentSender}-${index}`} text={line.trim()} sender={currentSender} />;
            }
            return null;
          })}
        </div>
      </motion.section>

      <motion.section
        variants={sectionVariants}
        className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
        
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Select AI sentiment</h2>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Pick the most accurate tone
          </span>
        </div>
        <form onSubmit={onSubmit} className="relative mt-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            {['Positive', 'Neutral', 'Negative'].map((sentiment) => {
              const isActive = annotation === sentiment;
              
              return (
                <motion.button
                  key={sentiment}
                  type="button"
                  onClick={() => handleAnnotation(sentiment)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-500/50 focus:ring-emerald-500/40'
                      : 'border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-700/50 hover:text-emerald-400 focus:ring-slate-500/30'
                  }`}
                >
                  {sentiment}
                </motion.button>
              );
            })}
          </div>

          {(project.paymentType || 'PER_TASK') === 'HOURLY' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="timeSpentMinutes">
                Time Spent (in minutes)
              </label>
              <input
                type="number"
                id="timeSpentMinutes"
                name="timeSpentMinutes"
                value={timeSpentMinutes}
                onChange={(e) => setTimeSpentMinutes(e.target.value)}
                className={inputClasses}
                required
                min="1"
                placeholder="Enter time spent in minutes"
              />
            </div>
          )}

          <div className="flex justify-end pt-4">
            <motion.button
              type="submit"
              disabled={!annotation || ((project.paymentType || 'PER_TASK') === 'HOURLY' && !timeSpentMinutes)}
              whileHover={annotation && ((project.paymentType || 'PER_TASK') !== 'HOURLY' || timeSpentMinutes) ? { scale: 1.05 } : {}}
              whileTap={annotation && ((project.paymentType || 'PER_TASK') !== 'HOURLY' || timeSpentMinutes) ? { scale: 0.95 } : {}}
              className={primaryButtonClasses}
            >
              Submit final annotation {annotation ? `(${annotation})` : ''}
            </motion.button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
};

export default function TaskPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const [project, setProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null); // The selected task from taskPool
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null); // Index of the selected task for submission
  const [annotation, setAnnotation] = useState('');
  const [timeSpentMinutes, setTimeSpentMinutes] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Model Comparison form data
  const [modelComparisonData, setModelComparisonData] = useState({
    chatGptInput1: '',
    chatGptResponse1: '',
    geminiInput1: '',
    geminiResponse1: '',
    chatGptRating: '',
    geminiRating: '',
    finalComparisonReason: '',
    bestModel: ''
  });

  const fetchProjectDetails = async () => {
    try {
      const res = await api.fetchProjectDetails(id);
      const projectData = res.data;
      
      // Handle Task Pool: Find the first unassigned task
      if (projectData.taskPool && projectData.taskPool.length > 0) {
        // Find the first task that is not assigned (isAssigned === false or undefined)
        const unassignedTaskIndex = projectData.taskPool.findIndex(
          (task) => !task.isAssigned || task.isAssigned === false
        );
        
        if (unassignedTaskIndex !== -1) {
          // Found an unassigned task
          setSelectedTask(projectData.taskPool[unassignedTaskIndex]);
          setSelectedTaskIndex(unassignedTaskIndex);
          // Update project object to use the selected task's content
          projectData.taskContent = projectData.taskPool[unassignedTaskIndex].content;
          projectData.taskImageUrl = projectData.taskPool[unassignedTaskIndex].imageUrl || null;
        } else {
          // All tasks are assigned, show error or use first task as fallback
          toast.warn('All tasks in this project are currently assigned. Using the first task as fallback.');
          setSelectedTask(projectData.taskPool[0]);
          setSelectedTaskIndex(0);
          projectData.taskContent = projectData.taskPool[0].content;
          projectData.taskImageUrl = projectData.taskPool[0].imageUrl || null;
        }
      } else {
        // No taskPool, use legacy taskContent
        projectData.taskImageUrl = null;
      }
      
      setProject(projectData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project:', err.message || err.response?.data?.msg);
      toast.error('Project not found or not available.');
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProjectDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    
    const paymentType = project.paymentType || 'PER_TASK';
    if (paymentType === 'HOURLY' && !timeSpentMinutes) {
      toast.warn('Time spent is required for hourly projects.');
      return;
    }

    try {
      let contentToSend;
      const submissionData = {};
      
      // Handle Model Comparison task type
      if (project.taskType === 'Model_Comparison') {
        // Format the comparison data as a structured JSON string
        contentToSend = JSON.stringify({
          chatGpt: {
            input: modelComparisonData.chatGptInput1,
            response: modelComparisonData.chatGptResponse1,
            rating: modelComparisonData.chatGptRating
          },
          gemini: {
            input: modelComparisonData.geminiInput1,
            response: modelComparisonData.geminiResponse1,
            rating: modelComparisonData.geminiRating
          },
          comparison: {
            bestModel: modelComparisonData.bestModel,
            reasoning: modelComparisonData.finalComparisonReason
          }
        }, null, 2);
        submissionData.content = contentToSend;
      } else {
        // Handle other task types (Chat_Sentiment, Code_Evaluation, Text_Classification)
        if (!annotation) {
          toast.warn('Annotation content is required before submitting.');
          return;
        }
        contentToSend = project.taskType === 'Chat_Sentiment' ? annotation : `Evaluation: ${annotation}`;
        submissionData.content = contentToSend;
      }
      
      // Add timeSpentMinutes if project is HOURLY
      if (paymentType === 'HOURLY' && timeSpentMinutes) {
        submissionData.timeSpentMinutes = parseInt(timeSpentMinutes, 10);
      }
      
      // Add task reference if taskPool is being used
      if (selectedTaskIndex !== null && project.taskPool) {
        submissionData.taskIndex = selectedTaskIndex;
      }

      const res = await api.submitTask(id, submissionData);
      
      // Check the response for submission status
      const submissionStatus = res.data?.submission?.status || res.data?.status;
      
      // Show appropriate message based on status
      if (submissionStatus === 'Approved') {
        toast.success('🎉 Submission Approved! Your work has been automatically approved.');
      } else if (submissionStatus === 'Rejected') {
        toast.error('❌ Submission Rejected. Your work did not meet the quality standards.');
      } else if (submissionStatus === 'Pending') {
        toast.info('⏳ Submission Pending Review. Your work is awaiting admin review.');
      } else {
        const successMsg = project.taskType === 'Model_Comparison' 
          ? 'Model Comparison submitted successfully!' 
          : `Submission Successful! Marked as: ${annotation}`;
        toast.success(successMsg);
      }

      // Refetch Project Data: This will update the UI and mark the task as assigned
      // This ensures the component re-renders with the latest information
      await fetchProjectDetails();
      
      // Clear form data
      setAnnotation('');
      setTimeSpentMinutes('');
      if (project.taskType === 'Model_Comparison') {
        setModelComparisonData({
          chatGptInput1: '',
          chatGptResponse1: '',
          geminiInput1: '',
          geminiResponse1: '',
          chatGptRating: '',
          geminiRating: '',
          bestModel: '',
          finalComparisonReason: ''
        });
      }
      
      // Navigate to dashboard if status is final (Approved/Rejected)
      if (submissionStatus === 'Approved' || submissionStatus === 'Rejected') {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg;
      toast.error(`Submission failed: ${errorMsg || 'Please try again.'}`);
      console.error('Submission Error:', errorMsg);
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
          <p className="text-sm font-medium text-slate-400">Loading project details…</p>
        </div>
      </div>
    );
  }

  const renderTaskInterface = () => {
    switch (project.taskType) {
      case 'Model_Comparison':
        return (
          <ModelComparisonInterface 
            project={project} 
            formData={modelComparisonData} 
            setFormData={setModelComparisonData} 
            timeSpentMinutes={timeSpentMinutes} 
            setTimeSpentMinutes={setTimeSpentMinutes} 
            onSubmit={onSubmit} 
          />
        );
      case 'Chat_Sentiment':
        return <ChatTaskInterface project={project} annotation={annotation} handleAnnotation={setAnnotation} timeSpentMinutes={timeSpentMinutes} setTimeSpentMinutes={setTimeSpentMinutes} onSubmit={onSubmit} />;
      case 'Code_Evaluation':
      case 'Text_Classification':
      case 'Image_Annotation':
        return <TextCodeTaskInterface project={project} annotation={annotation} setAnnotation={setAnnotation} timeSpentMinutes={timeSpentMinutes} setTimeSpentMinutes={setTimeSpentMinutes} onSubmit={onSubmit} />;
      default:
        return (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-xl p-6">
            <p className="text-rose-400 font-semibold">Error: Unknown Task Type "{project.taskType}".</p>
            <p className="text-rose-300 text-sm mt-2">Please contact support if you believe this is an error.</p>
          </div>
        );
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12" dir={dir}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-4"
      >
        {/* Two-Column Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Instructions Sidebar (1/3 width) */}
          <motion.aside
            variants={sectionVariants}
            className={`md:col-span-1 ${dir === 'rtl' ? 'md:order-2' : 'md:order-1'}`}
          >
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Instructions Sidebar Card */}
              <div className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
                
                <div className="relative space-y-6">
                  {/* Title */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Project Guidelines</p>
                    <h2 className="mt-1 text-2xl font-bold text-white">إرشادات المشروع</h2>
                  </div>

                  {/* Project Description / Detailed Instructions */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Project Overview</h3>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {project.detailedInstructions || project.description}
                    </div>
                  </div>

                  {/* Pay Rate */}
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs font-medium text-emerald-400 mb-1">Compensation</p>
                    <p className="text-lg font-bold text-emerald-300">
                      {typeof project.payRate === 'number' 
                        ? formatCurrency(project.payRate) 
                        : 'Rate TBD'}
                      {project.paymentType === 'HOURLY' ? ' / hour' : ' / task'}
                    </p>
                  </div>

                  {/* Quality Standards */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Quality Standards</h3>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-start">
                        <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                        <span>Ensure accuracy and attention to detail in all submissions</span>
                      </li>
                      <li className="flex items-start">
                        <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                        <span>Follow the provided guidelines and instructions carefully</span>
                      </li>
                      <li className="flex items-start">
                        <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                        <span>Maintain professional language and formatting</span>
                      </li>
                      <li className="flex items-start">
                        <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                        <span>Review your work before submission</span>
                      </li>
                    </ul>
                  </div>

                  {/* Domain Focus */}
                  {project.projectDomain && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300 mb-2">Domain Focus</h3>
                      <div className="inline-flex items-center rounded-full border border-slate-600 bg-slate-700/50 px-3 py-1">
                        <span className="text-xs font-medium text-slate-300">{project.projectDomain}</span>
                      </div>
                    </div>
                  )}

                  {/* Submission Requirements */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Submission Requirements</h3>
                    <ul className="space-y-2 text-xs text-slate-400">
                      <li className="flex items-start">
                        <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                        <span>Complete all required fields before submitting</span>
                      </li>
                      {project.paymentType === 'HOURLY' && (
                        <li className="flex items-start">
                          <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                          <span>Report accurate time spent (in minutes)</span>
                        </li>
                      )}
                      <li className="flex items-start">
                        <span className={`text-emerald-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>•</span>
                        <span>Submit only when you're satisfied with your work</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Column 2: Task Form (2/3 width) */}
          <div className={`md:col-span-2 space-y-8 ${dir === 'rtl' ? 'md:order-1' : 'md:order-2'}`}>
            {/* Header */}
            <motion.header variants={sectionVariants} className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Active Brief</p>
                <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {project.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {project.taskType && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-300"
                  >
                    {project.taskType.replace(/_/g, ' ')}
                  </motion.span>
                )}
              </div>
            </motion.header>

            {/* Task Interface */}
            {renderTaskInterface()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
