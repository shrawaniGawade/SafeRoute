# 🛡️ SafeRoute MVP (Minimum Viable Product) – 10 to 12 Days Execution Plan

> **प्रकल्प (Project)**: SafeRoute – AI-Powered Safety-Aware Route Navigation  
> **कालावधी (Timeline)**: 10 ते 12 दिवस (10 to 12 Working Days)  
> **ध्येय (Goal)**: 10 ते 12 दिवसांत SafeRoute चे पूर्ण कार्यक्षम, सुरक्षित आणि डिप्लॉय करण्यायोग्य MVP ॲप्लिकेशन तयार करणे.  
> **स्थिती (Status)**: Ready & Actionable 🚀  

---

## 📌 1. Executive Summary & MVP Scope (प्रकल्प व्याप्ती)

SafeRoute हे सुरक्षित प्रवासासाठी तयार केलेले AI-आधारित नेव्हिगेशन प्लॅटफॉर्म आहे. रस्त्यावरील **पथदिवे (Lighting)**, **गुन्हेगारी दर (Crime Risk)**, **अपघातांची शक्यता (Accident Probability)** आणि **गर्दीची पातळी (Crowd Density)** या ४ घटकांचे विश्लेषण करून हे ॲप सर्वात सुरक्षित मार्ग सुचवते.

### 🎯 MVP मधील मुख्य वैशिष्ट्ये (Must-Have Core Features):
1. **User Authentication & RBAC**: ईमेल नोंदणी, ६-अंकी सुरक्षित OTP पडताळणी, JWT RTR टोकन मॅनेजमेंट आणि Admin/User रोल सेपरेशन.
2. **AI-Powered Route Safety Engine**: Python FastAPI मायक्रोसर्व्हिस + Random Forest / Mathematical Scoring Fallback (0-100 स्कोअर).
3. **Interactive Route Safety Evaluator UI**: रिअल-टाइम स्लायडर्स आणि ३ रेडीमेड सेफ्टी प्रीसेट्स (*Night Walk, Daily Commute, High Caution*).
4. **Interactive Radar & Score Breakdown**: Lighting, Crime, Accident, Crowd या घटकांचा व्हिज्युअल ग्राफ आणि Safe vs Fast मार्गांची तुलना.
5. **Admin Command Center Console**: रिअल-टाइम टेलिमेट्री (Latency, Users, Route Evaluator), युझर मॅनेजमेंट आणि लाइव्ह AI सिम्युलेटर.
6. **Enterprise Security & Reliability**: Helmet headers, Rate limiting, Input validation (Zod), Password hashing (Bcrypt).
7. **Production Deployment & CI/CD**: GitHub Actions ऑटोमेटेड टेस्टिंग (100% Green), Docker कंटेनरायझेशन आणि Vercel क्लाउड डिप्लॉयमेंट.

---

## 🗓️ 12-Day Day-by-Day Sprint Schedule (दिवसनिहाय कृती आराखडा)

```mermaid
gantt
    title SafeRoute 12-Day MVP Development Roadmap
    dateFormat  YYYY-MM-DD
    section फेज 1: पायाभूत संरचना
    Day 1: Monorepo, DB & Architecture      :done, d1, 2026-10-11, 1d
    Day 2: Authentication & OTP Engine      :done, d2, 2026-10-12, 1d
    Day 3: Backend Gateway & Safety APIs    :done, d3, 2026-10-13, 1d
    section फेज 2: AI व युझर इंटरफेस
    Day 4: AI FastAPI Scoring Service       :done, d4, 2026-10-14, 1d
    Day 5: Frontend Design System & Theme   :done, d5, 2026-10-15, 1d
    Day 6: Interactive Route Evaluator UI   :done, d6, 2026-10-16, 1d
    Day 7: Auth Modal & User Profile UI     :done, d7, 2026-10-17, 1d
    section फेज 3: ॲडमिन व सुरक्षा
    Day 8: Admin Command Center Console     :done, d8, 2026-10-18, 1d
    Day 9: Security, Rate Limiter & Fallback:done, d9, 2026-10-19, 1d
    section फेज 4: टेस्टिंग व डिप्लॉयमेंट
    Day 10: E2E Automated Testing Suite    :done, d10, 2026-10-20, 1d
    Day 11: Docker & GitHub Actions CI      :done, d11, 2026-10-21, 1d
    Day 12: Vercel Deploy & Final Demo      :done, d12, 2026-10-22, 1d
```

---

### 📅 दिवसनिहाय सविस्तर नियोजन (Day-by-Day Breakdown)

---

#### 🔹 Day 1: Architecture Setup, Monorepo & Database Schemas
* **उद्दिष्ट (Objective)**: प्रोजेक्टचे फोल्डर स्ट्रक्चर, डेटाबेस मॉडेल्स आणि डेव्हलपमेंट एन्व्हायर्नमेंट तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] Monorepo रचना तयार करणे (`frontend`, `backend`, `ai`, `docs`).
  - [x] TypeScript कॉन्फिगरेशन (`tsconfig.json`) आणि पॅकेज मॅनेजमेंट सेट करणे.
  - [x] MongoDB Mongoose Schemas तयार करणे:
    - `User`: नाव, ईमेल, हॅश केलेला पासवर्ड, रोल (`USER` / `ADMIN`), व्हेरिफिकेशन स्टेटस.
    - `OTP`: ईमेल, ६-अंकी हॅश, प्रकार (`EMAIL_VERIFICATION` / `PASSWORD_RESET`), TTL इंडेक्स (१० मिनिटे).
    - `RefreshToken`: फॅमिली आयडी, रिव्होकेशन स्टेटस, एक्सपायरी.
  - [x] MongoDB डिस्कनेक्ट झाल्यास इन-मेमरी ऑटोमॅटिक फॉलबॅक जोडणे.
* **Deliverable**: `npm run dev` ने बॅकएंड पोर्ट ५००० वर सुरू होतो आणि `/api/health` 200 OK देतो.

---

#### 🔹 Day 2: Authentication Engine & OTP Email Verification
* **उद्दिष्ट (Objective)**: संपूर्ण सुरक्षित युझर ऑथेंटिकेशन आणि ईमेल OTP पडताळणी सिस्टीम तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] `bcryptjs` वापरून सुरक्षित पासवर्ड हॅशिंग (Salt rounds: 10+).
  - [x] ६-अंकी सुरक्षित न्यूमेरिक OTP जनरेटर तयार करणे (`crypto.randomInt`).
  - [x] Nodemailer ईमेल ट्रान्सपोर्टर कॉन्फिगर करणे (Ethereal टेस्ट ईमेल व थेट इनबॉक्स प्रिव्ह्यू).
  - [x] `POST /api/auth/register`, `POST /api/auth/verify-otp`, `POST /api/auth/login` एंडपॉइंट्स तयार करणे.
  - [x] JWT ॲक्सेस टोकन (15 मिनिटे) आणि सुरक्षित `httpOnly` रिफ्रेश टोकन (7 दिवस) विथ Token Rotation (RTR).
* **Deliverable**: युझर रजिस्टर करू शकतो, ईमेलवर OTP मिळतो आणि लॉगिन करून सुरक्षित टोकन प्राप्त करू शकतो.

---

#### 🔹 Day 3: Backend Gateway Routing & Core Safety Engine
* **उद्दिष्ट (Objective)**: रूट सेफ्टी इव्हॅल्यूएशन गेटवे आणि बिझनेस लॉजिक तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] `POST /api/safety/predict` एंडपॉइंट तयार करणे.
  - [x] Zod व्हॅलिडेशन स्कीमा: `lighting` (0-10), `crime_risk` (0-10), `accident_risk` (0-10), `crowd_level` (0-10).
  - [x] रिझिलियंट मॅथेमॅटिकल स्कोअरिंग फॉर्म्युला तयार करणे:
    $$\text{RawScore} = (\text{Lighting} \times 3.5) + (\text{Crowd} \times 2.5) + ((10 - \text{Crime}) \times 2.5) + ((10 - \text{Accident}) \times 1.5)$$
  - [x] सेफ्टी रेटिंग बॅजेस तयार करणे: `Optimal (80-100)`, `Moderate Caution (55-79)`, `High Risk (<55)`.
* **Deliverable**: बॅकएंड कोणत्याही इनपुट पॅरामीटर्ससाठी तात्काळ अचूक सेफ्टी स्कोअर आणि मार्गदर्शक सल्ला देतो.

---

#### 🔹 Day 4: AI Scoring Microservice (FastAPI + Scikit-Learn)
* **उद्दिष्ट (Objective)**: Python FastAPI मायक्रोसर्व्हिसद्वारे AI-आधारित सेफ्टी मॉडेल चालवणे.
* **करायची कामे (Tasks)**:
  - [x] Python व्हर्च्युअल एन्व्हायर्नमेंट (`.venv`) व FastAPI ॲप तयार करणे (पोर्ट ८०००).
  - [x] सिंथेटिक डेटासेटवर **Random Forest Regressor** मॉडेल ट्रेन करणे.
  - [x] मॉडेल सेव्ह करणे (`safety_model.joblib`) आणि लोड करणे.
  - [x] `POST /predict` हाय-स्पीड इन्फरन्स एंडपॉइंट (< 40ms रिस्पॉन्स).
  - [x] बॅकएंडमध्ये ॲक्सिओस प्रॉक्सी जोडणे; जर पायथॉन सर्व्हिस बंद असेल तर ऑटोमॅटिक मॅथ फॉलबॅक चालणे.
* **Deliverable**: `http://127.0.0.1:8000/docs` वर इंटरॲक्टिव्ह Swagger UI उपलब्ध.

---

#### 🔹 Day 5: Frontend Design System & Glassmorphism Shell
* **उद्दिष्ट (Objective)**: आधुनिक, प्रिमियम डार्क थीम UI आणि डिझाइन सिस्टम तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] React 19 + TypeScript + Vite प्रोजेक्ट सेटअप.
  - [x] व्हॅनिला CSS डिझाइन टोकन्स: डार्क स्लेट बॅकग्राउंड, इलेक्ट्रिक सायन, अंबर, आणि एमराल्ड शेड्स.
  - [x] GSAP-आधारित इंटरॲक्टिव्ह DotGrid कॅन्व्हास बॅकग्राउंड.
  - [x] आधुनिक नेव्हिगेशन बार: ब्रँड लोगो, युझर प्रोफाइल मेनू, ॲडमिन स्टेटस बॅज.
  - [x] रिस्पॉन्सिव्ह लेआउट (मोबाईल, टॅबलेट आणि डेस्कटॉपसाठी अनुकूल).
* **Deliverable**: मुख्य होमपेज ब्राउझरमध्ये आकर्षक ॲनिमेशन्ससह सुरळीतपणे लोड होते.

---

#### 🔹 Day 6: Interactive Route Safety Evaluator Interface
* **उद्दिष्ट (Objective)**: युझरला मार्ग निवडण्यासाठी आणि पॅरामीटर्स तपासण्यासाठी इंटरफेस देणे.
* **करायची कामे (Tasks)**:
  - [x] ३ क्विक सेफ्टी प्रीसेट बटणे:
    - 🌙 **Night Walk (Strict)**: ९०%+ स्ट्रीट लायटिंग आणि शून्य गुन्हेगारी प्राधान्य.
    - 🚗 **Daily Commute**: बॅलन्स्ड स्पीड आणि सुरक्षितता.
    - 🛡️ **High Caution**: अत्यंत सावधगिरीचा मार्ग.
  - [x] कस्टमाइझ करण्यायोग्य स्लायडर्स: Lighting, Crime Avoidance, Accident Risk, Crowd Density.
  - [x] रिअल-टाइम स्कोअर डिस्प्ले: सर्क्युलर गेज मीटर (0-100), AI लेटन्सी बॅज, आणि Safe vs Fast तुलना कार्ड्स.
* **Deliverable**: युझरने स्लायडर फिरवताच किंवा प्रीसेट निवडताच सेकंदाच्या आत नवीन सेफ्टी स्कोअर स्क्रीनवर दिसतो.

---

#### 🔹 Day 7: Authentication Modal & User Management UI
* **उद्दिष्ट (Objective)**: क्लायंट-साइड ऑथेंटिकेशन मोडल आणि युझर स्टेट व्यवस्थापन.
* **करायची कामे (Tasks)**:
  - [x] ग्लासमोर्फिक `AuthModal` तयार करणे (लॉगिन, साइन-अप, पासवर्ड रिसेट).
  - [x] ६-अंकी OTP बॉक्स विथ ऑटो-फोकस आणि बॅकस्पेस हँडलिंग.
  - [x] रिअल-टाइम पासवर्ड स्ट्रेंथ इंडिकेटर (लांबी, स्पेशल कॅरेक्टर्स, अक्षरे).
  - [x] `AuthContext`: युझर लॉगिन स्टेट, टोकन रिफ्रेश आणि टोस्ट नोटिफिकेशन्स.
* **Deliverable**: युझर ॲपमध्ये साइन-अप करू शकतो, ईमेलवरील OTP टाकून अकाउंट ॲक्टिव्हेट करू शकतो.

---

#### 🔹 Day 8: Admin Command Center Console
* **उद्दिष्ट (Objective)**: ॲडमिनिस्ट्रेटरसाठी संपूर्ण सिस्टीम मॉनिटरिंग डॅशबोर्ड तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] रोल-बेस्ड ॲक्सेस कंट्रोल (`/admin` आणि `#admin` राउट गार्ड).
  - [x] सिस्टीम टेलिमेट्री कार्ड्स: AI लेटन्सी, डेटाबेस युझर्स काउन्ट, ॲक्टिव्ह इव्हॅल्यूएशन काउंटर, कॅश हिट रेट.
  - [x] युझर डिरेक्टरी: सर्व युझर्सची यादी पाहणे, रोल बदलणे (`USER` ⇄ `ADMIN`), अकाउंट डिलीट करणे.
  - [x] लाइव्ह AI सिम्युलेटर: डॅशबोर्डवरून थेट मॉडेल इन्फरन्स टेस्ट करणे.
  - [x] डिफॉल्ट ॲडमिन क्रेडेंशियल्स सीड करणे (`admin@saferoute.com` / `Admin@12345`).
* **Deliverable**: `http://localhost:5173/admin` वर पूर्ण क्षमतेने चालणारा ॲडमिन कन्सोल.

---

#### 🔹 Day 9: Security Hardening & Microservice Failover
* **उद्दिष्ट (Objective)**: सायबर सुरक्षा नियम लागू करणे आणि सर्व्हिस डिस्कनेक्ट हाताळणे.
* **करायची कामे (Tasks)**:
  - [x] `helmet` द्वारे सुरक्षित HTTP रिस्पॉन्स हेडर्स लागू करणे.
  - [x] `express-rate-limit` द्वारे ब्रूट-फोर्स हल्ल्यांपासून संरक्षण (Auth साठी १५ विनंत्या/१५ मिनिटे).
  - [x] CORS सिक्युरिटी कॉन्फिगरेशन विथ क्रेडेंशियल्स सपोर्ट.
  - [x] AI मायक्रोसर्व्हिस फॉलबॅक व्हेरिफिकेशन (पायथॉन बंद असले तरी युझरला त्रुटी न दाखवता सुरक्षित स्कोअर मिळणे).
* **Deliverable**: ॲप्लिकेशन सुरक्षा चाचण्या यशस्वीरीत्या उत्तीर्ण करतो आणि सिस्टीम क्रॅश होत नाही.

---

#### 🔹 Day 10: Automated Test Suite (Unit & E2E Tests)
* **उद्दिष्ट (Objective)**: सर्व फंक्शन्स आणि API एंडपॉइंट्ससाठी ऑटोमेटेड चाचण्या लिहिणे.
* **करायची कामे (Tasks)**:
  - [x] ऑथेंटिकेशन टेस्ट सूट (`auth.test.ts`): रजिस्ट्रेशन, OTP, लॉगिन, पासवर्ड रिसेट (९ टेस्ट्स).
  - [x] ॲडमिन टेस्ट सूट (`admin.test.ts`): रोल गार्ड, टेलिमेट्री, युझर मॅनेजमेंट (८ टेस्ट्स).
  - [x] E2E इंटिग्रेशन टेस्ट्स (`e2e.test.ts`): संपूर्ण युझर जर्नी व्हेरिफिकेशन (११ टेस्ट्स).
  - [x] सर्व २८ टेस्ट्स १००% ग्रीन (Pass) असल्याची खात्री करणे:
    ```bash
    npm run test
    ```
* **Deliverable**: २८/२८ ऑटोमेटेड टेस्ट्स एका क्लिकवर यशस्वीरीत्या पास होतात.

---

#### 🔹 Day 11: Docker Containerization & GitHub Actions CI
* **उद्दिष्ट (Objective)**: संपूर्ण प्रोजेक्टचे कंटेनरायझेशन आणि ऑटोमेटेड CI पाईपलाईन तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] सर्व ३ टियर्ससाठी प्रोडक्शन डॉकरफाईल्स:
    - `frontend/Dockerfile` (Node 20 + Nginx)
    - `backend/Dockerfile` (Node 20 Alpine)
    - `ai/Dockerfile` (Python 3.12 Slim)
  - [x] `docker-compose.yml` तयार करणे (एक कमांडमध्ये संपूर्ण ॲप चालू करण्यासाठी: `docker-compose up`).
  - [x] GitHub Actions वर्कफ्लो (`.github/workflows/ci.yml`):
    - Node.js लिनक्स रनरवर बॅकएंड टेस्ट्स चालवणे.
    - फ्रंटएंड टाईपचेक व प्रॉडक्शन बिल्ड करणे.
    - पायथॉन लिंटिंग तपासणे.
* **Deliverable**: GitHub रिपॉझिटरीमध्ये प्रत्येक कमिटवर ऑटोमॅटिक ग्रीन टिक (CI Success) मिळतो.

---

#### 🔹 Day 12: Production Cloud Deployment & Final Submission
* **उद्दिष्ट (Objective)**: ॲप क्लाउडवर लाइव्ह करणे आणि अंतिम सबमिशन डॉक्युमेंट्स तयार करणे.
* **करायची कामे (Tasks)**:
  - [x] Vercel वर फ्रंटएंड आणि बॅकएंड सर्व्हरलेस डिप्लॉयमेंट (`vercel.json`).
  - [x] Vercel Web Analytics इंटिग्रेशन (`@vercel/analytics`).
  - [x] अंतिम प्रेझेंटेशन आणि डेमॉ डॉक्युमेंट्स तयार करणे:
    - [PRESENTATION_SLIDES.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/PRESENTATION_SLIDES.md): १०-स्लाइड्सचा तांत्रिक बचाव प्रेझेंटेशन डेक.
    - [DEMO_WALKTHROUGH.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/DEMO_WALKTHROUGH.md): ३ मिनिटांची थेट परीक्षक डेमॉ स्क्रिप्ट.
    - [FINAL_SUBMISSION_CHECKLIST.md](file:///c:/Users/shraw/OneDrive/Desktop/SafeRoute/docs/FINAL_SUBMISSION_CHECKLIST.md): १५ मुद्द्यांची गुणवत्ता तपासणी यादी.
* **Deliverable**: लाइव्ह इंटरनेट लिंक, संपूर्ण डॉक्युमेंटेशन आणि परीक्षक डेमॉसाठी तयार ॲप्लिकेशन.

---

## 📊 Feature Comparison Matrix (MVP vs Future V2)

| फिचर (Feature) | MVP (१०-१२ दिवस) | फ्युचर व्हर्जन (V2 Scope) |
| :--- | :---: | :---: |
| **User Sign Up & Login** | ✅ समाविष्ट (JWT + RTR) | Social OAuth (Google, Apple Login) |
| **6-Digit OTP Email Verification** | ✅ समाविष्ट (Nodemailer) | SMS / WhatsApp OTP (Twilio) |
| **Multi-Parameter Route Scoring** | ✅ समाविष्ट (४ घटक) | Live CCTV कॅमेरा फीड ॲनालिसिस |
| **Safety Evaluator UI & Presets** | ✅ समाविष्ट (३ प्रीसेट्स) | टर्न-बाय-टर्न व्हॉइस नेव्हिगेशन |
| **AI Random Forest Predictor** | ✅ समाविष्ट (<40ms) | रिअल-टाइम पोलीस FIR API स्क्रॅपिंग |
| **Admin Command Center** | ✅ समाविष्ट (पूर्ण टेलिमेट्री) | ऑटोमेटेड क्राइम हीटमॅप जनरेटर |
| **Edge Mathematical Fallback** | ✅ समाविष्ट (१००% अपटाईम) | मल्टी-रिजन क्लाउड मायग्रेशन |
| **Docker & GitHub CI Pipeline** | ✅ समाविष्ट (ऑटोमेटेड) | Kubernetes ऑटो-स्केलिंग |

---

## 💻 Tech Stack Overview (तांत्रिक स्टॅक)

| टियर (Tier) | वापरलेले तंत्रज्ञान (Technologies) | मुख्य जबाबदारी |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS, GSAP | इंटरॲक्टिव्ह UI, स्लायडर्स, ॲनिमेशन्स, ऑथेंटिकेशन मोडल |
| **Backend** | Node.js, Express 5, TypeScript, Zod, JWT, Helmet | API गेटवे, इनपुट व्हॅलिडेशन, टोकन मॅनेजमेंट, ॲडमिन राऊट्स |
| **AI Engine** | Python 3.12, FastAPI, Scikit-Learn, Joblib, Uvicorn | मल्टी-फॅक्टर सेफ्टी मॉडेल इन्फरन्स (< 40ms) |
| **Database** | MongoDB (Mongoose) + Memory Store Fallback | युझर प्रोफाइल्स, OTPs, टोकन फॅमिली डेटा |
| **DevOps & Cloud** | Docker, Docker Compose, GitHub Actions, Vercel | कंटेनरायझेशन, ऑटोमेटेड CI/CD, वेब ॲनालिटिक्स |

---

## 🎯 Definition of Done (DoD - काम पूर्ण मानण्याचे निकष)

प्रत्येक दिवसाचे काम पूर्ण झाले असे तेव्हाच मानले जाईल जेव्हा:
1. **Zero Runtime Errors**: कोड कोणतीही अनपेक्षित त्रुटी न देता सुरळीत चालतो.
2. **Type Safety**: TypeScript कोणत्याही त्रुटींशिवाय (`tsc -b`) कंपाइल होतो.
3. **100% Tests Pass**: सर्व २८ युनिट आणि इंटिग्रेशन टेस्ट्स ग्रीन होतात (`npm run test`).
4. **Mobile Responsive**: ३७५px मोबाईल स्क्रीनपासून १९२०px डेस्कटॉपपर्यंत UI परिपूर्ण दिसतो.
5. **Git Synced**: बदल स्पष्ट कमिट मेसेजसह GitHub रिपॉझिटरीमध्ये पुश झालेले असतात.

---

## 🚀 महत्त्वाच्या कमांड्स (Quick Command Reference)

```bash
# १. संपूर्ण प्रोजेक्टच्या सर्व टेस्ट्स चालवण्यासाठी
npm run test

# २. फ्रंटएंड आणि बॅकएंड बिल्ड करण्यासाठी
npm run build

# ३. लोकल डेव्हलपमेंट सर्व्हर्स सुरू करण्यासाठी
npm run dev

# ४. डॉकर कंटेनर्स सुरू करण्यासाठी
docker-compose up --build
```
