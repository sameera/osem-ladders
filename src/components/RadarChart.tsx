import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';

interface RadarChartData {
  coreArea: string;
  actual: number;
  expected: number;
}

interface RadarChartComponentProps {
  data: RadarChartData[];
  title: string;
}

export function RadarChartComponent({ data, title }: RadarChartComponentProps) {
  return (
    <div className="w-full h-80">
      <h4 className="text-lg font-semibold mb-6 text-center text-foreground">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 30, right: 40, bottom: 30, left: 40 }}>
          <defs>
            <linearGradient id="expectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--chart-expected))', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--chart-expected))', stopOpacity: 0.1 }} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--chart-actual-positive))', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--chart-actual-positive))', stopOpacity: 0.2 }} />
            </linearGradient>
          </defs>
          <PolarGrid 
            stroke="hsl(var(--chart-grid))" 
            strokeOpacity={0.4}
            strokeWidth={1.5}
            gridType="polygon"
          />
          <PolarAngleAxis 
            dataKey="coreArea" 
            className="text-xs font-medium"
            tick={{ 
              fontSize: 12, 
              fill: 'hsl(var(--foreground))',
              fontWeight: 500
            }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 7]} 
            tick={{ 
              fontSize: 11, 
              fill: 'hsl(var(--muted-foreground))',
              fontWeight: 400
            }}
            tickCount={8}
            strokeOpacity={0.3}
          />
          <Radar
            name="Expected Level"
            dataKey="expected"
            stroke="hsl(var(--chart-expected))"
            fill="url(#expectedGradient)"
            strokeWidth={3}
            strokeDasharray="6 3"
            dot={{ fill: 'hsl(var(--chart-expected))', strokeWidth: 2, r: 4 }}
          />
          <Radar
            name="Actual Performance"
            dataKey="actual"
            stroke="hsl(var(--chart-actual-positive))"
            fill="url(#actualGradient)"
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--chart-actual-positive))', strokeWidth: 2, r: 5 }}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '13px',
              color: 'hsl(var(--foreground))',
              fontWeight: 500,
              paddingTop: '15px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}