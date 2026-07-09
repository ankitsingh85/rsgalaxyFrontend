'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, UserX, Search, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { staffAPI } from '@/lib/api';
import type { Staff, StaffRole } from '@/types';
import { Modal, Input, Select } from '@/components/admin/FormControls';

const PAGE_SIZE = 8;

const STAFF_ROLES: StaffRole[] = ['manager', 'housekeeping', 'receptionist', 'chef'];

const STAFF_PERMISSIONS: Record<StaffRole, string[]> = {
  manager: ['Bookings', 'Rooms', 'Restaurant', 'Amenities', 'Reports'],
  housekeeping: ['Rooms'],
  receptionist: ['Bookings', 'Customers'],
  chef: ['Restaurant'],
};

const DAYS = [
  { value: 'mon', label: 'Mon' }, { value: 'tue', label: 'Tue' }, { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' }, { value: 'fri', label: 'Fri' }, { value: 'sat', label: 'Sat' }, { value: 'sun', label: 'Sun' },
];

const roleColor = (r: StaffRole) =>
  r === 'manager' ? 'border-purple-500/30 text-purple-400' :
  r === 'chef' ? 'border-orange-500/30 text-orange-400' :
  r === 'receptionist' ? 'border-blue-500/30 text-blue-400' :
  'border-teal-500/30 text-teal-400';

export default function StaffManager({ hotels }: { hotels: any[] }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const loadStaff = () => staffAPI.getAll().then(d => setStaff(d.staff || [])).catch(() => {});
  useEffect(() => { loadStaff(); }, []);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const [offboardTarget, setOffboardTarget] = useState<Staff | null>(null);
  const [offboardReason, setOffboardReason] = useState('');

  const [showOffboarded, setShowOffboarded] = useState(false);
  const [offboardedStaff, setOffboardedStaff] = useState<Staff[]>([]);

  const departments = useMemo(() => Array.from(new Set(staff.map(s => s.department))).sort(), [staff]);

  const filtered = useMemo(() => staff.filter(s => {
    const q = search.toLowerCase();
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchesRole = !roleFilter || s.staffRole === roleFilter;
    const matchesDept = !deptFilter || s.department === deptFilter;
    const matchesHotel = !hotelFilter || s.hotelId === hotelFilter;
    return matchesSearch && matchesRole && matchesDept && matchesHotel;
  }), [staff, search, roleFilter, deptFilter, hotelFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', email: '', phone: '', staffRole: 'receptionist', department: '', hotelId: hotels[0]?._id || '', credentialRef: '', shiftName: '', workingDays: [] });
    setModalOpen(true);
  };
  const openEdit = (s: Staff) => {
    setEditingId(s._id);
    setForm({ ...s });
    setModalOpen(true);
  };
  const toggleDay = (day: string) => {
    const days: string[] = form.workingDays || [];
    setForm({ ...form, workingDays: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.staffRole || !form.department || !form.hotelId) {
      toast.error('Name, email, staff role, department, and hotel are required');
      return;
    }
    try {
      if (editingId) {
        await staffAPI.update(editingId, form);
        toast.success('Staff profile updated');
      } else {
        await staffAPI.create(form);
        toast.success('Staff member added');
      }
      setModalOpen(false); setEditingId(null); setForm({});
      loadStaff();
    } catch (err: any) { toast.error(err.message); }
  };

  const submitOffboard = async () => {
    if (!offboardTarget) return;
    try {
      await staffAPI.offboard(offboardTarget._id, offboardReason.trim());
      toast.success('Staff member offboarded');
      setOffboardTarget(null); setOffboardReason('');
      loadStaff();
    } catch (err: any) { toast.error(err.message); }
  };

  const loadOffboarded = () => {
    const next = !showOffboarded;
    setShowOffboarded(next);
    if (next) staffAPI.getAll(undefined, true).then(d => setOffboardedStaff((d.staff || []).filter((s: Staff) => !s.isActive))).catch(() => {});
  };
  const restore = async (s: Staff) => {
    try {
      await staffAPI.restore(s._id);
      toast.success('Staff member restored');
      setOffboardedStaff(prev => prev.filter(x => x._id !== s._id));
      loadStaff();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Management ({filtered.length})</h2>
          <p className="text-gray-400 text-sm">Directory of hotel staff — contact, role, department, and shift.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none capitalize">
          <option value="">All Roles</option>
          {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value="">All Hotels</option>
          {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <button onClick={loadOffboarded}
          className={`text-xs font-semibold px-3 py-2 rounded-xl border ${showOffboarded ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-700 text-gray-400'}`}>
          {showOffboarded ? 'Hide' : 'Show'} Offboarded
        </button>
      </div>

      {showOffboarded && (
        <div className="mb-6 bg-gray-900 border border-red-500/20 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-red-400 mb-3">Offboarded Staff ({offboardedStaff.length})</h3>
          {offboardedStaff.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing here.</p>
          ) : (
            <div className="space-y-2">
              {offboardedStaff.map(s => (
                <div key={s._id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-white text-sm font-semibold">{s.name} <span className="text-gray-500">({s.email})</span></p>
                    <p className="text-xs text-gray-500">
                      {s.staffRole} · {s.department} · Offboarded {s.offboardedAt ? new Date(s.offboardedAt).toLocaleDateString() : ''}
                      {s.offboardReason ? ` — ${s.offboardReason}` : ''}
                    </p>
                  </div>
                  <button onClick={() => restore(s)} className="flex items-center gap-1 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg"><RotateCcw className="w-3 h-3" /> Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 bg-gray-800/50">
            {['Staff', 'Role & Permissions', 'Department', 'Hotel', 'Shift', 'Actions'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paged.map(s => (
              <tr key={s._id} className="border-b border-gray-800/50">
                <td className="py-3 px-4">
                  <p className="text-white">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-1 rounded-full bg-transparent border capitalize ${roleColor(s.staffRole)}`}>{s.staffRole}</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {STAFF_PERMISSIONS[s.staffRole].map(p => (
                      <span key={p} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-300">{s.department}</td>
                <td className="py-3 px-4 text-gray-400 max-w-[120px] truncate">{s.hotelName}</td>
                <td className="py-3 px-4 text-gray-400 text-xs">
                  {s.shiftName || '—'}
                  {s.workingDays?.length > 0 && <span className="block text-gray-500 uppercase mt-0.5">{s.workingDays.join(', ')}</span>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(s)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setOffboardTarget(s); setOffboardReason(''); }} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><UserX className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No staff match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {modalOpen && (
        <Modal title={editingId ? 'Edit Staff Profile' : 'Add Staff'} onClose={() => { setModalOpen(false); setEditingId(null); setForm({}); }} onSave={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Full Name *" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} />
            <Input label="Email *" value={form.email || ''} onChange={(v: string) => setForm({ ...form, email: v })} type="email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone || ''} onChange={(v: string) => setForm({ ...form, phone: v })} type="tel" />
            <Input label="Staff ID / Credential Ref" value={form.credentialRef || ''} onChange={(v: string) => setForm({ ...form, credentialRef: v })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Staff Role *" value={form.staffRole || 'receptionist'} onChange={(v: string) => setForm({ ...form, staffRole: v })} options={STAFF_ROLES} />
            <Input label="Department *" value={form.department || ''} onChange={(v: string) => setForm({ ...form, department: v })} />
          </div>
          <Select
            label="Hotel *"
            value={form.hotelId || ''}
            onChange={(v: string) => setForm({ ...form, hotelId: v })}
            options={[{ label: '-- Select hotel --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
          />
          <Input label="Shift Name (e.g. Morning, Night)" value={form.shiftName || ''} onChange={(v: string) => setForm({ ...form, shiftName: v })} />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(d => {
                const active = (form.workingDays || []).includes(d.value);
                return (
                  <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${active ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
          {form.staffRole && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1.5">Access permissions for this role:</p>
              <div className="flex flex-wrap gap-1.5">
                {STAFF_PERMISSIONS[form.staffRole as StaffRole].map(p => (
                  <span key={p} className="text-[11px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* OFFBOARD MODAL */}
      {offboardTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Offboard {offboardTarget.name}</h3>
            <p className="text-sm text-gray-400 mb-4">Their profile is deactivated but preserved for the audit trail; they drop out of the active directory.</p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-200/90">Reassign any of their open duties/shifts to another staff member — this isn't tracked automatically.</p>
            </div>
            <textarea value={offboardReason} onChange={e => setOffboardReason(e.target.value)} rows={3} placeholder="Reason for offboarding (optional)..."
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm mb-5 focus:outline-none focus:border-red-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setOffboardTarget(null); setOffboardReason(''); }} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={submitOffboard} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold">Offboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
