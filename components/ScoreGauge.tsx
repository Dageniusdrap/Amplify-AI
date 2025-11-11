import React from 'react';

interface ScoreGaugeProps {
  score: number; // Score from 0 to 10
  label: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label }) => {
  const percentage = score * 10;
  const circumference = 2 * Math.PI * 45; // r=45
  const offset = circumference - (percentage / 100) * circumference;

  let colorClass = 'text-red-500';
  if (percentage >= 40) colorClass = 'text-yellow-500';
  if (percentage >= 70) colorClass = 'text-green-500';

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-white">
          {score.toFixed(1)}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</p>
    </div>
  );
};
