import React from "react";
import { LucideIcon, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-primary text-primary-foreground">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Unable to load data. Please try again.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive/60 mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      )}
    </div>
  );
}

interface LoadingGridProps {
  count?: number;
  className?: string;
}

export function LoadingGrid({ count = 6, className = "h-48" }: LoadingGridProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(count).fill(0).map((_, i) => <Skeleton key={i} className={className} />)}
    </div>
  );
}

export function LoadingCards({ count = 3, className = "h-32" }: LoadingGridProps) {
  return (
    <div className="space-y-3">
      {Array(count).fill(0).map((_, i) => <Skeleton key={i} className={className} />)}
    </div>
  );
}

export function LoadingTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        {Array(cols).fill(0).map((_, i) => <Skeleton key={i} className="h-8 flex-1" />)}
      </div>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array(cols).fill(0).map((_, j) => <Skeleton key={j} className="h-10 flex-1" />)}
        </div>
      ))}
    </div>
  );
}
