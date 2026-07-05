import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  hint?: ReactNode;
}

const EmptyState = ({ title, hint }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 text-base-content/60">
      <p className="text-lg">{title}</p>
      {hint && <p className="text-sm mt-2">{hint}</p>}
    </div>
  );
};

export default EmptyState;
