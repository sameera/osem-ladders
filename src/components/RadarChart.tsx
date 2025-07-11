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
      <h4 className="text-lg font-semibold mb-4 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
          <PolarAngleAxis 
            dataKey="coreArea" 
            className="text-xs"
            tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 7]} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickCount={8}
          />
          <Radar
            name="Expected Level"
            dataKey="expected"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={3}
            strokeDasharray="8 4"
          />
          <Radar
            name="Actual Performance"
            dataKey="actual"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.3}
            strokeWidth={3}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '12px',
              color: 'hsl(var(--foreground))'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}