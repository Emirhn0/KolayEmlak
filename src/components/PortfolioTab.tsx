// src/components/PortfolioTab.tsx
import React, { useState } from 'react';
import { PortfolioProperty, Lead } from '../types/crm';
import { Building, User, Plus, MapPin, DollarSign, Home, Phone, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PortfolioTabProps {
  properties: PortfolioProperty[];
  leads: Lead[];
  onAddNewProperty: (prop: Partial<PortfolioProperty>) => void;
  onSelectPropertyForMatching: (propId: string) => void;
  onSelectLeadForMatching: (leadId: string) => void;
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({
  properties,
  leads,
  onAddNewProperty,
  onSelectPropertyForMatching,
  onSelectLeadForMatching,
}) => {
  const [subTab, setSubTab] = useState<'PROPERTIES' | 'LEADS'>('PROPERTIES');
  const [showAddModal, setShowAddModal] = useState(false);

  // New property form state
  const [newTitle, setNewTitle] = useState('');
  const [newCity, setNewCity] = useState('Bursa');
  const [newDistrict, setNewDistrict] = useState('Nilüfer');
  const [newNeighborhood, setNewNeighborhood] = useState('Özlüce');
  const [newPrice, setNewPrice] = useState('6800000');
  const [newRoom, setNewRoom] = useState('3+1');
  const [newGrossSqm, setNewGrossSqm] = useState('145');
  const [newIsMortgage, setNewIsMortgage] = useState(true);
  const [newOwnerName, setNewOwnerName] = useState('Ali Kaya');
  const [newOwnerPhone, setNewOwnerPhone] = useState('+90 533 123 45 67');

  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNewProperty({
      title: newTitle || `${newNeighborhood} ${newRoom} Satılık Daire`,
      city: newCity,
      district: newDistrict,
      neighborhood: newNeighborhood,
      price: Number(newPrice),
      roomCount: newRoom,
      grossSqm: Number(newGrossSqm),
      netSqm: Math.round(Number(newGrossSqm) * 0.85),
      isMortgageEligible: newIsMortgage,
      ownerName: newOwnerName,
      ownerPhone: newOwnerPhone,
      features: ['asansor', 'otopark', 'balkon', newIsMortgage ? 'krediye_uygun' : 'krediye_uygun_degil'],
    });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
          <button
            onClick={() => setSubTab('PROPERTIES')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              subTab === 'PROPERTIES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Portföy Mülkleri ({properties.length})</span>
          </button>
          <button
            onClick={() => setSubTab('LEADS')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              subTab === 'LEADS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Müşteri Talepleri ({leads.length})</span>
          </button>
        </div>

        {subTab === 'PROPERTIES' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Portföy Ekle</span>
          </button>
        )}
      </div>

      {/* Properties List */}
      {subTab === 'PROPERTIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                    {prop.district} / {prop.neighborhood}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                    prop.isMortgageEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {prop.isMortgageEligible ? 'Krediye Uygun' : 'Krediye Uygun Değil'}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-1">{prop.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{prop.description}</p>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl text-xs mb-3">
                  <div>
                    <span className="text-gray-600 block text-[11px]">Oda</span>
                    <span className="font-bold text-gray-900">{prop.roomCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[11px]">Metrekare</span>
                    <span className="font-bold text-gray-900">{prop.grossSqm} m² Brüt</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[11px]">Bina Yaşı</span>
                    <span className="font-bold text-gray-900">{prop.buildingAge === 0 ? 'Sıfır' : `${prop.buildingAge} Yıl`}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-600" />
                    <span>Mülk Sahibi: {prop.ownerName}</span>
                  </span>
                  <span className="text-gray-600 font-mono">{prop.ownerPhone}</span>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-600 block">Fiyat</span>
                  <span className="text-base font-bold text-emerald-600">
                    {prop.price.toLocaleString('tr-TR')} TL
                  </span>
                </div>
                <button
                  onClick={() => onSelectPropertyForMatching(prop.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Talepleri Eşleştir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leads List */}
      {subTab === 'LEADS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-base">{lead.fullName}</h3>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      lead.urgencyLevel === 'URGENT' ? 'bg-rose-100 text-rose-700' : lead.urgencyLevel === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {lead.urgencyLevel === 'URGENT' ? 'ÇOK ACİL' : lead.urgencyLevel === 'HIGH' ? 'YÜKSEK' : 'NORMAL'}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">
                    {(lead.maxBudget / 1000000).toFixed(1)}M TL
                  </span>
                </div>

                <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2.5 rounded-xl italic">
                  "{lead.aiSummary || lead.rawVoiceMemo}"
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-600 block text-[11px]">Hedef Lokasyon:</span>
                    <span className="font-semibold text-gray-800">
                      {lead.preferredDistricts.join(', ')} {lead.preferredNeighborhoods.length > 0 ? `(${lead.preferredNeighborhoods.join(', ')})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-[11px]">Oda & Ödeme:</span>
                    <span className="font-semibold text-gray-800">
                      {lead.roomCounts.join(', ')} • {lead.paymentMethod === 'MORTGAGE' ? 'Kredili' : lead.paymentMethod}
                    </span>
                  </div>
                </div>

                {lead.missingFields && lead.missingFields.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg mb-3">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Eksik: {lead.missingFields.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-600" />
                  <span>{lead.phoneNumber || 'Telefon yok'}</span>
                </span>
                <button
                  onClick={() => onSelectLeadForMatching(lead.id)}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Portföy Eşleştir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Yeni Portföy Mülkü Ekle</h3>
            <form onSubmit={handleCreateProperty} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Mülk Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Özlüce Bulvarında 3+1 Lüks Daire"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">İlçe</label>
                  <input
                    type="text"
                    required
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mahalle</label>
                  <input
                    type="text"
                    required
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fiyat (TL)</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Oda Sayısı</label>
                  <select
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
                  >
                    <option value="1+1">1+1</option>
                    <option value="2+1">2+1</option>
                    <option value="3+1">3+1</option>
                    <option value="4+1">4+1</option>
                    <option value="5+1">5+1</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Brüt m²</label>
                  <input
                    type="number"
                    value={newGrossSqm}
                    onChange={(e) => setNewGrossSqm(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={newIsMortgage}
                    onChange={(e) => setNewIsMortgage(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Banka Konut Kredisine Uygun</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mülk Sahibi Adı</label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mülk Sahibi Telefonu</label>
                  <input
                    type="text"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold hover:bg-gray-50 text-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Portföyü Kaydet ve Eşleştir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
