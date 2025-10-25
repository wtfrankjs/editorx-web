# 🚀 Deploy Smart Crop Microservice

## SEÇENEK 1: Railway (ÖNERİLEN - ÜCRETSIZ BAŞLANGIÇ)

### 1. Railway Hesabı Oluştur
- https://railway.app → Sign up with GitHub
- **$5 ücretsiz kredi** (monthly renewal)

### 2. Deploy
```bash
# Railway CLI yükle
npm install -g @railway/cli

# Login
railway login

# Project oluştur
railway init

# Deploy
railway up
```

### 3. URL'i Kopyala
Railway otomatik bir domain verir: `https://your-app.railway.app`

### 4. n8n'de Ayarla
- n8n → Settings → Environment Variables
- `SMART_CROP_API_URL` = `https://your-app.railway.app`

---

## SEÇENEK 2: Render (Ücretsiz Tier)

### 1. Render Hesabı
- https://render.com → Sign up

### 2. New Web Service
- Connect GitHub repo
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn main:app --bind 0.0.0.0:$PORT`

### 3. Deploy & Copy URL

---

## SEÇENEK 3: Vercel (Serverless)

**NOT:** Vercel Python desteği sınırlı, Railway önerilir.

---

## 💰 ÜCRET KARŞILAŞTIRMASI:

| Platform | Ücretsiz Tier | Ücretli |
|----------|---------------|---------|
| **Railway** | $5/ay kredi | $5/ay (pay-as-you-go) |
| **Render** | 750 saat/ay | $7/ay |
| **Fly.io** | 3GB RAM | $1.94/ay |

**ÖNERİ:** Railway ile başla (ücretsiz $5 kredi), scale edince ücretli geç.

---

## 🧪 TEST:

```bash
curl -X POST https://your-app.railway.app/prepare-canvas \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/image.jpg",
    "targetWidth": 1280,
    "targetHeight": 720
  }'
```

Başarılıysa: `{"success": true, "image_b64": "...", "mask_b64": "..."}`

---

## 📊 PERFORMANS:

- **Latency:** ~500ms - 1.5s (image download + processing)
- **Concurrent requests:** 2 workers (Railway free tier)
- **Upgrade:** Railway'de $7/ay → unlimited workers

---

## ✅ PRODUCTION CHECKLIST:

1. ✅ Railway deploy edildi
2. ✅ Health check çalışıyor (`/health`)
3. ✅ n8n'de `SMART_CROP_API_URL` ayarlandı
4. ✅ Test edildi
5. ✅ Monitoring aktif (Railway dashboard)

**HAZIR!** 🚀

