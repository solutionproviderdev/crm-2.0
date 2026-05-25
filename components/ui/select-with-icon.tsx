'use client';

import type React from 'react';

interface OptionItem {
  value: string;
  label: string;
}

interface SelectWithIconProps {
  id?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  options: OptionItem[];
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  error?: string;
}

export function SelectWithIcon({
  id, label, icon: Icon, value, onChange, options, selectProps, error,
}: SelectWithIconProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold mb-1 text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />}
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-8' : 'pl-3'} pr-7 py-1.5 text-xs border border-input rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring`}
          {...selectProps}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-[11px] text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}
