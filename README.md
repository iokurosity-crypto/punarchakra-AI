<div align="center">

# 🌿 Punarchakra AI

### From Waste to Worth

**An AI-powered waste identification and circular-economy routing platform, built for rural and urban India.**

[![Made for Maverick Effect AI Challenge 2026](https://img.shields.io/badge/Maverick%20Effect-AI%20Challenge%202026-2C5F2D?style=for-the-badge)](https://maverickeffectchallenge.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-97BC62?style=for-the-badge)](LICENSE)
[![Languages](https://img.shields.io/badge/Languages-6%20Indian%20Languages-2C5F2D?style=for-the-badge)]()

[Live Demo](#-live-demo) · [Features](#-key-features) · [How It Works](#-how-it-works) · [Setup](#-getting-started) · [Screenshots](#-screenshots)

</div>

---

## 📖 About The Project

**Punarchakra AI** *(पुनर्चक्र — "the cycle that returns")* is a smart, end-to-end waste-routing platform that closes the loop between identifying waste and actually recycling it.

Most waste apps stop at telling you "this is plastic." We go further: we tell you **what it's worth**, **who nearby will buy or process it**, and we do it **in your own language, by voice** — because accurate identification alone doesn't change behavior. People also need to know an item has value, and where to take it.

> Built for the **Maverick Effect AI Challenge 2026 – Season 3**, under the problem statement: *Waste Segregation & Circular Economy.*

---

## 🎥 Live Demo

▶️ **Watch the full demo video here:** [https://www.youtube.com/watch?v=8SO5I8MJsnU]

*(Paste your unlisted/public YouTube demo link above once uploaded)*

---

## ✨ Key Features

| | Feature | Description |
|---|---------|--------------|
| 🧠 | **Hybrid AI Classification** | Gemini Vision API for open-set, near-unlimited item recognition when online, with an offline TensorFlow.js + MobileNet fallback so it never stops working — even with zero connectivity. |
| 💰 | **Buyback Value Estimator** | Instantly shows the estimated resale/buyback value of an item (e.g., copper, PET bottles, cardboard), reframing waste as income instead of garbage. |
| 📍 | **Hyperlocal Recycler Routing** | A "Sort by Nearest to Me" geo-proximity sorter connects users to real, verified nearby recyclers and buyback centers — not placeholder pins. |
| 🗣️ | **Voice In / Voice Out** | Full speech-to-text input and text-to-speech output, so users with low literacy can operate the app hands-free. |
| 🌐 | **6 Indian Languages** | English, Hindi, Gujarati, Marathi, Tamil, and Telugu — complete interface translation, not just a few labels. |
| 📱 | **Mobile-First, Glassmorphic UI** | A clean, responsive, ChatGPT-style interface that adapts fluidly from desktop to mobile. |

---

## ⚙️ How It Works

Every uploaded photo runs through a **tiered classification pipeline**, designed to work reliably in both well-connected and low-connectivity conditions:

```
📷 User uploads/captures a photo
        │
        ▼
🌐 Gemini Vision API (primary, if online)
   Recognizes almost any waste type — not limited to a fixed category list
        │
        ▼  (falls back if offline / no API key / call fails)
⚡ Local MobileNet via TensorFlow.js (offline fallback)
   Runs entirely in-browser, zero server cost, zero latency
        │
        ▼  (falls back if this also fails)
🔤 Keyword Matching (last resort)
   Guarantees the user always gets a usable answer, never a dead end
```

Once a category is identified, the app:
1. 💰 Displays its **estimated buyback value**
2. 📍 Filters the map to show **verified nearby recyclers** for that exact category
3. 🗣️ Reads the result aloud in the **user's selected language**

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (glassmorphism, responsive design), Vanilla JavaScript
- **AI / ML:**
  - [TensorFlow.js](https://www.tensorflow.org/js) + MobileNet — offline in-browser image classification
  - [Gemini Vision API](https://ai.google.dev/) — cloud-based open-set waste recognition
  - Custom-trained MobileNetV2 model on real waste datasets (e-waste, plastic, metal, glass, paper/cardboard, agricultural residue, trash)
- **Maps & Location:** Google Maps Embed API, Geolocation API
- **Accessibility:** Web Speech API (Speech Synthesis + Speech Recognition), Google Translate integration
- **Data:** Verified real-world recycler/buyback-center dataset (GPCB/CPCB-authorized where applicable)

---

## 📁 Project Structure

```
punarchakra-ai/
├── index.html              # Main app shell
├── app.js                  # Core application logic (classification, chat, voice, map)
├── style.css                # Styling (glassmorphic UI, responsive layout)
├── waste_locations.json     # Verified recycler/buyback center data
├── dataset_summary.json     # Trained model category summary
├── prepare_dataset.py       # Dataset merging/preparation script
└── dataset/                 # Training images (by category)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.x (for local server)
- A modern browser (Chrome recommended for full Speech API support)
- *(Optional)* A Gemini API key for online, open-set classification

### Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Start a local server
python -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

### Enable Gemini Vision (optional)
Click the ⚙️ settings icon in the app and paste in your free [Gemini API key](https://ai.google.dev/) to unlock full open-set classification. Without a key, the app automatically uses the offline MobileNet model instead.

---

## 📸 Screenshots

| Multilingual Interface | AI Waste Scanning | Hyperlocal Recycler Map |
|:---:|:---:|:---:|
|<img width="262" height="221" alt="image" src="https://github.com/user-attachments/assets/1958aa14-bacf-4039-b918-0f94eddf2692" />|
|<img width="888" height="663" alt="image" src="https://github.com/user-attachments/assets/6d57dfae-02bb-4087-bcd3-c38964d5a93e" />|
|<img width="987" height="542" alt="image" src="https://github.com/user-attachments/assets/0368f6ef-3df4-441d-ae1e-b2f358a1d5af" />|



> Replace the placeholders above with real screenshots — drag and drop images directly into this section on GitHub, or add them to a `/screenshots` folder and reference them like:
> `![Multilingual UI](screenshots/multilingual.png)`

---

## 🌍 Why This Matters

- **Agricultural residue routing** directly addresses crop-stubble burning, a serious and ongoing air-quality crisis in Gujarat and neighboring states, by connecting farmers to real biomass/briquette buyers instead.
- **MSMEs and small businesses** often don't know which certified recyclers exist for their specific waste type — this app makes that discovery instant.
- **Language and voice accessibility** ensures the platform serves the people most affected by unmanaged waste, not just English-literate smartphone users.

---

## 🗺️ Roadmap

- [ ] Expand agricultural residue dataset with more real-world images
- [ ] Add SMS/WhatsApp-based access for users without a smartphone browser
- [ ] Partner with municipal corporations for verified live recycler data
- [ ] Add a "sell request" flow to directly notify nearby buyers

---

## 👥 Individual

Name:Kashis Makwana
Branch:Information Technology


**College:** L.D College of Engineering
**Challenge:** Maverick Effect AI Challenge 2026 – Season 3

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**♻️ Don't throw it. Trade it.**

Made with 💚 for a cleaner, circular India.

</div>
