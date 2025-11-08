import React from 'react';

/**
 * Reusable Skeleton Loader Component
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.width - Width of the skeleton (e.g., 'w-full', 'w-32', 'w-1/2')
 * @param {string} props.height - Height of the skeleton (e.g., 'h-4', 'h-8', 'h-12')
 * @param {string} props.rounded - Rounded corners (e.g., 'rounded', 'rounded-lg', 'rounded-full')
 * @param {boolean} props.circle - If true, renders a circular skeleton
 */
const SkeletonLoader = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded-lg',
  circle = false 
}) => {
  const roundedClass = circle ? 'rounded-full' : rounded;
  
  return (
    <div
      className={`bg-slate-700 animate-pulse ${roundedClass} ${width} ${height} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Skeleton Card Component - For stat cards or content cards
 */
export const SkeletonCard = ({ className = '' }) => (
  <div className={`relative rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 overflow-hidden ${className}`}>
    <div className="absolute inset-x-0 top-0 h-1 bg-slate-600/50" />
    <div className="relative space-y-3">
      <SkeletonLoader width="w-24" height="h-3" />
      <SkeletonLoader width="w-16" height="h-8" />
      <SkeletonLoader width="w-32" height="h-2" />
    </div>
  </div>
);

/**
 * Skeleton Table Row Component - For table rows
 */
export const SkeletonTableRow = ({ columns = 4 }) => (
  <tr className="hover:bg-slate-800/70">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="whitespace-nowrap px-6 py-4">
        <SkeletonLoader width="w-24" height="h-4" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton Table Component - Complete table skeleton
 */
export const SkeletonTable = ({ columns = 4, rows = 5, headers = [] }) => (
  <div className="relative mt-6 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/50">
    <div className="max-w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700/50">
        <thead className="bg-slate-900/80">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="whitespace-nowrap px-6 py-3 text-left">
                <SkeletonLoader 
                  width={headers[index] ? 'w-20' : 'w-16'} 
                  height="h-3" 
                  rounded="rounded"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/50 bg-slate-800/50">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <SkeletonTableRow key={rowIndex} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * Skeleton Project Card Component - For project cards in dashboard
 */
export const SkeletonProjectCard = () => (
  <div className="group relative flex h-full flex-col justify-between rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 opacity-0 pointer-events-none" />
    
    <div className="relative flex-1">
      <div className="flex items-start justify-between gap-3 mb-4">
        <SkeletonLoader width="w-3/4" height="h-6" />
        <SkeletonLoader width="w-20" height="h-6" rounded="rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonLoader width="w-full" height="h-4" />
        <SkeletonLoader width="w-full" height="h-4" />
        <SkeletonLoader width="w-3/4" height="h-4" />
      </div>
    </div>

    <div className="relative mt-8 flex items-center justify-between gap-4 pt-6 border-t border-slate-700/50">
      <div className="flex flex-col gap-3 flex-1">
        <div>
          <SkeletonLoader width="w-16" height="h-3" />
          <SkeletonLoader width="w-20" height="h-5" className="mt-1" />
        </div>
        <div>
          <SkeletonLoader width="w-20" height="h-3" />
          <SkeletonLoader width="w-12" height="h-4" className="mt-1" />
        </div>
      </div>
      <SkeletonLoader width="w-24" height="h-10" rounded="rounded-full" />
    </div>
  </div>
);

export default SkeletonLoader;

