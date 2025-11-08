import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
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
      ease: 'easeOut',
    },
  },
};

const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95';

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
      <div className="mx-auto max-w-4xl px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header Section */}
          <motion.div variants={sectionVariants} className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-3">
              About Us
            </h1>
            <p className="text-slate-400 text-lg">من نحن</p>
          </motion.div>

          {/* Section 1: Our Mission */}
          <motion.div
            variants={sectionVariants}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-4">
                Our Mission: <span className="text-emerald-400">Fueling the Future of AI</span>
              </h2>
              <p className="text-slate-300 leading-relaxed mb-3">
                Nexus AI is dedicated to providing high-quality data annotation and validation services that power the next generation of artificial intelligence models. We bridge the gap between raw data and intelligent systems, ensuring that every annotation contributes to building more accurate, ethical, and effective AI solutions.
              </p>
              <p className="text-slate-400 text-sm">
                مهمتنا: تزويد أنظمة الذكاء الاصطناعي ببيانات عالية الجودة لدفع المستقبل.
              </p>
            </div>
          </motion.div>

          {/* Section 2: How It Works */}
          <motion.div
            variants={sectionVariants}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-4">
                The Nexus Process: <span className="text-emerald-400">Quality Meets Efficiency</span>
              </h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  Our streamlined workflow ensures quality at every step:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <span className="text-emerald-400 font-semibold">Admin Creates Tasks:</span> Administrators publish carefully curated annotation projects with clear guidelines and fair compensation.
                  </li>
                  <li>
                    <span className="text-emerald-400 font-semibold">Annotators Submit Work:</span> Skilled annotators review tasks, apply their expertise, and submit high-quality annotations.
                  </li>
                  <li>
                    <span className="text-emerald-400 font-semibold">AI Auto-Triage:</span> Our advanced AI system automatically evaluates submissions, auto-approving high-quality work and flagging items for human review when needed.
                  </li>
                  <li>
                    <span className="text-emerald-400 font-semibold">Review & Approval:</span> Our quality assurance process ensures every submission meets our standards before approval.
                  </li>
                  <li>
                    <span className="text-emerald-400 font-semibold">Secure Payment:</span> Upon approval, payments are processed securely and added to your wallet, ready for payout.
                  </li>
                </ul>
                <p className="text-slate-400 text-sm mt-4">
                  كيف نعمل: عملية بسيطة تبدأ بإنشاء المهام وتنتهي بدفع آمن.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Vision and Core Values */}
          <motion.div variants={sectionVariants} className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Our Vision & <span className="text-emerald-400">Core Values</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Value 1: Precision & Quality */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 opacity-50 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Precision & <span className="text-emerald-400">Quality</span>
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    We maintain the highest standards of data accuracy and validation. Every annotation undergoes rigorous quality checks to ensure it meets industry-leading benchmarks for AI training data.
                  </p>
                  <p className="text-slate-400 text-xs mt-3">
                    الدقة والجودة في كل تفاصيل البيانات.
                  </p>
                </div>
              </motion.div>

              {/* Value 2: Innovation & AI-Driven */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 opacity-50 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Innovation & <span className="text-indigo-400">AI-Driven</span>
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    Our platform leverages cutting-edge AI technology to streamline workflows, automate quality assessment, and reduce manual review time—all while maintaining human oversight for critical decisions.
                  </p>
                  <p className="text-slate-400 text-xs mt-3">
                    الابتكار والتقنيات المتقدمة في خدمة الكفاءة.
                  </p>
                </div>
              </motion.div>

              {/* Value 3: Contributor Autonomy */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 opacity-50 pointer-events-none" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Contributor <span className="text-amber-400">Autonomy</span>
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    We empower our contributors with flexible work schedules, transparent compensation, and fair review processes. Your expertise and dedication are valued, and you have full control over your workflow.
                  </p>
                  <p className="text-slate-400 text-xs mt-3">
                    المرونة والاستقلالية في العمل مع تعويض عادل.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Section 4: Meet The Team */}
          <motion.div variants={sectionVariants} className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Meet The <span className="text-emerald-400">Team</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Team Member 1 Placeholder */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden text-center"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 opacity-50 pointer-events-none" />
                <div className="relative">
                  {/* Placeholder Image Area */}
                  <div className="w-24 h-24 rounded-full bg-slate-700/50 border-2 border-emerald-500/30 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-emerald-400">TM</span>
                  </div>
                  {/* Name Placeholder */}
                  <div className="h-6 bg-slate-700/50 rounded-lg mb-2 w-32 mx-auto"></div>
                  {/* Title Placeholder */}
                  <div className="h-4 bg-slate-700/30 rounded-lg w-24 mx-auto"></div>
                </div>
              </motion.div>

              {/* Team Member 2 Placeholder */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden text-center"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 opacity-50 pointer-events-none" />
                <div className="relative">
                  {/* Placeholder Image Area */}
                  <div className="w-24 h-24 rounded-full bg-slate-700/50 border-2 border-indigo-500/30 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-400">TM</span>
                  </div>
                  {/* Name Placeholder */}
                  <div className="h-6 bg-slate-700/50 rounded-lg mb-2 w-32 mx-auto"></div>
                  {/* Title Placeholder */}
                  <div className="h-4 bg-slate-700/30 rounded-lg w-24 mx-auto"></div>
                </div>
              </motion.div>

              {/* Team Member 3 Placeholder */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden text-center"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 opacity-50 pointer-events-none" />
                <div className="relative">
                  {/* Placeholder Image Area */}
                  <div className="w-24 h-24 rounded-full bg-slate-700/50 border-2 border-amber-500/30 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-400">TM</span>
                  </div>
                  {/* Name Placeholder */}
                  <div className="h-6 bg-slate-700/50 rounded-lg mb-2 w-32 mx-auto"></div>
                  {/* Title Placeholder */}
                  <div className="h-4 bg-slate-700/30 rounded-lg w-24 mx-auto"></div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Section 5: Frequently Asked Questions */}
          <motion.div variants={sectionVariants} className="space-y-6">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Frequently Asked <span className="text-emerald-400">Questions</span>
            </h2>
            <div className="space-y-4">
              {/* FAQ 1 */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-xl shadow-black/20 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-30 pointer-events-none" />
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-start">
                    <span className="text-emerald-400 mr-2">Q:</span>
                    <span>What is the account approval process and how long does it take?</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed ml-6">
                    After registration, your account status begins as 'New'. You'll need to complete the application form with your profile details. Once submitted, our admin team reviews your application. The review typically takes 1-3 business days. You'll receive updates via email when your status changes to 'Accepted' or if additional information is needed.
                  </p>
                </div>
              </motion.div>

              {/* FAQ 2 */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-xl shadow-black/20 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 opacity-30 pointer-events-none" />
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-start">
                    <span className="text-indigo-400 mr-2">Q:</span>
                    <span>How does the payout system work and what are the requirements?</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed ml-6">
                    Approved task submissions are automatically credited to your wallet. You can request a payout once you've accumulated a minimum balance (varies by payment method). To set up payouts, provide your payout method details (e.g., PayPal email, bank account) in your profile. Payout requests are processed within 5-7 business days after admin approval.
                  </p>
                </div>
              </motion.div>

              {/* FAQ 3 */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-xl shadow-black/20 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 opacity-30 pointer-events-none" />
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-start">
                    <span className="text-amber-400 mr-2">Q:</span>
                    <span>How long does it take for my submissions to be reviewed?</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed ml-6">
                    Our AI auto-triage system evaluates submissions immediately upon submission. High-quality submissions (score ≥ 98%) are auto-approved instantly. Submissions requiring human review typically receive a decision within 24-48 hours. You can track the status of all your submissions in your dashboard, and you'll receive notifications when the status changes.
                  </p>
                </div>
              </motion.div>

              {/* FAQ 4 */}
              <motion.div
                variants={sectionVariants}
                className="relative rounded-2xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-xl shadow-black/20 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-30 pointer-events-none" />
                <div className="relative">
                  <h3 className="text-lg font-bold text-white mb-2 flex items-start">
                    <span className="text-emerald-400 mr-2">Q:</span>
                    <span>What happens if my submission is rejected or needs revision?</span>
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed ml-6">
                    If a submission is rejected or requires revision, you'll receive detailed feedback explaining the reason. Rejected submissions don't count toward your earnings, but you can review the feedback and apply those learnings to future tasks. The platform provides AI-generated quality scores and feedback to help you improve your work over time.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Section 6: Join Our Network */}
          <motion.div
            variants={sectionVariants}
            className="relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/30 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-50 pointer-events-none" />
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-4">
                Join the Core: <span className="text-emerald-400">Become a Nexus Annotator</span>
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Whether you're an experienced data annotator or looking to contribute to the AI revolution, Nexus AI provides a transparent, fair, and rewarding platform. Join our community of skilled annotators and help shape the future of artificial intelligence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  type="button"
                  onClick={() => navigate('/register')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={primaryButtonClasses}
                >
                  Get Started
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => navigate('/apply-now')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/20 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 active:scale-95"
                >
                  Apply Now
                </motion.button>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                انضم لشبكتنا: كن جزءاً من ثورة الذكاء الاصطناعي واكسب بشكل عادل.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

