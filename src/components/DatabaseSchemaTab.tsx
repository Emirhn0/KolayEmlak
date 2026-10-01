// src/components/DatabaseSchemaTab.tsx
import React, { useState } from 'react';
import { Database, Code2, Sparkles, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';

const PRISMA_CODE = `// prisma/schema.prisma
// KolayEmlak - Saha Danışmanı Akıllı CRM & Portföy Eşleştirme Veri Tabanı Modeli
// Veri Tabanı: PostgreSQL

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// -------------------------------------------------------------
// ENUM TANIMLARI
// -------------------------------------------------------------

enum LeadStatus {
  ACTIVE      // Aktif arayışta
  PENDING     // Değerlendirmede / Askıda
  COMPLETED   // Satın alma tamamlandı
  CANCELLED   // Vazgeçti / İptal
}

enum PropertyStatus {
  AVAILABLE   // Satılık / Kiralık aktif
  RESERVED    // Kapora alındı / Rezerv
  SOLD        // Satıldı
  RENTED      // Kiraya verildi
  PASSIVE     // Yayından kaldırıldı
}

enum ListingType {
  FOR_SALE    // Satılık
  FOR_RENT    // Kiralık
}

enum PropertyType {
  APARTMENT   // Daire
  RESIDENCE   // Rezidans
  VILLA       // Villa / Müstakil
  COMMERCIAL  // Ticari / Dükkan / Ofis
  LAND        // Arsa / Tarla
}

enum PaymentMethod {
  CASH          // Nakit peşin
  MORTGAGE      // Konut Kredisi
  TRADE_IN      // Takas (Araç/Gayrimenkul)
  INSTALLMENT   // Senet / Taksit
  UNSPECIFIED   // Belirtilmedi
}

enum UrgencyLevel {
  URGENT  // Acil (Bu ay / hemen taşınmalı)
  HIGH    // Yüksek (1-2 ay içinde)
  MEDIUM  // Orta (3-6 ay içinde)
  LOW     // Düşük (Piyasa araştırıyor / yatırımcı)
}

enum MatchStatus {
  SUGGESTED       // Algoritma önerdi
  REVIEWED        // Danışman inceledi & onayladı
  PRESENTED       // Müşteriye sunuldu (WhatsApp/PDF)
  APPOINTMENT_SET // Yer gösterme / Randevu alındı
  OFFER_MADE      // Teklif verildi
  REJECTED        // Müşteri reddetti
  CLOSED          // Satışa dönüştü
}

// -------------------------------------------------------------
// 1. MÜŞTERİ / TALEP TABLOSU (Leads)
// -------------------------------------------------------------

model Lead {
  id                     String        @id @default(uuid()) @db.Uuid
  fullName               String        @db.VarChar(120) // Ad Soyad
  phoneNumber            String?       @db.VarChar(30)  // Telefon numarası
  email                  String?       @db.VarChar(120) // E-posta
  status                 LeadStatus    @default(ACTIVE)

  // Arayış Kriterleri
  propertyType           PropertyType  @default(APARTMENT)
  listingType            ListingType   @default(FOR_SALE)
  minBudget              Decimal?      @db.Decimal(14, 2) // Min Bütçe (TL)
  maxBudget              Decimal       @db.Decimal(14, 2) // Max Bütçe (TL)
  currency               String        @default("TRY") @db.VarChar(5)

  // Lokasyon Tercihleri
  preferredCities        String[]      @default(["Bursa"])
  preferredDistricts     String[]      @default([]) // Örn: ["Nilüfer", "Osmangazi"]
  preferredNeighborhoods  String[]      @default([]) // Örn: ["Özlüce", "Balat", "23 Nisan"]

  // Mülk Özellikleri Talebi
  roomCounts             String[]      @default([]) // Örn: ["3+1", "4+1"]
  minSquareMeters        Int?                       // Min net/brüt m²
  paymentMethod          PaymentMethod @default(UNSPECIFIED)
  urgencyLevel           UrgencyLevel  @default(MEDIUM)
  targetDate             DateTime?                  // Hedef taşınma / alım tarihi

  // İstenen Zorunlu Nitelikler
  mustHaveFeatures       String[]      @default([]) // Örn: ["krediye_uygun", "asansor", "site_ici"]

  // Sesli Not & Sistem Kaydı
  rawVoiceMemo           String?       @db.Text     // Danışmanın sesli notunun orijinal dökümü
  aiSummary              String?       @db.Text     // AI tarafından üretilen özet not
  missingFields          String[]      @default([]) // Eksik tespit edilen alanlar (örn: "phoneNumber")
  agentNotes             String?       @db.Text     // Danışmanın eklediği kişisel notlar
  assignedAgentId        String?       @db.Uuid

  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  matches                Match[]

  @@index([status])
  @@index([urgencyLevel])
  @@index([maxBudget])
  @@index([createdAt])
  @@map("leads")
}

// -------------------------------------------------------------
// 2. PORTFÖY / MÜLK TABLOSU (Properties)
// -------------------------------------------------------------

model Property {
  id                  String         @id @default(uuid()) @db.Uuid
  title               String         @db.VarChar(200) // Başlık
  description         String?        @db.Text
  propertyType        PropertyType   @default(APARTMENT)
  listingType         ListingType    @default(FOR_SALE)

  // Fiyat ve Finans
  price               Decimal        @db.Decimal(14, 2)
  currency            String         @default("TRY") @db.VarChar(5)
  isMortgageEligible  Boolean        @default(true) // Krediye Uygun mu?
  dues                Decimal?       @db.Decimal(10, 2) // Aidat

  // Lokasyon Bilgileri
  city                String         @db.VarChar(60) // İl (örn: Bursa)
  district            String         @db.VarChar(60) // İlçe (örn: Nilüfer)
  neighborhood        String         @db.VarChar(80) // Mahalle (örn: Özlüce)
  addressDetail       String?        @db.VarChar(255)
  latitude            Float?
  longitude           Float?

  // Mülk Detayları
  roomCount           String         @db.VarChar(10) // Örn: "3+1"
  grossSqm            Int                            // Brüt m²
  netSqm              Int                            // Net m²
  floorNumber         Int?                           // Bulunduğu Kat
  totalFloors         Int?                           // Toplam Kat
  buildingAge         Int            @default(0)     // Bina Yaşı
  heatingType         String?        @db.VarChar(50) // Doğalgaz Kombi, Yerden Isıtma

  // Donanımlar & Özellikler
  features            String[]       @default([]) // Örn: ["asansor", "otopark", "site_ici", "balkon"]
  images              String[]       @default([])

  // Mülk Sahibi İletişim (Sadece danışmana özel, gizli)
  ownerName           String         @db.VarChar(120)
  ownerPhone          String         @db.VarChar(30)
  ownerNotes          String?        @db.Text

  status              PropertyStatus @default(AVAILABLE)
  assignedAgentId     String?        @db.Uuid

  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  matches             Match[]

  @@index([city, district, neighborhood])
  @@index([price])
  @@index([roomCount])
  @@index([status])
  @@map("properties")
}

// -------------------------------------------------------------
// 3. EŞLEŞME TABLOSU (Matches)
// -------------------------------------------------------------

model Match {
  id              String       @id @default(uuid()) @db.Uuid
  leadId          String       @db.Uuid
  propertyId      String       @db.Uuid

  // Uyum Puanları (0 - 100 Arası)
  overallScore    Float        // Ağırlıklı Genel Uyum Skoru (0-100)
  budgetScore     Float        // Bütçe Uyumu (%35)
  locationScore   Float        // Lokasyon Uyumu (%30)
  roomScore       Float        // Oda Sayısı & Metrekare Uyumu (%20)
  featureScore    Float        // Özellik & Kredi Uygunluğu (%15)

  // Açıklayıcı Analiz
  reasons         Json         // Pozitif ve negatif gerekçeler listesi
  missingFeatures String[]     @default([]) // Karşılanamayan beklentiler

  // Eşleşme Yaşam Döngüsü
  status          MatchStatus  @default(SUGGESTED)
  agentFeedback   String?      @db.Text

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  lead            Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  property        Property     @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([leadId, propertyId])
  @@index([overallScore])
  @@index([status])
  @@map("matches")
}`;

const GEMINI_PARSER_CODE = `// src/services/voiceParser.ts
// Google Gemini 3.8 Flash (@google/genai SDK) - Voice-to-CRM Structured Output

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
});

export const voiceMemoResponseSchema = {
  type: Type.OBJECT,
  properties: {
    customer_name: { type: Type.STRING, description: "Müşterinin adı soyadı." },
    customer_phone: { type: Type.STRING, description: "Müşterinin telefon numarası." },
    preferred_locations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          city: { type: Type.STRING },
          district: { type: Type.STRING },
          neighborhood: { type: Type.STRING },
        },
        required: ["city", "district"],
      },
    },
    property_type: { type: Type.STRING, description: "APARTMENT, RESIDENCE, VILLA, COMMERCIAL, LAND" },
    listing_type: { type: Type.STRING, description: "FOR_SALE (Satılık), FOR_RENT (Kiralık)" },
    room_count: { type: Type.STRING, description: "Örn: '3+1', '2+1'" },
    min_budget: { type: Type.NUMBER, description: "TL cinsinden minimum bütçe." },
    max_budget: { type: Type.NUMBER, description: "TL cinsinden maksimum bütçe." },
    currency: { type: Type.STRING, description: "TRY, USD, EUR" },
    payment_method: { type: Type.STRING, description: "KREDI, CASH, TRADE_IN, INSTALLMENT, UNSPECIFIED" },
    urgency_level: { type: Type.STRING, description: "URGENT, HIGH, MEDIUM, LOW" },
    target_date: { type: Type.STRING, description: "Hedef taşınma tarihi (örn: '2026-11-01', 'Kasım 2026')" },
    must_have_features: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Örn: ['krediye_uygun', 'asansor', 'site_ici']",
    },
    summary: { type: Type.STRING, description: "Saha danışmanı için tek cümlelik net özet" },
    missing_fields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Eksik kalan kritik bilgi alanlarının listesi (örn: ['customer_phone', 'min_budget'])",
    },
    suggested_follow_up_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danışmanın müşteriye eksik bilgileri almak için sorabileceği öneri sorular",
    },
    confidence_score: { type: Type.NUMBER, description: "0-100 arası güven skoru" },
  },
  required: [
    "property_type", "listing_type", "max_budget", "currency", 
    "payment_method", "urgency_level", "must_have_features", 
    "summary", "missing_fields", "suggested_follow_up_questions", "confidence_score"
  ],
};

export async function parseVoiceMemo(transcript: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: \`Aşağıdaki danışman sesli notunu analiz et ve eksiksiz yapılandırılmış JSON çıkar:\\n\\n"""\\n\${transcript}\\n"""\`,
    config: {
      systemInstruction: "Sen Türkiye gayrimenkul sektöründe uzmanlaşmış KolayEmlak asistanısın. Müşteri bilgilerini, bütçeyi (örn: '6-7 milyon' -> min: 6M, max: 7M) ve eksik alanları (missing_fields) kusursuz ayıkla.",
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: voiceMemoResponseSchema,
    },
  });

  return JSON.parse(response.text!);
}`;

const MATCHING_ALGO_CODE = `// src/services/matchingEngine.ts
// KolayEmlak - Akıllı Portföy & Talep Eşleştirme Motoru
// Ağırlıklar: Bütçe (%35) + Lokasyon (%30) + Oda/Tip (%20) + Kredi & Nitelikler (%15)

export function calculateMatchScore(property: PortfolioProperty, lead: Lead): MatchResult {
  // 1. Bütçe Uyum Skoru (%35)
  const budget = calculateBudgetScore(property.price, lead.minBudget, lead.maxBudget);
  
  // 2. Lokasyon Uyum Skoru (%30) (İl + İlçe + Mahalle)
  const location = calculateLocationScore(property, lead);
  
  // 3. Oda Sayısı ve Gayrimenkul Tipi Skoru (%20)
  const room = calculateRoomAndTypeScore(property, lead);
  
  // 4. Krediye Uygunluk ve Nitelikler Skoru (%15)
  const features = calculateFeaturesScore(property, lead);

  // Ağırlıklı Toplam Skor
  let overallScore =
    budget.score * 0.35 +
    location.score * 0.30 +
    room.score * 0.20 +
    features.score * 0.15;

  // Sert Kurallar (Farklı şehir ise max %20, bütçe %30'dan fazla aşılmışsa max %25)
  if (location.score === 0) overallScore = Math.min(overallScore, 20);
  if (budget.score === 0) overallScore = Math.min(overallScore, 25);

  const finalScore = Math.round(Math.min(100, Math.max(0, overallScore)));

  // Gerekçeler
  const reasons = [budget.reason, location.reason, room.reason, features.reason];
  if ((lead.urgencyLevel === 'URGENT' || lead.urgencyLevel === 'HIGH') && finalScore >= 65) {
    reasons.unshift(\`⚡ YÜKSEK ÖNCELİK: Müşteri acil arayışta (\${lead.urgencyLevel}).\`);
  }

  return {
    propertyId: property.id,
    leadId: lead.id,
    overallScore: finalScore,
    breakdown: {
      budgetScore: Math.round(budget.score),
      locationScore: Math.round(location.score),
      roomScore: Math.round(room.score),
      featureScore: Math.round(features.score),
      urgencyBoostApplied: lead.urgencyLevel === 'URGENT' || lead.urgencyLevel === 'HIGH',
    },
    reasons,
    missingFeatures: features.missingFeatures,
    matchGrade: finalScore >= 80 ? 'EXCELLENT' : finalScore >= 65 ? 'HIGH' : finalScore >= 50 ? 'MODERATE' : 'LOW',
  };
}`;

export const DatabaseSchemaTab: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'PRISMA' | 'GEMINI' | 'MATCHING'>('PRISMA');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeCodeTab) {
      case 'PRISMA':
        return PRISMA_CODE;
      case 'GEMINI':
        return GEMINI_PARSER_CODE;
      case 'MATCHING':
        return MATCHING_ALGO_CODE;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">PostgreSQL / Prisma</h3>
              <p className="text-xs text-gray-600">3 İlişkisel Model</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Lead (Müşteri/Talep), Property (Portföy Mülkü) ve Match (Uyum & Analiz) tabloları, enumlar ve indexler.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Gemini Structured Output</h3>
              <p className="text-xs text-gray-600">gemini-3.8-flash</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Saha konuşma dökümlerinden katı JSON şeması ile entity ve missing_fields tespiti.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Eşleştirme Algoritması</h3>
              <p className="text-xs text-gray-600">TypeScript Motoru</p>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Bütçe (%35) + Lokasyon (%30) + Oda/Tip (%20) + Kredi & Donanım (%15) + Acil Çarpanı.
          </p>
        </div>
      </div>

      {/* Code Inspector Box */}
      <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        {/* Navigation Tabs Header */}
        <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('PRISMA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeCodeTab === 'PRISMA'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>1. Prisma Modelleri (PostgreSQL)</span>
            </button>
            <button
              onClick={() => setActiveCodeTab('GEMINI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeCodeTab === 'GEMINI'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Sesli Not Şeması (Gemini JSON)</span>
            </button>
            <button
              onClick={() => setActiveCodeTab('MATCHING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeCodeTab === 'MATCHING'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>3. Eşleştirme Motoru (TypeScript)</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-gray-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kodu Kopyala</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 sm:p-6 overflow-x-auto max-h-[600px] overflow-y-auto text-xs sm:text-sm font-mono leading-relaxed text-gray-200">
          <pre>{getActiveCode()}</pre>
        </div>
      </div>
    </div>
  );
};
