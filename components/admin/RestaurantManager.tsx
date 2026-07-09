'use client';
import { useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, RotateCcw, Upload, X, TrendingUp, Receipt, Star,
  Filter, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { menuItemAPI, orderAPI } from '@/lib/api';
import type { MenuItem, Order, DietaryTag } from '@/types';
import { Modal, Input, Select } from '@/components/admin/FormControls';

const DIETARY_OPTIONS: { value: DietaryTag; label: string }[] = [
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-Veg' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'jain', label: 'Jain' },
  { value: 'contains-nuts', label: 'Contains Nuts' },
];

const NEXT_STATUS: Record<string, { next: 'preparing' | 'served'; label: string } | undefined> = {
  pending: { next: 'preparing', label: 'Start Preparing' },
  preparing: { next: 'served', label: 'Mark Served' },
};

const statusColor = (s: string) =>
  s === 'served' ? 'border-green-500/30 text-green-400' :
  s === 'preparing' ? 'border-blue-500/30 text-blue-400' :
  'border-yellow-500/30 text-yellow-400';

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function RestaurantManager({ hotels, menuItems, orders, onReload }: {
  hotels: any[]; menuItems: MenuItem[]; orders: Order[]; onReload: () => void;
}) {
  const [mainTab, setMainTab] = useState<'menu' | 'orders'>('menu');

  // ══════════════ MENU ══════════════
  const [menuHotelFilter, setMenuHotelFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [archivedItems, setArchivedItems] = useState<MenuItem[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  const visibleItems = menuItems.filter((m: any) => !menuHotelFilter || m.hotelId === menuHotelFilter);

  const openCreateItem = () => {
    setEditingItemId(null);
    setItemForm({ hotelId: menuHotelFilter || hotels[0]?._id || '', name: '', category: '', price: '', image: '', dietaryTags: [], isAvailable: true });
    setItemModalOpen(true);
  };
  const openEditItem = (item: MenuItem) => {
    setEditingItemId(item._id);
    setItemForm({ ...item });
    setItemModalOpen(true);
  };
  const toggleTag = (tag: DietaryTag) => {
    const tags: DietaryTag[] = itemForm.dietaryTags || [];
    setItemForm({ ...itemForm, dietaryTags: tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag] });
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await menuItemAPI.uploadImage(file);
      setItemForm((f: any) => ({ ...f, image: res.url }));
      toast.success('Image uploaded');
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleSaveItem = async () => {
    if (!itemForm.hotelId || !itemForm.name || !itemForm.category || !itemForm.price) {
      toast.error('Hotel, name, category, and price are required');
      return;
    }
    try {
      const payload = { ...itemForm, price: Number(itemForm.price) };
      if (editingItemId) {
        await menuItemAPI.update(editingItemId, payload);
        toast.success('Menu item updated');
      } else {
        await menuItemAPI.create(payload);
        toast.success('Menu item created');
      }
      setItemModalOpen(false); setEditingItemId(null); setItemForm({});
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try { await menuItemAPI.update(item._id, { isAvailable: !item.isAvailable }); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  const archiveItem = async (item: MenuItem) => {
    if (!confirm(`Archive "${item.name}"? Past orders referencing it are unaffected.`)) return;
    try { await menuItemAPI.delete(item._id); toast.success('Menu item archived'); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  const loadArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    if (next) menuItemAPI.getDeleted(menuHotelFilter || undefined).then(d => setArchivedItems(d.menuItems || [])).catch(() => {});
  };
  const restoreItem = async (item: MenuItem) => {
    try {
      await menuItemAPI.restore(item._id);
      toast.success('Menu item restored');
      setArchivedItems(prev => prev.filter(m => m._id !== item._id));
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  // ══════════════ ORDERS ══════════════
  const [orderFilters, setOrderFilters] = useState({ tableNumber: '', status: '', date: '' });
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderHotelId, setOrderHotelId] = useState('');
  const [orderTable, setOrderTable] = useState('');
  const [orderLines, setOrderLines] = useState<{ menuItemId: string; name: string; price: number; quantity: number }[]>([]);
  const [pickItemId, setPickItemId] = useState('');
  const [pickQty, setPickQty] = useState(1);

  const distinctTables = useMemo(() => Array.from(new Set(orders.map((o: any) => o.tableNumber))).sort(), [orders]);

  const filteredOrders = useMemo(() => orders.filter((o: any) => {
    const matchesTable = !orderFilters.tableNumber || o.tableNumber === orderFilters.tableNumber;
    const matchesStatus = !orderFilters.status || o.status === orderFilters.status;
    const matchesDate = !orderFilters.date || isSameDay(new Date(o.createdAt), new Date(orderFilters.date));
    return matchesTable && matchesStatus && matchesDate;
  }), [orders, orderFilters]);

  // Daily sales report — computed client-side from today's orders
  const todaysOrders = useMemo(() => orders.filter((o: any) => isSameDay(new Date(o.createdAt), new Date())), [orders]);
  const todaysRevenue = todaysOrders.reduce((s, o) => s + o.totalAmount, 0);
  const topItem = useMemo(() => {
    const tally = new Map<string, number>();
    todaysOrders.forEach(o => o.items.forEach(it => tally.set(it.name, (tally.get(it.name) || 0) + it.quantity)));
    let best = ''; let bestQty = 0;
    tally.forEach((qty, name) => { if (qty > bestQty) { best = name; bestQty = qty; } });
    return best ? `${best} (${bestQty})` : '—';
  }, [todaysOrders]);

  const orderHotelItems = menuItems.filter((m: any) => m.hotelId === orderHotelId && m.isAvailable);

  const openNewOrder = () => {
    setOrderHotelId(orderFilters.tableNumber ? '' : (hotels[0]?._id || ''));
    setOrderTable('');
    setOrderLines([]);
    setPickItemId(''); setPickQty(1);
    setOrderModalOpen(true);
  };
  const addOrderLine = () => {
    const item = menuItems.find((m: any) => m._id === pickItemId);
    if (!item) { toast.error('Select an item'); return; }
    setOrderLines([...orderLines, { menuItemId: item._id, name: item.name, price: item.price, quantity: Number(pickQty || 1) }]);
    setPickItemId(''); setPickQty(1);
  };
  const removeOrderLine = (idx: number) => setOrderLines(orderLines.filter((_, i) => i !== idx));
  const orderTotal = orderLines.reduce((s, l) => s + l.price * l.quantity, 0);

  const submitOrder = async () => {
    if (!orderHotelId || !orderTable.trim() || orderLines.length === 0) {
      toast.error('Select hotel, table number, and at least one item');
      return;
    }
    try {
      await orderAPI.create({
        hotelId: orderHotelId,
        tableNumber: orderTable.trim(),
        items: orderLines.map(l => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
      });
      toast.success('Order placed');
      setOrderModalOpen(false);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const advanceOrder = async (order: Order) => {
    const step = NEXT_STATUS[order.status];
    if (!step) return;
    try { await orderAPI.update(order._id, { status: step.next }); toast.success(`Order ${step.next}`); onReload(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Restaurant Management</h2>
          <p className="text-gray-400 text-sm">Manage the menu and track the live order queue.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[['menu', 'Menu'], ['orders', 'Orders']].map(([id, label]) => (
          <button key={id} onClick={() => setMainTab(id as any)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
              mainTab === id ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ MENU TAB ══════════════ */}
      {mainTab === 'menu' && (
        <>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <select value={menuHotelFilter} onChange={e => { setMenuHotelFilter(e.target.value); if (showArchived) menuItemAPI.getDeleted(e.target.value || undefined).then(d => setArchivedItems(d.menuItems || [])); }}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
              <option value="">All hotels</option>
              {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            <button onClick={loadArchived}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border ${showArchived ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-gray-700 text-gray-400'}`}>
              {showArchived ? 'Hide' : 'Show'} Archived
            </button>
            <button onClick={openCreateItem} className="ml-auto flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
              <Plus className="w-4 h-4" /> Add Menu Item
            </button>
          </div>

          {showArchived && (
            <div className="mb-6 bg-gray-900 border border-red-500/20 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-red-400 mb-3">Archived Items ({archivedItems.length})</h3>
              {archivedItems.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing archived.</p>
              ) : (
                <div className="space-y-2">
                  {archivedItems.map(item => (
                    <div key={item._id} className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-white text-sm font-semibold">{item.name} <span className="text-gray-500">({item.category})</span></p>
                        <p className="text-xs text-gray-500">₹{item.price.toLocaleString()} · {item.hotelName}</p>
                      </div>
                      <button onClick={() => restoreItem(item)} className="flex items-center gap-1 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg"><RotateCcw className="w-3 h-3" /> Restore</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleItems.map((item: any) => (
              <div key={item._id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="h-32 bg-gray-800">
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-amber-400 font-bold whitespace-nowrap">₹{item.price.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{item.category} · {item.hotelName}</p>
                  {item.dietaryTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.dietaryTags.map((t: string) => (
                        <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleAvailability(item)}
                      className={`flex-1 text-xs px-2 py-1.5 rounded-lg border ${item.isAvailable ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-gray-700 text-gray-500'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                    <button onClick={() => openEditItem(item)} className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => archiveItem(item)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
            {visibleItems.length === 0 && (
              <p className="col-span-full text-center py-10 text-gray-500">No menu items yet.</p>
            )}
          </div>
        </>
      )}

      {/* ══════════════ ORDERS TAB ══════════════ */}
      {mainTab === 'orders' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { label: "Today's Revenue", value: `₹${todaysRevenue.toLocaleString()}`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
              { label: 'Orders Today', value: todaysOrders.length, icon: Receipt, color: 'from-blue-500 to-blue-600' },
              { label: 'Top-Selling Item', value: topItem, icon: Star, color: 'from-purple-500 to-purple-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-white truncate">{value}</p>
                <p className="text-sm text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-semibold text-white mr-1"><Filter className="w-4 h-4 text-amber-400" /> Filters</div>
              <select value={orderFilters.tableNumber} onChange={e => setOrderFilters({ ...orderFilters, tableNumber: e.target.value })}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
                <option value="">All tables</option>
                {distinctTables.map(t => <option key={t} value={t}>Table {t}</option>)}
              </select>
              <select value={orderFilters.status} onChange={e => setOrderFilters({ ...orderFilters, status: e.target.value })}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none">
                <option value="">All statuses</option>
                {['pending', 'preparing', 'served'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="date" value={orderFilters.date} onChange={e => setOrderFilters({ ...orderFilters, date: e.target.value })}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
            </div>
            <button onClick={openNewOrder} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                {['Ref', 'Table', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredOrders.map((o: any) => {
                  const step = NEXT_STATUS[o.status];
                  return (
                    <tr key={o._id} className="border-b border-gray-800/50">
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">{o.orderRef}</td>
                      <td className="py-3 px-4 text-white">Table {o.tableNumber}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs max-w-[220px]">
                        {o.items.map((it: any) => `${it.name} ×${it.quantity}`).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-amber-400 font-bold">₹{o.totalAmount.toLocaleString()}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full bg-transparent border capitalize ${statusColor(o.status)}`}>{o.status}</span></td>
                      <td className="py-3 px-4">
                        {step ? (
                          <button onClick={() => advanceOrder(o)} className="flex items-center gap-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-semibold">
                            {step.label} <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : <span className="text-xs text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-500">No orders match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MENU ITEM MODAL */}
      {itemModalOpen && (
        <Modal
          title={editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}
          onClose={() => { setItemModalOpen(false); setEditingItemId(null); setItemForm({}); }}
          onSave={handleSaveItem}
        >
          <Select
            label="Hotel *"
            value={itemForm.hotelId || ''}
            onChange={(v: string) => setItemForm({ ...itemForm, hotelId: v })}
            options={[{ label: '-- Select hotel --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Name *" value={itemForm.name || ''} onChange={(v: string) => setItemForm({ ...itemForm, name: v })} />
            <Input label="Category *" value={itemForm.category || ''} onChange={(v: string) => setItemForm({ ...itemForm, category: v })} />
          </div>
          <Input label="Price *" value={itemForm.price || ''} onChange={(v: string) => setItemForm({ ...itemForm, price: v })} type="number" />

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

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Dietary Tags</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => {
                const active = (itemForm.dietaryTags || []).includes(opt.value);
                return (
                  <button key={opt.value} type="button" onClick={() => toggleTag(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${active ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={itemForm.isAvailable !== false} onChange={e => setItemForm({ ...itemForm, isAvailable: e.target.checked })} />
            Available for order
          </label>
        </Modal>
      )}

      {/* NEW ORDER MODAL */}
      {orderModalOpen && (
        <Modal title="New Order" onClose={() => setOrderModalOpen(false)} onSave={submitOrder}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Hotel *"
              value={orderHotelId}
              onChange={(v: string) => { setOrderHotelId(v); setOrderLines([]); }}
              options={[{ label: '-- Select hotel --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
            />
            <Input label="Table Number *" value={orderTable} onChange={setOrderTable} />
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-3">Items</p>
            {orderLines.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {orderLines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/70 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-gray-200">{l.name} × {l.quantity}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-semibold">₹{(l.price * l.quantity).toLocaleString()}</span>
                      <button onClick={() => removeOrderLine(i)}><X className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <select value={pickItemId} onChange={e => setPickItemId(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none"
                disabled={!orderHotelId}>
                <option value="">-- Select item --</option>
                {orderHotelItems.map((m: any) => <option key={m._id} value={m._id}>{m.name} - ₹{m.price.toLocaleString()}</option>)}
              </select>
              <input type="number" min={1} value={pickQty} onChange={e => setPickQty(Number(e.target.value))}
                className="w-20 bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-xl text-sm focus:outline-none" />
              <button onClick={addOrderLine} className="bg-amber-500 hover:bg-amber-600 text-white px-4 rounded-xl text-sm font-bold">Add</button>
            </div>
          </div>

          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">Total</p>
            <p className="text-xl font-bold text-amber-400">₹{orderTotal.toLocaleString()}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
