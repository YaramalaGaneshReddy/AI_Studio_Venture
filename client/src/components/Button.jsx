import { clsx } from 'clsx';

const variants = {
  primary: 'bg-ink text-white hover:bg-black',
  secondary: 'bg-white text-ink border border-line hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100'
};

export function Button({ className, variant = 'primary', ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
