"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

interface LeadPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function LeadPagination({ page, totalPages, onPageChange, className }: LeadPaginationProps) {
  if (totalPages <= 1) return null;

  // Simple range generation for page numbers (e.g. 1, 2, 3, ..., 10)
  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (page < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <p className="text-sm text-gray-500 font-medium">
        Showing page <span className="text-gray-900 font-bold">{page}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
      </p>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 px-3 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-(--brand-primary) text-gray-600 disabled:opacity-40 transition-all font-bold group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
          Prev
        </Button>

        <div className="hidden md:flex items-center gap-1 mx-1">
          {getPages().map((p, i) => (
            p === "..." ? (
              <span key={`sep-${i}`} className="px-2 text-gray-400 font-bold">...</span>
            ) : (
              <Button
                key={`page-${p}`}
                variant={page === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(p as number)}
                className={cn(
                  "h-9 w-9 rounded-xl font-bold transition-all",
                  page === p 
                    ? "bg-(--brand-primary) shadow-lg shadow-(--brand-primary)/20 border-(--brand-primary)" 
                    : "border-gray-200 hover:border-(--brand-primary)/30 hover:bg-gray-50"
                )}
              >
                {p}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 px-3 rounded-xl border-gray-200 hover:bg-gray-50 hover:text-(--brand-primary) text-gray-600 disabled:opacity-40 transition-all font-bold group"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
