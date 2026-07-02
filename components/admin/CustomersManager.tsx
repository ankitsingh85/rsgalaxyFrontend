'use client';
import { useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, Download, ChevronLeft, ChevronRight,
  KeyRound, Ban, RotateCcw, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '@/lib/api';
import type { User, Booking } from '@/types';
import { Modal, Input } from '@/components/admin/FormControls';

const PAGE_SIZE = 8;

const statusOf = (u: User): 'active' | 'inactive' | 'banned' => {
  if (u.isBanned) return 'banned';
  if (u.isActive === false) return 'inactive';
  return 'active';
};

export default function CustomersManager({ customers, bookings, onReload }: { customers: User[]; bookings: Booking[]; onReload: () => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minBookings, setMinBookings] = useState(0);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [hardConfirmText, setHardConfirmText] = useState('');

  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedCustomers, setDeletedCustomers] = useState<User[]>([]);

  const enriched = useMemo(() => customers.map(u => {
    const ubks = bookings.filter(b => b.userId === u._id);
    const spent = ubks.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalPrice, 0);
    return { ...u, _bookingsCount: ubks.length, _spent: spent };
  }), [customers, bookings]);

  const filtered = useMemo(() => enriched.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q);
    const matchesStatus = !statusFilter || statusOf(u) === statusFilter;
    const matchesFrom = !dateFrom || new Date(u.createdAt) >= new Date(dateFrom);
    const matchesTo = !dateTo || new Date(u.createdAt) <= new Date(`${dateTo}T23:59:59`);
    return matchesSearch && matchesStatus && matchesFrom && matchesTo && u._bookingsCount >= minBookings;
  }), [enriched, search, statusFilter, dateFrom, dateTo, minBookings]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const loadDeleted = () => {
    const next = !showDeleted;
    setShowDeleted(next);
    if (next) userAPI.getDeleted().then(d => setDeletedCustomers((d.users || []).filter((u: User) => u.role === 'user'))).catch(() => {});
  };

  const exportCSV = () => {
    const header = ['Name', 'Email', 'Phone', 'Bookings', 'Total Spent', 'KYC Status', 'Status', 'Joined'];
    const rows = filtered.map(u => [
      u.name, u.email, u.phone || '', u._bookingsCount, u._spent, u.kycStatus || 'unverified', statusOf(u), new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `customers-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Create / Edit ──
  const openCreate = () => { setEditingId(null); setForm({}); setModalOpen(true); };
  const openEdit = (u: User) => { setEditingId(u._id!); setForm({ name: u.name, email: u.email, phone: u.phone }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    try {
      if (editingId) {
        await userAPI.update(editingId, { name: form.name, email: form.email, phone: form.phone });
        toast.success('Customer updated');
      } else {
        if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        await userAPI.createCustomer(form);
        toast.success('Customer created');
      }
      setModalOpen(false); setEditingId(null); setForm({});
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const updateKyc = async (id: string, kycStatus: string) => {
    try { await userAPI.update(id, { kycStatus }); toast.success('KYC status updated'); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  // ── Reset password ──
  const submitResetPassword = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await userAPI.resetPassword(resetTarget._id!, newPassword);
      toast.success('Password reset — customer notified by email');
      setResetTarget(null); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Ban / Unban ──
  const submitBan = async () => {
    if (!banTarget || !banReason.trim()) { toast.error('A reason is required'); return; }
    try {
      await userAPI.ban(banTarget._id!, banReason.trim());
      toast.success('Customer banned — notified by email');
      setBanTarget(null); setBanReason('');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };
  const unban = async (u: User) => {
    if (!confirm(`Unban ${u.name}?`)) return;
    try { await userAPI.unban(u._id!); toast.success('Customer unbanned'); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  // ── Delete ──
  const confirmSoftDelete = async () => {
    if (!deleteTarget) return;
    try {
      await userAPI.softDelete(deleteTarget._id!);
      toast.success('Customer moved to trash');
      setDeleteTarget(null);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };
  const confirmHardDelete = async () => {
    if (!deleteTarget || hardConfirmText !== deleteTarget.name) return;
    try {
      await userAPI.delete(deleteTarget._id!);
      toast.success('Customer permanently deleted');
      setDeleteTarget(null); setHardConfirmText('');
      onReload();
      if (showDeleted) userAPI.getDeleted().then(d => setDeletedCustomers((d.users || []).filter((u: User) => u.role === 'user')));
    } catch (err: any) { toast.error(err.message); }
  };
  const restore = async (id: string) => {
    try {
      await userAPI.restore(id);
      toast.success('Customer restored');
      setDeletedCustomers(prev => prev.filter(u => u._id !== id));
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'border-green-500/30 text-green-400' :
    s === 'banned' ? 'border-red-500/30 text-red-400' :
    'border-yellow-500/30 text-yellow-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Customers ({filtered.length})</h2>
          <p className="text-gray-400 text-sm">Manage customer accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or phone..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
        <select value={minBookings} onChange={e => setMinBookings(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value={0}>Any Bookings</option>
          {[1, 5, 10].map(n => <option key={n} value={n}>{n}+ bookings</option>)}
        </select>
        <button onClick={loadDeleted}
          className={`text-xs font-semibold px-3 py-2 rounded-xl border ${showDeleted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-700 text-gray-400'}`}>
          {showDeleted ? 'Hide' : 'Show'} Deleted
        </button>
      </div>

      {/* DELETED PANEL */}
      {showDeleted && (
        <div className="mb-6 bg-gray-900 border border-red-500/20 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-red-400 mb-3">Deleted Customers ({deletedCustomers.length})</h3>
          {deletedCustomers.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing in the trash.</p>
          ) : (
            <div className="space-y-2">
              {deletedCustomers.map(u => (
                <div key={u._id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-white text-sm font-semibold">{u.name} <span className="text-gray-500">({u.email})</span></p>
                    <p className="text-xs text-gray-500">Deleted {u.deletedAt ? new Date(u.deletedAt).toLocaleString() : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => restore(u._id!)} className="flex items-center gap-1 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg"><RotateCcw className="w-3 h-3" /> Restore</button>
                    <button onClick={() => setDeleteTarget(u)} className="flex items-center gap-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg"><Trash2 className="w-3 h-3" /> Delete Forever</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 bg-gray-800/50">
            {['Customer', 'Phone', 'Bookings', 'Total Spent', 'KYC', 'Status', 'Joined', 'Actions'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {paged.map(u => (
              <tr key={u._id} className="border-b border-gray-800/50">
                <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">{u.name[0]}</div><div><p className="text-white">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div></div></td>
                <td className="py-3 px-4 text-gray-400">{u.phone || '—'}</td>
                <td className="py-3 px-4 text-white">{u._bookingsCount}</td>
                <td className="py-3 px-4 text-amber-400 font-bold">₹{u._spent.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <select value={u.kycStatus || 'unverified'} onChange={e => updateKyc(u._id!, e.target.value)}
                    className="text-xs px-2 py-1 rounded-full bg-transparent border border-gray-700 text-gray-300 outline-none cursor-pointer capitalize">
                    {['unverified', 'pending', 'verified', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <span title={u.banReason} className={`text-xs px-2 py-1 rounded-full bg-transparent border capitalize ${statusColor(statusOf(u))}`}>{statusOf(u)}</span>
                </td>
                <td className="py-3 px-4 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(u)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setResetTarget(u)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 rounded-lg"><KeyRound className="w-3.5 h-3.5" /></button>
                    {u.isBanned ? (
                      <button onClick={() => unban(u)} className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg"><RotateCcw className="w-3.5 h-3.5" /></button>
                    ) : (
                      <button onClick={() => setBanTarget(u)} className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg"><Ban className="w-3.5 h-3.5" /></button>
                    )}
                    <button onClick={() => setDeleteTarget(u)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500">No customers match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <Modal title={editingId ? 'Edit Customer' : 'Add Customer'} onClose={() => { setModalOpen(false); setEditingId(null); setForm({}); }} onSave={handleSave}>
          <Input label="Full Name *" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} />
          <Input label="Email *" value={form.email || ''} onChange={(v: string) => setForm({ ...form, email: v })} type="email" />
          <Input label="Phone" value={form.phone || ''} onChange={(v: string) => setForm({ ...form, phone: v })} type="tel" />
          {!editingId && <Input label="Password *" value={form.password || ''} onChange={(v: string) => setForm({ ...form, password: v })} />}
        </Modal>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Reset Password — {resetTarget.name}</h3>
            <p className="text-sm text-gray-400 mb-4">The customer will be emailed a confirmation that their password changed.</p>
            <div className="space-y-3 mb-5">
              <Input label="New Password" value={newPassword} onChange={setNewPassword} />
              <Input label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setResetTarget(null); setNewPassword(''); setConfirmPassword(''); }} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={submitResetPassword} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold">Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* BAN MODAL */}
      {banTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Ban {banTarget.name}</h3>
            <p className="text-sm text-gray-400 mb-4">They'll be blocked from logging in and notified by email with this reason.</p>
            <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3} placeholder="Reason for ban..."
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm mb-5 focus:outline-none focus:border-red-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setBanTarget(null); setBanReason(''); }} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={submitBan} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold">Ban Customer</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Delete "{deleteTarget.name}"</h3>
            <p className="text-sm text-gray-400 mb-5">Choose how this customer should be removed.</p>

            <div className="bg-gray-800/60 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-white mb-1">Soft Delete (recommended)</p>
              <p className="text-xs text-gray-400 mb-3">Hides the account. Reversible from "Show Deleted". Logged to the audit trail.</p>
              <button onClick={confirmSoftDelete} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold">Move to Trash</button>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Permanent Delete</p>
              <p className="text-xs text-gray-400 mb-3">Irreversible. Type the customer's name to confirm.</p>
              <input value={hardConfirmText} onChange={e => setHardConfirmText(e.target.value)} placeholder={deleteTarget.name}
                className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm mb-2 focus:outline-none focus:border-red-500" />
              <button onClick={confirmHardDelete} disabled={hardConfirmText !== deleteTarget.name}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded-lg text-sm font-semibold">
                Permanently Delete
              </button>
            </div>

            <button onClick={() => { setDeleteTarget(null); setHardConfirmText(''); }} className="w-full border border-gray-700 text-gray-300 hover:bg-gray-800 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
