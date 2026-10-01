// src/components/VoiceParserTab.tsx
import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Copy, Check, Clock, MapPin, DollarSign, Home, Phone, User, ShieldAlert } from 'lucide-react';
import { VoiceMemoParsedResult, Lead } from '../types/crm';

interface VoiceParserTabProps {
  onLeadCreated: (lead: Lead) => void;
  onNavigateToMatching: (leadId: string) => void;
}

const SAMPLE_VOICE_MEMOS = [
  {
    title: "Örnek 1 (Kullanıcı Talebi)",
    text: "Ahmet Çelik aradı, Nilüfer Özlüce'de 6-7 milyona kadar krediye uygun 3+1 arıyor, kasıma kadar taşınmalı",
  },
  {
    title: "Örnek 2 (Nakit & Acil)",
    text: "Selin Yılmaz aradı, 23 Nisan veya Özlüce taraflarında nakit peşin 6.5 milyona kadar 2+1 veya 3+1 arıyor. Çok acil, ev sahibi tahliye davası açmış bu ay çıkmalı.",
  },
  {
    title: "Örnek 3 (Villa & Takas)",
    text: "Caner Demir aradı, Bademli veya Balat civarında müstakil bahçeli villa bakıyor. Bütçesi 14-15 milyon TL, kısmi lüks araç takasına da açık.",
  },
];

export const VoiceParserTab: React.FC<VoiceParserTabProps> = ({ onLeadCreated, onNavigateToMatching }) => {
  const [transcript, setTranscript] = useState(SAMPLE_VOICE_MEMOS[0].text);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<VoiceMemoParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedLead, setSavedLead] = useState<Lead | null>(null);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  // Web Speech API for real-time mobile voice dictation
  const handleToggleRecord = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tarayıcınız Web Speech API ses tanımayı desteklemiyor. Metin kutusunu veya örnekleri kullanabilirsiniz.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
      setError(`Mikrofon hatası: ${event.error}. Lütfen manuel olarak yazınız.`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError('Lütfen bir sesli not metni girin veya konuşun.');
      return;
    }

    setLoading(true);
    setError(null);
    setSavedLead(null);

    try {
      const res = await fetch('/api/parse-voice-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ayrıştırma başarısız oldu.');
      }

      setParsedResult(data.data);
    } catch (err: any) {
      console.error('Parse error:', err);
      setError(err.message || 'Sunucu ile bağlantı kurulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCRM = async () => {
    if (!parsedResult) return;
    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsedResult,
          transcript,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Talep kaydedilemedi.');
      }

      setSavedLead(data.lead);
      onLeadCreated(data.lead);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestion(text);
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner for Real Estate Agents */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sıfır Form Hamallığı • Voice-to-CRM</span>
            </div>
            <h2 className="text-xl font-bold">Sahadayken Sesli Not Bırakın, AI Müşteri Kartını Açsın</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Arabada veya müşteri görüşmesinden çıkarken 10 saniye konuşun. Gemini Structured Output bütçeyi, krediyi, lokasyonu ve eksik kalan bilgileri anında ayıklasın.
            </p>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-2">
          <span className="text-xs text-emerald-100 font-medium">Hızlı Örnekler:</span>
          {SAMPLE_VOICE_MEMOS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTranscript(sample.text);
                setParsedResult(null);
                setSavedLead(null);
              }}
              className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 text-white font-medium"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Voice / Text Input Box */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span>Danışman Ses Dökümü / Notu</span>
          </label>
          <span className="text-xs text-gray-600">Tek tıkla ses kaydedin veya yazın</span>
        </div>

        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            className="w-full p-4 pr-16 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-900 text-sm sm:text-base leading-relaxed resize-none transition-all placeholder:text-gray-600"
            placeholder="Örn: Ahmet Çelik aradı, Nilüfer Özlüce'de 6-7 milyona kadar krediye uygun 3+1 arıyor, kasıma kadar taşınmalı..."
          />

          <button
            onClick={handleToggleRecord}
            className={`absolute right-3 top-3 p-3 rounded-full transition-all shadow-md ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
            }`}
            title={isRecording ? 'Kaydı Durdur' : 'Mikrofonla Sesli Söyle'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-rose-600 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Dinleniyor... Konuşmanızı tamamlayınca mikrofonu durdurun.</span>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600">
            Model: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">gemini-3.8-flash</code> (Server-side Structured Output)
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading || !transcript.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Analiz Ediliyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Sesli Notu Ayrıştır (Structured JSON)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structured Output Visualization */}
      {parsedResult && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Ayrıştırılmış Müşteri Talebi</h3>
                <p className="text-xs text-gray-600">Yapay zeka güven skoru: %{parsedResult.confidence_score}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                parsedResult.urgency_level === 'URGENT' || parsedResult.urgency_level === 'HIGH'
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                ⚡ {parsedResult.urgency_level === 'URGENT' ? 'ÇOK ACİL' : parsedResult.urgency_level === 'HIGH' ? 'YÜKSEK ACİLİYET' : 'STANDART'}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-5">
            {/* Quick Summary */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">AI Özeti</span>
              <p className="text-sm font-medium text-gray-800">{parsedResult.summary}</p>
            </div>

            {/* Extracted Entity Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Customer */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Müşteri Adı</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {parsedResult.customer_name || <span className="text-rose-500 font-normal italic">Belirtilmedi</span>}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{parsedResult.customer_phone || <span className="text-amber-600">Telefon eksik</span>}</span>
                </div>
              </div>

              {/* Location */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Hedef Lokasyon</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {parsedResult.preferred_locations.length > 0 ? (
                    parsedResult.preferred_locations.map((loc, i) => (
                      <span key={i}>
                        {loc.district} {loc.neighborhood ? `(${loc.neighborhood})` : ''} - {loc.city}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-600">Fark etmez</span>
                  )}
                </div>
                <div className="text-xs text-emerald-600 mt-1 font-medium">
                  {parsedResult.property_type} • {parsedResult.listing_type === 'FOR_SALE' ? 'Satılık' : 'Kiralık'}
                </div>
              </div>

              {/* Budget */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Bütçe Aralığı</span>
                </div>
                <div className="font-bold text-emerald-700 text-sm">
                  {parsedResult.min_budget ? `${(parsedResult.min_budget / 1000000).toFixed(1)}M - ` : ''}
                  {parsedResult.max_budget ? `${(parsedResult.max_budget / 1000000).toFixed(1)}M TL` : 'Belirtilmedi'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Ödeme: <span className="font-semibold text-gray-700">{parsedResult.payment_method === 'MORTGAGE' ? 'Konut Kredisi' : parsedResult.payment_method}</span>
                </div>
              </div>

              {/* Room & Target Date */}
              <div className="p-3.5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>Oda & Zaman</span>
                </div>
                <div className="font-bold text-gray-900 text-sm">
                  {parsedResult.room_count || 'Belirtilmedi'}
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Hedef: {parsedResult.target_date || 'En kısa sürede'}</span>
                </div>
              </div>
            </div>

            {/* Must Have Features Badges */}
            {parsedResult.must_have_features.length > 0 && (
              <div>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                  Aranan Zorunlu Kriterler
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedResult.must_have_features.map((feat, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Fields Detection (CRITICAL MVP REQUIREMENT) */}
            {parsedResult.missing_fields && parsedResult.missing_fields.length > 0 && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Tespit Edilen Eksik Bilgiler ({parsedResult.missing_fields.length} Adet)</span>
                </div>
                <p className="text-xs text-amber-700">
                  Müşteriyi kaçırmamak ve doğru portföy sunmak için bu bilgileri netleştirmeniz tavsiye edilir:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedResult.missing_fields.map((field, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-semibold"
                    >
                      ⚠️ {field}
                    </span>
                  ))}
                </div>

                {/* Suggested Follow-up Questions for the Agent */}
                {parsedResult.suggested_follow_up_questions?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-200/60">
                    <span className="text-xs font-bold text-amber-900 block mb-1.5">
                      Danışmana Önerilen Takip Soruları (Tıkla ve Kopyala):
                    </span>
                    <div className="space-y-1.5">
                      {parsedResult.suggested_follow_up_questions.map((q, idx) => (
                        <div
                          key={idx}
                          onClick={() => copyToClipboard(q)}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 text-xs text-gray-800 cursor-pointer hover:bg-amber-50/50 transition-colors"
                        >
                          <span>"{q}"</span>
                          <button className="text-gray-600 hover:text-emerald-600 shrink-0 ml-2">
                            {copiedQuestion === q ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              {savedLead ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Talep CRM'e Kaydedildi!
                  </span>
                  <button
                    onClick={() => onNavigateToMatching(savedLead.id)}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>Portföy Eşleşmelerini Gör</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSaveToCRM}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Talebi CRM'e Kaydet ve Eşleşmeleri Bul</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
