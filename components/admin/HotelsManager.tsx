'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, Star, MapPin, Search, Table2, Map as MapIcon,
  ChevronLeft, ChevronRight, History, RotateCcw, X, Upload, AlertTriangle, Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { hotelAPI, auditAPI } from '@/lib/api';
import type { Hotel, AuditLog } from '@/types';
import { Modal, Input, TextArea, Select } from '@/components/admin/FormControls';
import StarRatingInput from './StarRatingInput';
import LocationPicker from './LocationPicker';
import HotelMapView from './HotelMapView';

const PAGE_SIZE = 8;
const emptyForm = { status: 'active', amenities: [], images: [], rating: 4.5 };

export default function HotelsManager({ hotels, onReload }: { hotels: Hotel[]; onReload: () => void }) {
  const [view, setView] = useState<'table' | 'map'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('active');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Hotel | null>(null);
  const [hardConfirmText, setHardConfirmText] = useState('');

  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedHotels, setDeletedHotels] = useState<Hotel[]>([]);

  const [historyTarget, setHistoryTarget] = useState<Hotel | null>(null);
  const [historyLogs, setHistoryLogs] = useState<AuditLog[]>([]);

  const cities = useMemo(() => Array.from(new Set(hotels.map(h => h.city))).sort(), [hotels]);

  const filtered = useMemo(() => hotels.filter(h =>
    (!search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || h.status === statusFilter) &&
    (!cityFilter || h.city === cityFilter) &&
    (h.rating >= minRating)
  ), [hotels, search, statusFilter, cityFilter, minRating]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, statusFilter, cityFilter, minRating]);
  useEffect(() => { if (showDeleted) hotelAPI.getDeleted().then(d => setDeletedHotels(d.hotels || [])).catch(() => {}); }, [showDeleted]);

  // ── Selection ──
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleSelectAllOnPage = () => setSelected(prev => {
    const allSelected = paged.every(h => prev.has(h._id));
    const next = new Set(prev);
    paged.forEach(h => allSelected ? next.delete(h._id) : next.add(h._id));
    return next;
  });

  // ── Create / Edit ──
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (hotel: Hotel) => {
    setEditingId(hotel._id);
    setForm({ ...hotel, amenities: hotel.amenities.join(', '), images: hotel.images?.length ? hotel.images : (hotel.image ? [hotel.image] : []) });
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await hotelAPI.uploadImages(files);
      setForm((f: any) => ({ ...f, images: [...(f.images || []), ...res.urls] }));
      toast.success('Images uploaded');
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };
  const removeImage = (url: string) => setForm((f: any) => ({ ...f, images: (f.images || []).filter((u: string) => u !== url) }));

  const handleSave = async () => {
    if (!form.name || !form.location || !form.city || !form.description) {
      toast.error('Name, address, city and description are required');
      return;
    }
    if (!form.images || form.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    try {
      const data = {
        ...form,
        amenities: typeof form.amenities === 'string' ? form.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : form.amenities,
      };
      if (editingId) {
        await hotelAPI.update(editingId, data);
        toast.success('Hotel updated');
      } else {
        await hotelAPI.create(data);
        toast.success('Hotel created');
      }
      setModalOpen(false); setEditingId(null); setForm(emptyForm);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Bulk status ──
  const applyBulkStatus = async () => {
    if (selected.size === 0) return;
    try {
      await hotelAPI.bulkUpdateStatus(Array.from(selected), bulkStatus);
      toast.success(`${selected.size} hotel(s) set to ${bulkStatus}`);
      setSelected(new Set());
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Delete ──
  const confirmSoftDelete = async () => {
    if (!deleteTarget) return;
    try {
      await hotelAPI.delete(deleteTarget._id);
      toast.success('Hotel moved to trash');
      setDeleteTarget(null);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };
  const confirmHardDelete = async () => {
    if (!deleteTarget || hardConfirmText !== deleteTarget.name) return;
    try {
      await hotelAPI.hardDelete(deleteTarget._id);
      toast.success('Hotel permanently deleted');
      setDeleteTarget(null); setHardConfirmText('');
      onReload();
      if (showDeleted) hotelAPI.getDeleted().then(d => setDeletedHotels(d.hotels || []));
    } catch (err: any) { toast.error(err.message); }
  };

  const restoreHotel = async (id: string) => {
    try {
      await hotelAPI.restore(id);
      toast.success('Hotel restored');
      setDeletedHotels(prev => prev.filter(h => h._id !== id));
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const openHistory = async (hotel: Hotel) => {
    setHistoryTarget(hotel);
    try {
      const res = await auditAPI.getForEntity('Hotel', hotel._id);
      setHistoryLogs(res.logs || []);
    } catch { setHistoryLogs([]); }
  };

  const statusColor = (status: string) =>
    status === 'active' ? 'border-green-500/30 text-green-400' :
    status === 'suspended' ? 'border-red-500/30 text-red-400' :
    'border-yellow-500/30 text-yellow-400';

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Hotels ({filtered.length})</h2>
          <p className="text-gray-400 text-sm">Manage all properties</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 border border-gray-700 rounded-xl p-1">
            <button onClick={() => setView('table')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'table' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>
              <Table2 className="w-3.5 h-3.5" /> Table
            </button>
            <button onClick={() => setView('map')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${view === 'map' ? 'bg-amber-500 text-white' : 'text-gray-400'}`}>
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Hotel
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
          <option value={0}>Any Rating</option>
          {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r}+ stars</option>)}
        </select>
        <button onClick={() => setShowDeleted(s => !s)}
          className={`text-xs font-semibold px-3 py-2 rounded-xl border ${showDeleted ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-700 text-gray-400'}`}>
          {showDeleted ? 'Hide' : 'Show'} Deleted
        </button>
      </div>

      {/* BULK BAR */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          <span className="text-sm text-amber-300 font-semibold">{selected.size} selected</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-sm focus:outline-none">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={applyBulkStatus} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">Apply</button>
          <button onClick={() => setSelected(new Set())} className="text-gray-400 text-sm hover:text-white">Clear</button>
        </div>
      )}

      {/* DELETED PANEL */}
      {showDeleted && (
        <div className="mb-6 bg-gray-900 border border-red-500/20 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-red-400 mb-3">Deleted Hotels ({deletedHotels.length})</h3>
          {deletedHotels.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing in the trash.</p>
          ) : (
            <div className="space-y-2">
              {deletedHotels.map(h => (
                <div key={h._id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-white text-sm font-semibold">{h.name}</p>
                    <p className="text-xs text-gray-500">Deleted {h.deletedAt ? new Date(h.deletedAt).toLocaleString() : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => restoreHotel(h._id)} className="flex items-center gap-1 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg"><RotateCcw className="w-3 h-3" /> Restore</button>
                    <button onClick={() => setDeleteTarget(h)} className="flex items-center gap-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg"><Trash2 className="w-3 h-3" /> Delete Forever</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MAIN VIEW */}
      {view === 'map' ? (
        <HotelMapView hotels={filtered} onEdit={openEdit} />
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                <th className="py-3 px-4"><input type="checkbox" checked={paged.length > 0 && paged.every(h => selected.has(h._id))} onChange={toggleSelectAllOnPage} /></th>
                {['Hotel', 'Rating', 'Contact', 'City', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paged.map(hotel => (
                  <tr key={hotel._id} className="border-b border-gray-800/50">
                    <td className="py-3 px-4"><input type="checkbox" checked={selected.has(hotel._id)} onChange={() => toggleSelect(hotel._id)} /></td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={hotel.images?.[0] || hotel.image} alt={hotel.name} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <p className="text-white font-medium">{hotel.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{hotel.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className="flex items-center gap-1 text-amber-400 font-bold"><Star className="w-3.5 h-3.5 fill-amber-400" />{hotel.rating}</span></td>
                    <td className="py-3 px-4 text-gray-400">{hotel.contact ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{hotel.contact}</span> : '—'}</td>
                    <td className="py-3 px-4 text-gray-400">{hotel.city}, {hotel.country}</td>
                    <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full bg-transparent border capitalize ${statusColor(hotel.status)}`}>{hotel.status}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(hotel)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openHistory(hotel)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-blue-400 rounded-lg"><History className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTarget(hotel)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-500">No hotels match your filters.</td></tr>
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
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <Modal title={editingId ? 'Edit Hotel' : 'Add Hotel'} onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }} onSave={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Hotel Name *" value={form.name || ''} onChange={(v: string) => setForm({ ...form, name: v })} />
            <Input label="Contact Number" value={form.contact || ''} onChange={(v: string) => setForm({ ...form, contact: v })} type="tel" />
            <Input label="Address *" value={form.location || ''} onChange={(v: string) => setForm({ ...form, location: v })} />
            <Input label="City *" value={form.city || ''} onChange={(v: string) => setForm({ ...form, city: v })} />
            <Input label="Country" value={form.country || ''} onChange={(v: string) => setForm({ ...form, country: v })} />
            <Input label="Total Rooms" value={form.totalRooms || ''} onChange={(v: string) => setForm({ ...form, totalRooms: Number(v) })} type="number" />
            <Input label="Price Range" value={form.priceRange || ''} onChange={(v: string) => setForm({ ...form, priceRange: v })} />
          </div>

          <StarRatingInput value={form.rating || 0} onChange={v => setForm({ ...form, rating: v })} />

          <LocationPicker latitude={form.latitude} longitude={form.longitude}
            onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })} />

          <TextArea label="Description *" value={form.description || ''} onChange={(v: string) => setForm({ ...form, description: v })} />
          <Input label="Amenities (comma-separated)" value={Array.isArray(form.amenities) ? form.amenities.join(', ') : form.amenities || ''}
            onChange={(v: string) => setForm({ ...form, amenities: v })} />
          <Select label="Status" value={form.status || 'active'} onChange={(v: string) => setForm({ ...form, status: v })} options={['active', 'inactive', 'suspended']} />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Images *</label>
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

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Delete "{deleteTarget.name}"</h3>
            <p className="text-sm text-gray-400 mb-5">Choose how this hotel should be removed.</p>

            <div className="bg-gray-800/60 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-white mb-1">Soft Delete (recommended)</p>
              <p className="text-xs text-gray-400 mb-3">Hides the hotel from listings. Reversible from "Show Deleted". Logged to the audit trail.</p>
              <button onClick={confirmSoftDelete} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-sm font-semibold">Move to Trash</button>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-red-400 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Permanent Delete</p>
              <p className="text-xs text-gray-400 mb-3">Irreversible. Also deletes all rooms and bookings for this hotel and unassigns its manager. Type the hotel name to confirm.</p>
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

      {/* HISTORY MODAL */}
      {historyTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Activity — {historyTarget.name}</h3>
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
