// src/components/LoadingScreen.tsx
import React from 'react';

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  progress = 0,
  showProgress = false 
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 shadow-2xl border border-slate-700 max-w-md w-full mx-4">
        {/* Loading Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-16 h-16 border-4 border-slate-600 rounded-full"></div>
            {/* Animated ring */}
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            {/* Inner dot */}
            <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            {message}
          </h3>
          
          {showProgress && (
            <div className="mb-4">
              <div className="bg-slate-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                ></div>
              </div>
              <span className="text-sm text-slate-400">
                {Math.round(progress)}% Complete
              </span>
            </div>
          )}
          
          <p className="text-sm text-slate-400">
            Please wait while we set up your map...
          </p>
        </div>

        {/* Map Generation Steps (for visual feedback) */}
        <div className="mt-6 space-y-2">
          {message.includes("Creating") ? (
            <>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Initializing map configuration
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse delay-150"></div>
                Creating base layer tiles
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-blue-300 rounded-full mr-2 animate-pulse delay-300"></div>
                Setting up autotiling engine
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-blue-200 rounded-full mr-2 animate-pulse delay-500"></div>
                Preparing workspace
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Reading map data
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse delay-150"></div>
                Loading layers
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse delay-300"></div>
                Restoring configuration
              </div>
              <div className="flex items-center text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-200 rounded-full mr-2 animate-pulse delay-500"></div>
                Finalizing workspace
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;