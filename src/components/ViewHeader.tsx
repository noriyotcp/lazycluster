import type { ReactNode } from 'react';

interface ViewHeaderProps {
  title: string;
  onBack: () => void;
  children?: ReactNode;
}

const ViewHeader = ({ title, onBack, children }: ViewHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 shrink-0">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
            <path
              fillRule="evenodd"
              d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </button>
        <h2 className="text-lg font-bold whitespace-nowrap">{title}</h2>
      </div>
      {children}
    </div>
  );
};

export default ViewHeader;
