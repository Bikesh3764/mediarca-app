# MediArca Mobile - Free Standalone APK Build & Installation Guide
## फ्री स्टैंडअलोन APK कैसे बनाएं और बिना ₹2,100 ($25) Play Store खरीदे किसी भी फ़ोन में कैसे चलाएं

> **Note**: आपको अभी Google Play Store का $25 (लगभग ₹2,100) का Developer Account खरीदने की कोई आवश्यकता नहीं है। इस गाइड का उपयोग करके आप बिल्कुल मुफ़्त में एक स्टैंडअलोन `.apk` फ़ाइल बना सकते हैं और उसे किसी भी Android फ़ोन पर सीधे इंस्टॉल करके टेस्ट कर सकते हैं। साथ ही, आप अपने कंप्यूटर के वेब ब्राउज़र पर भी लोकलहोस्ट चलाकर ऐप देख सकते हैं।

---

## भाग 1: अपने कंप्यूटर पर Web Localhost कैसे चलाएं (How to View on Web Localhost)

अगर आप अपने लैपटॉप या कंप्यूटर पर तुरंत ऐप देखना और चलाना चाहते हैं:

### 1. टर्मिनल खोलें और कमांड चलाएं:
```bash
npm run web
```
या
```bash
npx expo start --web
```

### 2. ब्राउज़र में खोलें:
कमांड चलने के बाद आपका डिफ़ॉल्ट वेब ब्राउज़र अपने आप **`http://localhost:8081`** पर खुल जाएगा।
- यदि अपने आप न खुले, तो Chrome या Edge में **`http://localhost:8081`** टाइप करके Enter दबाएं।
- यहाँ आप Phase 1 से लेकर Phase 7 तक के सभी पोर्टल्स (Patient, Doctor, Receptionist, Clinic Management, Admin Governance, Legal Pages) लाइव देख सकते हैं।

---

## भाग 2: मुफ़्त स्टैंडअलोन `.apk` फ़ाइल कैसे बनाएं (How to Build Free Standalone APK with EAS)

हमने आपके लिए `eas.json` में `preview` प्रोफाइल पहले से कॉन्फ़िगर कर दिया है जो सीधे `.apk` फ़ाइल बनाता है:

### स्टेप 1: EAS CLI इंस्टॉल करें (सिर्फ पहली बार):
```bash
npm install -g eas-cli
```

### स्टेप 2: Expo में मुफ़्त अकाउंट लॉगिन करें:
यदि आपका Expo अकाउंट नहीं है, तो [expo.dev/signup](https://expo.dev/signup) पर जाकर 1 मिनट में फ़्री अकाउंट बनाएं।
फिर टर्मिनल में लॉगिन करें:
```bash
eas login
```

### स्टेप 3: स्टैंडअलोन APK क्लाउड बिल्ड शुरू करें:
```bash
eas build --platform android --profile preview
```
- EAS आपसे पूछेगा कि क्या आप नया Android Keystore जनरेट करना चाहते हैं: **`Y` (Yes)** दबाएं।
- Expo Cloud अपने आप सर्वर पर आपका `.apk` कंपाइल करना शुरू कर देगा (आपके लैपटॉप पर कोई भारी Android Studio या NDK डाउनलोड करने की ज़रूरत नहीं है)।
- 5 से 8 मिनट में आपको टर्मिनल में एक **Downloadable APK URL** मिल जाएगा (जैसे: `https://expo.dev/artifacts/eas/...apk`)।

---

## भाग 3: अपने असली Android फ़ोन पर APK कैसे इंस्टॉल करें (How to Install APK on Real Phones)

### 1. APK फ़ोन में ट्रांसफर करें:
- EAS द्वारा दिए गए डाउनलोड लिंक को सीधे अपने फ़ोन के Chrome ब्राउज़र में खोलें और `.apk` डाउनलोड करें।
- या अपने कंप्यूटर से `.apk` फ़ाइल को **WhatsApp**, **Google Drive**, या **USB Cable** के ज़रिए अपने फ़ोन पर भेजें।

### 2. "Install Unknown Apps" (अज्ञात स्रोत) अनुमति दें:
Android फ़ोन की सुरक्षा प्रणाली पहली बार बाहर से APK इंस्टॉल करने पर अनुमति मांगती है:
1. डाउनलोड की गई `.apk` फ़ाइल पर टैप करें।
2. यदि पॉपअप आए: **"For your security, your phone is not allowed to install unknown apps from this source"**:
   - **Settings** पर टैप करें।
   - **"Allow from this source"** (इस स्रोत से अनुमति दें) टॉगल को चालू (ON) करें।
3. वापस आएं और **Install** बटन दबाएं।

### 3. विभिन्न फ़ोन ब्रांड्स में सेटिंग्स:
- **Samsung One UI**: `Settings > Apps > Special app access > Install unknown apps > Chrome / My Files > Allow`.
- **Xiaomi / Redmi / POCO (MIUI / HyperOS)**: `Settings > Protection & privacy > Special permissions > Install unknown apps`. (5 सेकंड की सुरक्षा चेतावनी पर टिक करके OK करें).
- **Vivo / iQOO (Funtouch OS)**: `Settings > Security > Install unknown apps`.
- **Realme / Oppo / OnePlus (ColorOS / OxygenOS)**: `Settings > Security & Privacy > Installation sources`.
- **Google Pixel (Stock Android)**: `Settings > Apps > Special app access > Install unknown apps > Chrome`.

### 4. ऐप खोलें और टेस्ट करें:
- ऐप का नाम **MediArca** दिखेगा।
- ऐप खोलते ही यह लाइव प्रोडक्शन सर्वर (`https://mediarca-mdwk.onrender.com/api`) से कनेक्ट हो जाएगा।
- आप कैमरा अनुमति देकर क्लिनिक के काउंटर स्टैंडी का QR कोड स्कैन कर सकते हैं, टोकन जनरेट कर सकते हैं, डॉक्टर कंसोल चला सकते हैं और रिसेप्शनिस्ट डेस्क पर टोकन अप्रूव कर सकते हैं।

---

## भाग 4: डॉक्टरों और क्लिनिक स्टाफ के साथ APK कैसे शेयर करें

आपको Play Store पर $25 देने की ज़रूरत नहीं है। जब भी आप ऐप में कोई बदलाव करें:
1. `eas build --platform android --profile preview` चलाएं।
2. डाउनलोड लिंक को कॉपी करें।
3. अपने क्लिनिक के डॉक्टरों, रिसेप्शनिस्टों और स्टाफ के WhatsApp ग्रुप पर लिंक शेयर कर दें। वे एक क्लिक में नया अपडेटेड ऐप डाउनलोड करके इस्तेमाल कर सकते हैं।

---

## भाग 5: भविष्य में जब आप $25 Play Store अकाउंट खरीदेंगे (Future Play Store Release)

जब आप भविष्य में Google Play Console पर $25 का अकाउंट खरीद लें, तब आपको बस यह कमांड चलाना होगा:
```bash
eas build --platform android --profile production
```
यह कमांड Google Play Store के लिए साइन किया हुआ `.aab` (Android App Bundle) बना देगा, जिसे आप सीधे Play Store Console पर अपलोड कर सकते हैं।

---

## संक्षेप में आवश्यक कमांड्स (Quick Reference)

| कार्य (Task) | कमांड (Command) |
| :--- | :--- |
| **वेब ब्राउज़र पर लोकलहोस्ट चलाना** | `npm run web` |
| **मुफ़्त स्टैंडअलोन APK बनाना** | `eas build --platform android --profile preview` |
| **टाइपस्क्रिप्ट कोड चेक करना** | `npm run typecheck` |
| **सभी ऑटोमेटेड टेस्ट (Phases 1-7) चलाना** | `npm run test:verify:all` |
