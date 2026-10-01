// src/services/voiceParser.ts
// KolayEmlak - Voice-to-CRM Structured Output Parser
// Google Gemini API (@google/genai SDK) - gemini-3.8-flash

import { GoogleGenAI, Type } from '@google/genai';
import { VoiceMemoParsedResult } from '../types/crm.js';

// Server-side initialization with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Gemini Structured Output JSON Şeması
 * Gayrimenkul terimleri ve saha danışmanı konuşma kalıplarına göre optimize edilmiştir.
 */
export const voiceMemoResponseSchema = {
  type: Type.OBJECT,
  properties: {
    customer_name: {
      type: Type.STRING,
      description: "Müşterinin adı soyadı. Metinde yoksa null veya boş bırakınız.",
    },
    customer_phone: {
      type: Type.STRING,
      description: "Müşterinin telefon numarası (varsa). Metinde yoksa null.",
    },
    preferred_locations: {
      type: Type.ARRAY,
      description: "Müşterinin aradığı lokasyonlar (İl, İlçe, Mahalle).",
      items: {
        type: Type.OBJECT,
        properties: {
          city: {
            type: Type.STRING,
            description: "İl adı (örn: Bursa, İstanbul). Metinde ilçe verilip il söylenmemişse Türkiye'deki meşhur ilçeden ili çıkarınız (örn: Nilüfer -> Bursa, Kadıköy -> İstanbul).",
          },
          district: {
            type: Type.STRING,
            description: "İlçe adı (örn: Nilüfer, Osmangazi, Kadıköy).",
          },
          neighborhood: {
            type: Type.STRING,
            description: "Mahalle adı veya semt (örn: Özlüce, Balat, Moda, Batıkent).",
          },
        },
        required: ["city", "district"],
      },
    },
    property_type: {
      type: Type.STRING,
      description: "Gayrimenkul tipi. Değerler: APARTMENT, RESIDENCE, VILLA, COMMERCIAL, LAND.",
    },
    listing_type: {
      type: Type.STRING,
      description: "İşlem türü. Değerler: FOR_SALE (Satılık), FOR_RENT (Kiralık).",
    },
    room_count: {
      type: Type.STRING,
      description: "Aranan oda sayısı formatı (örn: '1+1', '2+1', '3+1', '4+1').",
    },
    min_budget: {
      type: Type.NUMBER,
      description: "Minimum bütçe tutarı tam sayı (TL). Örn: '6-7 milyon' için 6000000. Belirtilmemişse null.",
    },
    max_budget: {
      type: Type.NUMBER,
      description: "Maksimum bütçe tutarı tam sayı (TL). Örn: '6-7 milyon' için 7000000.",
    },
    currency: {
      type: Type.STRING,
      description: "Para birimi. Varsayılan 'TRY', aksi belirtilmedikçe USD veya EUR.",
    },
    payment_method: {
      type: Type.STRING,
      description: "Ödeme yöntemi: KREDI (Kredi/Mortgage), CASH (Nakit Peşin), TRADE_IN (Takas), INSTALLMENT (Taksit), UNSPECIFIED.",
    },
    urgency_level: {
      type: Type.STRING,
      description: "Aciliyet seviyesi: URGENT (Hemen/bu ay), HIGH (1-2 ay içinde/kasıma kadar), MEDIUM (3-6 ay), LOW (Yatırım/Acelesi yok).",
    },
    target_date: {
      type: Type.STRING,
      description: "Hedef taşınma veya satın alma tarihi / ayı (örn: '2026-11-01', 'Kasım 2026').",
    },
    must_have_features: {
      type: Type.ARRAY,
      description: "Olmazsa olmaz kriterler ve etiketler (örn: ['krediye_uygun', 'asansor', 'site_ici', 'otopark', 'balkon', 'metroya_yakin']).",
      items: {
        type: Type.STRING,
      },
    },
    notes: {
      type: Type.STRING,
      description: "Danışman için özel bağlamsal notlar (meslek, özel istek, çocuk okulu vb.).",
    },
    summary: {
      type: Type.STRING,
      description: "Saha danışmanı için tek cümlelik net profesyonel özet.",
    },
    missing_fields: {
      type: Type.ARRAY,
      description: "Eksik kalan kritik bilgi alanlarının listesi (örn: ['customer_phone', 'min_budget', 'listing_type']). Müşteriden alınması gereken eksikleri mutlaka listele.",
      items: {
        type: Type.STRING,
      },
    },
    suggested_follow_up_questions: {
      type: Type.ARRAY,
      description: "Danışmanın müşteriye veya kendine sorması önerilen 1-3 adet soru.",
      items: {
        type: Type.STRING,
      },
    },
    confidence_score: {
      type: Type.NUMBER,
      description: "Ayrıştırmanın genel güven puanı (0-100 arası).",
    },
  },
  required: [
    "property_type",
    "listing_type",
    "max_budget",
    "currency",
    "payment_method",
    "urgency_level",
    "must_have_features",
    "summary",
    "missing_fields",
    "suggested_follow_up_questions",
    "confidence_score",
  ],
};

const SYSTEM_INSTRUCTION = `
Sen Türkiye gayrimenkul sektöründe uzmanlaşmış 'KolayEmlak' yapay zeka saha asistanısın.
Saha danışmanları arabada veya yürürken hızlıca sesli not kaydeder (Örn: "Ahmet Çelik aradı, Nilüfer Özlüce'de 6-7 milyona kadar krediye uygun 3+1 arıyor, kasıma kadar taşınmalı").

Görevin:
1. Türkçe doğal konuşma metnini analiz et ve kesinlikle belirtilen JSON şemasına uygun nesne döndür.
2. Sayısal bütçeleri doğru hesapla:
   - "6-7 milyona kadar" -> min_budget: 6000000, max_budget: 7000000
   - "500 bin TL" -> 500000
   - "10 milyon civarı" -> min_budget: 9000000, max_budget: 10500000
3. Türkiye il ve ilçe/mahalle eşleştirmelerini doğru yap:
   - "Nilüfer Özlüce" -> City: "Bursa", District: "Nilüfer", Neighborhood: "Özlüce"
   - "Kadıköy Moda" -> City: "İstanbul", District: "Kadıköy", Neighborhood: "Moda"
   - "Çankaya Çayyolu" -> City: "Ankara", District: "Çankaya", Neighborhood: "Çayyolu"
4. Ödeme ve aciliyeti yorumla:
   - "krediye uygun" -> payment_method: "MORTGAGE", must_have_features içine "krediye_uygun" ekle.
   - "kasıma kadar taşınmalı" -> urgency_level: "HIGH" veya "URGENT", target_date: "2026-11".
5. EKSİK ALAN TESPİTİ (missing_fields):
   - Müşteri adı (customer_name) yoksa -> 'customer_name'
   - Müşteri telefonu (customer_phone) yoksa -> 'customer_phone'
   - Belirli bir alt bütçe yoksa -> 'min_budget'
   - İstenen bina yaşı / kat tercihi yoksa -> 'floor_or_age_preference'
   Bu eksikleri listele ve danışmana hemen sorabileceği follow-up soruları (suggested_follow_up_questions) üret.
`;

/**
 * Danışmanın sesli not dökümünü veya sesini analiz edip yapılandırılmış JSON nesnesine dönüştürür.
 */
export async function parseVoiceMemo(transcript: string): Promise<VoiceMemoParsedResult> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error("Sesli not metni boş olamaz.");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `Aşağıdaki danışman sesli notunu analiz et ve eksiksiz yapılandırılmış JSON çıkar:\n\n"""\n${transcript}\n"""`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.1, // Düşük sıcaklık ile tutarlı ve kesin veri çıkarma
      responseMimeType: 'application/json',
      responseSchema: voiceMemoResponseSchema,
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Gemini API'den boş yanıt döndü.");
  }

  try {
    const parsed = JSON.parse(rawText) as VoiceMemoParsedResult;
    return parsed;
  } catch (err) {
    console.error("JSON parse error from Gemini response:", rawText, err);
    throw new Error("Yapay zeka yanıtı geçerli JSON formatında ayrıştırılamadı.");
  }
}
