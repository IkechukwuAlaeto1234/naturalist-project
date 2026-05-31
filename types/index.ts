export interface UserType {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isVerified: boolean;
  createdAt: string;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  category: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  benefits: string[];
  ingredients: string[];
  usage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BundleType {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  products: ProductType[]; // Fully populated products
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemType {
  id: string; // Dynamic combination of item id & option if needed
  product?: ProductType;
  bundle?: BundleType;
  quantity: number;
  price: number;
}

export interface CartType {
  items: CartItemType[];
  totalItems: number;
  totalAmount: number;
}

export interface ShippingAddressType {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface OrderItemType {
  product?: string;
  bundle?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderType {
  id: string;
  user: UserType | string;
  items: OrderItemType[];
  shippingAddress: ShippingAddressType;
  paymentStatus: "pending" | "paid" | "failed";
  shippingStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  stripeSessionId?: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterType {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: string;
}

export interface AdminStatsType {
  revenue: {
    total: number;
    percentageChange: number;
  };
  orders: {
    total: number;
    percentageChange: number;
  };
  customers: {
    total: number;
    percentageChange: number;
  };
  products: {
    total: number;
  };
  recentOrders: Array<{
    id: string;
    customer: string;
    date: string;
    amount: number;
    status: OrderType["paymentStatus"];
  }>;
  revenueChart: Array<{
    name: string;
    revenue: number;
  }>;
}
