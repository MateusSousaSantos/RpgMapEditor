// src/components/WorkspaceUI/ErrorDisplay.tsx
import React from 'react';

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center p-4 border-2 border-red-300 bg-red-50">
      <p className="text-red-600">{error}</p>
    </div>
  );
};