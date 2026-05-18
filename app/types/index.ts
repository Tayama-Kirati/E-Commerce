export interface ProductCardData {
  id:           string;
  name:         string;
  slug:         string;
  shortDesc?:   string;
  basePrice:    string | number;
  comparePrice?:string | number | null;
  currency:     string;
  stock:        number;
  averageRating:number;
  totalReviews: number;
  totalSales:   number;
  isEco:        boolean;
  isFlashSale:  boolean;
  flashSaleEndsAt?: Date | null;
  freeShipping: boolean;
  isFeatured:   boolean;
  hasVariants:  boolean;
  seller?: {
    id:          string;
    storeName:   string;
    storeSlug:   string;
    isVerified:  boolean;
  };
  category?: {
    id:   string;
    name: string;
    slug: string;
  };
  images?: {
    url: string;
    alt?:string;
  }[];
  variants?: {
    id:          string;
    name:        string;
    price:       string | number;
    comparePrice?:string | number | null;
    stock:       number;
    attributes:  Record<string, string>;
    image?:      string;
  }[];
  tags?:        string[];
  discountPercent?: number | null;
}