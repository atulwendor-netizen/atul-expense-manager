export type ProductCategory = 
  | 'all'
  | 'ebooks'
  | 'youtube'
  | 'prompts'
  | 'templates'
  | 'toolkits'
  | 'bundles';

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  category: ProductCategory;
  categoryLabel: string;
  priceINR: number;
  originalPriceINR: number;
  format: string; // e.g., 'PDF eBook + ePub', 'Notion OS + Video Walkthrough'
  pagesOrItems: string; // e.g., '142 Pages', '1,500+ Prompts', '18 Templates'
  badge?: string; // e.g., 'Bestseller', 'Staff Pick', 'Complete Bundle', 'New Release'
  coverTheme: 'electric-blue' | 'violet-glow' | 'cyan-matrix' | 'emerald-ai' | 'amber-gold' | 'neon-purple';
  description: string;
  benefits: string[];
  tableOfContents?: string[];
  targetAudience: string;
  isSpotlight?: boolean;
  sampleAvailable?: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'products' | 'delivery' | 'payments';
}

export interface TrustPillar {
  title: string;
  description: string;
  iconName: string;
  tag: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
