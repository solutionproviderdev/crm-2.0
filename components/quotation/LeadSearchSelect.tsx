'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, User } from 'lucide-react';

interface LeadOption {
  id: string;
  name: string;
  cid: string;
  phone: string;
  address?: string;
  source?: string;
  status?: string;
}

interface LeadSearchSelectProps {
  value: string | null;       // currently selected lead id
  selectedName?: string;      // display name for selected lead
  onSelect: (lead: LeadOption) => void;
  onClear: () => void;
}

export function LeadSearchSelect({ value, selectedName, onSelect, onClear }: LeadSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = async (q: string) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.leads || []);
        setOpen(true);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (lead: LeadOption) => {
    onSelect(lead);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  if (value && selectedName) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-input bg-background text-sm">
        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1 truncate text-sm font-medium">{selectedName}</span>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear lead"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search lead by name, phone, or CID..."
          className="h-8 w-full pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map(lead => (
            <button
              key={lead.id}
              type="button"
              onClick={() => handleSelect(lead)}
              className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{lead.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{lead.cid}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {lead.phone && <span className="text-xs text-muted-foreground">{lead.phone}</span>}
                  {lead.source && <span className="text-[10px] text-muted-foreground">• {lead.source}</span>}
                  {lead.status && <span className="text-[10px] text-muted-foreground">• {lead.status}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
          No leads found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
