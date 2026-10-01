// server.ts
// KolayEmlak Full-Stack Express Server with Gemini API & Vite Middleware

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseVoiceMemo } from './src/services/voiceParser.js';
import { calculateMatchScore, findMatchingLeadsForProperty, findMatchingPropertiesForLead } from './src/services/matchingEngine.js';
import { INITIAL_LEADS, INITIAL_PROPERTIES } from './src/data/seedData.js';
import { Lead, PortfolioProperty } from './src/types/crm.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory data store for live MVP session
let leads: Lead[] = [...INITIAL_LEADS];
let properties: PortfolioProperty[] = [...INITIAL_PROPERTIES];

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

/**
 * 1. Sesli Not Ayrıştırıcı API (Gemini Structured Output)
 * Danışmanın gönderdiği ses dökümünü analiz eder ve standart JSON döner.
 */
app.post('/api/parse-voice-memo', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Geçerli bir "transcript" metni gönderilmelidir.' });
      return;
    }

    // Call server-side Gemini 3.8 Flash with structured schema
    const parsedData = await parseVoiceMemo(transcript);
    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/parse-voice-memo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Sesli not ayrıştırılırken hata oluştu.',
    });
  }
});

/**
 * 2. Yeni Talep Kaydetme (Voice-to-Lead)
 */
app.post('/api/leads', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      fullName: payload.customer_name || payload.fullName || 'İsimsiz Müşteri',
      phoneNumber: payload.customer_phone || payload.phoneNumber || null,
      email: payload.email || null,
      status: 'ACTIVE',
      propertyType: payload.property_type || payload.propertyType || 'APARTMENT',
      listingType: payload.listing_type || payload.listingType || 'FOR_SALE',
      minBudget: payload.min_budget !== undefined ? payload.min_budget : (payload.minBudget ?? null),
      maxBudget: payload.max_budget || payload.maxBudget || 5000000,
      currency: payload.currency || 'TRY',
      preferredCities: payload.preferred_locations?.map((l: any) => l.city) || payload.preferredCities || ['Bursa'],
      preferredDistricts: payload.preferred_locations?.map((l: any) => l.district) || payload.preferredDistricts || ['Nilüfer'],
      preferredNeighborhoods: payload.preferred_locations?.map((l: any) => l.neighborhood).filter(Boolean) || payload.preferredNeighborhoods || [],
      roomCounts: payload.room_count ? [payload.room_count] : (payload.roomCounts || ['3+1']),
      minSquareMeters: payload.minSquareMeters || null,
      paymentMethod: payload.payment_method || payload.paymentMethod || 'UNSPECIFIED',
      urgencyLevel: payload.urgency_level || payload.urgencyLevel || 'MEDIUM',
      targetDate: payload.target_date || payload.targetDate || null,
      mustHaveFeatures: payload.must_have_features || payload.mustHaveFeatures || [],
      rawVoiceMemo: payload.rawVoiceMemo || payload.transcript || null,
      aiSummary: payload.summary || payload.aiSummary || null,
      missingFields: payload.missing_fields || payload.missingFields || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.unshift(newLead);

    // Otomatik olarak yeni talebi mevcut portföy ile eşleştir
    const matches = findMatchingPropertiesForLead(newLead, properties, 40);

    res.status(201).json({
      success: true,
      lead: newLead,
      matches,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 3. Talepleri Getir
 */
app.get('/api/leads', (_req: Request, res: Response) => {
  res.json({ leads });
});

/**
 * 4. Portföy Mülklerini Getir
 */
app.get('/api/properties', (_req: Request, res: Response) => {
  res.json({ properties });
});

/**
 * 5. Yeni Portföy Ekle ve Anında Taleplerle Eşleştir
 */
app.post('/api/properties', (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const newProperty: PortfolioProperty = {
      id: `prop-${Date.now()}`,
      title: payload.title || 'Yeni Portföy',
      description: payload.description || '',
      propertyType: payload.propertyType || 'APARTMENT',
      listingType: payload.listingType || 'FOR_SALE',
      price: Number(payload.price) || 5000000,
      currency: payload.currency || 'TRY',
      isMortgageEligible: payload.isMortgageEligible ?? true,
      city: payload.city || 'Bursa',
      district: payload.district || 'Nilüfer',
      neighborhood: payload.neighborhood || 'Özlüce',
      addressDetail: payload.addressDetail || '',
      roomCount: payload.roomCount || '3+1',
      grossSqm: Number(payload.grossSqm) || 130,
      netSqm: Number(payload.netSqm) || 115,
      buildingAge: Number(payload.buildingAge) || 2,
      features: payload.features || ['asansor', 'otopark', 'balkon'],
      images: payload.images || ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop'],
      ownerName: payload.ownerName || 'Mülk Sahibi',
      ownerPhone: payload.ownerPhone || '+90 532 000 00 00',
      ownerNotes: payload.ownerNotes || '',
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    properties.unshift(newProperty);

    // Yeni mülk için eşleşen talepleri anında bul
    const matchingLeads = findMatchingLeadsForProperty(newProperty, leads, 40);

    res.status(201).json({
      success: true,
      property: newProperty,
      matches: matchingLeads,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 6. Akıllı Eşleştirme Motoru Sorgu API
 * Belirli bir mülk veya talep için eşleşme sonuçlarını hesaplar
 */
app.post('/api/calculate-match', (req: Request, res: Response) => {
  try {
    const { propertyId, leadId } = req.body;
    const property = properties.find((p) => p.id === propertyId);
    const lead = leads.find((l) => l.id === leadId);

    if (!property || !lead) {
      res.status(404).json({ error: 'Portföy veya Talep bulunamadı.' });
      return;
    }

    const matchResult = calculateMatchScore(property, lead);
    res.json({ success: true, match: matchResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 7. Sıfırla ve Örnek Verilere Dön
 */
app.post('/api/reset-data', (_req: Request, res: Response) => {
  leads = [...INITIAL_LEADS];
  properties = [...INITIAL_PROPERTIES];
  res.json({ success: true, message: 'Veriler varsayılana sıfırlandı.' });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KolayEmlak server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
