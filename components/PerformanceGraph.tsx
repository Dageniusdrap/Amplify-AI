import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceDot } from 'recharts';
import type { PerformanceMetricPoint } from '../types';

interface PerformanceGraphProps {
  metrics: PerformanceMetricPoint[];
  onTimeSegmentHover?: (label: string | null) => void;
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

const AnnotationLabel = (props: any) => {
    const { x, y, value, isMax } = props;
    const boxWidth = 120;
    const boxHeight = 24;
    const yOffset = isMax ? -30 : 20;
    const text = isMax ? '🚀 Highest Point!' : '📉 Lowest Point';
    const color = isMax ? '#10b981' : '#ef4444';
    
    return (
        <g transform={`translate(${x}, ${y + yOffset})`}>
            <rect x={-boxWidth / 2} y={-boxHeight/2} width={boxWidth} height={boxHeight} rx="12" fill={color} />
            <text x={0} y={4} textAnchor="middle" fill="white" fontSize="10px" fontWeight="bold">
                {text}
            </text>
        </g>
    );
};

export const PerformanceGraph: React.FC<PerformanceGraphProps> = ({ metrics: data, onTimeSegmentHover }) => {
  const [view, setView] = useState<'trend' | 'overview'>('trend');
  const metricKeys = useMemo(() => {
    if (!data || data.length === 0 || !data[0].scores || data[0].scores.length === 0) return [];
    const allKeys = new Set<string>();
    data.forEach(point => (point.scores || []).forEach(score => allKeys.add(score.metric)));
    return Array.from(allKeys);
  }, [data]);

  const [activeMetrics, setActiveMetrics] = useState<string[]>([]);

  useEffect(() => {
    if (metricKeys.length > 0) {
      setActiveMetrics(metricKeys); // Default to showing all metrics
    }
  }, [metricKeys]);

  const toggleMetric = (key: string) => {
    setActiveMetrics(prev => {
        const newMetrics = prev.includes(key)
            ? prev.filter(m => m !== key)
            : [...prev, key];
        
        // Ensure at least one metric is always selected
        if (newMetrics.length === 0 && metricKeys.length > 0) {
            return [key];
        }
        return newMetrics;
    });
  };

  const chartData = useMemo(() => {
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
  
  const radarData = useMemo(() => {
    if (metricKeys.length === 0 || chartData.length === 0) return [];

    const totals = metricKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);
    
    chartData.forEach(point => {
        metricKeys.forEach(key => {
            totals[key] += point[key] || 0;
        });
    });

    return metricKeys.map(key => ({
        metric: formatKey(key),
        score: totals[key] / chartData.length,
        fullMark: 10,
    }));
  }, [chartData, metricKeys]);

  const annotations = useMemo(() => {
    if (activeMetrics.length === 0 || chartData.length === 0) return null;
    let maxPoint = { x: '', y: -1, metric: '' };
    let minPoint = { x: '', y: 11, metric: '' };

    chartData.forEach(point => {
        activeMetrics.forEach(metric => {
            if (point[metric] > maxPoint.y) {
                maxPoint = { x: point.name, y: point[metric], metric };
            }
             if (point[metric] < minPoint.y) {
                minPoint = { x: point.name, y: point[metric], metric };
            }
        });
    });
    
    if (maxPoint.y === minPoint.y) return null; // Don't show if all points are the same

    return { maxPoint, minPoint };

  }, [chartData, activeMetrics]);


  if (metricKeys.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
        No performance data available to display in the graph.
      </div>
    );
  }

  const handleMouseMove = (state: any) => {
    if (onTimeSegmentHover) {
        if (state.isTooltipActive && state.activeTooltipIndex !== undefined && chartData[state.activeTooltipIndex]) {
            const label = chartData[state.activeTooltipIndex].name;
            onTimeSegmentHover(label);
        } else {
            onTimeSegmentHover(null);
        }
    }
  };

  const handleMouseLeave = () => {
      if(onTimeSegmentHover) {
          onTimeSegmentHover(null);
      }
  };

  const TrendView = () => (
    <>
        {metricKeys.length > 1 && (
            <div className="flex justify-center flex-wrap gap-2 mb-4">
                {metricKeys.map((key, index) => (
                <button
                    key={key}
                    onClick={() => toggleMetric(key)}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    activeMetrics.includes(key)
                        ? 'text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    style={{ 
                        backgroundColor: activeMetrics.includes(key) ? COLORS[index % COLORS.length] : undefined,
                        ringColor: COLORS[index % COLORS.length],
                    }}
                >
                    {formatKey(key)}
                </button>
                ))}
            </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 25, right: 20, left: -10, bottom: 5, }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
                {metricKeys.map((key, index) => (
                    <linearGradient key={`color-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis dataKey="name" stroke="rgba(128, 128, 128, 0.8)" />
            <YAxis domain={[0, 10]} stroke="rgba(128, 128, 128, 0.8)" />
            <Tooltip 
              cursor={{ stroke: 'rgba(128, 128, 128, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }}
              content={<CustomTooltip />} 
            />
            <Legend formatter={(value) => formatKey(value)} />
            {activeMetrics.map(key => {
                 const index = metricKeys.indexOf(key);
                 return ( <Area key={`area-${key}`} type="monotone" dataKey={key} stroke="none" fill={`url(#color-${key})`} /> )
            })}
             {activeMetrics.map(key => {
                 const index = metricKeys.indexOf(key);
                 const color = COLORS[index % COLORS.length];
                 return ( <Line key={`line-${key}`} type="monotone" dataKey={key} name={formatKey(key)} stroke={color} strokeWidth={2} activeDot={{ r: 8, style: { fill: color, stroke: 'white' } }} dot={{ r: 4, fill: color }} /> )
            })}
            {annotations?.maxPoint && (
                <ReferenceDot 
                    x={annotations.maxPoint.x} 
                    y={annotations.maxPoint.y} 
                    r={8} 
                    fill="#10b981" 
                    stroke="white"
                    isFront={true}
                    label={<AnnotationLabel isMax={true} />}
                />
            )}
             {annotations?.minPoint && (
                <ReferenceDot 
                    x={annotations.minPoint.x} 
                    y={annotations.minPoint.y} 
                    r={8} 
                    fill="#ef4444" 
                    stroke="white"
                    isFront={true}
                    label={<AnnotationLabel isMax={false} />}
                />
            )}
          </LineChart>
        </ResponsiveContainer>
    </>
  );
  
  const Overview = () => (
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
            <PolarGrid stroke="rgba(128, 128, 128, 0.2)" />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
            <Radar name="Average Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Tooltip formatter={(value: number, name: string) => [value.toFixed(1), "Avg. Score"]} />
        </RadarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="w-full h-full flex flex-col p-4">
        <div className="flex justify-center mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setView('trend')} className={`w-1/2 py-1 text-sm font-semibold rounded-md ${view === 'trend' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Trend</button>
            <button onClick={() => setView('overview')} className={`w-1/2 py-1 text-sm font-semibold rounded-md ${view === 'overview' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}>Overview</button>
        </div>
      <div className="flex-grow">
        {view === 'trend' ? <TrendView /> : <Overview />}
      </div>
    </div>
  );
};