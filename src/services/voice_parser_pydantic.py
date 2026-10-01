# src/services/voice_parser_pydantic.py
"""
KolayEmlak - Voice-to-CRM Pydantic & Gemini Function Calling Schema (Python / FastAPI)
Gayrimenkul saha danışmanının ses dökümlerini ayrıştıran Pydantic modelleri.
"""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class PropertyTypeEnum(str, Enum):
    APARTMENT = "APARTMENT"
    RESIDENCE = "RESIDENCE"
    VILLA = "VILLA"
    COMMERCIAL = "COMMERCIAL"
    LAND = "LAND"

class ListingTypeEnum(str, Enum):
    FOR_SALE = "FOR_SALE"
    FOR_RENT = "FOR_RENT"

class PaymentMethodEnum(str, Enum):
    CASH = "CASH"
    MORTGAGE = "MORTGAGE"
    TRADE_IN = "TRADE_IN"
    INSTALLMENT = "INSTALLMENT"
    UNSPECIFIED = "UNSPECIFIED"

class UrgencyLevelEnum(str, Enum):
    URGENT = "URGENT"    # Bu ay / derhal
    HIGH = "HIGH"        # 1-2 ay içinde
    MEDIUM = "MEDIUM"    # 3-6 ay içinde
    LOW = "LOW"          # Acelesi yok / yatırımcı

class LocationPreference(BaseModel):
    city: str = Field(description="İl adı (Örn: Bursa, İstanbul, Ankara)")
    district: str = Field(description="İlçe adı (Örn: Nilüfer, Kadıköy, Çankaya)")
    neighborhood: Optional[str] = Field(default=None, description="Mahalle veya semt adı (Örn: Özlüce, Moda, Balat)")

class VoiceMemoParsedLead(BaseModel):
    """
    Saha danışmanının ses dökümünden çıkarılan standart Müşteri / Talep JSON şeması.
    """
    customer_name: Optional[str] = Field(
        default=None, 
        description="Müşterinin adı soyadı (örn: 'Ahmet Çelik'). Bulunamadıysa null."
    )
    customer_phone: Optional[str] = Field(
        default=None, 
        description="Müşteri telefon numarası. Metinde geçmiyorsa null."
    )
    preferred_locations: List[LocationPreference] = Field(
        default_factory=list, 
        description="Aranan lokasyon listesi (İl, İlçe, Mahalle)"
    )
    property_type: PropertyTypeEnum = Field(
        default=PropertyTypeEnum.APARTMENT, 
        description="Gayrimenkul türü"
    )
    listing_type: ListingTypeEnum = Field(
        default=ListingTypeEnum.FOR_SALE, 
        description="İşlem türü (Satılık / Kiralık)"
    )
    room_count: Optional[str] = Field(
        default=None, 
        description="Oda sayısı (örn: '3+1', '2+1', '4+1')"
    )
    min_budget: Optional[float] = Field(
        default=None, 
        description="Minimum bütçe (TL). Örn: '6-7 milyon' için 6_000_000"
    )
    max_budget: float = Field(
        description="Maksimum bütçe (TL). Örn: '6-7 milyon' için 7_000_000"
    )
    currency: str = Field(
        default="TRY", 
        description="Para birimi (TRY, USD, EUR)"
    )
    payment_method: PaymentMethodEnum = Field(
        default=PaymentMethodEnum.UNSPECIFIED, 
        description="Ödeme türü (Krediye uygun arıyorsa MORTGAGE)"
    )
    urgency_level: UrgencyLevelEnum = Field(
        default=UrgencyLevelEnum.MEDIUM, 
        description="Aciliyet düzeyi"
    )
    target_date: Optional[str] = Field(
        default=None, 
        description="Hedef taşınma veya satın alma ayı/tarihi (örn: 'Kasım 2026')"
    )
    must_have_features: List[str] = Field(
        default_factory=list, 
        description="Olmazsa olmaz özellikler (örn: ['krediye_uygun', 'asansor', 'site_ici'])"
    )
    notes: Optional[str] = Field(
        default=None, 
        description="Danışmanın dikkat etmesi gereken özel detaylar"
    )
    summary: str = Field(
        description="Saha danışmanı için tek cümlelik net özet"
    )
    missing_fields: List[str] = Field(
        default_factory=list, 
        description="Metinde tespit edilemeyen kritik eksik alanlar (örn: ['customer_phone', 'min_budget'])"
    )
    suggested_follow_up_questions: List[str] = Field(
        default_factory=list, 
        description="Danışmanın müşteriye eksik bilgileri tamamlamak için sorabileceği öneri sorular"
    )
    confidence_score: float = Field(
        ge=0.0, 
        le=100.0, 
        description="AI ayrıştırma güven skoru (0-100)"
    )
