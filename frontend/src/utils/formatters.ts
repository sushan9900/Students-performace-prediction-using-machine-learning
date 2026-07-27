
/**
 * Formats a decimal (0.85) or percentage number (85.2) to formatted percentage string.
 */
export const formatPercent = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0.0%';
  const num = value > 1.0 ? value : value * 100;
  return `${num.toFixed(1)}%`;
};

/**
 * Formats raw file size bytes into human-readable KB / MB strings.
 */
export const formatBytes = (bytes: number | undefined | null): string => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formats ISO date string into readable local date format.
 */
export const formatDate = (isoString: string | undefined | null): string => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
};

/**
 * Returns Tailwind CSS badge styling classes based on performance category.
 */
export const getCategoryBadgeColor = (category: string | undefined | null): string => {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'excellent':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'good':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'average':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'poor':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};
