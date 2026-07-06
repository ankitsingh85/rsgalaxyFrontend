'use client';

import { useMemo, useState } from 'react';
import {
  Archive, CalendarDays, Edit2, FileText, ImagePlus, Plus, Search, Trash2, Upload, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { blogAPI } from '@/lib/api';
import type { Blog } from '@/types';
import { Input, Modal, Select, TextArea } from './FormControls';
import RichTextEditor from './RichTextEditor';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '<p></p>',
  coverImage: '',
  category: 'Travel',
  tags: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
};

const statusColors: Record<string, string> = {
  published: 'border-green-500/30 text-green-400',
  draft: 'border-yellow-500/30 text-yellow-400',
  archived: 'border-red-500/30 text-red-400',
};

export default function BlogsManager({ blogs, onReload }: { blogs: Blog[]; onReload: () => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const categories = useMemo(() => Array.from(new Set(blogs.map(blog => blog.category).filter(Boolean))).sort(), [blogs]);

  const filtered = useMemo(() => blogs.filter(blog => {
    const createdAt = blog.createdAt ? new Date(blog.createdAt) : null;
    return (
      (!search ||
        blog.title.toLowerCase().includes(search.toLowerCase()) ||
        blog.category.toLowerCase().includes(search.toLowerCase()) ||
        blog.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))) &&
      (!status || blog.status === status) &&
      (!category || blog.category === category) &&
      (!dateFrom || (createdAt && createdAt >= new Date(dateFrom))) &&
      (!dateTo || (createdAt && createdAt <= new Date(`${dateTo}T23:59:59`)))
    );
  }), [blogs, category, dateFrom, dateTo, search, status]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (blog: Blog) => {
    setEditingId(blog._id);
    setForm({
      title: blog.title || '',
      slug: blog.slug || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '<p></p>',
      coverImage: blog.coverImage || '',
      category: blog.category || 'Travel',
      tags: (blog.tags || []).join(', '),
      status: blog.status || 'draft',
      seoTitle: blog.seoTitle || '',
      seoDescription: blog.seoDescription || '',
      seoKeywords: (blog.seoKeywords || []).join(', '),
    });
    setModalOpen(true);
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await blogAPI.uploadCover(file);
      setForm((prev: any) => ({ ...prev, coverImage: res.url }));
      toast.success('Cover uploaded');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const saveBlog = async (nextStatus?: 'draft' | 'published') => {
    if (!form.title || !form.content || !form.category) {
      toast.error('Title, content, and category are required');
      return;
    }

    const payload = {
      ...form,
      status: nextStatus || form.status,
      tags: String(form.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
      seoKeywords: String(form.seoKeywords || '').split(',').map(tag => tag.trim()).filter(Boolean),
    };

    try {
      if (editingId) {
        await blogAPI.update(editingId, payload);
        toast.success(payload.status === 'published' ? 'Blog published' : 'Blog updated');
      } else {
        await blogAPI.create(payload);
        toast.success(payload.status === 'published' ? 'Blog published' : 'Draft created');
      }
      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      onReload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const archiveBlog = async (blog: Blog) => {
    if (!confirm(`Archive "${blog.title}"? It will be hidden from the website.`)) return;
    try {
      await blogAPI.archive(blog._id);
      toast.success('Blog archived');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const hardDeleteBlog = async (blog: Blog) => {
    if (!confirm(`Permanently delete "${blog.title}"? This cannot be undone.`)) return;
    try {
      await blogAPI.hardDelete(blog._id);
      toast.success('Blog permanently deleted');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  const publishBlog = async (blog: Blog) => {
    try {
      await blogAPI.update(blog._id, { ...blog, status: 'published' });
      toast.success('Blog published');
      onReload();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Blogs ({filtered.length})</h2>
          <p className="text-gray-400 text-sm">Create posts, manage drafts, SEO, categories, and tags</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus className="w-4 h-4" /> Create Post
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 mb-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search title, category, tags..."
            className="w-full bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select value={category} onChange={event => setCategory(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none">
          <option value="">All Categories</option>
          {categories.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none" />
          <input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {filtered.map(blog => (
          <article key={blog._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="h-44 bg-gray-800">
              {blog.coverImage ? (
                <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600"><FileText className="w-10 h-10" /></div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-amber-400">{blog.category}</span>
                <span className={`text-xs px-2 py-1 rounded-full border capitalize ${statusColors[blog.status] || 'border-gray-600 text-gray-400'}`}>{blog.status}</span>
              </div>
              <h3 className="font-bold text-white line-clamp-2">{blog.title}</h3>
              <p className="text-sm text-gray-400 mt-2 line-clamp-2">{blog.excerpt || 'No excerpt added.'}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(blog.tags || []).slice(0, 4).map(tag => (
                  <span key={tag} className="text-[11px] bg-gray-800 text-gray-400 px-2 py-1 rounded-lg">{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-4">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => openEdit(blog)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg" title="Edit post">
                  <Edit2 className="w-4 h-4" />
                </button>
                {blog.status !== 'published' && (
                  <button onClick={() => publishBlog(blog)} className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-xs font-semibold">
                    Publish
                  </button>
                )}
                {blog.status !== 'archived' && (
                  <button onClick={() => archiveBlog(blog)} className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg" title="Archive post">
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => hardDeleteBlog(blog)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg" title="Permanent delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-xl py-16 text-center text-gray-500">No blog posts match your filters.</div>
        )}
      </div>

      {modalOpen && (
        <Modal title={editingId ? 'Edit Blog Post' : 'Create Blog Post'} onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }} onSave={() => saveBlog()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Title *" value={form.title} onChange={(value: string) => setForm({ ...form, title: value })} />
            <Input label="Slug" value={form.slug} onChange={(value: string) => setForm({ ...form, slug: value })} />
            <Input label="Category *" value={form.category} onChange={(value: string) => setForm({ ...form, category: value })} />
            <Select label="Status" value={form.status} onChange={(value: string) => setForm({ ...form, status: value })} options={['draft', 'published', 'archived']} />
          </div>
          <TextArea label="Excerpt" value={form.excerpt} onChange={(value: string) => setForm({ ...form, excerpt: value })} />
          <Input label="Tags (comma-separated)" value={form.tags} onChange={(value: string) => setForm({ ...form, tags: value })} />

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Cover Image</label>
            <div className="flex items-center gap-3">
              {form.coverImage ? (
                <div className="relative w-32 h-20 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                  <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                  <button onClick={() => setForm({ ...form, coverImage: '' })} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 rounded-xl border border-dashed border-gray-700 flex items-center justify-center text-gray-600 flex-shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
              )}
              <label className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-4 py-2.5 rounded-xl text-sm cursor-pointer">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Cover'}
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <RichTextEditor value={form.content} onChange={(value: string) => setForm({ ...form, content: value })} />

          <div className="border-t border-gray-800 pt-4 mt-2">
            <h3 className="text-sm font-bold text-white mb-3">SEO Meta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="SEO Title" value={form.seoTitle} onChange={(value: string) => setForm({ ...form, seoTitle: value })} />
              <Input label="SEO Keywords" value={form.seoKeywords} onChange={(value: string) => setForm({ ...form, seoKeywords: value })} />
            </div>
            <TextArea label="SEO Description" value={form.seoDescription} onChange={(value: string) => setForm({ ...form, seoDescription: value })} />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => saveBlog('draft')} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-semibold">Save Draft</button>
            <button onClick={() => saveBlog('published')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold">Publish</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
