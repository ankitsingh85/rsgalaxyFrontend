'use client';
import { useState } from 'react';
import { Plus, Edit2, Trash2, Hotel } from 'lucide-react';
import toast from 'react-hot-toast';
import { userAPI } from '@/lib/api';
import type { User, ManagerPermissions, ModulePermission } from '@/types';
import { Modal, Input, Select } from '@/components/admin/FormControls';

const MODULES: { key: keyof ManagerPermissions; label: string }[] = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'restaurant', label: 'Restaurant' },
  { key: 'amenities', label: 'Amenities & Billing' },
  { key: 'staff', label: 'Staff' },
  { key: 'customers', label: 'Customers' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'blogs', label: 'Blogs' },
];

// Matches the backend's schema defaults exactly, so a brand-new manager's checkboxes
// reflect what they'd actually get if saved without touching anything.
const defaultPermissions = (): ManagerPermissions => ({
  bookings: { view: true, edit: true, delete: true },
  rooms: { view: true, edit: true, delete: true },
  restaurant: { view: true, edit: true, delete: true },
  amenities: { view: true, edit: true, delete: true },
  staff: { view: true, edit: true, delete: true },
  customers: { view: false, edit: false, delete: false },
  coupons: { view: false, edit: false, delete: false },
  notifications: { view: false, edit: false, delete: false },
  blogs: { view: false, edit: false, delete: false },
});

export default function ManagersManager({ users, hotels, onReload }: { users: User[]; hotels: any[]; onReload: () => void }) {
  const managers = users.filter(u => u.role === 'manager');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', email: '', phone: '', password: '', managedHotelId: '', permissions: defaultPermissions() });
    setModalOpen(true);
  };
  const openEdit = (mgr: User) => {
    setEditingId(mgr._id!);
    setForm({
      name: mgr.name, email: mgr.email, phone: mgr.phone || '',
      managedHotelId: mgr.managedHotelId || '',
      permissions: mgr.permissions || defaultPermissions(),
    });
    setModalOpen(true);
  };

  const setModulePermission = (moduleKey: keyof ManagerPermissions, patch: Partial<ModulePermission>) => {
    setForm((f: any) => ({
      ...f,
      permissions: { ...f.permissions, [moduleKey]: { ...f.permissions[moduleKey], ...patch } },
    }));
  };

  // Edit/Delete implies View — checking either forces View on; View can only be
  // unchecked once both Edit and Delete are off.
  const toggleView = (moduleKey: keyof ManagerPermissions) => {
    const current: ModulePermission = form.permissions[moduleKey];
    if (current.edit || current.delete) return; // locked on while edit/delete active
    setModulePermission(moduleKey, { view: !current.view });
  };
  const toggleEdit = (moduleKey: keyof ManagerPermissions) => {
    const current: ModulePermission = form.permissions[moduleKey];
    const next = !current.edit;
    setModulePermission(moduleKey, { edit: next, view: next ? true : current.view });
  };
  const toggleDelete = (moduleKey: keyof ManagerPermissions) => {
    const current: ModulePermission = form.permissions[moduleKey];
    const next = !current.delete;
    setModulePermission(moduleKey, { delete: next, view: next ? true : current.view });
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    try {
      if (editingId) {
        await userAPI.update(editingId, {
          name: form.name, email: form.email, phone: form.phone,
          managedHotelId: form.managedHotelId || undefined,
          permissions: form.permissions,
        });
        toast.success('Manager updated');
      } else {
        if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        await userAPI.createManager(form);
        toast.success('Manager created');
      }
      setModalOpen(false); setEditingId(null); setForm({});
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this manager?')) return;
    try { await userAPI.delete(id); toast.success('Manager removed'); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Managers ({managers.length})</h2>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus className="w-4 h-4" /> Add Manager
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {managers.map(mgr => {
          const hotel = hotels.find((h: any) => h._id === mgr.managedHotelId);
          const grantedModules = MODULES.filter(m => mgr.permissions?.[m.key]?.view);
          return (
            <div key={mgr._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">{mgr.name[0]}</div>
                <div><h3 className="font-bold text-white">{mgr.name}</h3><p className="text-sm text-gray-400">{mgr.email}</p></div>
              </div>
              {hotel && (
                <div className="bg-gray-800 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-500 mb-1">Managing</p>
                  <p className="text-sm font-medium text-white flex items-center gap-1"><Hotel className="w-3.5 h-3.5 text-amber-400" />{hotel.name}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {grantedModules.length === 0 ? (
                  <span className="text-xs text-gray-500">No modules granted</span>
                ) : grantedModules.map(m => (
                  <span key={m.key} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{m.label}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(mgr)} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs font-semibold">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Access
                </button>
                <button onClick={() => handleDelete(mgr._id!)} className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        {managers.length === 0 && <p className="col-span-full text-center py-10 text-gray-500">No managers yet.</p>}
      </div>

      {modalOpen && (
        <Modal
          title={editingId ? 'Edit Manager Access' : 'Add Manager'}
          onClose={() => { setModalOpen(false); setEditingId(null); setForm({}); }}
          onSave={handleSave}
        >
          <Input label="Full Name *" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} />
          <Input label="Email *" value={form.email || ''} onChange={(v: string) => setForm({ ...form, email: v })} type="email" />
          <Input label="Phone" value={form.phone || ''} onChange={(v: string) => setForm({ ...form, phone: v })} type="tel" />
          {!editingId && <Input label="Password *" value={form.password || ''} onChange={(v: string) => setForm({ ...form, password: v })} />}
          <Select
            label="Assign Hotel"
            value={form.managedHotelId || ''}
            onChange={(v: string) => setForm({ ...form, managedHotelId: v })}
            options={[{ label: '-- None --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
          />

          {form.permissions && (
            <div className="pt-2">
              <p className="text-sm font-semibold text-white mb-2">Access Permissions</p>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-xs text-gray-400 uppercase">
                      <th className="text-left py-2 px-3 font-semibold">Module</th>
                      <th className="text-center py-2 px-3 font-semibold">View</th>
                      <th className="text-center py-2 px-3 font-semibold">Edit</th>
                      <th className="text-center py-2 px-3 font-semibold">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(({ key, label }) => {
                      const perm: ModulePermission = form.permissions[key];
                      const viewLocked = perm.edit || perm.delete;
                      return (
                        <tr key={key} className="border-b border-gray-800 last:border-0">
                          <td className="py-2 px-3 text-gray-200">{label}</td>
                          <td className="text-center py-2 px-3">
                            <input type="checkbox" checked={perm.view} disabled={viewLocked} onChange={() => toggleView(key)} />
                          </td>
                          <td className="text-center py-2 px-3">
                            <input type="checkbox" checked={perm.edit} onChange={() => toggleEdit(key)} />
                          </td>
                          <td className="text-center py-2 px-3">
                            <input type="checkbox" checked={perm.delete} onChange={() => toggleDelete(key)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">Checking Edit or Delete automatically grants View for that module.</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
