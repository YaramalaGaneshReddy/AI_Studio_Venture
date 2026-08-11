export const statusStyles = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  awaiting_approval: 'bg-amber-50 text-amber-800 border-amber-200'
};

export function formatStatus(status = 'pending') {
  return status.replaceAll('_', ' ');
}
