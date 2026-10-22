'use client';

import { useId, useState } from 'react';

type NoteInputProps = {
  label: string;
};

export function NoteInput({ label }: NoteInputProps) {
  const id = useId();
  const [note, setNote] = useState('');

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        id={id}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Write a note..."
        className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
      />
    </div>
  );
}
