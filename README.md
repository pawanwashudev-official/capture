# 🛡️ NFCapture (No-Filter Capture)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

**NFCapture** (No-Filter Capture) is a 100% serverless, end-to-end encrypted, and database-free web application designed to restore trust in photography for high-stakes verifications (e.g., insurance claims, marriage proposals, remote verifications).

It guarantees that a photo is taken **live**, **unedited**, and **unaltered** through a cryptographically secure "Lock & Key" workflow.

## 🚀 Live Demo
[https://nf-capture.vercel.app](https://nf-capture.vercel.app)

## ✨ Core Features
- **Zero-Trust Architecture:** No database, no backend. Everything happens entirely in your browser memory.
- **Mandatory Live Camera:** Strictly enforces hardware camera capture; the system rejects file uploads for the source image.
- **Asymmetric Encryption (Curve25519):** Uses `tweetnacl.js` to ensure the sender cannot view or edit the photo after capture. Only the requester's private key can decrypt it.
- **Local Private Keys:** Private keys are stored safely and locally in your browser's IndexedDB.
- **Privacy First:** Your data never leaves your device in an unencrypted state. The output `.nfcapture` file is completely opaque without the key.

## 🛠️ The Lock & Key Workflow
1. **Requester (Owner):** Generates a secure capture request link. The Private Key is generated and saved locally.
2. **Sender:** Clicks the link, captures a photo using the live camera, and the app encrypts it instantly.
3. **Distribution:** The Sender shares the resulting `.nfcapture` file via any secure channel (WhatsApp/Email).
4. **Unlock:** The Requester uploads the `.nfcapture` file, and the app unlocks it using the stored local key.

## 💻 Technical Stack
- **Frontend Framework:** React + TypeScript + Vite
- **Cryptography:** Tweetnacl.js (Curve25519)
- **Local Storage:** IDB (IndexedDB for key storage)
- **UI/UX:** Tailwind CSS, Framer Motion, Lucide React

## 🏗️ Local Development
```bash
# Clone the repository
git clone https://github.com/pawanwashudev-official/NFCapture.git

# Install dependencies
npm install

# Run the local development server
npm run dev
```

## 👨‍💻 Developer
Developed with ❤️ by **Pawan Washudev**
- **Email:** pawanwashudev@neubofy.in
- **Instagram:** [@pawan_washudev](https://instagram.com/pawan_washudev)
- **Telegram:** [@pawanwashudev](https://t.me/pawanwashudev)

## 📄 License
Open Source under the MIT License.
