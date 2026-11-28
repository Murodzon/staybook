import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, name, ...input },
  ref,
) {
  const errorId = `${name}-error`;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        {...input}
        ref={ref}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 aria-invalid:border-red-600"
      />
      {error && (
        <span id={errorId} className="text-sm text-red-700">
          {error}
        </span>
      )}
    </label>
  );
});
