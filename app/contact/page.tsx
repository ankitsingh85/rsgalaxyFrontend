'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { contactAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactAPI.submit(form);
      setSent(true);
      toast.success('Message sent!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Get In Touch</p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-gray-500 mt-2">We'd love to hear from you. Our team responds within 24 hours.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[
            { icon: MapPin, title: 'Address', text: 'RS Galaxy Avenue\nLuxury District, India' },
            { icon: Phone,  title: 'Phone', text: '+91-800-RS-GALAXY' },
            { icon: Mail,   title: 'Email', text: 'hello@rsgalaxy.com\nreservations@rsgalaxy.com' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white border border-stone-200 rounded-xl p-5 flex gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-gray-500 text-sm whitespace-pre-line">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-2xl p-8">
          {sent ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-gray-500 mb-6">We'll respond within 24 hours.</p>
              <button onClick={() => { setSent(false); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); }} className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required placeholder="Full Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                <input required type="email" placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                <select required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                  className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400">
                  <option value="">Subject *</option>
                  <option>Booking Inquiry</option>
                  <option>Cancellation</option>
                  <option>General Information</option>
                  <option>Special Request</option>
                  <option>Other</option>
                </select>
              </div>
              <textarea required rows={5} placeholder="Your message *" value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none" />
              <button type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md">
                {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
