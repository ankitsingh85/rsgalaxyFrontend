export interface ModulePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export interface ManagerPermissions {
  bookings: ModulePermission;
  rooms: ModulePermission;
  restaurant: ModulePermission;
  amenities: ModulePermission;
  staff: ModulePermission;
  customers: ModulePermission;
  coupons: ModulePermission;
  notifications: ModulePermission;
  blogs: ModulePermission;
}

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  phone?: string;
  managedHotelId?: string;
  isActive?: boolean;
  permissions?: ManagerPermissions;
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  loyaltyPoints?: number;
  loyaltyTier?: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  isVIP?: boolean;
  preferences?: string;
  notes?: string;
  idDocument?: string;
  isAnonymized?: boolean;
  anonymizedAt?: string;
  avatar?: string;
  dateOfBirth?: string;
  notificationPrefs?: { email: boolean; push: boolean };
  createdAt: string;
}

export interface SavedCard {
  _id: string;
  userId: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
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
  weekendRate?: number;
  customRates?: { startDate: string; endDate: string; price: number }[];
  capacity: number;
  description: string;
  amenities: string[];
  images: string[];
  status: 'available' | 'occupied' | 'maintenance';
  floor: number;
  size: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface ExtraService {
  serviceId: string;
  name: string;
  price: number;
  addedAt: string;
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
  extraServices?: ExtraService[];
  checkInActualAt?: string;
  checkOutActualAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  bookingId: string;
  hotelId: string;
  hotelName: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  hotelId: string;
  hotelName: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

export type StaffRole = 'manager' | 'housekeeping' | 'receptionist' | 'chef';

export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  staffRole: StaffRole;
  department: string;
  hotelId: string;
  hotelName: string;
  credentialRef?: string;
  shiftName?: string;
  workingDays: string[];
  isActive: boolean;
  offboardedAt?: string;
  offboardReason?: string;
  createdAt: string;
}

export interface AmenityUsage {
  _id: string;
  bookingId: string;
  hotelId: string;
  hotelName: string;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  discountType?: 'flat' | 'percent';
  discountValue: number;
  amount: number;
  usedAt: string;
  notes?: string;
  createdAt: string;
}

export type DietaryTag = 'veg' | 'non-veg' | 'vegan' | 'gluten-free' | 'jain' | 'contains-nuts';

export interface MenuItem {
  _id: string;
  hotelId: string;
  hotelName: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  dietaryTags: DietaryTag[];
  isAvailable: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderRef: string;
  hotelId: string;
  hotelName: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'served';
  createdAt: string;
  updatedAt: string;
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
