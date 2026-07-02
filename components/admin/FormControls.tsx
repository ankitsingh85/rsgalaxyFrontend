'use client';
import { Save, X } from 'lucide-react';

export function Modal({ title, children, onClose, onSave }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-3 rounded-xl font-semibold">Cancel</button>
          <button onClick={onSave} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
    </div>
  );
}

export function TextArea({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 resize-none" />
    </div>
  );
}

export function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500">
        {options.map((opt: any) => {
          if (typeof opt === 'string') return <option key={opt} value={opt} className="capitalize">{opt}</option>;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
      </select>
    </div>
  );
}
