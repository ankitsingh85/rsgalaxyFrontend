'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, Ban, Upload, X, Search, Receipt, Trash2, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceAPI, amenityUsageAPI } from '@/lib/api';
import type { Service, AmenityUsage, Booking } from '@/types';
import { Modal, Input, TextArea, Select } from '@/components/admin/FormControls';

export default function AmenitiesManager({ hotels, bookings }: { hotels: any[]; bookings: Booking[] }) {
  const [mainTab, setMainTab] = useState<'amenities' | 'billing'>('amenities');
  const [services, setServices] = useState<Service[]>([]);

  const loadServices = () => serviceAPI.getAll().then(d => setServices(d.services || [])).catch(() => {});
  useEffect(() => { loadServices(); }, []);

  // ══════════════ AMENITIES TAB ══════════════
  const [hotelFilter, setHotelFilter] = useState('');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  const visibleServices = services.filter((s: any) => !hotelFilter || s.hotelId === hotelFilter);

  const openCreate = () => {
    setEditingId(null);
    setItemForm({ hotelId: hotelFilter || hotels[0]?._id || '', name: '', price: '', description: '', image: '', isActive: true });
    setItemModalOpen(true);
  };
  const openEdit = (item: Service) => {
    setEditingId(item._id);
    setItemForm({ ...item });
    setItemModalOpen(true);
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await serviceAPI.uploadImage(file);
      setItemForm((f: any) => ({ ...f, image: res.url }));
      toast.success('Image uploaded');
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleSaveItem = async () => {
    if (!itemForm.hotelId || !itemForm.name || !itemForm.price) {
      toast.error('Hotel, name, and unit price are required');
      return;
    }
    try {
      const payload = { ...itemForm, price: Number(itemForm.price) };
      if (editingId) {
        await serviceAPI.update(editingId, payload);
        toast.success('Amenity updated');
      } else {
        await serviceAPI.create(payload);
        toast.success('Amenity created');
      }
      setItemModalOpen(false); setEditingId(null); setItemForm({});
      loadServices();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleActive = async (item: Service) => {
    try { await serviceAPI.update(item._id, { isActive: !item.isActive }); loadServices(); }
    catch (err: any) { toast.error(err.message); }
  };
  const deactivateItem = async (item: Service) => {
    if (!confirm(`Deactivate "${item.name}"? It stays out of new bookings/usage but past bills are unaffected.`)) return;
    try { await serviceAPI.delete(item._id); toast.success('Amenity deactivated'); loadServices(); }
    catch (err: any) { toast.error(err.message); }
  };

  // ══════════════ BILLING TAB ══════════════
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [usage, setUsage] = useState<AmenityUsage[]>([]);
  const [logForm, setLogForm] = useState<any>({ serviceId: '', quantity: 1, discountType: '', discountValue: 0, notes: '' });
  const [editingUsageId, setEditingUsageId] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    if (!q) return bookings.slice(0, 20);
    return bookings.filter((b: any) =>
      b.bookingRef?.toLowerCase().includes(q) || b.userName?.toLowerCase().includes(q) || b.userEmail?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [bookings, bookingSearch]);

  const selectedBooking = bookings.find((b: any) => b._id === selectedBookingId);
  const bookingServices = services.filter((s: any) => s.hotelId === selectedBooking?.hotelId && s.isActive);

  const loadUsage = (bookingId: string) => {
    if (!bookingId) { setUsage([]); return; }
    amenityUsageAPI.getByBooking(bookingId).then(d => setUsage(d.usage || [])).catch(() => setUsage([]));
  };

  const selectBooking = (id: string) => {
    setSelectedBookingId(id);
    setLogForm({ serviceId: '', quantity: 1, discountType: '', discountValue: 0, notes: '' });
    setEditingUsageId(null);
    loadUsage(id);
  };

  const submitUsage = async () => {
    if (!selectedBookingId || !logForm.serviceId) { toast.error('Select an amenity'); return; }
    try {
      if (editingUsageId) {
        await amenityUsageAPI.update(editingUsageId, {
          quantity: Number(logForm.quantity || 1),
          discountType: logForm.discountType || undefined,
          discountValue: Number(logForm.discountValue || 0),
          notes: logForm.notes,
        });
        toast.success('Usage entry updated');
      } else {
        await amenityUsageAPI.create({
          bookingId: selectedBookingId,
          serviceId: logForm.serviceId,
          quantity: Number(logForm.quantity || 1),
          discountType: logForm.discountType || undefined,
          discountValue: Number(logForm.discountValue || 0),
          notes: logForm.notes,
        });
        toast.success('Usage logged');
      }
      setLogForm({ serviceId: '', quantity: 1, discountType: '', discountValue: 0, notes: '' });
      setEditingUsageId(null);
      loadUsage(selectedBookingId);
    } catch (err: any) { toast.error(err.message); }
  };

  const editUsageEntry = (entry: AmenityUsage) => {
    setEditingUsageId(entry._id);
    setLogForm({
      serviceId: entry.serviceId, quantity: entry.quantity,
      discountType: entry.discountType || '', discountValue: entry.discountValue, notes: entry.notes || '',
    });
  };
  const cancelEditUsage = () => {
    setEditingUsageId(null);
    setLogForm({ serviceId: '', quantity: 1, discountType: '', discountValue: 0, notes: '' });
  };
  const removeUsage = async (entry: AmenityUsage) => {
    if (!confirm(`Remove this "${entry.serviceName}" entry?`)) return;
    try { await amenityUsageAPI.delete(entry._id); toast.success('Usage entry removed'); loadUsage(selectedBookingId); }
    catch (err: any) { toast.error(err.message); }
  };

  const usageTotal = usage.reduce((s, u) => s + u.amount, 0);
  const grandTotal = (selectedBooking?.totalPrice || 0) + usageTotal;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Amenities & Billing</h2>
          <p className="text-gray-400 text-sm">Manage hotel amenities and track per-guest usage and bills.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[['amenities', 'Amenities'], ['billing', 'Usage & Bills']].map(([id, label]) => (
          <button key={id} onClick={() => setMainTab(id as any)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
              mainTab === id ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ AMENITIES TAB ══════════════ */}
      {mainTab === 'amenities' && (
        <>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
              <option value="">All hotels</option>
              {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            <button onClick={openCreate} className="ml-auto flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
              <Plus className="w-4 h-4" /> Add Amenity
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleServices.map((item: any) => (
              <div key={item._id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="h-32 bg-gray-800">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600"><Sparkles className="w-8 h-8" /></div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-amber-400 font-bold whitespace-nowrap">₹{item.price.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{item.hotelName}</p>
                  {item.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleActive(item)}
                      className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${item.isActive ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-700 text-gray-500'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deactivateItem(item)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Ban className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
            {visibleServices.length === 0 && (
              <p className="col-span-full text-center py-10 text-gray-500">No amenities yet.</p>
            )}
          </div>
        </>
      )}

      {/* ══════════════ BILLING TAB ══════════════ */}
      {mainTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={bookingSearch} onChange={e => setBookingSearch(e.target.value)} placeholder="Search booking ref or guest..."
                className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {filteredBookings.map((b: any) => (
                <button key={b._id} onClick={() => selectBooking(b._id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm border ${
                    selectedBookingId === b._id ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-gray-800/60 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}>
                  <p className="font-semibold">{b.userName}</p>
                  <p className="text-xs opacity-70 font-mono">{b.bookingRef} · {b.hotelName}</p>
                </button>
              ))}
              {filteredBookings.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No bookings found.</p>}
            </div>
          </div>

          <div>
            {!selectedBooking ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center text-gray-500">
                Select a booking to log amenity usage and preview its bill.
              </div>
            ) : (
              <>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-4">
                  <p className="text-sm font-semibold text-white mb-3">{editingUsageId ? 'Edit Usage Entry' : 'Log Usage'}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Select
                      label="Amenity *"
                      value={logForm.serviceId}
                      onChange={(v: string) => setLogForm({ ...logForm, serviceId: v })}
                      options={[{ label: '-- Select amenity --', value: '' }, ...bookingServices.map((s: any) => ({ label: `${s.name} - ₹${s.price.toLocaleString()}`, value: s._id }))]}
                    />
                    <Input label="Quantity" value={logForm.quantity} onChange={(v: string) => setLogForm({ ...logForm, quantity: Number(v) })} type="number" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <Select
                      label="Discount Type"
                      value={logForm.discountType}
                      onChange={(v: string) => setLogForm({ ...logForm, discountType: v })}
                      options={[{ label: 'None', value: '' }, { label: 'Flat ₹', value: 'flat' }, { label: 'Percent %', value: 'percent' }]}
                    />
                    <Input label="Discount Value" value={logForm.discountValue} onChange={(v: string) => setLogForm({ ...logForm, discountValue: Number(v) })} type="number" />
                  </div>
                  <Input label="Notes" value={logForm.notes} onChange={(v: string) => setLogForm({ ...logForm, notes: v })} />
                  <div className="flex gap-2 mt-3">
                    {editingUsageId && (
                      <button onClick={cancelEditUsage} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
                    )}
                    <button onClick={submitUsage} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold">
                      {editingUsageId ? 'Save Changes' : 'Log Usage'}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                      {['Amenity', 'Unit', 'Qty', 'Discount', 'Amount', 'Logged', 'Actions'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {usage.map((u: any) => (
                        <tr key={u._id} className="border-b border-gray-800/50">
                          <td className="py-3 px-4 text-white">{u.serviceName}</td>
                          <td className="py-3 px-4 text-gray-400">₹{u.unitPrice.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-300">{u.quantity}</td>
                          <td className="py-3 px-4 text-gray-400 text-xs">
                            {u.discountType ? (u.discountType === 'percent' ? `${u.discountValue}%` : `₹${u.discountValue.toLocaleString()}`) : '—'}
                          </td>
                          <td className="py-3 px-4 text-amber-400 font-bold">₹{u.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{new Date(u.usedAt).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1.5">
                              <button onClick={() => editUsageEntry(u)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => removeUsage(u)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {usage.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-8 text-gray-500">No amenity usage logged yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Receipt className="w-4 h-4 text-amber-400" /> Consolidated Bill Preview</div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-300"><span>Room charges ({selectedBooking.bookingRef})</span><span>₹{selectedBooking.totalPrice.toLocaleString()}</span></div>
                    <div className="flex justify-between text-gray-300"><span>Amenity usage ({usage.length} entries)</span><span>₹{usageTotal.toLocaleString()}</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-800">
                    <p className="text-sm font-semibold text-white">Grand Total</p>
                    <p className="text-xl font-bold text-amber-400">₹{grandTotal.toLocaleString()}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* AMENITY MODAL */}
      {itemModalOpen && (
        <Modal
          title={editingId ? 'Edit Amenity' : 'Add Amenity'}
          onClose={() => { setItemModalOpen(false); setEditingId(null); setItemForm({}); }}
          onSave={handleSaveItem}
        >
          <Select
            label="Hotel *"
            value={itemForm.hotelId || ''}
            onChange={(v: string) => setItemForm({ ...itemForm, hotelId: v })}
            options={[{ label: '-- Select hotel --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name * (e.g. Spa, Laundry)" value={itemForm.name || ''} onChange={(v: string) => setItemForm({ ...itemForm, name: v })} />
            <Input label="Unit Price *" value={itemForm.price || ''} onChange={(v: string) => setItemForm({ ...itemForm, price: v })} type="number" />
          </div>
          <TextArea label="Description" value={itemForm.description || ''} onChange={(v: string) => setItemForm({ ...itemForm, description: v })} />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Image</label>
            <div className="flex items-center gap-3">
              {itemForm.image ? (
                <div className="relative group">
                  <img src={itemForm.image} className="w-20 h-20 object-cover rounded-lg" />
                  <button onClick={() => setItemForm({ ...itemForm, image: '' })} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : null}
              <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer text-gray-500 hover:border-amber-500 hover:text-amber-400">
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-[10px]">{uploading ? 'Uploading…' : 'Upload'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={itemForm.isActive !== false} onChange={e => setItemForm({ ...itemForm, isActive: e.target.checked })} />
            Active
          </label>
        </Modal>
      )}
    </div>
  );
}
