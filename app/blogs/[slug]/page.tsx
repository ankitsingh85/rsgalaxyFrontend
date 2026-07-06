'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Tag } from 'lucide-react';
import { blogAPI } from '@/lib/api';
import type { Blog } from '@/types';

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogAPI.getPublishedOne(params.slug)
      .then(res => setBlog(res.blog))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <main className="min-h-screen pt-32 text-center text-gray-500">Loading blog...</main>;
  }

  if (!blog) {
    return (
      <main className="min-h-screen pt-32 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Blog not found</h1>
        <Link href="/blogs" className="inline-flex items-center gap-2 text-amber-700 font-semibold mt-4">
          <ArrowLeft className="w-4 h-4" /> Back to Blogs
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-28">
      <article>
        <header className="bg-gray-950 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/blogs" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 mb-8">
              <ArrowLeft className="w-4 h-4" /> Blogs
            </Link>
            <p className="text-sm font-bold text-amber-400 uppercase tracking-[0.2em]">{blog.category}</p>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold mt-3 leading-tight">{blog.title}</h1>
            {blog.excerpt && <p className="text-gray-300 text-lg mt-5">{blog.excerpt}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-6">
              <span className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
              </span>
              {blog.authorName && <span>{blog.authorName}</span>}
            </div>
          </div>
        </header>

        {blog.coverImage && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
            <img src={blog.coverImage} alt={blog.title} className="w-full aspect-[16/8] object-cover rounded-xl shadow-2xl" />
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div
            className="blog-content text-gray-800 text-lg leading-8"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
          {(blog.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-gray-200">
              {blog.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-sm px-3 py-1.5 rounded-lg">
                  <Tag className="w-3.5 h-3.5" /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </main>
  );
}
