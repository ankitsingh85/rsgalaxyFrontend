'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Building2, Calendar, CheckCircle, CreditCard, Star, Users, MapPin, Ticket, AlertTriangle } from 'lucide-react';
import { bookingAPI, roomAPI, hotelAPI, reviewAPI, serviceAPI, couponAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { estimateStayTotal } from '@/lib/roomPricing';
import RoomLocationMap from '@/components/room/RoomLocationMap';
import type { Room, Hotel, Review, Service } from '@/types';

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: string; checkOut: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '');
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    if (!params.id) return;
    roomAPI.getOne(params.id).then(data => setRoom(data.room)).finally(() => setLoading(false));
    roomAPI.getBookedRanges(params.id).then(data => setBookedRanges(data.bookedRanges || [])).catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (!room) return;
    hotelAPI.getOne(room.hotelId).then(data => setHotel(data.hotel)).catch(() => {});
    reviewAPI.getForHotel(room.hotelId).then(data => { setReviews(data.reviews || []); setAvgRating(data.avgRating || 0); }).catch(() => {});
    serviceAPI.getPublic(room.hotelId).then(data => setServices(data.services || [])).catch(() => {});
  }, [room]);

  const stayEstimate = estimateStayTotal(room, checkIn, checkOut);
  const { nights, subtotal, tax } = stayEstimate;
  const servicesTotal = services.filter(s => selectedServices.includes(s._id)).reduce((sum, s) => sum + s.price, 0);
  const preDiscountTotal = subtotal + tax + servicesTotal;
  const total = Math.max(0, preDiscountTotal - (appliedCoupon?.discountAmount || 0));

  const isOverlapping = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    const inDate = new Date(checkIn).getTime();
    const outDate = new Date(checkOut).getTime();
    return bookedRanges.some(r => new Date(r.checkIn).getTime() < outDate && new Date(r.checkOut).getTime() > inDate);
  }, [checkIn, checkOut, bookedRanges]);

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponChecking(true);
    try {
      const data = await couponAPI.validate(couponCode.trim(), subtotal + tax + servicesTotal);
      setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discountAmount: data.discountAmount });
      toast.success(`Coupon applied — ₹${data.discountAmount.toLocaleString()} off`);
    } catch (err: any) {
      setAppliedCoupon(null);
      toast.error(err.message);
    } finally {
      setCouponChecking(false);
    }
  };
  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); };

  const handleBook = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!checkIn || !checkOut || nights <= 0) { toast.error('Select valid dates'); return; }
    if (isOverlapping) { toast.error('This room is not available for the selected dates'); return; }

    setBooking(true);
    try {
      const data = await bookingAPI.create({
        roomId: room!._id,
        checkIn,
        checkOut,
        guests,
        specialRequests,
        extraServices: selectedServices.map(id => ({ serviceId: id, quantity: 1 })),
        couponCode: appliedCoupon?.code,
      });
      setSuccess(data.booking);
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }
  if (!room) {
    return <div className="min-h-screen flex items-center justify-center">Room not found</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#faf9f6]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-stone-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-amber-600 font-bold font-mono mb-4">{success.bookingRef}</p>
          <p className="text-gray-500 text-sm mb-6">Confirmation sent to {user?.email}</p>
          <button type="button" onClick={() => router.push('/dashboard')} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold">
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  const gallery = room.images.length ? room.images : ['https://images.pexels.com/photos/3688261/pexels-photo-3688261.jpeg?w=1200'];

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="relative h-72">
        <img src={gallery[activeImage]} alt={`Room ${room.roomNumber}`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 text-white">
          <span className="text-xs bg-amber-500 px-2.5 py-1 rounded-full font-bold uppercase">{room.type}</span>
          <h1 className="font-playfair text-4xl font-bold mt-2">Room {room.roomNumber}</h1>
          <p className="text-amber-300">{room.hotelName}</p>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {gallery.map((img, i) => (
              <button key={img + i} onClick={() => setActiveImage(i)}
                className={`w-20 h-16 rounded-lg overflow-hidden shrink-0 border-2 ${activeImage === i ? 'border-amber-500' : 'border-white'}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <Users className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Capacity</p>
                <p className="font-bold">{room.capacity} guests</p>
              </div>
              <div>
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Size</p>
                <p className="font-bold">{room.size} sqm</p>
              </div>
              <div>
                <Building2 className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Floor</p>
                <p className="font-bold">{room.floor}</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">{room.description}</p>
            <h3 className="font-bold text-gray-900 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {room.amenities.map(amenity => (
                <div key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /> Location</h3>
            <RoomLocationMap latitude={hotel?.latitude} longitude={hotel?.longitude} name={room.hotelName} />
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Guest Reviews</h3>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1 text-sm font-bold text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} ({reviews.length})
                </span>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400">No reviews yet for this property.</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 8).map(r => (
                  <div key={r._id} className="border-b border-stone-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{r.userName}</p>
                      <div className="flex">{[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />)}</div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside>
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 sticky top-24">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">From</p>
            <p className="font-playfair text-3xl font-bold text-gray-900 mb-5">
              Rs. {room.price.toLocaleString()}<span className="text-sm text-gray-400 font-normal">/night</span>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={checkIn} onChange={e => setCheckIn(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type="date" min={checkIn} value={checkOut} onChange={e => setCheckOut(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              {isOverlapping && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Not available for these dates.
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Guests</label>
                <select value={guests} onChange={e => setGuests(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400">
                  {Array.from({ length: room.capacity }, (_, index) => index + 1).map(count => (
                    <option key={count} value={count}>{count} {count === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Special Requests</label>
                <textarea rows={2} value={specialRequests} onChange={e => setSpecialRequests(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none" />
              </div>

              {services.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">Add-ons</label>
                  <div className="space-y-1.5">
                    {services.map(s => (
                      <label key={s._id} className="flex items-center justify-between text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 cursor-pointer">
                        <span className="flex items-center gap-2 text-gray-700">
                          <input type="checkbox" checked={selectedServices.includes(s._id)} onChange={() => toggleService(s._id)} />
                          {s.name}
                        </span>
                        <span className="text-amber-600 font-semibold">₹{s.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Coupon Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-sm">
                    <span className="flex items-center gap-1.5 text-green-700 font-semibold"><Ticket className="w-4 h-4" /> {appliedCoupon.code}</span>
                    <button onClick={removeCoupon} className="text-xs text-red-500 font-semibold">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Enter code"
                      className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                    <button onClick={applyCoupon} disabled={couponChecking}
                      className="bg-gray-900 hover:bg-black text-white px-4 rounded-xl text-sm font-semibold disabled:opacity-50">
                      {couponChecking ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {nights > 0 && (
              <div className="bg-stone-50 rounded-xl p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rs. {room.price.toLocaleString()} x {nights} nights</span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxes (12%)</span>
                  <span className="font-semibold">Rs. {tax.toLocaleString()}</span>
                </div>
                {servicesTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Add-ons</span>
                    <span className="font-semibold">Rs. {servicesTotal.toLocaleString()}</span>
                  </div>
                )}
                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="font-semibold">-Rs. {appliedCoupon.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-stone-200 font-bold">
                  <span>Total</span>
                  <span className="text-amber-600 text-lg">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button type="button" onClick={handleBook} disabled={booking || room.status !== 'available' || isOverlapping}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md">
              {booking ? 'Processing...' : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {isAuthenticated ? 'Confirm & Pay' : 'Login to Book'}
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
