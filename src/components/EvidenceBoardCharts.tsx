'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/Card';

export interface ActivityTimelineProps {
  data: { date: string; testimonies: number }[];
}

export function ActivityTimelineChart({ data }: ActivityTimelineProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f0b44c" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f0b44c" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 180, 76, 0.15)" />
          <XAxis dataKey="date" stroke="#8a8a92" tick={{ fontSize: 11, fontFamily: 'Special Elite' }} />
          <YAxis stroke="#8a8a92" tick={{ fontSize: 11, fontFamily: 'Special Elite' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#15151a',
              borderColor: '#f0b44c',
              color: '#e9dfc7',
              fontFamily: 'Special Elite',
              fontSize: '12px',
              borderRadius: '4px',
            }}
          />
          <Area
            type="monotone"
            dataKey="testimonies"
            stroke="#f0b44c"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#amberGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface ChoiceDistributionProps {
  label: string;
  data: { option: string; count: number }[];
}

export function ChoiceDistributionChart({ label, data }: ChoiceDistributionProps) {
  return (
    <Card tabTitle={label.toUpperCase()}>
      <h4 className="font-serif text-sm font-bold text-lamp-amber mb-3">{label}</h4>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 180, 76, 0.15)" />
            <XAxis dataKey="option" stroke="#8a8a92" tick={{ fontSize: 10, fontFamily: 'Inter' }} />
            <YAxis stroke="#8a8a92" tick={{ fontSize: 10, fontFamily: 'Special Elite' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#15151a',
                borderColor: '#f0b44c',
                color: '#e9dfc7',
                fontFamily: 'Special Elite',
                fontSize: '12px',
                borderRadius: '4px',
              }}
            />
            <Bar dataKey="count" fill="#f0b44c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export interface RatingHistogramProps {
  label: string;
  avg?: number;
  min?: number;
  max?: number;
  data: { value: number; count: number }[];
}

export function RatingHistogramChart({ label, avg, min, max, data }: RatingHistogramProps) {
  return (
    <Card tabTitle={label.toUpperCase()}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-serif text-sm font-bold text-lamp-amber">{label}</h4>
        <div className="font-typewriter text-xs text-lamp-amber bg-lamp-amber/10 px-2 py-0.5 rounded border border-lamp-amber/30">
          Avg: {avg ?? 0} (Min: {min ?? 0}, Max: {max ?? 0})
        </div>
      </div>
      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 180, 76, 0.15)" />
            <XAxis dataKey="value" stroke="#8a8a92" tick={{ fontSize: 10, fontFamily: 'Special Elite' }} />
            <YAxis stroke="#8a8a92" tick={{ fontSize: 10, fontFamily: 'Special Elite' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#15151a',
                borderColor: '#f0b44c',
                color: '#e9dfc7',
                fontFamily: 'Special Elite',
                fontSize: '12px',
                borderRadius: '4px',
              }}
            />
            <Bar dataKey="count" fill="#b3261e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export interface TextEvidenceProps {
  label: string;
  totalAnswers: number;
  recentAnswers: string[];
}

export function TextEvidenceCard({ label, totalAnswers, recentAnswers }: TextEvidenceProps) {
  return (
    <Card tabTitle={label.toUpperCase()}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-serif text-sm font-bold text-lamp-amber">{label}</h4>
        <span className="font-typewriter text-xs text-fog-grey">{totalAnswers} Depositions</span>
      </div>

      {recentAnswers && recentAnswers.length > 0 ? (
        <div className="space-y-2">
          {recentAnswers.map((answer, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded border border-border-color/60 bg-surface/40 font-typewriter text-xs text-primary leading-relaxed"
            >
              "{answer}"
            </div>
          ))}
        </div>
      ) : (
        <p className="font-typewriter text-xs text-fog-grey italic">No text depositions recorded yet.</p>
      )}
    </Card>
  );
}
