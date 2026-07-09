'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, Table2, CalendarDays, CalendarRange,
  History, RotateCcw, X, Upload, Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { roomAPI, auditAPI } from '@/lib/api';
import type { Hotel, Room, AuditLog } from '@/types';
import { Modal, Input, TextArea, Select } from '@/components/admin/FormControls';
import RoomAvailabilityCalendar from './RoomAvailabilityCalendar';

const PAGE_SIZE = 8;
const emptyForm = { status: 'available', type: 'standard', capacity: 2, floor: 1, size: 30, amenities: [], images: [], customRates: [] };

export default function RoomsManager({ hotels, rooms, onReload }: { hotels: Hotel[]; rooms: Room[]; onReload: () => void }) {
  const [view, setView] = useState<'table' | 'availability'>('table');
  const [search, setSearch] = useState('');
  const [hotelFilter, setHotelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<'set' | 'percent'>('set');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkWeekendRate, setBulkWeekendRate] = useState('');
  const [bulkPercent, setBulkPercent] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<Room | null>(null);

  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedRooms, setDeletedRooms] = useState<Room[]>([]);

  const [historyTarget, setHistoryTarget] = useState<Room | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);

  const [customRateModalOpen, setCustomRateModalOpen] = useState(false);
  const [newCustomRate, setNewCustomRate] = useState({ startDate: '', endDate: '', price: '' });

  const filtered = useMemo(() => rooms.filter(r =>
    (!search || r.roomNumber.toLowerCase().includes(search.toLowerCase()) || r.hotelName.toLowerCase().includes(search.toLowerCase())) &&
    (!hotelFilter || r.hotelId === hotelFilter) &&
    (!typeFilter || r.type === typeFilter) &&
    (!statusFilter || r.status === statusFilter) &&
    (!minPrice || r.price >= Number(minPrice)) &&
    (!maxPrice || r.price <= Number(maxPrice))
  ), [rooms, search, hotelFilter, typeFilter, statusFilter, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, hotelFilter, typeFilter, statusFilter, minPrice, maxPrice]);
  useEffect(() => { if (showDeleted) roomAPI.getDeleted().then(d => setDeletedRooms(d.rooms || [])).catch(() => {}); }, [showDeleted]);

  // ── Selection ──
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSelectAllOnPage = () => setSelected(prev => {
    const allSelected = paged.every(r => prev.has(r._id));
    const next = new Set(prev);
    paged.forEach(r => allSelected ? next.delete(r._id) : next.add(r._id));
    return next;
  });

  // ── Create / Edit ──
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (room: Room) => {
    setEditingId(room._id);
    setForm({ ...room, amenities: room.amenities.join(', '), images: room.images?.length ? room.images : [] });
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await roomAPI.uploadImages(files);
      setForm((f: any) => ({ ...f, images: [...(f.images || []), ...res.urls] }));
      toast.success('Images uploaded');
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };
  const removeImage = (url: string) => setForm((f: any) => ({ ...f, images: (f.images || []).filter((u: string) => u !== url) }));

  const addCustomRate = () => {
    const { startDate, endDate, price } = newCustomRate;
    if (!startDate || !endDate || !price) { toast.error('Start date, end date, and price are required'); return; }
    if (endDate < startDate) { toast.error('End date must be on or after the start date'); return; }
    setForm((f: any) => ({
      ...f,
      customRates: [...(f.customRates || []), { startDate, endDate, price: Number(price) }],
    }));
    setNewCustomRate({ startDate: '', endDate: '', price: '' });
    setCustomRateModalOpen(false);
  };
  const removeCustomRate = (index: number) => setForm((f: any) => ({
    ...f,
    customRates: (f.customRates || []).filter((_: any, i: number) => i !== index),
  }));

  const handleSave = async () => {
    if (!form.hotelId || !form.roomNumber || !form.price) {
      toast.error('Hotel, room number and price are required');
      return;
    }
    try {
      const data = {
        ...form,
        amenities: typeof form.amenities === 'string' ? form.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : form.amenities,
      };
      if (editingId) {
        await roomAPI.update(editingId, data);
        toast.success('Room updated');
      } else {
        await roomAPI.create(data);
        toast.success('Room created');
      }
      setModalOpen(false); setEditingId(null); setForm(emptyForm);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await roomAPI.update(id, { status }); toast.success('Status updated'); onReload(); } catch (err: any) { toast.error(err.message); }
  };

  // ── Bulk price ──
  const applyBulkPrice = async () => {
    if (selected.size === 0) return;
    try {
      const payload = bulkMode === 'set'
        ? { mode: 'set' as const, ...(bulkPrice ? { price: Number(bulkPrice) } : {}), ...(bulkWeekendRate ? { weekendRate: Number(bulkWeekendRate) } : {}) }
        : { mode: 'percent' as const, percent: Number(bulkPercent) };
      if (bulkMode === 'set' && !bulkPrice && !bulkWeekendRate) {
        toast.error('Enter a base price or weekend rate');
        return;
      }
      if (bulkMode === 'percent' && !bulkPercent) {
        toast.error('Enter a percentage');
        return;
      }
      const res = await roomAPI.bulkUpdatePrice(Array.from(selected), payload);
      toast.success(res.message || 'Prices updated');
      setSelected(new Set()); setBulkPrice(''); setBulkWeekendRate(''); setBulkPercent('');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Deactivate / Reactivate ──
  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await roomAPI.delete(deactivateTarget._id);
      toast.success('Room deactivated');
      setDeactivateTarget(null);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };
  const reactivateRoom = async (id: string) => {
    try {
      await roomAPI.restore(id);
      toast.success('Room reactivated');
      setDeletedRooms(prev => prev.filter(r => r._id !== id));
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const openHistory = async (room: Room) => {
    setHistoryTarget(room);
    try {
      const res = await auditAPI.getForEntity('Room', room._id);
      setHistoryLogs(res.logs || []);
    } catch { setHistoryLogs([]); }
  };

  const statusColor = (status: string) =>
    status === 'available' ? 'border-green-500/30 text-green-400' :
    status === 'occupied' ? 'border-red-500/30 text-red-400' :
    'border-yellow-500/30 text-yellow-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Rooms ({filtered.length})</h2>
          <p className="text-gray-400 text-sm">Manage rooms, pricing and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 border border-gray-700 rounded-xl p-1">
            <button onClick={() => setView('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'table' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>
              <Table2 className="w-3.5 h-3.5" /> Table
            </button>
            <button onClick={() => setView('availability')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'availability' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>
              <CalendarDays className="w-3.5 h-3.5" /> Availability
            </button>
          </div>
          {view === 'table' && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
              <Plus className="w-4 h-4" /> Add Room
            </button>
          )}
        </div>
      </div>

      {view === 'availability' ? (
        <RoomAvailabilityCalendar hotels={hotels} />
      ) : (
        <>
          {/* FILTERS */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by room # or hotel..."
                className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <select value={hotelFilter} onChange={e => setHotelFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
              <option value="">All Hotels</option>
              {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
              <option value="">All Types</option>
              {['standard', 'deluxe', 'suite', 'presidential'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" placeholder="Min ₹"
              className="w-24 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" placeholder="Max ₹"
              className="w-24 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
            <button onClick={() => setShowDeleted(s => !s)}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border ${showDeleted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-700 text-gray-400'}`}>
              {showDeleted ? 'Hide' : 'Show'} Deactivated
            </button>
          </div>

          {/* BULK PRICE BAR */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex-wrap">
              <span className="text-sm text-amber-300 font-semibold">{selected.size} selected</span>
              <select value={bulkMode} onChange={e => setBulkMode(e.target.value as 'set' | 'percent')}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none">
                <option value="set">Set price</option>
                <option value="percent">Adjust by %</option>
              </select>
              {bulkMode === 'set' ? (
                <>
                  <input value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} type="number" placeholder="Base price ₹"
                    className="w-32 bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none" />
                  <input value={bulkWeekendRate} onChange={e => setBulkWeekendRate(e.target.value)} type="number" placeholder="Weekend rate ₹"
                    className="w-36 bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none" />
                </>
              ) : (
                <input value={bulkPercent} onChange={e => setBulkPercent(e.target.value)} type="number" placeholder="+10 or -10 (%)"
                  className="w-36 bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none" />
              )}
              <button onClick={applyBulkPrice} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">Apply</button>
              <button onClick={() => setSelected(new Set())} className="text-gray-400 text-sm hover:text-white">Clear</button>
            </div>
          )}

          {/* DEACTIVATED PANEL */}
          {showDeleted && (
            <div className="mb-6 bg-gray-900 border border-red-500/20 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-red-400 mb-3">Deactivated Rooms ({deletedRooms.length})</h3>
              {deletedRooms.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing deactivated.</p>
              ) : (
                <div className="space-y-2">
                  {deletedRooms.map(r => (
                    <div key={r._id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-white text-sm font-semibold">#{r.roomNumber} — {r.hotelName}</p>
                        <p className="text-xs text-gray-500">Deactivated {r.deletedAt ? new Date(r.deletedAt).toLocaleString() : ''}</p>
                      </div>
                      <button onClick={() => reactivateRoom(r._id)} className="flex items-center gap-1 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg">
                        <RotateCcw className="w-3 h-3" /> Reactivate
                      </button>
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
                <th className="py-3 px-4"><input type="checkbox" checked={paged.length > 0 && paged.every(r => selected.has(r._id))} onChange={toggleSelectAllOnPage} /></th>
                {['Room', 'Type', 'Base Price', 'Weekend Rate', 'Capacity/Floor', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paged.map(room => (
                  <tr key={room._id} className="border-b border-gray-800/50">
                    <td className="py-3 px-4"><input type="checkbox" checked={selected.has(room._id)} onChange={() => toggleSelect(room._id)} /></td>
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">#{room.roomNumber}</p>
                      <p className="text-xs text-gray-500">{room.hotelName}</p>
                    </td>
                    <td className="py-3 px-4"><span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full capitalize">{room.type}</span></td>
                    <td className="py-3 px-4 text-amber-400 font-bold">₹{room.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-400">{room.weekendRate ? `₹${room.weekendRate.toLocaleString()}` : '—'}</td>
                    <td className="py-3 px-4 text-gray-400">{room.capacity} guests · Floor {room.floor}</td>
                    <td className="py-3 px-4">
                      <select value={room.status} onChange={e => updateStatus(room._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full bg-transparent border outline-none cursor-pointer ${statusColor(room.status)}`}>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(room)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openHistory(room)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 rounded-lg"><History className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeactivateTarget(room)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Power className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-500">No rooms match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg">‹</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-gray-800 disabled:opacity-40 text-gray-300 rounded-lg">›</button>
            </div>
          </div>
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <Modal title={editingId ? 'Edit Room' : 'Add Room'} onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }} onSave={handleSave}>
          <Select label="Hotel *" value={form.hotelId || ''} onChange={(v: string) => setForm({ ...form, hotelId: v })}
            options={hotels.map(h => ({ label: h.name, value: h._id }))} />

          <div className="grid grid-cols-2 gap-3">
            {([
              ['roomNumber', 'Room Number *', 'text'],
              ['floor', 'Floor', 'number'],
              ['capacity', 'Capacity', 'number'],
              ['size', 'Size (m²)', 'number'],
              ['price', 'Base Price (₹) *', 'number'],
              ['weekendRate', 'Weekend Rate (₹)', 'number'],
            ] as const).map(([key, label, type]) => (
              <Input key={key} label={label} value={form[key] ?? ''}
                onChange={(v: string) => setForm({ ...form, [key]: type === 'number' ? Number(v) : v })} type={type} />
            ))}
            <Select label="Type" value={form.type || 'standard'} onChange={(v: string) => setForm({ ...form, type: v })}
              options={['standard', 'deluxe', 'suite', 'presidential']} />
            <Select label="Status" value={form.status || 'available'} onChange={(v: string) => setForm({ ...form, status: v })}
              options={['available', 'occupied', 'maintenance']} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-400">Custom Date Range Pricing</label>
              <button type="button" onClick={() => setCustomRateModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300">
                <Plus className="w-3.5 h-3.5" /> Add Custom Date Range
              </button>
            </div>
            {(form.customRates || []).length === 0 ? (
              <p className="text-xs text-gray-500">No custom date-range prices set — the base/weekend rate applies to every night.</p>
            ) : (
              <div className="space-y-1.5">
                {form.customRates.map((rate: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 text-gray-300">
                      <CalendarRange className="w-3.5 h-3.5 text-amber-400" />
                      {new Date(rate.startDate).toLocaleDateString()} – {new Date(rate.endDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold">₹{Number(rate.price).toLocaleString()}/night</span>
                      <button type="button" onClick={() => removeCustomRate(i)} className="text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <TextArea label="Description" value={form.description || ''} onChange={(v: string) => setForm({ ...form, description: v })} />
          <Input label="Amenities (comma-separated)" value={Array.isArray(form.amenities) ? form.amenities.join(', ') : form.amenities || ''}
            onChange={(v: string) => setForm({ ...form, amenities: v })} />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Images</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {(form.images || []).map((url: string) => (
                <div key={url} className="relative group">
                  <img src={url} className="w-full h-20 object-cover rounded-lg" />
                  <button onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer text-gray-500 hover:border-amber-500 hover:text-amber-400">
                <Upload className="w-4 h-4 mb-1" />
                <span className="text-[10px]">{uploading ? 'Uploading…' : 'Upload'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={uploading} />
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* CUSTOM DATE RANGE POPUP */}
      {customRateModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><CalendarRange className="w-4 h-4 text-amber-400" /> Custom Date Range</h3>
              <button onClick={() => setCustomRateModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={newCustomRate.startDate}
                    onChange={e => setNewCustomRate({ ...newCustomRate, startDate: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">End Date</label>
                  <input type="date" value={newCustomRate.endDate} min={newCustomRate.startDate || undefined}
                    onChange={e => setNewCustomRate({ ...newCustomRate, endDate: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Price for these nights (₹)</label>
                <input type="number" value={newCustomRate.price}
                  onChange={e => setNewCustomRate({ ...newCustomRate, price: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCustomRateModalOpen(false)} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={addCustomRate} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRM MODAL */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Deactivate Room #{deactivateTarget.roomNumber}</h3>
            <p className="text-sm text-gray-400 mb-5">
              Hides the room from listings and blocks new bookings. Existing bookings and history for this room are preserved and reversible anytime from "Show Deactivated".
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeactivateTarget(null)} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={confirmDeactivate} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Activity — Room #{historyTarget.roomNumber}</h3>
              <button onClick={() => setHistoryTarget(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {historyLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {historyLogs.map(log => (
                  <div key={log._id} className="bg-gray-800/60 rounded-xl px-4 py-2.5">
                    <p className="text-sm text-white capitalize">{log.action.replace('-', ' ')} <span className="text-gray-500">by {log.performedByName} ({log.performedByRole})</span></p>
                    <p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
