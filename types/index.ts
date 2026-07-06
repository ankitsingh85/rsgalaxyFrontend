export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  phone?: string;
  managedHotelId?: string;
  isActive?: boolean;
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface Hotel {
  _id: string;
  name: string;
  slug?: string;
  location: string;
  city: string;
  country: string;
  contact?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  rating: number;
  image?: string;
  images: string[];
  amenities: string[];
  totalRooms: number;
  priceRange: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive' | 'suspended';
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  action: 'create' | 'update' | 'soft-delete' | 'restore' | 'hard-delete' | 'bulk-status-update';
  entityType: string;
  entityId: string;
  entityName?: string;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  meta?: any;
  createdAt: string;
}

export interface Room {
  _id: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  type: 'standard' | 'deluxe' | 'suite' | 'presidential';
  price: number;
  capacity: number;
  description: string;
  amenities: string[];
  images: string[];
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
  size: number;
}

export interface Booking {
  _id: string;
  bookingRef: string;
  userId: string;
  userName: string;
  userEmail: string;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  specialRequests?: string;
  createdAt: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  publishedAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRecipient {
  recipientType: 'user' | 'hotel';
  recipientId: string;
  name?: string;
  email?: string;
  readAt?: string;
  snoozedUntil?: string;
}

export interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  targetType: 'all' | 'users' | 'hotels';
  channels: Array<'push' | 'email'>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipients: NotificationRecipient[];
  emailSentCount: number;
  pushQueuedCount: number;
  readByAdminIds: string[];
  isRead?: boolean;
  isSnoozed?: boolean;
  snoozedUntil?: string;
  createdByName?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotification {
  _id: string;
  title: string;
  message: string;
  channels: Array<'push' | 'email'>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
