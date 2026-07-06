'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Search, Tag } from 'lucide-react';
import { blogAPI } from '@/lib/api';
import type { Blog } from '@/types';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    blogAPI.getPublished()
      .then(res => setBlogs(res.blogs || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => Array.from(new Set(blogs.map(blog => blog.category))).sort(), [blogs]);
  const filtered = useMemo(() => blogs.filter(blog =>
    (!search ||
      blog.title.toLowerCase().includes(search.toLowerCase()) ||
      blog.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      blog.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))) &&
    (!category || blog.category === category)
  ), [blogs, category, search]);

  return (
    <main className="min-h-screen bg-white pt-28">
      <section className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-amber-400 text-sm font-bold uppercase tracking-[0.2em]">RS Galaxy Journal</p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold mt-3">Blogs</h1>
          <p className="text-gray-300 mt-4 max-w-2xl">Travel guides, hotel stories, destination ideas, and hospitality updates from RS Galaxy.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search articles..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
          </div>
          <select value={category} onChange={event => setCategory(event.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500">
            <option value="">All Categories</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500">Loading blogs...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-500">No published blogs found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(blog => (
              <Link key={blog._id} href={`/blogs/${blog.slug}`} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                  {blog.coverImage ? (
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-amber-50" />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-bold text-amber-700 uppercase">{blog.category}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2">{blog.title}</h2>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">{blog.excerpt}</p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {(blog.tags || []).slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
