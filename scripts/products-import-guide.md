# Mahsulotlarni JSON Fayl Orqali Import Qilish

## 📝 JSON Fayl Shablon

JSON fayl quyidagi formatda bo'lishi kerak:

```json
[
  {
    "name_uz": "Mahsulot nomi (o'zbek)",
    "name_ru": "Название продукта (русский)",
    "slug": "mahsulot-slug",
    "description_uz": "Tavsif o'zbek tilida",
    "description_ru": "Описание на русском",
    "price": 15000000,
    "productType": "hearing-aids",
    "brandName": "Oticon",
    "intro_uz": "Kirish matni (uz)",
    "intro_ru": "Введение (ru)",
    "features_uz": ["Xususiyat 1", "Xususiyat 2"],
    "features_ru": ["Особенность 1", "Особенность 2"],
    "benefits_uz": ["Foyda 1", "Foyda 2"],
    "benefits_ru": ["Преимущество 1", "Преимущество 2"],
    "tech_uz": "Texnologiya tavsifi (uz)",
    "tech_ru": "Описание технологии (ru)",
    "specsText": "Texnik xususiyatlar",
    "galleryUrls": ["https://example.com/image1.jpg"],
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "audience": ["children", "adults"],
    "formFactors": ["bte", "ite"],
    "signalProcessing": "BrainHearing",
    "powerLevel": "High",
    "hearingLossLevels": ["mild", "moderate"],
    "smartphoneCompatibility": ["iOS", "Android"],
    "paymentOptions": ["cash", "installment"],
    "availabilityStatus": "in-stock",
    "tinnitusSupport": true
  }
]
```

## 📋 Maydonlar Tushuntirishi

### Majburiy maydonlar:
- `name_uz` - Mahsulot nomi (o'zbek) - **MAJBURIY**
- `name_ru` - Mahsulot nomi (rus) - **MAJBURIY**

### Ixtiyoriy maydonlar:
- `slug` - URL slug (avtomatik yaratiladi agar berilmasa)
- `description_uz` - Tavsif (o'zbek)
- `description_ru` - Tavsif (rus)
- `price` - Narx (raqam)
- `productType` - Mahsulot turi ("hearing-aids", "accessories", "interacoustics")
- `brandName` - Brend nomi (masalan: "Oticon", "Phonak", "Signia")
- `intro_uz` - Kirish matni (o'zbek)
- `intro_ru` - Kirish matni (rus)
- `features_uz` - Xususiyatlar ro'yxati (o'zbek) - array
- `features_ru` - Xususiyatlar ro'yxati (rus) - array
- `benefits_uz` - Foydalar ro'yxati (o'zbek) - array
- `benefits_ru` - Foydalar ro'yxati (rus) - array
- `tech_uz` - Texnologiya tavsifi (o'zbek)
- `tech_ru` - Texnologiya tavsifi (rus)
- `specsText` - Texnik xususiyatlar (matn)
- `galleryUrls` - Rasm URL'lari ro'yxati - array
- `thumbnailUrl` - Asosiy rasm URL
- `audience` - Auditoriya - array: ["children", "adults", "elderly"]
- `formFactors` - Korpus turi - array: ["bte", "ite", "cic", "ric"]
- `signalProcessing` - Signal qayta ishlash (matn)
- `powerLevel` - Quvvat darajasi ("Low", "Medium", "High")
- `hearingLossLevels` - Eshitish darajasi - array: ["mild", "moderate", "severe", "profound"]
- `smartphoneCompatibility` - Smartfon mosligi - array: ["iOS", "Android"]
- `paymentOptions` - To'lov usullari - array: ["cash", "installment", "card"]
- `availabilityStatus` - Mavjudlik holati ("in-stock", "out-of-stock", "pre-order")
- `tinnitusSupport` - Tinnitus qo'llab-quvvatlash (true/false)

## 🚀 Import Qilish

```bash
cd /var/www/acoustic.uz

# Barcha mahsulotlarni import qilish
pnpm exec ts-node scripts/import-products-from-json.ts products.json

# Faqat ma'lum brend uchun
pnpm exec ts-node scripts/import-products-from-json.ts products.json --brand-name "Oticon"
```

## 📝 Misol

Shablon fayl: `scripts/products-template.json`
