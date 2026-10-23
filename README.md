# Still — Personal Journal

A private, browser-local personal log built with **React + Vite + Tailwind CSS**.

## Run it

```bash
npm install
npm run dev
```

Open the localhost URL printed in your terminal (normally `http://localhost:5173`).

## Login

- Username: `Anthony.constantino`
- Password: Use the password you specified when commissioning this project.

The requested password is checked against a SHA-256 digest in `src/App.jsx`. **Important: a static React app cannot provide genuine password-based security.** It is a convenience lock only. Anyone with access to your browser profile or developer tools may access local data. Do not deploy sensitive records to a shared/untrusted device without a real authenticated backend and encryption.

## Features

- **Write or dictate:** Browser speech recognition converts live microphone speech to text. The app saves the transcript, not the audio. SpeechRecognition is usually available on Chrome / Edge and may require an internet connection, with recognition performed by a browser service.
- **Optional photos:** Up to six images per entry. Photos are stored in an origin-private directory called `photos` using the Origin Private File System (OPFS), when the browser supports it. A limited localStorage compatibility fallback is used on browsers without OPFS.
- **History:** View by local calendar day (including exact hours, minutes, seconds), view all days, search text, edit or delete.
- **Excel export:** A real `.xlsx` file, with columns for date, time, title, text, photos, and creation/update timestamps.
- **Text export:** A readable `.txt` archive of all journal entries.
- **Full ZIP backup:** `journal.xlsx`, `journal.txt`, `journal-data.json` for restoration, and actual photo files inside the `photos/` directory.
- **Restore:** Import a previously exported full ZIP backup, adding new entries without overwriting entries already in this browser.

## Data and limitations

- Notes are persisted automatically to the browser's `localStorage`. They are **not** written continuously to a physical `.txt` database file. Browsers cannot silently write a file anywhere on the user's computer without explicit permission; instead use **Download text archive** or **Complete backup**.
- Photos are stored under the browser origin's private `photos` directory, **not** a visible folder on the desktop. Full ZIP backups contain a normal `photos/` folder so images are accessible on your computer after extraction.
- Browser storage is specific to the browser/profile/origin. Changing the site URL, clearing browser data, or moving devices may make the journal unavailable. Back up regularly!
- This is 100% frontend-only: no server and no cloud synchronization.

## Production build

```bash
npm run build
npm run preview
```

Deploy `dist/` to a static host **with HTTPS**. To preserve your journal, stay on the same domain/origin. Microphone permission and `crypto.subtle` require a secure context (HTTPS or localhost).
