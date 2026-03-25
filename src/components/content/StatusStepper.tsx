'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming' | 'failed';
  timestamp?: string;
  description?: string;
}

interface StatusStepperProps {
  steps: Step[];
}

export function StatusStepper({ steps }: StatusStepperProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isComplete = step.status === 'complete';
        const isCurrent = step.status === 'current';
        const isFailed = step.status === 'failed';

        return (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isComplete ? 'bg-green-100 text-green-600' :
                isCurrent ? 'bg-orange-100 text-orange-600' :
                isFailed ? 'bg-red-100 text-red-600' :
                'bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]'
              }`}>
                {isComplete ? <CheckCircle2 size={14} /> :
                 isFailed ? <AlertCircle size={14} /> :
                 isCurrent ? <Clock size={14} /> :
                 <Circle size={14} />}
              </div>
              {!isLast && (
                <div className={`w-px h-8 ${isComplete ? 'bg-green-200' : 'bg-[var(--color-border)]'}`} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-medium ${
                isCurrent || isComplete ? 'text-[var(--color-text)]' :
                isFailed ? 'text-[var(--color-error)]' :
                'text-[var(--color-text-muted)]'
              }`}>
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{step.timestamp}</p>
              )}
              {step.description && (
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{step.description}</p>
              )}
              {isCurrent && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 mt-1 inline-block">
                  In Progress
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
