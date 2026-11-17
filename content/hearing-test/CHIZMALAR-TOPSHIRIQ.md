# Onlayn eshitish testi uchun chizmalar

Sana: 2026-11-17. Tayyor fayllar `apps/frontend/public/hearing-test/` papkasiga aynan quyidagi nomlar bilan qoʻyiladi.

Test sahifasida hozir vaqtinchalik chizmalar turibdi (`apps/frontend/src/components/hearing-test/hearing-test-art.tsx`). Ular shu topshiriqdagi yakuniy chizmalar bilan almashtiriladi. Testni koʻrish: `https://acoustic.uz/services/hearing-test?preview=1`.

## Umumiy uslub

- Hammasi **SVG**, kod bilan chiziladi (rasm generatsiyasi emas): chiziqlar toza va istalgan oʻlchamda tiniq boʻlishi kerak.
- **Chiziqli uslub:** faqat kontur, ichi boʻyalmaydi. Chiziq uchlari va burilishlari yumaloq (`stroke-linecap="round"`, `stroke-linejoin="round"`).
- **Ranglar:** asosiy chiziq `#3F3091` (binafsha), urgʻu `#F07E22` (toʻq sariq). Boshqa rang ishlatilmaydi. Fon shaffof.
- **Oʻziga xoslik:** chizmalar Acoustic uchun noldan chiziladi. Boshqa kompaniyalar saytidagi rasmlardan nusxa olinmaydi va ularga oʻxshatilmaydi.
- Quloq anatomik aniq boʻlishi shart emas, lekin bir qarashda quloq ekani tushunilsin: tashqi kontur va ichida bitta-ikkita egri chiziq yetarli.
- Yozuv yoʻq. Soya, gradient va mayda bezak yoʻq.
- Har bir fayl 6 KB dan oshmasin.

## Fayllar

| № | Fayl | `viewBox` | Tavsif |
|---|---|---|---|
| 1 | `quloq.svg` | `0 0 320 360` | Chap quloq (yon tomondan). Tashqi kontur binafsha, chiziq qalinligi 8. Ichidagi egri chiziq toʻq sariq, qalinligi 8. Oʻng quloq uchun shu faylning koʻzgu aksi ishlatiladi, alohida fayl kerak emas |
| 2 | `quloq-va-tovush.svg` | `0 0 640 360` | Oʻng tomonda №1 dagi quloqning oʻzi (faqat binafsha rangda). Chap tomonda quloqqa kelayotgan tovush: toʻq sariq rangdagi 3–4 ta yoy yoki toʻlqin chizigʻi, quloqqa yaqinlashgan sari kichrayadi. Chiziq qalinligi 8 |
| 3 | `quloq-fon.svg` | `0 0 320 360` | №1 dagi quloqning soddalashtirilgan konturi, bitta rangda (`#3F3091`), chiziq qalinligi 4. Sahifa fonida juda xira qilib ishlatiladi, shuning uchun tafsilot kam boʻlsin |
| 4 | `belgi-quloq.svg` | `0 0 48 48` | Bosqichlar qatori uchun kichik quloq belgisi. Bitta rang (`#3F3091`), chiziq qalinligi 3, koʻpi bilan ikkita `<path>`. 20 piksel oʻlchamda ham quloq ekani bilinsin |
| 5 | `belgi-tinch-joy.svg` | `0 0 96 96` | "Tinch joy" belgisi: ustiga qiya chiziq tortilgan karnay yoki "shovqin yoʻq" maʼnosidagi boshqa sodda belgi. Asosiy chiziq binafsha (qalinligi 5), qiya chiziq toʻq sariq |
| 6 | `belgi-ovoz.svg` | `0 0 96 96` | "Ovozni eng yuqoriga qoʻying" belgisi: karnay va undan chiqayotgan uchta toʻlqin. Karnay binafsha, toʻlqinlar toʻq sariq, qalinligi 5 |
| 7 | `belgi-naushnik.svg` | `0 0 96 96` | Naushnik (bosh ustidan oʻtadigan). Binafsha, qalinligi 5; ikki quloqchin ichida toʻq sariq kichik urgʻu |

Ixtiyoriy, Codex orqali fotosurat sifatida:

| № | Fayl | Oʻlcham | Tavsif |
|---|---|---|---|
| 8 | `natija-qabul.webp` | 1200×900, 200 KB gacha | Natija sahifasidagi "Toʻliq eshitish tekshiruvi" bloki uchun. Prompt: *A hearing care specialist in a bright consultation room explains hearing check results to a middle-aged client, both seated at a desk, friendly and calm; the monitor is turned away so nothing is readable.* Oxiriga `content/posts/rasmlar/TOPSHIRIQ.md` dagi "Style" va "Avoid" qismlari qoʻshiladi (nisbat 4:3) |

## Tekshirish

1. Har bir SVG ni 24, 96 va 320 piksel kenglikda PNG ga aylantirib koʻring: chiziqlar uzilmagan, shakl tushunarli boʻlsin.
2. №1, №2 va №3 dagi quloq bir xil shaklda boʻlsin (bitta chizmadan olingan).
3. Fayllarda `<text>`, `<image>`, tashqi shrift yoki skript boʻlmasin.

## Tayyor boʻlgach

Faqat `apps/frontend/public/hearing-test/` papkasiga fayl qoʻshing, boshqa fayllarga tegmang. Commit qilib `main` ga push qiling va qaysi fayllar chiqmaganini hisobotda yozing. Chizmalarni sahifaga ulash alohida bajariladi.
