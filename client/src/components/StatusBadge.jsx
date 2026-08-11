import { clsx } from 'clsx';
import { formatStatus, statusStyles } from '../utils/status';

export function StatusBadge({ status }) {
  return (
    <span className={clsx('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize', statusStyles[status] || statusStyles.pending)}>
      {formatStatus(status)}
    </span>
  );
}
