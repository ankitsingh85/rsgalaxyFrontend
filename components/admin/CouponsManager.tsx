'use client';
import { useState } from 'react';
import {
  Plus, Edit2, Power, Search, TicketPercent, CheckCircle, BarChart3, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { couponAPI } from '@/lib/api';
import { Modal, Input, Select } from '@/components/admin/FormControls';

export default function CouponsManager({ coupons, onReload }: { coupons: any[]; onReload: () => void }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const openCreate = () => {
    setEditingId(null);
    setForm({
      code: '',
      type: 'percent',
      value: 10,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: '',
      minBookingAmount: 0,
      usageLimit: 100,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: coupon.value || 0,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 10) : '',
      minBookingAmount: coupon.minBookingAmount || 0,
      usageLimit: coupon.usageLimit || 1,
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!form.code || !form.validFrom || !form.validUntil) {
        toast.error('Code and validity dates are required');
        return;
      }

      const payload = {
        ...form,
        code: String(form.code).trim().toUpperCase(),
        value: Number(form.value || 0),
        minBookingAmount: Number(form.minBookingAmount || 0),
        usageLimit: Number(form.usageLimit || 1),
      };

      if (editingId) {
        await couponAPI.update(editingId, payload);
        toast.success('Coupon updated');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created');
      }
      setModalOpen(false); setEditingId(null); setForm({});
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleStatus = async (coupon: any) => {
    try {
      await couponAPI.update(coupon._id, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (coupon: any) => {
    if (!confirm(`Deactivate coupon ${coupon.code}? Existing applied bookings will stay unchanged.`)) return;
    try {
      await couponAPI.delete(coupon._id);
      toast.success('Coupon deactivated');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const filteredCoupons = coupons.filter((coupon: any) =>
    !search ||
    coupon.code?.toLowerCase().includes(search.toLowerCase()) ||
    coupon.type?.toLowerCase().includes(search.toLowerCase())
  );
  const activeCoupons = coupons.filter((coupon: any) => coupon.isActive).length;
  const totalCouponUses = coupons.reduce((sum: number, coupon: any) => sum + (coupon.analytics?.usageCount || coupon.usedCount || 0), 0);
  const totalCouponImpact = coupons.reduce((sum: number, coupon: any) => sum + (coupon.analytics?.revenueImpact || coupon.revenueImpact || 0), 0);
  const avgRedemptionRate = coupons.length
    ? Math.round(coupons.reduce((sum: number, coupon: any) => sum + (coupon.analytics?.redemptionRate || 0), 0) / coupons.length)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TicketPercent className="w-6 h-6 text-amber-400" />
            <h2 className="text-2xl font-bold text-white">Coupons ({coupons.length})</h2>
          </div>
          <p className="text-gray-400 text-sm">Create codes, track redemption, edit validity, and deactivate instantly.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or type..."
          className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Coupons', value: activeCoupons, icon: TicketPercent, color: 'from-amber-500 to-amber-600' },
          { label: 'Total Uses', value: totalCouponUses, icon: CheckCircle, color: 'from-green-500 to-green-600' },
          { label: 'Avg Redemption', value: `${avgRedemptionRate}%`, icon: BarChart3, color: 'from-blue-500 to-blue-600' },
          { label: 'Revenue Impact', value: `₹${totalCouponImpact.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800 bg-gray-800/50">
            {['Code', 'Discount', 'Validity', 'Min Booking', 'Usage', 'Analytics', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">No coupons found</td>
              </tr>
            ) : (
              filteredCoupons.map((coupon: any) => {
                const analytics = coupon.analytics || {};
                const usage = analytics.usageCount ?? coupon.usedCount ?? 0;
                const limit = analytics.usageLimit ?? coupon.usageLimit ?? 0;
                return (
                  <tr key={coupon._id} className="border-b border-gray-800/50">
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-white">{coupon.code}</p>
                      <p className="text-xs text-gray-500">Created {new Date(coupon.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-bold">
                      {coupon.type === 'percent' ? `${coupon.value}%` : `₹${Number(coupon.value || 0).toLocaleString()}`}
                      <span className="block text-xs text-gray-500 font-normal capitalize">{coupon.type}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(coupon.validFrom).toLocaleDateString()}<br />{new Date(coupon.validUntil).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-300">₹{Number(coupon.minBookingAmount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-300">{usage} / {limit}</td>
                    <td className="py-3 px-4">
                      <p className="text-blue-400 font-semibold">{analytics.redemptionRate || 0}% redeemed</p>
                      <p className="text-xs text-gray-500">Impact ₹{Number(analytics.revenueImpact || coupon.revenueImpact || 0).toLocaleString()}</p>
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleStatus(coupon)}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          coupon.isActive
                            ? 'border-green-500/30 text-green-400 bg-green-500/10'
                            : 'border-red-500/30 text-red-400 bg-red-500/10'
                        }`}>
                        {coupon.isActive ? 'active' : 'inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(coupon)}
                          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(coupon)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal
          title={editingId ? 'Edit Coupon' : 'Create Coupon'}
          onClose={() => { setModalOpen(false); setEditingId(null); setForm({}); }}
          onSave={handleSave}
        >
          <Input
            label="Coupon Code *"
            value={form.code || ''}
            onChange={(v: string) => setForm({ ...form, code: v.toUpperCase() })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Discount Type"
              value={form.type || 'percent'}
              onChange={(v: string) => setForm({ ...form, type: v })}
              options={[
                { label: 'Percentage (%)', value: 'percent' },
                { label: 'Flat Amount', value: 'flat' },
              ]}
            />
            <Input
              label={form.type === 'flat' ? 'Value (₹)' : 'Value (%)'}
              value={form.value || ''}
              onChange={(v: string) => setForm({ ...form, value: Number(v) })}
              type="number"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Valid From *"
              value={form.validFrom || ''}
              onChange={(v: string) => setForm({ ...form, validFrom: v })}
              type="date"
            />
            <Input
              label="Valid Until *"
              value={form.validUntil || ''}
              onChange={(v: string) => setForm({ ...form, validUntil: v })}
              type="date"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Min Booking Amount (₹)"
              value={form.minBookingAmount || 0}
              onChange={(v: string) => setForm({ ...form, minBookingAmount: Number(v) })}
              type="number"
            />
            <Input
              label="Usage Limit"
              value={form.usageLimit || 1}
              onChange={(v: string) => setForm({ ...form, usageLimit: Number(v) })}
              type="number"
            />
          </div>
          <Select
            label="Status"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(v: string) => setForm({ ...form, isActive: v === 'active' })}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">Delete behavior</p>
            <p className="text-xs text-gray-400">Deleting a coupon deactivates it immediately. Existing bookings that already used it remain unchanged.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
