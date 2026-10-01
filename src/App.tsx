// src/App.tsx
import React, { useState, useEffect } from 'react';
import {
  Mic,
  Sparkles,
  Building,
  Code2,
  RefreshCw,
  Layers,
  Menu,
  X,
  ChevronRight,
  UserCheck,
  Zap,
  SlidersHorizontal,
  FolderGit2,
} from 'lucide-react';
import { VoiceParserTab } from './components/VoiceParserTab';
import { MatchingEngineTab } from './components/MatchingEngineTab';
import { DatabaseSchemaTab } from './components/DatabaseSchemaTab';
import { PortfolioTab } from './components/PortfolioTab';
import { Lead, PortfolioProperty } from './types/crm';
import { INITIAL_LEADS, INITIAL_PROPERTIES } from './data/seedData';

type TabKey = 'voice' | 'matching' | 'portfolio' | 'architecture';

interface NavItem {
  key: TabKey;
  label: string;
  shortDesc: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('voice');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [properties, setProperties] = useState<PortfolioProperty[]>(INITIAL_PROPERTIES);
  const [targetLeadIdForMatching, setTargetLeadIdForMatching] = useState<string | null>(null);

  // Fetch initial data from server if available
  useEffect(() => {
    fetch('/api/leads')
      .then((res) => res.json())
      .then((data) => {
        if (data.leads && data.leads.length > 0) setLeads(data.leads);
      })
      .catch((err) => console.log('Using local fallback leads:', err));

    fetch('/api/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.properties && data.properties.length > 0) setProperties(data.properties);
      })
      .catch((err) => console.log('Using local fallback properties:', err));
  }, []);

  const handleLeadCreated = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleNavigateToMatching = (leadId: string) => {
    setTargetLeadIdForMatching(leadId);
    setActiveTab('matching');
    setIsSidebarOpen(false);
  };

  const handleAddNewProperty = async (propData: Partial<PortfolioProperty>) => {
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propData),
      });
      const data = await res.json();
      if (data.property) {
        setProperties((prev) => [data.property, ...prev]);
      }
    } catch {
      const localProp: PortfolioProperty = {
        id: `prop-${Date.now()}`,
        title: propData.title || 'Yeni Portföy',
        description: propData.description || '',
        propertyType: propData.propertyType || 'APARTMENT',
        listingType: propData.listingType || 'FOR_SALE',
        price: propData.price || 6000000,
        currency: 'TRY',
        isMortgageEligible: propData.isMortgageEligible ?? true,
        city: propData.city || 'Bursa',
        district: propData.district || 'Nilüfer',
        neighborhood: propData.neighborhood || 'Özlüce',
        roomCount: propData.roomCount || '3+1',
        grossSqm: propData.grossSqm || 140,
        netSqm: propData.netSqm || 120,
        features: propData.features || ['asansor', 'otopark'],
        images: [],
        ownerName: propData.ownerName || 'Mülk Sahibi',
        ownerPhone: propData.ownerPhone || '+90 532 000 00 00',
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProperties((prev) => [localProp, ...prev]);
    }
  };

  const handleResetData = async () => {
    try {
      await fetch('/api/reset-data', { method: 'POST' });
    } catch {}
    setLeads([...INITIAL_LEADS]);
    setProperties([...INITIAL_PROPERTIES]);
  };

  const navItems: NavItem[] = [
    {
      key: 'voice',
      label: 'Sesli Not (Voice-to-CRM)',
      shortDesc: 'Konuşmadan yapılandırılmış müşteri kartı',
      icon: Mic,
      badge: 'AI Aktif',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    {
      key: 'matching',
      label: 'Akıllı Eşleştirme Motoru',
      shortDesc: 'Portföy & talep 4 kademeli uyum',
      icon: Sparkles,
      badge: '0-100%',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      key: 'portfolio',
      label: 'Portföy & Talepler',
      shortDesc: `${properties.length} Mülk • ${leads.length} Talep`,
      icon: Layers,
      badge: `${properties.length + leads.length}`,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      key: 'architecture',
      label: 'Mimari & Kod Blokları',
      shortDesc: 'Prisma, Gemini şeması & TS Motoru',
      icon: Code2,
      badge: 'Prisma/TS',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  ];

  const currentTabInfo = navItems.find((n) => n.key === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
      {/* ------------------------------------------------------------- */}
      {/* MOBILE TOP BAR (Small screens only) */}
      {/* ------------------------------------------------------------- */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-15 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">KolayEmlak</span>
              <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                MVP
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetData}
          title="Verileri Sıfırla"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE BACKDROP OVERLAY */}
      {/* ------------------------------------------------------------- */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR (Desktop Fixed, Mobile Drawer) */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen w-72 lg:w-80 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-250 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header & Brand */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-lg tracking-tight text-slate-900">KolayEmlak</h1>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                    MVP
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Saha Danışmanı Akıllı CRM</p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Real Estate Agent Card */}
          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0 font-bold text-xs">
              EA
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">Saha Danışmanı</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 truncate">Bursa Nilüfer Bölgesi</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5">
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Ana Menü
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 relative group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-emerald-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-xs sm:text-sm tracking-tight truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] line-clamp-1 ${
                      isActive ? 'text-emerald-100' : 'text-slate-600'
                    }`}
                  >
                    {item.shortDesc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Quick Metrics Widget in Sidebar */}
          <div className="mt-6 pt-4 border-t border-slate-100 px-3 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Sistem Durumu (Canlı)
            </span>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-600 block">Portföy</span>
                <span className="font-extrabold text-slate-900 text-sm">{properties.length} Mülk</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-600 block">Talepler</span>
                <span className="font-extrabold text-emerald-700 text-sm">{leads.length} Aktif</span>
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Gemini 3.8 Flash</span>
              </div>
              <p className="text-emerald-700 leading-tight">
                Server-side Structured Output & Function Calling hazır.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={handleResetData}
            title="Örnek verileri sıfırla"
            className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Örnek Verileri Sıfırla</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Breadcrumb & Context Header for Current Tab */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span className="font-semibold text-slate-900">KolayEmlak</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-emerald-600">{currentTabInfo?.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Saha Modu Aktif</span>
            </div>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'voice' && (
            <VoiceParserTab
              onLeadCreated={handleLeadCreated}
              onNavigateToMatching={handleNavigateToMatching}
            />
          )}

          {activeTab === 'matching' && (
            <MatchingEngineTab
              leads={leads}
              properties={properties}
              selectedLeadId={targetLeadIdForMatching}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioTab
              properties={properties}
              leads={leads}
              onAddNewProperty={handleAddNewProperty}
              onSelectPropertyForMatching={(_propId) => {
                setActiveTab('matching');
              }}
              onSelectLeadForMatching={(leadId) => {
                setTargetLeadIdForMatching(leadId);
                setActiveTab('matching');
              }}
            />
          )}

          {activeTab === 'architecture' && <DatabaseSchemaTab />}
        </div>
      </main>
    </div>
  );
}
