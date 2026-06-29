export interface MarketItem {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  conditionLevel: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category: string;
  images: string[] | null;
  contactInfo: string | null;
  status: 'selling' | 'reserved' | 'sold' | 'removed';
  sellerId: number;
  seller?: import('./user').User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketItemRequest {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  conditionLevel: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category: string;
  images?: string[];
  contactInfo?: string;
}
