# Zadaniya: Chegirma belgisi va filter

**Maqsad:** Saytda chegirmali mahsulotlarni ko‘rsatish (belgi) va ularni filtrlash imkoniyati. Hozirgi funksionallik, rasmlar va sahifalar o‘zgarishsiz qoladi.

---

## 1. Backend (faqat qo‘shish)

- **Product modeliga** (Prisma) ixtiyoriy maydonlar:
  - `discountPercent` — `Int?` (null = chegirma yo‘q, 1–99 = foiz, masalan 10 = 10% chegirma).
  - `originalPrice` — `Decimal?` (ixtiyoriy; chegirma bo‘lganda eski narx, agar bo‘lsa kartochkada o‘chirilgan narx ko‘rsatiladi).
- **API:** Mahsulotlar ro‘yxati va bitta mahsulot javobida `discountPercent` va `originalPrice` ham qaytariladi.
- **Filter:** `GET /products?...&discount=true` bo‘lsa, faqat `discountPercent > 0` bo‘lgan mahsulotlar qaytariladi (mavjud filterlar o‘zgarishsiz).
- **Admin:** Mahsulot yaratish/tahrirlashda `discountPercent` va `originalPrice` kiritish imkoniyati (ixtiyoriy qadam; agar vaqt bo‘lsa).

---

## 2. Frontend (faqat qo‘shish)

- **Katalog — mahsulot kartochkasi:**
  - Agar `product.discountPercent > 0` bo‘lsa, kartochkada (masalan, rasm ustida yoki nom ustida) **“Chegirma”** yoki **“−X%”** belgisi ko‘rsatiladi.
  - Mavjud rasm, nom, narx, mavjudlik va boshqa elementlar **o‘chirilmaydi**, faqat belgi qo‘shiladi.
- **Katalog — filter:**
  - Filtrlar blokida **“Chegirma”** (uz) / **“Со скидкой”** (ru) checkbox qo‘shiladi.
  - Tanlansa: faqat chegirmali mahsulotlar ko‘rsatiladi; URL da masalan `discount=1` saqlanadi.
  - Boshqa filterlar (brend, auditoriya, korpus va h.k.) va paginatsiya **o‘zgarishsiz** ishlaydi.
- **Mahsulot sahifasi (product page):**
  - Agar mahsulotda `discountPercent > 0` bo‘lsa, sahifada chegirma belgisi va kerak bo‘lsa `originalPrice` (o‘chirilgan narx) ko‘rsatiladi.
  - Mavjud rasm, narx, tavsif va boshqa bloklar **o‘chirilmaydi**.

---

## 3. Qat’iy qoidalar

- Hech qanday mavjud maydon, API parametri yoki UI element **o‘chirilmaydi**.
- Mahsulot rasmlari, katalog va mahsulot sahifasidagi hozirgi ko‘rinish **saqlanadi**.
- Faqat **yangi** maydonlar, parametrlar va UI (belgi + filter) qo‘shiladi.
- Agar `discountPercent` null yoki 0 bo‘lsa, hech qanday belgi ko‘rinmaydi va filter “Chegirma” tanlanmagan holatga mos keladi.

---

## 4. Amalga oshirish tartibi

1. Prisma: `Product` ga `discountPercent`, `originalPrice` qo‘shish → migratsiya.
2. Backend: DTO va products service/controller da filter `discount=true` va javobda yangi maydonlar.
3. Frontend API types: `discountPercent`, `originalPrice`.
4. Katalog: kartochkada chegirma belgisi; filter panelida “Chegirma” checkbox va URL/searchParams.
5. Mahsulot sahifasi: chegirma belgisi va ixtiyoriy originalPrice ko‘rsatish.
