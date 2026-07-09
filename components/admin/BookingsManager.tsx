'use client';
import { useMemo, useState } from 'react';
import {
  Plus, Filter, Download, Printer, LogIn, LogOut, Edit2, Ban,
  Settings, X, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI, serviceAPI } from '@/lib/api';
import type { Booking, Service } from '@/types';
import { Modal, Input, TextArea, Select } from '@/components/admin/FormControls';
import { estimateStayTotal } from '@/lib/roomPricing';

const PAGE_SIZE = 8;

const getRoomStayTotal = (rooms: any[], roomId: string, checkIn: string, checkOut: string) => {
  const room = rooms.find((r: any) => r._id === roomId);
  return estimateStayTotal(room, checkIn, checkOut).total;
};

const statusColor = (s: string) =>
  s === 'confirmed' || s === 'checked-in' ? 'border-green-500/30 text-green-400' :
  s === 'checked-out' ? 'border-blue-500/30 text-blue-400' :
  s === 'cancelled' ? 'border-red-500/30 text-red-400' :
  'border-yellow-500/30 text-yellow-400';

export default function BookingsManager({ hotels, rooms, customers, bookings, onReload }: {
  hotels: any[]; rooms: any[]; customers: any[]; bookings: Booking[]; onReload: () => void;
}) {
  const [mainTab, setMainTab] = useState<'create' | 'view'>('create');

  // ── Create ──
  const [createForm, setCreateForm] = useState<any>({
    userId: '', hotelId: '', roomId: '', guests: 1, checkIn: '', checkOut: '',
    status: 'confirmed', paymentStatus: 'paid', specialRequests: '',
  });
  const createRooms = rooms.filter((r: any) => !createForm.hotelId || r.hotelId === createForm.hotelId);
  const createEstimate = getRoomStayTotal(rooms, createForm.roomId, createForm.checkIn, createForm.checkOut);

  const handleCreate = async () => {
    if (!createForm.userId || !createForm.roomId || !createForm.checkIn || !createForm.checkOut) {
      toast.error('Select customer, room, and dates');
      return;
    }
    const totalPrice = createEstimate;
    if (!totalPrice) { toast.error('Please choose a valid date range'); return; }

    const selectedRoom = rooms.find((r: any) => r._id === createForm.roomId);
    try {
      await bookingAPI.create({
        userId: createForm.userId,
        roomId: createForm.roomId,
        checkIn: createForm.checkIn,
        checkOut: createForm.checkOut,
        guests: Number(createForm.guests || 1),
        status: createForm.status,
        paymentStatus: createForm.paymentStatus,
        totalPrice,
        specialRequests: createForm.specialRequests,
        ...(selectedRoom ? {
          hotelId: selectedRoom.hotelId,
          hotelName: selectedRoom.hotelName,
          roomNumber: selectedRoom.roomNumber,
          roomType: selectedRoom.type,
        } : {}),
      });
      toast.success('Manual booking created');
      setCreateForm({
        userId: '', hotelId: '', roomId: '', guests: 1, checkIn: '', checkOut: '',
        status: 'confirmed', paymentStatus: 'paid', specialRequests: '',
      });
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── View: filters ──
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ hotelId: '', roomId: '', dateFrom: '', dateTo: '', status: '', paymentStatus: '' });
  const [page, setPage] = useState(1);
  const filterRooms = rooms.filter((r: any) => !filters.hotelId || r.hotelId === filters.hotelId);

  const filteredBookings = useMemo(() => bookings.filter((b: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || b.userName?.toLowerCase().includes(q) || b.userEmail?.toLowerCase().includes(q) || b.bookingRef?.toLowerCase().includes(q);
    const matchesHotel = !filters.hotelId || b.hotelId === filters.hotelId;
    const matchesRoom = !filters.roomId || b.roomId === filters.roomId;
    const checkIn = b.checkIn ? new Date(b.checkIn) : null;
    const matchesFrom = !filters.dateFrom || (checkIn && checkIn >= new Date(filters.dateFrom));
    const matchesTo = !filters.dateTo || (checkIn && checkIn <= new Date(`${filters.dateTo}T23:59:59`));
    const matchesStatus = !filters.status || b.status === filters.status;
    const matchesPayment = !filters.paymentStatus || b.paymentStatus === filters.paymentStatus;
    return matchesSearch && matchesHotel && matchesRoom && matchesFrom && matchesTo && matchesStatus && matchesPayment;
  }), [bookings, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const paged = filteredBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Export ──
  const exportCSV = () => {
    const header = ['Ref', 'Guest', 'Email', 'Hotel', 'Room', 'Check-in', 'Check-out', 'Guests', 'Amount', 'Status', 'Payment'];
    const rows = filteredBookings.map((b: any) => [
      b.bookingRef, b.userName, b.userEmail, b.hotelName, b.roomNumber,
      new Date(b.checkIn).toLocaleDateString(), new Date(b.checkOut).toLocaleDateString(),
      b.guests, b.totalPrice, b.status, b.paymentStatus,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bookings-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const rowsHtml = filteredBookings.map((b: any) => `
      <tr>
        <td>${b.bookingRef}</td><td>${b.userName}<br/><small>${b.userEmail}</small></td>
        <td>${b.hotelName}</td><td>${b.roomNumber}</td>
        <td>${new Date(b.checkIn).toLocaleDateString()} - ${new Date(b.checkOut).toLocaleDateString()}</td>
        <td>${b.guests}</td><td>Rs.${Number(b.totalPrice).toLocaleString()}</td>
        <td>${b.status}</td><td>${b.paymentStatus}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Bookings Export</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin-bottom:4px}
        p{color:#555;font-size:12px;margin-top:0}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #ccc;padding:6px 8px;font-size:11px;text-align:left}
        th{background:#f2f2f2}
      </style></head><body>
      <h1>RS Galaxy Hotel — Bookings Export</h1>
      <p>Generated ${new Date().toLocaleString()} · ${filteredBookings.length} bookings</p>
      <table><thead><tr><th>Ref</th><th>Guest</th><th>Hotel</th><th>Room</th><th>Dates</th><th>Guests</th><th>Amount</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>${rowsHtml}</tbody></table>
      </body></html>`;
    const win = window.open('', '_blank');
    if (!win) { toast.error('Please allow popups to export PDF'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  // ── One-click check-in / check-out ──
  const doCheckIn = async (b: Booking) => {
    try { await bookingAPI.checkIn(b._id); toast.success('Checked in — confirmation emailed'); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };
  const doCheckOut = async (b: Booking) => {
    try { await bookingAPI.checkOut(b._id); toast.success('Checked out — confirmation emailed'); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  // ── Modify ──
  const [modifyTarget, setModifyTarget] = useState<Booking | null>(null);
  const [modifyForm, setModifyForm] = useState<any>({});
  const [modifyServices, setModifyServices] = useState<any[]>([]);
  const [modifyCatalog, setModifyCatalog] = useState<Service[]>([]);
  const modifyRooms = rooms.filter((r: any) => !modifyForm.hotelId || r.hotelId === modifyForm.hotelId);
  const modifyStayTotal = getRoomStayTotal(rooms, modifyForm.roomId, modifyForm.checkIn, modifyForm.checkOut);
  const modifyServicesTotal = modifyServices.reduce((s, x) => s + Number(x.price || 0), 0);
  const modifyGrandTotal = modifyStayTotal + modifyServicesTotal;

  const openModify = (b: Booking) => {
    setModifyTarget(b);
    setModifyForm({
      hotelId: b.hotelId, roomId: b.roomId,
      checkIn: new Date(b.checkIn).toISOString().slice(0, 10),
      checkOut: new Date(b.checkOut).toISOString().slice(0, 10),
      guests: b.guests, status: b.status, paymentStatus: b.paymentStatus,
      specialRequests: b.specialRequests || '',
    });
    setModifyServices(b.extraServices || []);
    serviceAPI.getAll(b.hotelId).then(d => setModifyCatalog((d.services || []).filter((s: Service) => s.isActive))).catch(() => setModifyCatalog([]));
  };

  const addModifyService = (svc: Service) => {
    if (modifyServices.some(s => s.serviceId === svc._id)) return;
    setModifyServices([...modifyServices, { serviceId: svc._id, name: svc.name, price: svc.price, addedAt: new Date().toISOString() }]);
  };
  const removeModifyService = (serviceId: string) => setModifyServices(modifyServices.filter(s => s.serviceId !== serviceId));

  const handleModifySave = async () => {
    if (!modifyTarget) return;
    if (!modifyForm.roomId || !modifyForm.checkIn || !modifyForm.checkOut) { toast.error('Select room and dates'); return; }
    if (!modifyGrandTotal) { toast.error('Please choose a valid date range'); return; }
    const selectedRoom = rooms.find((r: any) => r._id === modifyForm.roomId);
    try {
      await bookingAPI.update(modifyTarget._id, {
        roomId: modifyForm.roomId,
        checkIn: modifyForm.checkIn,
        checkOut: modifyForm.checkOut,
        guests: Number(modifyForm.guests || 1),
        status: modifyForm.status,
        paymentStatus: modifyForm.paymentStatus,
        specialRequests: modifyForm.specialRequests,
        extraServices: modifyServices,
        ...(selectedRoom ? {
          hotelId: selectedRoom.hotelId, hotelName: selectedRoom.hotelName,
          roomNumber: selectedRoom.roomNumber, roomType: selectedRoom.type,
        } : {}),
      });
      toast.success('Booking updated and re-priced');
      setModifyTarget(null); setModifyForm({}); setModifyServices([]);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Cancel ──
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const submitCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) { toast.error('A reason is required'); return; }
    try {
      await bookingAPI.cancel(cancelTarget._id, cancelReason.trim());
      toast.success('Booking cancelled — guest notified, room released');
      setCancelTarget(null); setCancelReason('');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Services catalog ──
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [catalogHotelId, setCatalogHotelId] = useState('');
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [newService, setNewService] = useState({ name: '', price: '' });

  const loadCatalog = (hotelId: string) => {
    if (!hotelId) { setCatalog([]); return; }
    serviceAPI.getAll(hotelId).then(d => setCatalog(d.services || [])).catch(() => setCatalog([]));
  };
  const openServicesModal = () => {
    const hid = filters.hotelId || hotels[0]?._id || '';
    setCatalogHotelId(hid);
    loadCatalog(hid);
    setServicesModalOpen(true);
  };
  const addCatalogService = async () => {
    if (!newService.name.trim() || !newService.price) { toast.error('Name and price are required'); return; }
    try {
      await serviceAPI.create({ hotelId: catalogHotelId, name: newService.name.trim(), price: Number(newService.price) });
      setNewService({ name: '', price: '' });
      loadCatalog(catalogHotelId);
    } catch (err: any) { toast.error(err.message); }
  };
  const toggleCatalogActive = async (svc: Service) => {
    try { await serviceAPI.update(svc._id, { isActive: !svc.isActive }); loadCatalog(catalogHotelId); }
    catch (err: any) { toast.error(err.message); }
  };
  const deleteCatalogService = async (svc: Service) => {
    if (!confirm(`Delete service "${svc.name}"?`)) return;
    try { await serviceAPI.delete(svc._id); loadCatalog(catalogHotelId); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Booking Management ({bookings.length})</h2>
          <p className="text-gray-400 text-sm">Create bookings, or view, check guests in/out, modify, and cancel reservations.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[['create', 'Create'], ['view', 'View']].map(([id, label]) => (
          <button key={id} onClick={() => setMainTab(id as any)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
              mainTab === id
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── CREATE ── */}
      {mainTab === 'create' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Plus className="w-4 h-4 text-amber-400" /> New Manual Booking
          </div>
          <div className="space-y-3">
            <Select
              label="Customer *"
              value={createForm.userId || ''}
              onChange={(v: string) => setCreateForm({ ...createForm, userId: v })}
              options={[{ label: '-- Select customer --', value: '' }, ...customers.map((c: any) => ({ label: `${c.name} (${c.email})`, value: c._id }))]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Hotel *"
                value={createForm.hotelId || ''}
                onChange={(v: string) => setCreateForm({ ...createForm, hotelId: v, roomId: '' })}
                options={[{ label: '-- Select hotel --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
              />
              <Select
                label="Room *"
                value={createForm.roomId || ''}
                onChange={(v: string) => setCreateForm({ ...createForm, roomId: v })}
                options={[
                  { label: '-- Select room --', value: '' },
                  ...createRooms.filter((r: any) => r.status === 'available').map((r: any) => ({
                    label: `#${r.roomNumber} ${r.type} - Rs.${Number(r.price || 0).toLocaleString()}/night`, value: r._id,
                  })),
                ]}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Check-in *" value={createForm.checkIn || ''} onChange={(v: string) => setCreateForm({ ...createForm, checkIn: v })} type="date" />
              <Input label="Check-out *" value={createForm.checkOut || ''} onChange={(v: string) => setCreateForm({ ...createForm, checkOut: v })} type="date" />
              <Input label="Guests *" value={createForm.guests || 1} onChange={(v: string) => setCreateForm({ ...createForm, guests: Number(v) })} type="number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Booking Status" value={createForm.status || 'confirmed'} onChange={(v: string) => setCreateForm({ ...createForm, status: v })} options={['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']} />
              <Select label="Payment Status" value={createForm.paymentStatus || 'paid'} onChange={(v: string) => setCreateForm({ ...createForm, paymentStatus: v })} options={['pending', 'paid', 'refunded']} />
            </div>
            <TextArea label="Special Requests" value={createForm.specialRequests || ''} onChange={(v: string) => setCreateForm({ ...createForm, specialRequests: v })} />
            <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Total</p>
                <p className="text-xs text-gray-400">Room rate x nights + 12% tax.</p>
              </div>
              <p className="text-xl font-bold text-amber-400">₹{createEstimate.toLocaleString()}</p>
            </div>
            <button onClick={handleCreate} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold">
              Create Booking
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW ── */}
      {mainTab === 'view' && (
        <>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by guest, email or ref..."
                className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
            </div>
            <button onClick={openServicesModal} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold">
              <Settings className="w-4 h-4" /> Manage Services
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={exportPDF} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold">
              <Printer className="w-4 h-4" /> PDF
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Filter className="w-4 h-4 text-amber-400" /> Advanced Filters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              <select value={filters.hotelId} onChange={e => { setFilters({ ...filters, hotelId: e.target.value, roomId: '' }); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                <option value="">All hotels</option>
                {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
              <select value={filters.roomId} onChange={e => { setFilters({ ...filters, roomId: e.target.value }); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                <option value="">All rooms</option>
                {filterRooms.map((r: any) => <option key={r._id} value={r._id}>#{r.roomNumber} {r.type}</option>)}
              </select>
              <input type="date" value={filters.dateFrom} onChange={e => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500" />
              <input type="date" value={filters.dateTo} onChange={e => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500" />
              <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                <option value="">All statuses</option>
                {['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filters.paymentStatus} onChange={e => { setFilters({ ...filters, paymentStatus: e.target.value }); setPage(1); }}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                <option value="">All payments</option>
                {['pending', 'paid', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                {['Ref', 'Guest', 'Hotel', 'Room', 'Dates', 'Guests', 'Amount', 'Status', 'Payment', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paged.map((b: any) => {
                  const canCheckIn = b.status === 'pending' || b.status === 'confirmed';
                  const canCheckOut = b.status === 'checked-in';
                  const canModify = b.status !== 'checked-out' && b.status !== 'cancelled';
                  const canCancel = canModify;
                  return (
                    <tr key={b._id} className="border-b border-gray-800/50">
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{b.bookingRef}</td>
                      <td className="py-3 px-4 text-white">{b.userName}<br /><span className="text-xs text-gray-500">{b.userEmail}</span></td>
                      <td className="py-3 px-4 text-gray-400 max-w-[120px] truncate">{b.hotelName}</td>
                      <td className="py-3 px-4 text-gray-400">#{b.roomNumber}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString()}<br />{new Date(b.checkOut).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-300">{b.guests}</td>
                      <td className="py-3 px-4 text-amber-400 font-bold">₹{b.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full bg-transparent border capitalize ${statusColor(b.status)}`}>{b.status}</span></td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${b.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.paymentStatus}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {canCheckIn && (
                            <button onClick={() => doCheckIn(b)} title="Check In" className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg"><LogIn className="w-3.5 h-3.5" /></button>
                          )}
                          {canCheckOut && (
                            <button onClick={() => doCheckOut(b)} title="Check Out" className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg"><LogOut className="w-3.5 h-3.5" /></button>
                          )}
                          {canModify && (
                            <button onClick={() => openModify(b)} title="Modify" className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          )}
                          {canCancel && (
                            <button onClick={() => { setCancelTarget(b); setCancelReason(''); }} title="Cancel" className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-10 text-gray-500">No bookings match your filters.</td></tr>
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
        </>
      )}

      {/* MODIFY MODAL */}
      {modifyTarget && (
        <Modal
          title={`Modify Booking — ${modifyTarget.bookingRef}`}
          onClose={() => { setModifyTarget(null); setModifyForm({}); setModifyServices([]); }}
          onSave={handleModifySave}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Hotel"
              value={modifyForm.hotelId || ''}
              onChange={(v: string) => setModifyForm({ ...modifyForm, hotelId: v, roomId: '' })}
              options={hotels.map((h: any) => ({ label: h.name, value: h._id }))}
            />
            <Select
              label="Room (swap)"
              value={modifyForm.roomId || ''}
              onChange={(v: string) => setModifyForm({ ...modifyForm, roomId: v })}
              options={modifyRooms.filter((r: any) => r.status === 'available' || r._id === modifyForm.roomId).map((r: any) => ({
                label: `#${r.roomNumber} ${r.type} - ₹${Number(r.price || 0).toLocaleString()}/night`, value: r._id,
              }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Check-in" value={modifyForm.checkIn || ''} onChange={(v: string) => setModifyForm({ ...modifyForm, checkIn: v })} type="date" />
            <Input label="Check-out (extend)" value={modifyForm.checkOut || ''} onChange={(v: string) => setModifyForm({ ...modifyForm, checkOut: v })} type="date" />
            <Input label="Guests" value={modifyForm.guests || 1} onChange={(v: string) => setModifyForm({ ...modifyForm, guests: Number(v) })} type="number" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Booking Status" value={modifyForm.status || 'confirmed'} onChange={(v: string) => setModifyForm({ ...modifyForm, status: v })} options={['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']} />
            <Select label="Payment Status" value={modifyForm.paymentStatus || 'paid'} onChange={(v: string) => setModifyForm({ ...modifyForm, paymentStatus: v })} options={['pending', 'paid', 'refunded']} />
          </div>
          <TextArea label="Special Requests" value={modifyForm.specialRequests || ''} onChange={(v: string) => setModifyForm({ ...modifyForm, specialRequests: v })} />

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-2">Extra Services</p>
            {modifyServices.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {modifyServices.map((s: any) => (
                  <span key={s.serviceId} className="flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    {s.name} · ₹{Number(s.price).toLocaleString()}
                    <button onClick={() => removeModifyService(s.serviceId)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            {modifyCatalog.filter(c => !modifyServices.some(s => s.serviceId === c._id)).length === 0 ? (
              <p className="text-xs text-gray-500">No more active services available for this hotel.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {modifyCatalog.filter(c => !modifyServices.some(s => s.serviceId === c._id)).map(c => (
                  <button key={c._id} onClick={() => addModifyService(c)}
                    className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700">
                    + {c.name} (₹{Number(c.price).toLocaleString()})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Recalculated Total</p>
              <p className="text-xs text-gray-400">Room rate × nights + 12% tax + services.</p>
            </div>
            <p className="text-xl font-bold text-amber-400">₹{modifyGrandTotal.toLocaleString()}</p>
          </div>
        </Modal>
      )}

      {/* CANCEL MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-white mb-1">Cancel Booking — {cancelTarget.bookingRef}</h3>
            <p className="text-sm text-gray-400 mb-4">The guest will be notified by email and the room will be released for those dates.</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Reason for cancellation..."
              className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-xl text-sm mb-5 focus:outline-none focus:border-red-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); }} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Keep Booking</button>
              <button onClick={submitCancel} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold">Cancel Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE SERVICES MODAL */}
      {servicesModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Manage Services</h3>
              <button onClick={() => setServicesModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
            </div>
            <select value={catalogHotelId} onChange={e => { setCatalogHotelId(e.target.value); loadCatalog(e.target.value); }}
              className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500 mb-4">
              {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>

            <div className="space-y-2 mb-4">
              {catalog.length === 0 ? (
                <p className="text-sm text-gray-500">No services yet for this hotel.</p>
              ) : catalog.map(svc => (
                <div key={svc._id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-white text-sm font-semibold">{svc.name}</p>
                    <p className="text-xs text-gray-500">₹{Number(svc.price).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleCatalogActive(svc)}
                      className={`text-xs px-2 py-1 rounded-full border ${svc.isActive ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-700 text-gray-400'}`}>
                      {svc.isActive ? 'active' : 'inactive'}
                    </button>
                    <button onClick={() => deleteCatalogService(svc)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} placeholder="Service name"
                className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              <input value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} placeholder="Price" type="number"
                className="w-28 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              <button onClick={addCatalogService} className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-xl text-sm font-bold">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
