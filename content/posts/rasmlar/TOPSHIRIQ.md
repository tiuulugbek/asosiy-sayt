# Rasm topshirigʻi №1: saytdagi 7 ta maqola uchun matn ichidagi rasmlar

Sana: 2026-11-17. Bu papka (`content/posts/rasmlar/`) tayyor rasmlar uchun. Fayllar shu yerga aynan quyidagi nomlar bilan qoʻyiladi; keyin ular saytga koʻchiriladi va maqola matniga joylanadi.

Muqova kerak emas: yettita maqolaning hammasida muqova bor. Oltitasida matn boshida bittadan rasm ham bor, ular oʻzgarmaydi. Bu topshiriq faqat matn ichiga qoʻshiladigan yangi rasmlar haqida: 4 ta fotosurat va 5 ta sxema.

## Umumiy talablar

**Fotosuratlar**

- Format: WebP, 1600×900 piksel (16:9), 250 KB dan oshmasin.
- Rasm ichida yozuv, raqam, logotip, suv belgisi boʻlmasin.
- Odamlar oʻzbek yoki Markaziy Osiyo qiyofasida, kundalik oddiy kiyimda, tabiiy yuz ifodasi bilan.
- Qoʻl, quloq va yuz buzilmagan boʻlsin. Qoʻrqituvchi tibbiy manzara boʻlmasin.
- Kadrda eshitish moslamasi koʻrinsa, u haqiqiyga oʻxshashi va toʻgʻri taqilgan boʻlishi kerak. Shubha boʻlsa, katalogdagi haqiqiy mahsulot suratidan foydalanish yaxshiroq.

Har bir fotosurat promptining oxiriga shu ikki qism qoʻshiladi:

> Style: Realistic professional photograph, natural soft daylight, clean modern interior, warm and calm mood, authentic natural expressions, people of Uzbek / Central Asian appearance in everyday modest clothing, shallow depth of field, horizontal 16:9 composition.

> Avoid: text, letters, numbers, logos, watermarks, brand marks, distorted hands, ears or faces, unrealistic or incorrectly worn hearing aids, frightening medical imagery, exaggerated emotions, cluttered background.

**Sxemalar**

- Format: SVG, `viewBox="0 0 1200 675"`. Rasm generatsiyasi bilan emas, kod bilan chiziladi, chunki ichida yozuv bor.
- Har bir sxema ikki tilda: `-uz.svg` va `-ru.svg`. Chizma bir xil, faqat yozuvlar farq qiladi.
- Ranglar: asosiy `#3F3091` (binafsha), urgʻu `#F07E22` (toʻq sariq), fon oq yoki juda och kulrang, matn `#1F2937`.
- Shrift: tizim shrifti (`font-family: system-ui, -apple-system, 'Segoe UI', sans-serif`), eng kichik yozuv 22 px dan kam boʻlmasin (telefonda oʻqilishi uchun).
- Oʻzbekcha yozuvlarda oʻ va gʻ uchun U+02BB (ʻ) belgisi ishlatiladi, oddiy apostrof emas.
- Sodda, tekis uslub: ortiqcha soya, gradient va bezaksiz. Tibbiy aniqlikka daʼvo qiladigan mayda anatomik tafsilot kerak emas.
- Yozuvlar quyida berilganidek aynan koʻchiriladi, qoʻshimcha matn qoʻshilmaydi.

## Rasmlar roʻyxati

| № | Fayl nomi | Maqola (slug) | Matndagi joyi |
|---|---|---|---|
| 1 | `belgilar-sabab-guruhlari-uz.svg`, `belgilar-sabab-guruhlari-ru.svg` | eshitish-pasayishi-belgilari | "Eshitish nima sababdan pasayadi" boʻlimining oxirida |
| 2 | `audiogramma-namuna-uz.svg`, `audiogramma-namuna-ru.svg` | audiogramma-nima | "Ranglar va belgilar" boʻlimining oxirida |
| 3 | `keksalar-moslama-korsatish.webp` | keksalarda-eshitish | "Nima qilish mumkin" boʻlimida, moslama imkoniyatlari roʻyxatidan keyin |
| 4 | `tinnitus-sabablar-uz.svg`, `tinnitus-sabablar-ru.svg` | quloqda-shovqin-tinnitus | "Shovqinning sabablari" boʻlimining oxirida |
| 5 | `tinnitus-yetti-odat-uz.svg`, `tinnitus-yetti-odat-ru.svg` | quloqda-shovqin-tinnitus | "Shovqinni yengillashtiradigan yetti odat" roʻyxatidan keyin |
| 6 | `moslashuv-uyda-mashq.webp` | eshitish-apparatiga-moslashuv | "Birinchi haftalar" boʻlimining boshida |
| 7 | `miflar-eski-va-yangi-moslama.webp` | eshitish-apparati-miflar | 2-mifdan keyin |
| 8 | `bolalar-yoshga-qarab-javoblar-uz.svg`, `bolalar-yoshga-qarab-javoblar-ru.svg` | bolalarda-eshitish-qanday-rivojlanadi | "Yoshga qarab odatiy javoblar" jadvalidan keyin |
| 9 | `bolalar-shaqildoq.webp` | bolalarda-eshitish-qanday-rivojlanadi | Matn boshida (bu maqolada matn ichida rasm yoʻq) |

Jami 14 ta fayl: 4 ta WebP va 10 ta SVG.

## Fotosuratlar

### 3. `keksalar-moslama-korsatish.webp`

Prompt:

> A hearing care specialist shows an elderly woman how to put on a small behind-the-ear hearing aid while her adult son sits beside her and watches. Bright consultation room, medium shot.

- Alt (uz): Mutaxassis yoshi ulugʻ mijozga eshitish moslamasini koʻrsatmoqda
- Alt (ru): Специалист показывает пожилому клиенту слуховой аппарат
- Eʼtibor: moslama yaqindan koʻrinadi, tayyor rasmni qoʻlda tekshirish kerak.

### 6. `moslashuv-uyda-mashq.webp`

Prompt:

> An older woman sits at a table at home listening to an audiobook from a smartphone lying on the table, relaxed and attentive. Cozy living room, a cup of tea nearby, medium shot.

- Alt (uz): Yoshi ulugʻ inson uyda audiokitob tinglamoqda
- Alt (ru): Пожилой человек дома слушает аудиокнигу

### 7. `miflar-eski-va-yangi-moslama.webp`

Prompt:

> On a specialist's open palm lie two hearing aids side by side: an older, bulkier beige behind-the-ear model and a small modern one. Close-up, soft neutral background.

- Alt (uz): Eski va zamonaviy eshitish moslamalari yonma-yon
- Alt (ru): Старый и современный слуховые аппараты рядом
- Eʼtibor: bu kadr generatsiyada koʻpincha notoʻgʻri chiqadi. Iloji boʻlsa, filialda haqiqiy ikki moslamani suratga olish yaxshiroq.

### 9. `bolalar-shaqildoq.webp`

Prompt:

> A father shakes a rattle to one side while a six-month-old baby lying on a play mat turns the head toward the sound. Bright children's room, warm daylight, medium shot.

- Alt (uz): Chaqaloq shaqildoq tovushi tomonga burilmoqda
- Alt (ru): Малыш поворачивается на звук погремушки

## Sxemalar

### 1. `belgilar-sabab-guruhlari-uz.svg` / `-ru.svg`

Ikki ustunli sodda sxema. Tepada umumiy sarlavha, ostida ikki yonma-yon blok, har birida sarlavha va uchta misol. Chap blok binafsha, oʻng blok toʻq sariq hoshiyada.

| | uz | ru |
|---|---|---|
| Umumiy sarlavha | Eshitish nima sababdan pasayadi | Почему снижается слух |
| Chap blok sarlavhasi | Tovush ichki quloqqa yetib bormaydi | Звук не доходит до внутреннего уха |
| Chap blok misollari | Quloq kiri tiqini · Oʻrta quloq yalligʻlanishi · Quloq pardasi shikastlanishi | Серная пробка · Воспаление среднего уха · Повреждение барабанной перепонки |
| Chap blok izohi | Koʻpincha davolanadi | Часто поддаётся лечению |
| Oʻng blok sarlavhasi | Ichki quloq yoki eshitish nervi zararlangan | Повреждены внутреннее ухо или слуховой нерв |
| Oʻng blok misollari | Yosh bilan bogʻliq oʻzgarishlar · Uzoq yillik shovqin · Irsiyat | Возрастные изменения · Многолетний шум · Наследственность |
| Oʻng blok izohi | Eshitish moslamasi yordam beradi | Помогает слуховой аппарат |

- Alt (uz): Eshitish pasayishining ikki asosiy guruhi sxemasi
- Alt (ru): Две основные группы причин снижения слуха

### 2. `audiogramma-namuna-uz.svg` / `-ru.svg`

Namunaviy audiogramma. Toʻrli koordinata maydoni. Gorizontal oʻq tepada: 250, 500, 1000, 2000, 4000, 8000. Vertikal oʻq chapda, yuqoridan pastga: 0, 20, 40, 60, 80, 100. Ikki chiziq, ikkalasi ham oʻngga qarab pastlaydi:

- qizil chiziq, nuqtalari doiracha (oʻng quloq): 250→20, 500→25, 1000→30, 2000→45, 4000→60, 8000→65;
- koʻk chiziq, nuqtalari xoch (chap quloq): 250→25, 500→30, 1000→35, 2000→50, 4000→65, 8000→70.

Yuqoridagi 0–25 oraliq och yashil fon bilan belgilanadi.

| | uz | ru |
|---|---|---|
| Gorizontal oʻq | Ohang (Gs) | Высота звука (Гц) |
| Vertikal oʻq | Balandlik (dB) | Громкость (дБ) |
| Oʻq uchlaridagi izoh (chap, oʻng) | Past tovushlar · Ingichka tovushlar | Низкие звуки · Высокие звуки |
| Yashil oraliq yozuvi | Meʼyor | Норма |
| Qizil chiziq | Oʻng quloq | Правое ухо |
| Koʻk chiziq | Chap quloq | Левое ухо |

- Alt (uz): Oʻng va chap quloq uchun audiogramma namunasi
- Alt (ru): Пример аудиограммы для правого и левого уха
- Eʼtibor: bu namuna, biror insonning haqiqiy natijasi emas. Sxema ostiga mayda yozuv: "Namuna" / «Пример».

### 4. `tinnitus-sabablar-uz.svg` / `-ru.svg`

Olti bir xil kartochka (2 qator × 3 ustun), har birida sodda belgi va yozuv.

| № | uz | ru | Belgi |
|---|---|---|---|
| 1 | Eshitish pasayishi | Снижение слуха | quloq |
| 2 | Quloq bilan bogʻliq holatlar | Состояния, связанные с ухом | quloq va tomchi |
| 3 | Umumiy kasalliklar | Общие заболевания | yurak va puls chizigʻi |
| 4 | Bosh jarohatlari | Травмы головы | bosh silueti |
| 5 | Dorilar | Лекарства | kapsula |
| 6 | Ruhiy holat | Эмоциональное состояние | bulutcha yoki toʻlqin |

- Umumiy sarlavha: uz "Quloqda shovqinning olti guruh sababi", ru «Шесть групп причин шума в ушах»
- Alt (uz): Quloqda shovqinning olti guruh sababi
- Alt (ru): Шесть групп причин шума в ушах

### 5. `tinnitus-yetti-odat-uz.svg` / `-ru.svg`

Yetti kartochka (birinchi qatorda 4 ta, ikkinchisida 3 ta, oʻrtaga tekislangan), har birida raqam, sodda belgi va yozuv.

| № | uz | ru | Belgi |
|---|---|---|---|
| 1 | Kofein va tamakini kamaytirish | Меньше кофеина и табака | piyola |
| 2 | Dam olish | Отдых | oromkursi |
| 3 | Qon bosimini kuzatish | Контроль давления | tonometr |
| 4 | Baland tovushdan saqlanish | Защита от громких звуков | quloq himoyasi |
| 5 | Tuzni kamaytirish | Меньше соли | tuzdon |
| 6 | Jismoniy faollik | Движение | yurayotgan odam |
| 7 | Sokin fon tovushi | Тихий фоновый звук | nota |

- Umumiy sarlavha: uz "Shovqinni yengillashtiradigan yetti odat", ru «Семь привычек, которые облегчают шум»
- Alt (uz): Quloqdagi shovqinni yengillashtiradigan yetti odat
- Alt (ru): Семь привычек, которые облегчают шум в ушах

### 8. `bolalar-yoshga-qarab-javoblar-uz.svg` / `-ru.svg`

Gorizontal vaqt chizigʻi, olti nuqta. Har bir nuqta ustida yosh, ostida qisqa yozuv.

| Yosh (uz) | Yozuv (uz) | Yosh (ru) | Yozuv (ru) |
|---|---|---|---|
| 0–3 oy | Baland tovushdan choʻchiydi | 0–3 месяца | Вздрагивает от громкого звука |
| 3–6 oy | Tovush tomonga buriladi | 3–6 месяцев | Поворачивается к звуку |
| 7–12 oy | Ismini biladi | 7–12 месяцев | Знает своё имя |
| 12–18 oy | Birinchi soʻzlar | 12–18 месяцев | Первые слова |
| 2 yosh | Soʻzlarni birlashtiradi | 2 года | Соединяет слова |
| 3–4 yosh | Gap tuzadi, savol beradi | 3–4 года | Строит фразы, задаёт вопросы |

- Umumiy sarlavha: uz "Bola tovushga qanday javob beradi", ru «Как ребёнок реагирует на звук»
- Sxema ostida mayda yozuv: uz "Yosh chegaralari taxminiy", ru «Возрастные границы приблизительны»
- Alt (uz): Bolaning yoshga qarab tovushga javoblari
- Alt (ru): Реакции ребёнка на звук по возрасту

## Tayyor boʻlgach

1. 14 ta faylni shu papkaga qoʻying (`content/posts/rasmlar/`), nomlarini oʻzgartirmang.
2. Commit qilib `main` ga push qiling yoki fayllarni suhbatga yuboring.
3. Shundan keyin rasmlar saytning `uploads` papkasiga koʻchiriladi va maqola matnidagi yuqorida koʻrsatilgan joylarga alt matni bilan qoʻyiladi (oʻzbekcha sahifaga `-uz`, ruscha sahifaga `-ru` varianti).

Qabul qilish mezoni: yozuvlar aynan jadvaldagidek; imlo xatosi yoʻq; telefonda oʻqiladi; fotosuratlarda yozuv va logotip yoʻq; odamlar va moslamalar tabiiy koʻrinadi.
