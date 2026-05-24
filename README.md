# 🎬 VidSlice — تطبيق تقسيم الفيديوهات

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-Expo-blue?style=for-the-badge&logo=expo" />
  <img src="https://img.shields.io/badge/FFmpeg-Kit-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-orange?style=for-the-badge" />
</p>

> **قسّم فيديوهاتك إلى أجزاء صغيرة بجودة كاملة — جاهزة للستوري والريلز فوراً**

---

## ✨ المميزات

| الميزة | التفاصيل |
|--------|----------|
| 🔪 تقسيم ذكي | يقسم الفيديو لأجزاء بمدة محددة تلقائياً |
| 🎯 مدد جاهزة | 15ث / 30ث / 60ث / 90ث مع أيقونات التطبيقات |
| 🎛️ مدة مخصصة | سلايدر من 5 ثواني لـ 5 دقائق |
| ⚡ جودة كاملة | `stream copy` بدون إعادة ترميز — سريع ومحافظ على الجودة |
| 💾 حفظ للمعرض | حفظ كل الأجزاء بضغطة واحدة |
| 📤 مشاركة مباشرة | شارك أي جزء مباشرة لواتساب أو أي تطبيق |
| 🌙 واجهة مودرن | داكنة بالكامل مع تأثيرات Glassmorphism |

---

## 📱 الشاشات

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   الشاشة الرئيسية │    │   شاشة التقسيم  │    │  شاشة النتائج   │
│                 │    │                 │    │                 │
│   [VidSlice]    │ →  │  اختار المدة    │ →  │  ١٢ فيديو جاهز │
│                 │    │  ابدأ التقسيم   │    │  حفظ / مشاركة  │
│  اختار الفيديو  │    │  شريط تقدم      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 خطوات التشغيل

### المتطلبات
- Node.js 18+
- Expo CLI
- Android Studio (للمحاكي) أو جهاز Android حقيقي

### 1️⃣ تثبيت المشروع

```bash
# استنسخ المشروع
git clone https://github.com/yourusername/VidSlice.git
cd VidSlice

# ثبّت المكتبات
npm install
```

### 2️⃣ تشغيل في وضع التطوير

```bash
# شغّل Expo
npx expo start

# اضغط 'a' لفتح على Android
# أو امسح QR Code بتطبيق Expo Go
```

### 3️⃣ بناء APK (للتوزيع)

```bash
# ثبّت EAS CLI
npm install -g eas-cli

# سجّل دخول لحسابك في Expo
eas login

# ابنِ APK للتجربة
eas build --platform android --profile preview

# أو للنشر على Google Play (AAB)
eas build --platform android --profile production
```

---

## 🏗️ هيكل المشروع

```
VidSlice/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # الشاشة الرئيسية
│   ├── split.tsx            # شاشة التقسيم
│   └── result.tsx           # شاشة النتائج
├── src/
│   └── utils/
│       └── videoSplitter.ts # منطق FFmpeg
├── app.json                 # إعدادات Expo
├── eas.json                 # إعدادات البناء
└── package.json
```

---

## ⚙️ كيف يعمل التقسيم؟

```
الفيديو الأصلي (5 دقائق)
│
├── FFmpeg: -ss [start] -t [duration] -c copy
│   ↓
│   stream copy = بدون إعادة ترميز = جودة 100%
│
├── الجزء 1: 0:00 → 0:30
├── الجزء 2: 0:30 → 1:00
├── الجزء 3: 1:00 → 1:30
└── ...
```

**لماذا `-c copy`؟**
- ⚡ أسرع بـ 10x من إعادة الترميز
- 🎯 جودة مطابقة للأصل 100%
- 🔋 استهلاك بطارية أقل

---

## 🎨 التصميم

- **الألوان:** `#0A0A0F` (خلفية) + `#6C63FF` (رئيسي) + `#FF6584` (تمييز)
- **التأثيرات:** Glassmorphism, Gradient Orbs, Animated Progress
- **المكتبات:** `expo-linear-gradient`, `expo-blur`, `expo-haptics`

---

## 📦 المكتبات المستخدمة

| المكتبة | الغرض |
|---------|-------|
| `ffmpeg-kit-react-native` | تقسيم الفيديو |
| `expo-document-picker` | اختيار الفيديو |
| `expo-media-library` | الحفظ في المعرض |
| `expo-sharing` | المشاركة |
| `expo-av` | معاينة الفيديو |
| `expo-linear-gradient` | التدرجات |
| `expo-blur` | تأثير الزجاج |
| `expo-haptics` | الاهتزاز |
| `react-native-reanimated` | الأنيميشن |

---

## 🛠️ مشاكل شائعة

**`FFmpegKit not found`**
```bash
npx expo prebuild --clean
cd android && ./gradlew clean
```

**`Permission denied`**
> تأكد إن التطبيق عنده إذن الوصول للتخزين في إعدادات الجهاز

**بطء في التقسيم**
> عادي لأول مرة — FFmpeg بيتحمّل. المرة التانية أسرع بكتير.

---

## 📄 الرخصة

MIT License — استخدم الكود بحرية ✌️
