// src/types/crm.ts
// KolayEmlak Core Domain Models and Type Definitions

export type LeadStatus = 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type PropertyStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'PASSIVE';
export type ListingType = 'FOR_SALE' | 'FOR_RENT';
export type PropertyType = 'APARTMENT' | 'RESIDENCE' | 'VILLA' | 'COMMERCIAL' | 'LAND';
export type PaymentMethod = 'CASH' | 'MORTGAGE' | 'TRADE_IN' | 'INSTALLMENT' | 'UNSPECIFIED';
export type UrgencyLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type MatchStatus = 'SUGGESTED' | 'REVIEWED' | 'PRESENTED' | 'APPOINTMENT_SET' | 'OFFER_MADE' | 'REJECTED' | 'CLOSED';

export interface Lead {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  email?: string | null;
  status: LeadStatus;
  propertyType: PropertyType;
  listingType: ListingType;
  minBudget?: number | null;
  maxBudget: number;
  currency: string;
  preferredCities: string[];
  preferredDistricts: string[];
  preferredNeighborhoods: string[];
  roomCounts: string[]; // e.g. ["3+1", "4+1"]
  minSquareMeters?: number | null;
  paymentMethod: PaymentMethod;
  urgencyLevel: UrgencyLevel;
  targetDate?: string | null;
  mustHaveFeatures: string[]; // e.g. ["krediye_uygun", "asansor", "site_ici"]
  rawVoiceMemo?: string | null;
  aiSummary?: string | null;
  missingFields: string[];
  agentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioProperty {
  id: string;
  title: string;
  description?: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  currency: string;
  isMortgageEligible: boolean;
  dues?: number;
  city: string;
  district: string;
  neighborhood: string;
  addressDetail?: string;
  roomCount: string; // e.g. "3+1"
  grossSqm: number;
  netSqm: number;
  floorNumber?: number;
  totalFloors?: number;
  buildingAge?: number;
  heatingType?: string;
  features: string[]; // e.g. ["krediye_uygun", "asansor", "otopark", "site_ici", "balkon"]
  images: string[];
  ownerName: string;
  ownerPhone: string;
  ownerNotes?: string;
  status: PropertyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MatchScoreBreakdown {
  budgetScore: number;     // 0 - 100
  locationScore: number;   // 0 - 100
  roomScore: number;       // 0 - 100
  featureScore: number;    // 0 - 100
  urgencyBoostApplied?: boolean;
}

export interface MatchResult {
  propertyId: string;
  leadId: string;
  overallScore: number;    // 0 - 100
  breakdown: MatchScoreBreakdown;
  reasons: string[];
  missingFeatures: string[];
  matchGrade: 'EXCELLENT' | 'HIGH' | 'MODERATE' | 'LOW';
  property?: PortfolioProperty;
  lead?: Lead;
}

// Sesli Not Ayrıştırıcı Çıktı Şeması (Structured Output)
export interface VoiceMemoParsedResult {
  customer_name: string | null;
  customer_phone: string | null;
  preferred_locations: Array<{
    city: string;
    district: string;
    neighborhood: string | null;
  }>;
  property_type: PropertyType;
  listing_type: ListingType;
  room_count: string | null;
  min_budget: number | null;
  max_budget: number | null;
  currency: string;
  payment_method: PaymentMethod;
  urgency_level: UrgencyLevel;
  target_date: string | null;
  must_have_features: string[];
  notes: string | null;
  summary: string;
  missing_fields: string[];
  suggested_follow_up_questions: string[];
  confidence_score: number;
}
