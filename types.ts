export type UserRole = 'promoter' | 'member' | 'promo_ambassador' | 'product_selector' | 'admin';

export interface QrConfig {
  x: number;
  y: number;
  size: number;
  zoom?: number; // Scaling factor (1 = full image, >1 = zoomed in)
  cropX?: number; // Horizontal shift percentage (-50 to 50)
  cropY?: number; // Vertical shift percentage (-50 to 50)

  // New Poster Config Fields
  titleX?: number;
  titleY?: number;
  titleSize?: number;
  titleColor?: string;
  priceX?: number;
  priceY?: number;
  priceSize?: number;
  priceColor?: string;
}

export interface UserProfile {
  nickname: string;
  roles: UserRole[]; // Changed from single role to array
  qrCode: string; // Base64 string
  role: UserRole;
  qrConfig?: QrConfig;
  password?: string; // Simple password for user login
  email?: string; // Optional for email login users
  joinDate?: number; // Timestamp of registration
}

export interface SelectionItem {
  id: string;
  type: 'product';
  title: string;
  originalCopy: string; // Base product info
  xhsCopy?: string; // Admin provided XHS copy
  pyqCopy?: string; // Admin provided Friend Circle copy
  imageUrl?: string; // Main Product Image (Legacy support)
  images?: string[]; // [Product Image, Benchmark Shop Image, Source Shop Image]
  price?: string;

  // New Fields
  benchmarkShopName?: string;
  recommendationReason?: string;
  tags?: string[];
  benchmarkShopUrl?: string;
  sourceShopUrl?: string;

  uploaderName?: string;
  timestamp: number;
}

export interface PromoMaterial {
  id: string;
  type: 'promo';
  content: string; // The marketing copy
  images: string[]; // List of marketing images (Base64)
  timestamp: number;
}

export type CopyStyle = 'xiaohongshu' | 'wechat';

export interface CanvasTextConfig {
  text: string;
  x: number;
  y: number;
  maxWidth?: number;
  lineHeight?: number;
  fontSize: string;
  color: string;
  fontFamily?: string;
  align?: CanvasTextAlign;
  isBold?: boolean;
}
