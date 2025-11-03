// قائمة العملات العالمية مع معلوماتها الكاملة
// ISO 4217 Currency Codes with Arabic and English names

export interface CurrencyInfo {
  code: string; // ISO 4217 code (e.g., USD, EUR, GBP)
  nameAr: string; // الاسم بالعربية
  nameEn: string; // Name in English
  symbol: string; // رمز العملة (e.g., $, €, £)
  fractionalUnit: string; // جزء العملة (e.g., سنت, قرش)
  fractionalUnitEn: string; // Fractional unit in English
}

export const WORLD_CURRENCIES: CurrencyInfo[] = [
  // العملات الرئيسية
  {
    code: "USD",
    nameAr: "دولار أمريكي",
    nameEn: "US Dollar",
    symbol: "$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "EUR",
    nameAr: "يورو",
    nameEn: "Euro",
    symbol: "€",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "GBP",
    nameAr: "جنيه إسترليني",
    nameEn: "British Pound",
    symbol: "£",
    fractionalUnit: "بنس",
    fractionalUnitEn: "Penny",
  },
  {
    code: "SAR",
    nameAr: "ريال سعودي",
    nameEn: "Saudi Riyal",
    symbol: "ر.س",
    fractionalUnit: "هللة",
    fractionalUnitEn: "Halala",
  },
  {
    code: "AED",
    nameAr: "درهم إماراتي",
    nameEn: "UAE Dirham",
    symbol: "د.إ",
    fractionalUnit: "فلس",
    fractionalUnitEn: "Fils",
  },
  {
    code: "KWD",
    nameAr: "دينار كويتي",
    nameEn: "Kuwaiti Dinar",
    symbol: "د.ك",
    fractionalUnit: "فلس",
    fractionalUnitEn: "Fils",
  },
  {
    code: "BHD",
    nameAr: "دينار بحريني",
    nameEn: "Bahraini Dinar",
    symbol: "د.ب",
    fractionalUnit: "فلس",
    fractionalUnitEn: "Fils",
  },
  {
    code: "OMR",
    nameAr: "ريال عماني",
    nameEn: "Omani Rial",
    symbol: "ر.ع",
    fractionalUnit: "بيسة",
    fractionalUnitEn: "Baisa",
  },
  {
    code: "QAR",
    nameAr: "ريال قطري",
    nameEn: "Qatari Riyal",
    symbol: "ر.ق",
    fractionalUnit: "درهم",
    fractionalUnitEn: "Dirham",
  },
  {
    code: "JOD",
    nameAr: "دينار أردني",
    nameEn: "Jordanian Dinar",
    symbol: "د.أ",
    fractionalUnit: "قرش",
    fractionalUnitEn: "Piastre",
  },
  {
    code: "LBP",
    nameAr: "ليرة لبنانية",
    nameEn: "Lebanese Pound",
    symbol: "ل.ل",
    fractionalUnit: "قرش",
    fractionalUnitEn: "Piastre",
  },
  {
    code: "EGP",
    nameAr: "جنيه مصري",
    nameEn: "Egyptian Pound",
    symbol: "ج.م",
    fractionalUnit: "قرش",
    fractionalUnitEn: "Piastre",
  },
  {
    code: "IQD",
    nameAr: "دينار عراقي",
    nameEn: "Iraqi Dinar",
    symbol: "ع.د",
    fractionalUnit: "فلس",
    fractionalUnitEn: "Fils",
  },
  {
    code: "YER",
    nameAr: "ريال يمني",
    nameEn: "Yemeni Rial",
    symbol: "﷼",
    fractionalUnit: "فلس",
    fractionalUnitEn: "Fils",
  },
  {
    code: "JPY",
    nameAr: "ين ياباني",
    nameEn: "Japanese Yen",
    symbol: "¥",
    fractionalUnit: "سين",
    fractionalUnitEn: "Sen",
  },
  {
    code: "CNY",
    nameAr: "يوان صيني",
    nameEn: "Chinese Yuan",
    symbol: "¥",
    fractionalUnit: "فن",
    fractionalUnitEn: "Fen",
  },
  {
    code: "INR",
    nameAr: "روبية هندية",
    nameEn: "Indian Rupee",
    symbol: "₹",
    fractionalUnit: "بيزة",
    fractionalUnitEn: "Paisa",
  },
  {
    code: "PKR",
    nameAr: "روبية باكستانية",
    nameEn: "Pakistani Rupee",
    symbol: "₨",
    fractionalUnit: "بيزة",
    fractionalUnitEn: "Paisa",
  },
  {
    code: "TRY",
    nameAr: "ليرة تركية",
    nameEn: "Turkish Lira",
    symbol: "₺",
    fractionalUnit: "قروش",
    fractionalUnitEn: "Kurus",
  },
  {
    code: "CHF",
    nameAr: "فرنك سويسري",
    nameEn: "Swiss Franc",
    symbol: "Fr",
    fractionalUnit: "رابين",
    fractionalUnitEn: "Rappen",
  },
  {
    code: "CAD",
    nameAr: "دولار كندي",
    nameEn: "Canadian Dollar",
    symbol: "C$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "AUD",
    nameAr: "دولار أسترالي",
    nameEn: "Australian Dollar",
    symbol: "A$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "NZD",
    nameAr: "دولار نيوزيلندي",
    nameEn: "New Zealand Dollar",
    symbol: "NZ$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "ZAR",
    nameAr: "راند جنوب أفريقي",
    nameEn: "South African Rand",
    symbol: "R",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "RUB",
    nameAr: "روبل روسي",
    nameEn: "Russian Ruble",
    symbol: "₽",
    fractionalUnit: "كوبيك",
    fractionalUnitEn: "Kopek",
  },
  {
    code: "BRL",
    nameAr: "ريال برازيلي",
    nameEn: "Brazilian Real",
    symbol: "R$",
    fractionalUnit: "سنتافو",
    fractionalUnitEn: "Centavo",
  },
  {
    code: "MXN",
    nameAr: "بيزو مكسيكي",
    nameEn: "Mexican Peso",
    symbol: "$",
    fractionalUnit: "سنتافو",
    fractionalUnitEn: "Centavo",
  },
  {
    code: "ARS",
    nameAr: "بيزو أرجنتيني",
    nameEn: "Argentine Peso",
    symbol: "$",
    fractionalUnit: "سنتافو",
    fractionalUnitEn: "Centavo",
  },
  {
    code: "KRW",
    nameAr: "وون كوري جنوبي",
    nameEn: "South Korean Won",
    symbol: "₩",
    fractionalUnit: "جون",
    fractionalUnitEn: "Jeon",
  },
  {
    code: "SGD",
    nameAr: "دولار سنغافوري",
    nameEn: "Singapore Dollar",
    symbol: "S$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "HKD",
    nameAr: "دولار هونغ كونغ",
    nameEn: "Hong Kong Dollar",
    symbol: "HK$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
  {
    code: "NOK",
    nameAr: "كرونة نرويجية",
    nameEn: "Norwegian Krone",
    symbol: "kr",
    fractionalUnit: "أوري",
    fractionalUnitEn: "Ore",
  },
  {
    code: "SEK",
    nameAr: "كرونة سويدية",
    nameEn: "Swedish Krona",
    symbol: "kr",
    fractionalUnit: "أوري",
    fractionalUnitEn: "Ore",
  },
  {
    code: "DKK",
    nameAr: "كرونة دنماركية",
    nameEn: "Danish Krone",
    symbol: "kr",
    fractionalUnit: "أوري",
    fractionalUnitEn: "Ore",
  },
  {
    code: "PLN",
    nameAr: "زلوتي بولندي",
    nameEn: "Polish Zloty",
    symbol: "zł",
    fractionalUnit: "جروش",
    fractionalUnitEn: "Grosz",
  },
  {
    code: "CZK",
    nameAr: "كرونة تشيكية",
    nameEn: "Czech Koruna",
    symbol: "Kč",
    fractionalUnit: "هالير",
    fractionalUnitEn: "Haler",
  },
  {
    code: "HUF",
    nameAr: "فورنت مجري",
    nameEn: "Hungarian Forint",
    symbol: "Ft",
    fractionalUnit: "فيلر",
    fractionalUnitEn: "Filler",
  },
  {
    code: "ILS",
    nameAr: "شيكل إسرائيلي",
    nameEn: "Israeli Shekel",
    symbol: "₪",
    fractionalUnit: "أغورة",
    fractionalUnitEn: "Agora",
  },
  {
    code: "THB",
    nameAr: "باخت تايلندي",
    nameEn: "Thai Baht",
    symbol: "฿",
    fractionalUnit: "ساتانغ",
    fractionalUnitEn: "Satang",
  },
  {
    code: "MYR",
    nameAr: "رينغيت ماليزي",
    nameEn: "Malaysian Ringgit",
    symbol: "RM",
    fractionalUnit: "سين",
    fractionalUnitEn: "Sen",
  },
  {
    code: "IDR",
    nameAr: "روبية إندونيسية",
    nameEn: "Indonesian Rupiah",
    symbol: "Rp",
    fractionalUnit: "سين",
    fractionalUnitEn: "Sen",
  },
  {
    code: "PHP",
    nameAr: "بيزو فلبيني",
    nameEn: "Philippine Peso",
    symbol: "₱",
    fractionalUnit: "سنتيمو",
    fractionalUnitEn: "Centavo",
  },
  {
    code: "VND",
    nameAr: "دونغ فيتنامي",
    nameEn: "Vietnamese Dong",
    symbol: "₫",
    fractionalUnit: "هاو",
    fractionalUnitEn: "Hao",
  },
  {
    code: "TWD",
    nameAr: "دولار تايواني",
    nameEn: "New Taiwan Dollar",
    symbol: "NT$",
    fractionalUnit: "سنت",
    fractionalUnitEn: "Cent",
  },
];

// دالة للبحث عن عملة بالكود أو الاسم
export function findCurrencyByCode(code: string): CurrencyInfo | undefined {
  return WORLD_CURRENCIES.find(
    (currency) => currency.code.toUpperCase() === code.toUpperCase(),
  );
}

// دالة للبحث عن عملة بالاسم
export function findCurrencyByName(name: string): CurrencyInfo | undefined {
  const searchName = name.toLowerCase();

  return WORLD_CURRENCIES.find(
    (currency) =>
      currency.nameAr.toLowerCase().includes(searchName) ||
      currency.nameEn.toLowerCase().includes(searchName) ||
      currency.code.toLowerCase() === searchName,
  );
}

// دالة لجلب قائمة العملات للاختيار من القائمة المنسدلة
export function getCurrencyOptions() {
  return WORLD_CURRENCIES.map((currency) => ({
    value: currency.code,
    label: `${currency.code} - ${currency.nameAr} (${currency.nameEn})`,
    ...currency,
  }));
}
