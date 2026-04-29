import { Loader2, AlertCircle, Database } from 'lucide-react';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Loader2 className="w-10 h-10 animate-spin mb-3" style={{ color: '#2E86DE' }} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <AlertCircle className="w-10 h-10 mb-3" style={{ color: '#E74C3C' }} />
      <p className="text-sm font-medium mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-white text-sm hover:opacity-90"
          style={{ backgroundColor: '#2E86DE' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data found.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Database className="w-10 h-10 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
