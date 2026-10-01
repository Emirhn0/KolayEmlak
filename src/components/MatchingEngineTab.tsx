// src/components/MatchingEngineTab.tsx
import React, { useState } from 'react';
import { Lead, PortfolioProperty, MatchResult } from '../types/crm';
import { calculateMatchScore, findMatchingLeadsForProperty, findMatchingPropertiesForLead } from '../services/matchingEngine';
import { CheckCircle2, AlertTriangle, Building, User, Sparkles, TrendingUp, DollarSign, MapPin, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface MatchingEngineTabProps {
  leads: Lead[];
  properties: PortfolioProperty[];
  selectedLeadId?: string | null;
}

export const MatchingEngineTab: React.FC<MatchingEngineTabProps> = ({
  leads,
  properties,
  selectedLeadId: initialLeadId,
}) => {
  const [mode, setMode] = useState<'PROPERTY_TO_LEADS' | 'LEAD_TO_PROPERTIES'>('PROPERTY_TO_LEADS');
  const [selectedPropId, setSelectedPropId] = useState<string>(properties[0]?.id || '');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || leads[0]?.id || '');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Selected items
  const activeProperty = properties.find((p) => p.id === selectedPropId) || properties[0];
  const activeLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Calculate matches dynamically based on active selection
  const propertyMatches: MatchResult[] = activeProperty
    ? findMatchingLeadsForProperty(activeProperty, leads, 20)
    : [];

  const leadMatches: MatchResult[] = activeLead
    ? findMatchingPropertiesForLead(activeLead, properties, 20)
    : [];

  const currentMatches = mode === 'PROPERTY_TO_LEADS' ? propertyMatches : leadMatches;

  return (
    <div className="space-y-6">
      {/* Header and Mode Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Akıllı Eşleştirme Motoru • 4 Kademeli Uyum</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Portföy & Talep Eşleştirme Simülatörü</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Ağırlıklar: Bütçe (%35) + Lokasyon (%30) + Oda & Tip (%20) + Kredi & Nitelikler (%15)
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
            <button
              onClick={() => setMode('PROPERTY_TO_LEADS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'PROPERTY_TO_LEADS'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Portföye Müşteri Bul</span>
            </button>
            <button
              onClick={() => setMode('LEAD_TO_PROPERTIES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'LEAD_TO_PROPERTIES'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Talebe Mülk Bul</span>
            </button>
          </div>
        </div>

        {/* Source Entity Selector */}
        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
              {mode === 'PROPERTY_TO_LEADS' ? 'Taranacak Portföy Mülkü Seçin' : 'Eşleştirilecek Müşteri Talebi Seçin'}
            </label>
            {mode === 'PROPERTY_TO_LEADS' ? (
              <select
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.district} / {p.neighborhood} • {p.roomCount} • {(p.price / 1000000).toFixed(2)}M TL
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} • {l.roomCounts.join('/')} • {(l.maxBudget / 1000000).toFixed(1)}M TL ({l.preferredNeighborhoods[0] || l.preferredDistricts[0]})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Active Item Mini Preview Card */}
          <div className="md:col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {mode === 'PROPERTY_TO_LEADS' && activeProperty && (
              <>
                <div>
                  <span className="font-bold text-gray-900 text-sm block">{activeProperty.title}</span>
                  <div className="text-gray-600 mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-600" /> {activeProperty.city}, {activeProperty.district} ({activeProperty.neighborhood})</span>
                    <span>• {activeProperty.roomCount}</span>
                    <span>• {activeProperty.netSqm} m² Net</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-600 block">
                    {activeProperty.price.toLocaleString('tr-TR')} TL
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${activeProperty.isMortgageEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {activeProperty.isMortgageEligible ? 'Krediye Uygun' : 'Krediye Uygun Değil'}
                  </span>
                </div>
              </>
            )}

            {mode === 'LEAD_TO_PROPERTIES' && activeLead && (
              <>
                <div>
                  <span className="font-bold text-gray-900 text-sm block">{activeLead.fullName}</span>
                  <div className="text-gray-600 mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-600" /> {activeLead.preferredDistricts.join(', ')} ({activeLead.preferredNeighborhoods.join(', ')})</span>
                    <span>• {activeLead.roomCounts.join(', ')}</span>
                    <span>• {activeLead.paymentMethod}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-600 block">
                    Maks: {activeLead.maxBudget.toLocaleString('tr-TR')} TL
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    activeLead.urgencyLevel === 'URGENT' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {activeLead.urgencyLevel === 'URGENT' ? 'ÇOK ACİL' : activeLead.urgencyLevel === 'HIGH' ? 'YÜKSEK ACİL' : 'NORMAL'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Matching Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>Eşleşme Sonuçları</span>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
              {currentMatches.length} Bulundu
            </span>
          </h3>
          <span className="text-xs text-gray-600">Uyum skoruna ve aciliyete göre sıralanmıştır</span>
        </div>

        {currentMatches.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-200">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Bu kritere uygun eşleşme bulunamadı.</p>
            <p className="text-xs text-gray-600 mt-1">Eşik değerinin altında kalan adaylar filtrelendi.</p>
          </div>
        ) : (
          currentMatches.map((match) => {
            const matchId = mode === 'PROPERTY_TO_LEADS' ? match.leadId : match.propertyId;
            const isExpanded = expandedMatchId === matchId;

            // Score badge color
            let scoreBg = 'bg-rose-50 text-rose-700 border-rose-200';
            let barColor = 'bg-rose-500';
            if (match.overallScore >= 80) {
              scoreBg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
              barColor = 'bg-emerald-500';
            } else if (match.overallScore >= 65) {
              scoreBg = 'bg-teal-50 text-teal-700 border-teal-300';
              barColor = 'bg-teal-500';
            } else if (match.overallScore >= 50) {
              scoreBg = 'bg-amber-50 text-amber-700 border-amber-300';
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={matchId}
                className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all shadow-sm overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Entity Info */}
                    <div className="flex items-start gap-3.5">
                      <div className={`p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[72px] ${scoreBg}`}>
                        <span className="text-2xl font-black">%{match.overallScore}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                          {match.matchGrade === 'EXCELLENT' ? 'MÜKEMMEL' : match.matchGrade === 'HIGH' ? 'YÜKSEK' : match.matchGrade === 'MODERATE' ? 'ORTA' : 'DÜŞÜK'}
                        </span>
                      </div>

                      <div>
                        {mode === 'PROPERTY_TO_LEADS' ? (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-900 text-base">{match.lead?.fullName}</h4>
                              {match.breakdown.urgencyBoostApplied && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md text-[11px] font-bold">
                                  ⚡ ACİL MÜŞTERİ
                                </span>
                              )}
                              <span className="text-xs text-gray-600">
                                {match.lead?.phoneNumber || 'Telefon kayıtlı değil'}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1">
                              Aranan: <span className="font-semibold text-gray-800">{match.lead?.preferredDistricts.join(', ')} ({match.lead?.preferredNeighborhoods.join(', ')})</span> • Oda: <span className="font-semibold text-gray-800">{match.lead?.roomCounts.join(', ')}</span> • Bütçe: <span className="font-semibold text-emerald-600">{(match.lead!.maxBudget / 1000000).toFixed(1)}M TL</span>
                            </p>

                            <p className="text-xs text-gray-600 mt-1 italic">
                              "{match.lead?.aiSummary || match.lead?.rawVoiceMemo}"
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-900 text-base">{match.property?.title}</h4>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${match.property?.isMortgageEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {match.property?.isMortgageEligible ? 'Krediye Uygun' : 'Krediye Uygun Değil'}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1">
                              Konum: <span className="font-semibold text-gray-800">{match.property?.district} / {match.property?.neighborhood}</span> • {match.property?.roomCount} • {match.property?.netSqm} m² Net • Fiyat: <span className="font-semibold text-emerald-600">{match.property?.price.toLocaleString('tr-TR')} TL</span>
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                              Mülk Sahibi: {match.property?.ownerName} ({match.property?.ownerPhone})
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Action & Breakdown Toggle */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : matchId)}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Skor Kırılımı</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 4 Score Breakdown Progress Bars */}
                  <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between text-gray-600 mb-1">
                        <span>Bütçe (%35)</span>
                        <span className="font-bold text-gray-900">%{match.breakdown.budgetScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${match.breakdown.budgetScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-600 mb-1">
                        <span>Lokasyon (%30)</span>
                        <span className="font-bold text-gray-900">%{match.breakdown.locationScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${match.breakdown.locationScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-600 mb-1">
                        <span>Oda / Tip (%20)</span>
                        <span className="font-bold text-gray-900">%{match.breakdown.roomScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${match.breakdown.roomScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-600 mb-1">
                        <span>Nitelik & Kredi (%15)</span>
                        <span className="font-bold text-gray-900">%{match.breakdown.featureScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${match.breakdown.featureScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detailed Reasons */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 animate-fadeIn">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                        Algoritma Gerekçe ve Analiz Raporu:
                      </span>
                      <ul className="space-y-1.5 text-xs text-gray-700">
                        {match.reasons.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>

                      {match.missingFeatures && match.missingFeatures.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-rose-600 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Eksik Nitelikler: {match.missingFeatures.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
