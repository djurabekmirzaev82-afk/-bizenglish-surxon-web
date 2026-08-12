# BizEnglish Surxon — Web ilova

Biznes va tadbirkorlik oliy maktabi Surxondaryo filiali uchun Business English
platformasining web ilovasi (React + Vite). Backend sifatida allaqachon jonli
turgan Render API'ni ishlatadi: `https://business-english-surxon.onrender.com/api`

## Nega bu alohida loyiha?

Claude'ning ichki ko'rsatuv oynasi (artifact preview) ba'zan xavfsizlik sababli
tashqi backend'larga so'rov yuborishni cheklaydi. Haqiqiy saytga (Vercel'ga)
joylaganda bu cheklov bo'lmaydi — brauzerning o'zi to'g'ridan-to'g'ri
`business-english-surxon.onrender.com` bilan gaplashadi.

## Bepul deploy — Vercel

1. Bu papkani GitHub'da **yangi, alohida repo** qilib yuklang (masalan
   `bizenglish-surxon-web` nomi bilan) — bot repo'sidan alohida bo'lsin,
   chunki bu butunlay boshqa loyiha (frontend, backend emas).
2. [vercel.com](https://vercel.com) ga GitHub hisobingiz bilan kiring.
3. "Add New" → "Project" → yangi repo'ni tanlang.
4. Vercel Vite loyihasini avtomatik taniydi (Framework Preset: Vite) —
   hech narsa o'zgartirmasdan "Deploy" tugmasini bosing.
5. Bir necha daqiqadan so'ng `https://bizenglish-surxon-web.vercel.app`
   (yoki shunga o'xshash) manzil beriladi — shu sizning haqiqiy saytingiz.

## Muhim: Render'da CORS'ni yangilang

Sayt tayyor bo'lgach, Render Dashboard → Environment → `FRONTEND_URL`
qiymatini `*` o'rniga aynan shu Vercel manziliga almashtiring, masalan:

```
FRONTEND_URL=https://bizenglish-surxon-web.vercel.app
```

Bu — xavfsizlik uchun (faqat shu sayt backend'ga so'rov yubora oladi,
boshqa hech kim emas).

## Lokal ishga tushirish (ixtiyoriy, test uchun)

```bash
npm install
npm run dev
```

## Keyingi qadamlar

- O'z domeningizni ulash (masalan `bizenglish-surxon.uz`) — Vercel
  Settings → Domains bo'limida bepul qo'shiladi.
- Reading/Listening modullari uchun backend'da yangi `/api` yo'nalishlari
  qo'shilgach, shu loyihaga ham ekranlarini qo'shish kerak bo'ladi.
