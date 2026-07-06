'use client';

import { useMemo, useState } from 'react';
import {
  Bell, BellRing, CheckCheck, Clock3, Mail, Plus, Search, Send, Smartphone, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationAPI } from '@/lib/api';
import type { AdminNotification, Hotel, User } from '@/types';
import { Input, Modal, Select, TextArea } from './FormControls';

const emptyForm = {
  title: '',
  message: '',
  targetType: 'all',
  targetUserIds: [] as string[],
  targetHotelIds: [] as string[],
  channels: ['push'] as Array<'push' | 'email'>,
  priority: 'normal',
  expiresAt: '',
};

const priorityColors: Record<string, string> = {
  low: 'border-gray-600 text-gray-400',
  normal: 'border-blue-500/30 text-blue-400',
  high: 'border-yellow-500/30 text-yellow-400',
  urgent: 'border-red-500/30 text-red-400',
};

export default function NotificationsManager({
  notifications,
  users,
  hotels,
  onReload,
}: {
  notifications: AdminNotification[];
  users: User[];
  hotels: Hotel[];
  onReload: () => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [targetType, setTargetType] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const customersAndManagers = useMemo(
    () => users.filter(user => user.role === 'user' || user.role === 'manager'),
    [users]
  );

  const filtered = useMemo(() => notifications.filter(notification => (
    (!search ||
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())) &&
    (!status ||
      (status === 'read' && notification.isRead) ||
      (status === 'unread' && !notification.isRead) ||
      (status === 'snoozed' && notification.isSnoozed)) &&
    (!priority || notification.priority === priority) &&
    (!targetType || notification.targetType === targetType)
  )), [notifications, priority, search, status, targetType]);

  const selectedFilteredIds = filtered.map(item => item._id);
  const allVisibleSelected = selectedFilteredIds.length > 0 && selectedFilteredIds.every(id => selectedIds.includes(id));

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAllVisible = () => {
    setSelectedIds(prev => {
      if (allVisibleSelected) return prev.filter(id => !selectedFilteredIds.includes(id));
      return Array.from(new Set([...prev, ...selectedFilteredIds]));
    });
  };

  const toggleChannel = (channel: 'push' | 'email') => {
    setForm(prev => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter(item => item !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels: channels.length ? channels : ['push'] };
    });
  };

  const toggleTargetId = (key: 'targetUserIds' | 'targetHotelIds', id: string) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter(item => item !== id) : [...prev[key], id],
    }));
  };

  const createNotification = async () => {
    if (!form.title || !form.message) {
      toast.error('Title and message are required');
      return;
    }
    if (form.targetType === 'users' && form.targetUserIds.length === 0) {
      toast.error('Choose at least one user');
      return;
    }
    if (form.targetType === 'hotels' && form.targetHotelIds.length === 0) {
      toast.error('Choose at least one hotel');
      return;
    }

    try {
      await notificationAPI.create({
        ...form,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Notification broadcast created');
      setModalOpen(false);
      setForm(emptyForm);
      onReload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const bulkMarkRead = async () => {
    if (selectedIds.length === 0) return toast.error('Select notifications first');
    try {
      await notificationAPI.markRead(selectedIds);
      toast.success('Marked as read');
      setSelectedIds([]);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const bulkSnooze = async () => {
    if (selectedIds.length === 0) return toast.error('Select notifications first');
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    try {
      await notificationAPI.snooze(selectedIds, until);
      toast.success('Snoozed for 24 hours');
      setSelectedIds([]);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteNotification = async (notification: AdminNotification) => {
    if (!confirm(`Delete "${notification.title}"?`)) return;
    try {
      await notificationAPI.delete(notification._id);
      toast.success('Notification deleted');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const cleanupOld = async () => {
    if (!confirm('Delete notifications older than 90 days?')) return;
    try {
      const res = await notificationAPI.cleanup(90);
      toast.success(`${res.deletedCount || 0} old notifications removed`);
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Notifications ({filtered.length})</h2>
          <p className="text-gray-400 text-sm">Broadcast alerts, track inbox read states, snooze, and cleanup old messages</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cleanupOld} className="flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-4 py-2.5 rounded-xl text-sm font-semibold">
            <Trash2 className="w-4 h-4" /> Cleanup
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
            <Plus className="w-4 h-4" /> Create Notification
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notifications..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
          <option value="">All Inbox</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="snoozed">Snoozed</option>
        </select>
        <select value={priority} onChange={event => setPriority(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={targetType} onChange={event => setTargetType(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
          <option value="">All Targets</option>
          <option value="all">All</option>
          <option value="users">Users</option>
          <option value="hotels">Hotels</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="accent-amber-500" />
          Select visible
        </label>
        <div className="flex items-center gap-2">
          <button onClick={bulkMarkRead} className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-xs font-semibold">
            <CheckCheck className="w-4 h-4" /> Mark Read
          </button>
          <button onClick={bulkSnooze} className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-xs font-semibold">
            <Clock3 className="w-4 h-4" /> Snooze 24h
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(notification => (
          <article key={notification._id} className={`bg-gray-900 border rounded-xl p-4 ${notification.isRead ? 'border-gray-800' : 'border-amber-500/30'}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selectedIds.includes(notification._id)} onChange={() => toggleSelected(notification._id)} className="mt-1 accent-amber-500" />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.isRead ? 'bg-gray-800 text-gray-400' : 'bg-amber-500/15 text-amber-400'}`}>
                {notification.isRead ? <Bell className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="font-bold text-white">{notification.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${priorityColors[notification.priority] || priorityColors.normal}`}>{notification.priority}</span>
                    <span className="text-xs px-2 py-1 rounded-full border border-gray-700 text-gray-400 capitalize">{notification.targetType}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2 whitespace-pre-line">{notification.message}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 flex-wrap">
                  <span>{new Date(notification.createdAt).toLocaleString()}</span>
                  <span>{notification.recipients?.length || 0} recipients</span>
                  {notification.channels.includes('push') && <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> {notification.pushQueuedCount} push</span>}
                  {notification.channels.includes('email') && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {notification.emailSentCount} email</span>}
                  {notification.isSnoozed && <span className="text-blue-400">Snoozed until {new Date(notification.snoozedUntil || '').toLocaleString()}</span>}
                </div>
              </div>
              <button onClick={() => deleteNotification(notification)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg" title="Delete notification">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 text-center text-gray-500">No notifications match your filters.</div>
        )}
      </div>

      {modalOpen && (
        <Modal title="Create Notification" onClose={() => { setModalOpen(false); setForm(emptyForm); }} onSave={createNotification}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Title *" value={form.title} onChange={(value: string) => setForm({ ...form, title: value })} />
            <Select label="Priority" value={form.priority} onChange={(value: string) => setForm({ ...form, priority: value })} options={['low', 'normal', 'high', 'urgent']} />
          </div>
          <TextArea label="Message *" value={form.message} onChange={(value: string) => setForm({ ...form, message: value })} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Broadcast Target" value={form.targetType} onChange={(value: string) => setForm({ ...form, targetType: value, targetUserIds: [], targetHotelIds: [] })} options={[
              { label: 'All users and managers', value: 'all' },
              { label: 'Specific users', value: 'users' },
              { label: 'Specific hotels', value: 'hotels' },
            ]} />
            <Input label="Auto-cleanup Date" type="date" value={form.expiresAt} onChange={(value: string) => setForm({ ...form, expiresAt: value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Delivery Channels</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'push', label: 'Push', icon: Smartphone },
                { id: 'email', label: 'Email', icon: Mail },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => toggleChannel(id as 'push' | 'email')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border ${form.channels.includes(id as any) ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {form.targetType === 'users' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Specific Users</label>
              <div className="max-h-48 overflow-y-auto border border-gray-800 rounded-xl divide-y divide-gray-800">
                {customersAndManagers.map(item => (
                  <label key={item._id || item.id} className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-gray-800/60">
                    <input type="checkbox" checked={form.targetUserIds.includes((item._id || item.id) as string)} onChange={() => toggleTargetId('targetUserIds', (item._id || item.id) as string)} className="accent-amber-500" />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-gray-500">{item.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.targetType === 'hotels' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Specific Hotels</label>
              <div className="max-h-48 overflow-y-auto border border-gray-800 rounded-xl divide-y divide-gray-800">
                {hotels.map(hotel => (
                  <label key={hotel._id} className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-gray-800/60">
                    <input type="checkbox" checked={form.targetHotelIds.includes(hotel._id)} onChange={() => toggleTargetId('targetHotelIds', hotel._id)} className="accent-amber-500" />
                    <span className="flex-1">{hotel.name}</span>
                    <span className="text-gray-500">{hotel.city}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={createNotification} className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold">
            <Send className="w-4 h-4" /> Broadcast Notification
          </button>
        </Modal>
      )}
    </div>
  );
}
