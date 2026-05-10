# NFCapture 🛡️

**NFCapture** (No-Filter Capture) is a 100% serverless, end-to-end encrypted, and database-free web application designed to restore trust in photography for high-stakes verifications, such as marriage proposals.

It guarantees that a photo is taken **live**, **unedited**, and **unaltered** through a cryptographically secure "Lock & Key" workflow.

## 🚀 Live Demo
[https://nf-capture.vercel.app](https://nf-capture.vercel.app) (Replace with your actual Vercel URL)

## ✨ Features
- **Serverless Trust:** No database, no backend. Everything happens in your browser.
- **Mandatory Live Camera:** Strictly enforces camera capture; no file uploads allowed for the source.
- **Asymmetric Encryption:** Uses Curve25519 (tweetnacl) to ensure the sender cannot view or edit the photo after capture.
- **Local Private Keys:** Private keys are stored safely in your browser's IndexedDB.
- **Privacy First:** Your data never leaves your device in an unencrypted state.

## 🛠️ How it Works
1. **Requester (Owner):** Generates a capture request. The Private Key is saved locally.
2. **Sender (Groom):** Clicks the link, takes a photo, and the app encrypts it instantly.
3. **Distribution:** The Sender shares the `.nfcapture` file via WhatsApp/Email.
4. **Unlock:** The Requester uploads the file, and the app unlocks it using the stored local key.

## 💻 Tech Stack
- **React + TypeScript + Vite**
- **Tweetnacl.js** (Cryptography)
- **IDB** (IndexedDB for key storage)
- **Lucide React** (Icons)
- **CSS Animations** (Premium UI/UX)

## 🏗️ Local Development
```bash
# Clone the repo
git clone https://github.com/pawanwashudev-official/NFCapture.git

# Install dependencies
npm install

# Run dev server
npm run dev
```

## 👨‍💻 Developer
Developed with ❤️ by **Pawan Washudev**
- **Founder:** Neubofy
- **Email:** pawanwashudev@neubofy.in
- **Instagram:** [@pawan_washudev](https://instagram.com/pawan_washudev)
- **Telegram:** [@pawanwashudev](https://t.me/pawanwashudev)

## 📄 License
Open Source under the MIT License.
