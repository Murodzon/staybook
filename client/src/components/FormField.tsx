import { forwardRef, type InputHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; icon: IconName; error?: string };

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, icon, error, name, ...input },
  ref,
) {
  const errorId = `${name}-error`;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className="group flex cursor-text flex-col rounded-xl border border-slate-200 bg-white px-3.5 pt-2 pb-1 transition focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100 has-aria-invalid:border-red-500">
        <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">{label}</span>
        <span className="flex items-center gap-2">
          <Icon name={icon} className="size-5 text-brand-600" />
          <input
            {...input}
            ref={ref}
            name={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="h-10 w-full min-w-0 bg-transparent text-base font-semibold outline-none placeholder:font-medium placeholder:text-slate-400"
          />
        </span>
      </label>
      {error && (
        <span id={errorId} className="px-1 text-sm font-medium text-red-700">
          {error}
        </span>
      )}
    </div>
  );
});
