import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
interface RadarChartData {
  competence: string;
  actual: number;
  expected: number;
}
interface RadarChartComponentProps {
  data: RadarChartData[];
  title: string;
  showLegend?: boolean;
}
export function RadarChartComponent({
  data,
  title,
  showLegend = true
}: RadarChartComponentProps) {
  return <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{
        top: 20,
        right: 30,
        bottom: 20,
        left: 30
      }}>
          <defs>
            <linearGradient id="expectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8} />
              <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <PolarGrid 
            gridType="polygon"
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
          <PolarAngleAxis
            dataKey="competence" 
            className="text-xs font-medium" 
            tick={{
              fontSize: 11,
              fill: 'hsl(var(--foreground))',
              fontWeight: 500
            }} 
            tickSize={8}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 7]} 
            tick={{
              fontSize: 10,
              fill: 'hsl(var(--muted-foreground))',
              fontWeight: 400
            }} 
            tickCount={8}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.3}
          />
          <Radar name="Expected Level" dataKey="expected" stroke="hsl(var(--muted-foreground))" fill="url(#expectedGradient)" fillOpacity={0.15} strokeWidth={3} strokeDasharray="8 4" />
          <Radar name="Actual Performance" dataKey="actual" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} strokeWidth={2} />
          {showLegend && <Legend wrapperStyle={{
          fontSize: '12px',
          color: 'hsl(var(--foreground))'
        }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>;
}