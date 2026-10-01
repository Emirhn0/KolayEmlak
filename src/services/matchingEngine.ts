// src/services/matchingEngine.ts
// KolayEmlak - Akıllı Portföy & Talep Eşleştirme Motoru
// Kriterler: Bütçe (%35), Lokasyon (%30), Oda/Tip (%20), Nitelik & Kredi (%15) + Aciliyet Önceliği

import { Lead, PortfolioProperty, MatchResult, MatchScoreBreakdown } from '../types/crm.js';

export interface MatchingWeights {
  budget: number;    // 0.35
  location: number;  // 0.30
  room: number;      // 0.20
  features: number;  // 0.15
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  budget: 0.35,
  location: 0.30,
  room: 0.20,
  features: 0.15,
};

/**
 * İki metin arasındaki Türkçe karakter duyarsız normalize karşılaştırma
 */
function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * 1. Bütçe Uyum Skoru Hesabı (%35 Ağırlık)
 */
export function calculateBudgetScore(
  propertyPrice: number,
  minBudget: number | null | undefined,
  maxBudget: number
): { score: number; reason: string } {
  const formattedPrice = propertyPrice.toLocaleString('tr-TR') + ' TL';
  const formattedMax = maxBudget.toLocaleString('tr-TR') + ' TL';

  // Fiyat tam bütçe aralığında
  if (propertyPrice <= maxBudget && (!minBudget || propertyPrice >= minBudget)) {
    return {
      score: 100,
      reason: `Mülk fiyatı (${formattedPrice}) müşterinin bütçe aralığında (Maks: ${formattedMax}).`,
    };
  }

  // Fiyat bütçenin üzerinde (Pazarlık toleransı)
  if (propertyPrice > maxBudget) {
    const overPercent = ((propertyPrice - maxBudget) / maxBudget) * 100;

    if (overPercent <= 5) {
      return {
        score: 85,
        reason: `Fiyat bütçeyi sadece %${overPercent.toFixed(1)} aşıyor (${formattedPrice}), pazarlıkla kapanabilir.`,
      };
    } else if (overPercent <= 10) {
      return {
        score: 65,
        reason: `Fiyat bütçeyi %${overPercent.toFixed(1)} aşıyor (${formattedPrice}), pazarlık payı zorlanabilir.`,
      };
    } else if (overPercent <= 20) {
      return {
        score: 35,
        reason: `Fiyat bütçenin %${overPercent.toFixed(1)} üzerinde (${formattedPrice}), bütçe aşımı yüksek.`,
      };
    } else {
      return {
        score: 0,
        reason: `Fiyat (${formattedPrice}) müşterinin maksimum bütçesinin (%${overPercent.toFixed(1)}) çok üzerinde.`,
      };
    }
  }

  // Fiyat min bütçenin altında (Alıcı için genellikle avantajdır)
  if (minBudget && propertyPrice < minBudget) {
    const underPercent = ((minBudget - propertyPrice) / minBudget) * 100;
    if (underPercent <= 20) {
      return {
        score: 95,
        reason: `Mülk fiyatı (${formattedPrice}) talep edilen alt bütçeden uygun, cazip fırsat.`,
      };
    }
    return {
      score: 80,
      reason: `Mülk fiyatı (${formattedPrice}) alt bütçenin altında kalıyor.`,
    };
  }

  return { score: 70, reason: 'Bütçe kısmen uyumlu.' };
}

/**
 * 2. Lokasyon Uyum Skoru Hesabı (%30 Ağırlık)
 */
export function calculateLocationScore(
  property: { city: string; district: string; neighborhood: string },
  lead: { preferredCities: string[]; preferredDistricts: string[]; preferredNeighborhoods: string[] }
): { score: number; reason: string } {
  const pCity = normalizeText(property.city);
  const pDistrict = normalizeText(property.district);
  const pNeighborhood = normalizeText(property.neighborhood);

  const cityMatches =
    lead.preferredCities.length === 0 ||
    lead.preferredCities.some((c) => normalizeText(c) === pCity);

  if (!cityMatches) {
    return {
      score: 0,
      reason: `Şehir uyuşmuyor: Mülk ${property.city}, müşteri tercihi: ${lead.preferredCities.join(', ')}.`,
    };
  }

  // İlçe kontrolü
  const districtMatches =
    lead.preferredDistricts.length === 0 ||
    lead.preferredDistricts.some((d) => normalizeText(d) === pDistrict);

  if (!districtMatches) {
    return {
      score: 25,
      reason: `Şehir aynı (${property.city}) ancak ilçe farklı: Mülk ${property.district}, aranan: ${lead.preferredDistricts.join(', ')}.`,
    };
  }

  // Mahalle kontrolü
  const neighborhoodMatches =
    lead.preferredNeighborhoods.length === 0 ||
    lead.preferredNeighborhoods.some((n) => normalizeText(n) === pNeighborhood);

  if (neighborhoodMatches && lead.preferredNeighborhoods.length > 0) {
    return {
      score: 100,
      reason: `Tam mahalle eşleşmesi: ${property.district} / ${property.neighborhood}.`,
    };
  }

  if (districtMatches) {
    return {
      score: 80,
      reason: `İlçe eşleşmesi sağlandı: ${property.district} (${property.neighborhood}).`,
    };
  }

  return { score: 50, reason: `Lokasyon kısmen uyumlu (${property.city} / ${property.district}).` };
}

/**
 * 3. Oda Sayısı ve Gayrimenkul Tipi Skoru (%20 Ağırlık)
 */
export function calculateRoomAndTypeScore(
  property: { roomCount: string; propertyType: string },
  lead: { roomCounts: string[]; propertyType: string }
): { score: number; reason: string } {
  const pRoom = normalizeText(property.roomCount);
  const pType = normalizeText(property.propertyType);
  const lType = normalizeText(lead.propertyType);

  let typePenalty = 0;
  if (pType !== lType) {
    typePenalty = 30;
  }

  if (lead.roomCounts.length === 0) {
    return {
      score: Math.max(0, 85 - typePenalty),
      reason: `Oda kısıtı belirtilmemiş. Mülk: ${property.roomCount}.`,
    };
  }

  const exactRoomMatch = lead.roomCounts.some((rc) => normalizeText(rc) === pRoom);
  if (exactRoomMatch) {
    return {
      score: Math.max(0, 100 - typePenalty),
      reason: `Oda sayısı tam eşleşiyor (${property.roomCount}).`,
    };
  }

  // Yakın oda eşleşmesi toleransı (Örn: Müşteri 3+1 istiyor, mülk 3.5+1 veya 4+1)
  const pRoomNum = parseInt(property.roomCount.split('+')[0], 10) || 0;
  const anyClose = lead.roomCounts.some((rc) => {
    const lRoomNum = parseInt(rc.split('+')[0], 10) || 0;
    return Math.abs(pRoomNum - lRoomNum) <= 1;
  });

  if (anyClose) {
    return {
      score: Math.max(0, 70 - typePenalty),
      reason: `Oda sayısı yakın alternatif (${property.roomCount}, aranan: ${lead.roomCounts.join(', ')}).`,
    };
  }

  return {
    score: Math.max(0, 20 - typePenalty),
    reason: `Oda sayısı uyuşmuyor: Mülk ${property.roomCount}, aranan: ${lead.roomCounts.join(', ')}.`,
  };
}

/**
 * 4. Nitelikler & Krediye Uygunluk Skoru (%15 Ağırlık)
 */
export function calculateFeaturesScore(
  property: { isMortgageEligible: boolean; features: string[] },
  lead: { paymentMethod: string; mustHaveFeatures: string[] }
): { score: number; reason: string; missingFeatures: string[] } {
  const normalizedPropFeatures = property.features.map(normalizeText);
  const missingFeatures: string[] = [];
  const reasons: string[] = [];

  // Kritik Kredi Kontrolü
  const requiresMortgage =
    lead.paymentMethod === 'MORTGAGE' ||
    lead.mustHaveFeatures.some((f) => normalizeText(f).includes('kredi'));

  if (requiresMortgage && !property.isMortgageEligible) {
    return {
      score: 10,
      reason: 'KRİTİK UYARı: Müşteri kredili alım yapacak fakat mülk krediye uygun değil!',
      missingFeatures: ['krediye_uygunluk'],
    };
  }

  let matchedFeaturesCount = 0;
  const totalMustHaves = lead.mustHaveFeatures.filter(
    (f) => !normalizeText(f).includes('kredi')
  );

  for (const feature of totalMustHaves) {
    const norm = normalizeText(feature);
    const hasIt = normalizedPropFeatures.some((pf) => pf.includes(norm) || norm.includes(pf));
    if (hasIt) {
      matchedFeaturesCount++;
    } else {
      missingFeatures.push(feature);
    }
  }

  let score = 75; // Temel uyum başlangıcı
  if (requiresMortgage && property.isMortgageEligible) {
    reasons.push('Konut kredisine uygun.');
    score += 15;
  }

  if (totalMustHaves.length > 0) {
    const ratio = matchedFeaturesCount / totalMustHaves.length;
    score = Math.round(score * 0.4 + ratio * 60);
  }

  score = Math.min(100, Math.max(0, score));

  if (missingFeatures.length > 0) {
    reasons.push(`Karşılanamayan istekler: ${missingFeatures.join(', ')}.`);
  } else if (totalMustHaves.length > 0) {
    reasons.push('Tüm aranan özellikler mevcut.');
  }

  return {
    score,
    reason: reasons.join(' ') || 'Temel mülk özellikleri uyumlu.',
    missingFeatures,
  };
}

/**
 * Ana Eşleştirme Fonksiyonu: Tek bir Talep ile Portföy arasındaki uyum skorunu ve gerekçelerini hesaplar.
 */
export function calculateMatchScore(
  property: PortfolioProperty,
  lead: Lead,
  weights = DEFAULT_WEIGHTS
): MatchResult {
  const budget = calculateBudgetScore(property.price, lead.minBudget, lead.maxBudget);
  const location = calculateLocationScore(property, lead);
  const room = calculateRoomAndTypeScore(property, lead);
  const features = calculateFeaturesScore(property, lead);

  // Ağırlıklı toplam skor hesabı
  let overallScore =
    budget.score * weights.budget +
    location.score * weights.location +
    room.score * weights.room +
    features.score * weights.features;

  // Sert Kural Kısıtlamaları (Veto Şartları)
  if (location.score === 0) {
    overallScore = Math.min(overallScore, 20); // Şehir tamamen farklıysa eşleşme skoru düşürülür
  }
  if (budget.score === 0) {
    overallScore = Math.min(overallScore, 25); // Bütçe çok fahiş aşıldıysa tavan konur
  }

  // 0 - 100 arasına yuvarla
  const finalScore = Math.round(Math.min(100, Math.max(0, overallScore)));

  // Gerekçeleri derle
  const reasons: string[] = [
    budget.reason,
    location.reason,
    room.reason,
    features.reason,
  ];

  // Aciliyet katsayısı bildirimi
  const urgencyBoostApplied = lead.urgencyLevel === 'URGENT' || lead.urgencyLevel === 'HIGH';
  if (urgencyBoostApplied && finalScore >= 65) {
    reasons.unshift(`⚡ YÜKSEK ÖNCELİK: Müşteri acil arayışta (${lead.urgencyLevel}).`);
  }

  let matchGrade: MatchResult['matchGrade'] = 'LOW';
  if (finalScore >= 85) matchGrade = 'EXCELLENT';
  else if (finalScore >= 70) matchGrade = 'HIGH';
  else if (finalScore >= 50) matchGrade = 'MODERATE';

  return {
    propertyId: property.id,
    leadId: lead.id,
    overallScore: finalScore,
    breakdown: {
      budgetScore: Math.round(budget.score),
      locationScore: Math.round(location.score),
      roomScore: Math.round(room.score),
      featureScore: Math.round(features.score),
      urgencyBoostApplied,
    },
    reasons,
    missingFeatures: features.missingFeatures,
    matchGrade,
    property,
    lead,
  };
}

/**
 * Yeni eklenen bir portföy için sistemdeki tüm aktif talepleri tarar ve uyum skoruna göre sıralar.
 */
export function findMatchingLeadsForProperty(
  property: PortfolioProperty,
  leads: Lead[],
  minScoreThreshold = 50
): MatchResult[] {
  return leads
    .filter((lead) => lead.status === 'ACTIVE')
    .map((lead) => calculateMatchScore(property, lead))
    .filter((result) => result.overallScore >= minScoreThreshold)
    .sort((a, b) => {
      // Önce acil olan yüksek uyumlu talepler, sonra genel skor
      const aUrgencyWeight = a.lead?.urgencyLevel === 'URGENT' ? 10 : a.lead?.urgencyLevel === 'HIGH' ? 5 : 0;
      const bUrgencyWeight = b.lead?.urgencyLevel === 'URGENT' ? 10 : b.lead?.urgencyLevel === 'HIGH' ? 5 : 0;
      return b.overallScore + bUrgencyWeight - (a.overallScore + aUrgencyWeight);
    });
}

/**
 * Yeni veya güncellenen bir talep için portföydeki tüm uygun mülkleri tarar.
 */
export function findMatchingPropertiesForLead(
  lead: Lead,
  properties: PortfolioProperty[],
  minScoreThreshold = 50
): MatchResult[] {
  return properties
    .filter((prop) => prop.status === 'AVAILABLE')
    .map((prop) => calculateMatchScore(prop, lead))
    .filter((result) => result.overallScore >= minScoreThreshold)
    .sort((a, b) => b.overallScore - a.overallScore);
}
