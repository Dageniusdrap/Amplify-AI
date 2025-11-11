

import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PerformanceMetricPoint } from '../types';

interface PerformanceGraphProps {
  metrics: PerformanceMetricPoint[];
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{label}</p>
        {payload.map((pld: any, index: number) => (
            <div key={index} className="mt-2 flex items-center" style={{ color: pld.color }}>
                <span className="font-semibold">{pld.name}: {pld.value.toFixed(1)} / 10</span>
            </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ metrics: data }) => {
  const metricKeys = useMemo(() => {
    if (!data || data.length === 0 || !data[0].scores || data[0].scores.length === 0) return [];
    // Get unique metric keys from all data points to be safe
    const allKeys = new Set<string>();
    data.forEach(point => (point.scores || []).forEach(score => allKeys.add(score.metric)));
    return Array.from(allKeys);
  }, [data]);

  const [activeMetric, setActiveMetric] = useState<string>('');

  useEffect(() => {
    if (metricKeys.length > 0 && !metricKeys.includes(activeMetric)) {
      setActiveMetric(metricKeys[0]);
    }
  }, [metricKeys, activeMetric]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(point => {
      const scoresObject = (point.scores || []).reduce((acc, score) => {
        acc[score.metric] = score.value;
        return acc;
      }, {} as Record<string, number>);
      return {
        name: point.label,
        ...scoresObject,
      };
    });
  }, [data]);

  if (metricKeys.length === 0 || !chartData || chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
        No performance data available to display in the graph.
      </div>
    );
  }

  const currentMetricInfo = {
    key: activeMetric,
    label: formatKey(activeMetric),
    color: COLORS[metricKeys.indexOf(activeMetric) % COLORS.length]
  };

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        {metricKeys.map((key, index) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 ${
              activeMetric === key
                ? 'text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            style={{ backgroundColor: activeMetric === key ? COLORS[index % COLORS.length] : undefined }}
          >
            {formatKey(key)}
          </button>
        ))}
      </div>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 20,
              left: -10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis dataKey="name" stroke="rgba(128, 128, 128, 0.8)" />
            <YAxis domain={[0, 10]} stroke="rgba(128, 128, 128, 0.8)" />
            <Tooltip 
              cursor={{ stroke: currentMetricInfo.color, strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<CustomTooltip />} 
            />
            <Legend formatter={(value) => formatKey(value)} />
            <Line 
              type="monotone" 
              dataKey={currentMetricInfo.key}
              name={currentMetricInfo.label}
              stroke={currentMetricInfo.color}
              strokeWidth={2}
              activeDot={{ r: 8, style: { fill: currentMetricInfo.color, stroke: 'white' } }} 
              dot={{ r: 4, fill: currentMetricInfo.color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
