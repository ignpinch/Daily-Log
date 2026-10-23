import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, BookOpenText, CalendarDays, Camera,
  Check, ChevronRight, CircleAlert, CloudOff, Download, FileArchive, FileSpreadsheet,
  FileText, HardDrive, Image as ImageIcon, LayoutGrid, LockKeyhole, LogOut,
  Mic, MicOff, MoreHorizontal, PenLine, Plus, Search, ShieldCheck, Sparkles,
  Trash2, UploadCloud, X, Eye, EyeOff, Clock3, Pencil
} from 'lucide-react';
import {
  deletePhoto, formatLongDate, formatShortDate, formatTime, formatTimeZone,
  loadEntries, localDateKey, optimizePhoto, persistEntries, readPhoto, savePhoto
} from './lib/storage';
import { downloadText, downloadExcel, downloadCompleteBackup, importCompleteBackup } from './lib/exports';

const USERNAME = 'Anthony.constantino';
// SHA-256 of the requested password. This is a local-only convenience lock, NOT server-side security.
const PASSWORD_SHA256 = '69836e0b605d470daa50ddbcc95493a413d8c736b3952032f1e2c1aa1c2ba255';
const SESSION_KEY = 'still.session.v1';
const DRAFT_KEY = 'still.draft.v1';
const emptyDraft = { title: '', body: '' };
const cl = (...parts) => parts.filter(Boolean).join(' ');

function Logo({ dark = false }) {
  return <div className="flex items-center gap-3">
    <div className={cl('grid h-10 w-10 place-items-center rounded-[13px] text-xl font-semibold serif', dark ? 'bg-[#d7e6d5] text-[#173329]' : 'bg-[#244739] text-[#f9faf4]')}>s<span className="-ml-[5px] self-end mb-[9px] text-[10px]">.</span></div>
    <div className="leading-tight"><div className={cl('text-[20px] font-semibold tracking-[-.06em]', dark ? 'text-[#f7f8ef]' : 'text-[#18332a]')}>still<span className="text-[#8eab98]">.</span></div><div className={cl('micro mt-[3px]', dark ? 'text-[#829e90]' : 'text-[#839289]')}>PERSONAL JOURNAL</div></div>
  </div>;
}

async function matchesPassword(value) {
  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('') === PASSWORD_SHA256;
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (username.trim() === USERNAME && await matchesPassword(password)) onLogin();
      else setError('The username or password is incorrect.');
    } catch { setError('Login requires localhost or HTTPS.'); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-[#f7f7f3] lg:grid lg:grid-cols-[minmax(390px,1fr)_minmax(500px,1fr)]">
    <div className="relative hidden min-h-screen overflow-hidden bg-[#17362b] px-[10%] py-12 text-white lg:flex lg:flex-col">
      <div className="absolute -right-54 top-[17%] h-[620px] w-[620px] rounded-full border border-[#c3d8c3]/15" />
      <div className="absolute -right-34 top-[25%] h-[460px] w-[460px] rounded-full border border-[#c3d8c3]/15" />
      <div className="absolute -right-14 top-[34%] h-[300px] w-[300px] rounded-full border border-[#c3d8c3]/15" />
      <div className="absolute left-[10%] top-[43%] h-px w-36 bg-gradient-to-r from-[#a1baa5]/30 to-transparent" />
      <Logo dark />
      <div className="relative z-10 my-auto max-w-[470px] pt-10">
        <span className="micro text-[#adbea9]">A SPACE OF YOUR OWN  ·  EST. 2026</span>
        <h1 className="serif mt-7 text-[clamp(58px,5.3vw,90px)] leading-[1.07] text-[#f5f5ee]">Every day<br />is worth <em className="font-normal text-[#a8c4aa]">keeping.</em></h1>
        <p className="mt-8 max-w-[350px] text-[15px] leading-8 text-[#b0c5b7]">Your thoughts, the little moments, and everything in between. All in one quiet place.</p>
      </div>
      <div className="relative z-10 flex items-center gap-2.5 text-xs text-[#9db2a6]"><LockKeyhole size={14}/>Private. Personal. Just yours.</div>
    </div>
    <div className="flex min-h-screen flex-col justify-center px-6 py-16 sm:px-[14%] lg:px-[11%]">
      <div className="mb-14 lg:hidden"><Logo /></div>
      <div className="mx-auto w-full max-w-[440px]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9eee7] text-[#244739]"><LockKeyhole size={21} strokeWidth={1.8}/></div>
        <div className="micro mt-8 text-[#839b8d]">WELCOME BACK</div>
        <h2 className="serif mt-3 text-[49px] leading-[1.1] text-[#1b3028] sm:text-[55px]">Your space awaits.</h2>
        <p className="mb-10 mt-4 text-[14px] leading-7 text-[#839088]">A little space to reflect, record, and remember.</p>
        <form onSubmit={submit} className="space-y-5">
          <div><label className="mb-2.5 block text-xs font-semibold text-[#3c5145]" htmlFor="username">Username</label><input id="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" className="w-full rounded-[13px] border border-[#dfe6de] bg-white px-4 py-[16px] text-[14px] text-[#1c3126] placeholder:text-[#aab5aa] focus:border-[#729b84]" required /></div>
          <div><label className="mb-2.5 block text-xs font-semibold text-[#3c5145]" htmlFor="password">Password</label><div className="relative"><input id="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className="w-full rounded-[13px] border border-[#dfe6de] bg-white px-4 py-[16px] pr-12 text-[14px] text-[#1c3126] placeholder:text-[#aab5aa] focus:border-[#729b84]" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-4 text-[#899c90]">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
          {error && <p role="alert" className="flex items-center gap-2 text-sm text-red-600"><CircleAlert size={16}/>{error}</p>}
          <button disabled={busy} type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-[13px] bg-[#1c3b2f] py-[17px] text-sm font-semibold text-white transition hover:bg-[#2b5541] disabled:opacity-60">{busy ? 'Checking…' : 'Enter my journal'}<ArrowRight size={17}/></button>
        </form>
        <div className="mt-12 flex items-start gap-2.5 rounded-xl border border-[#e7ebe5] p-4 text-[12px] leading-5 text-[#85948b]"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#607f6e]"/><span>Journal entries stay in this browser. This login is a convenience lock, not strong protection against someone with access to your device.</span></div>
      </div>
    </div>
  </div>;
}

function Sidebar({ page, setPage, logout, total, days }) {
  const nav = [{ id:'today', title:'My journal', icon:LayoutGrid },{ id:'history', title:'Entry history', icon:BookOpenText },{ id:'backup', title:'Export & backup', icon:ArrowDownToLine }];
  return <aside className="fixed inset-y-0 left-0 z-20 hidden w-[253px] flex-col bg-[#19382c] px-5 pb-7 pt-9 text-white md:flex">
    <div className="px-3"><Logo dark /></div>
    <div className="micro mb-5 mt-17 px-3 text-[#8aa395]">WORKSPACE</div>
    <nav className="space-y-1.5" aria-label="Main navigation">{nav.map(n => <button key={n.id} onClick={() => setPage(n.id)} className={cl('flex w-full items-center gap-3 rounded-[11px] px-4 py-[13px] text-left text-[13px] font-medium transition', page === n.id ? 'bg-[#e0e9dc] text-[#1a3b2b]' : 'text-[#b4c7ba] hover:bg-white/10 hover:text-white')}><n.icon size={18} strokeWidth={1.8}/><span className="flex-1">{n.title}</span>{page === n.id && <ChevronRight size={16}/>}</button>)}</nav>
    <div className="mt-auto">
      <div className="mb-7 rounded-[17px] border border-white/10 bg-white/[.045] p-4"><p className="micro text-[#98ae9f]">YOUR COLLECTION</p><div className="mt-4 grid grid-cols-2 gap-4"><div><p className="serif text-[29px] text-[#eaf0e7]">{total}</p><p className="text-[11px] text-[#9bb3a4]">Entries saved</p></div><div><p className="serif text-[29px] text-[#eaf0e7]">{days}</p><p className="text-[11px] text-[#9bb3a4]">Days logged</p></div></div></div>
      <div className="flex items-center gap-2 px-3 text-[11px] text-[#9ab0a1]"><CloudOff size={15}/> Saved on this device</div>
      <button className="mt-5 flex w-full items-center gap-3 rounded-[11px] px-3 py-3 text-left text-[13px] text-[#b6cabb] hover:bg-white/10" onClick={logout}><LogOut size={17}/> Log out</button>
    </div>
  </aside>;
}

function MobileNavigation({ page, setPage }) {
  const links = [{id:'today',text:'Journal',icon:PenLine},{id:'history',text:'History',icon:BookOpenText},{id:'backup',text:'Backup',icon:Download}];
  return <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[#e4e9e1] bg-white/95 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur md:hidden">{links.map(n=><button key={n.id} onClick={()=>setPage(n.id)} className={cl('flex flex-col items-center gap-1.5 text-[11px]',page===n.id?'font-semibold text-[#1b4834]':'text-[#92a096]')}><n.icon size={21}/>{n.text}</button>)}</nav>;
}

function PhotoThumb({ photo, onRemove }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (photo.preview) { setSrc(photo.preview); return; }
    let active = true; let objectUrl;
    readPhoto(photo.filename).then(blob => { objectUrl = URL.createObjectURL(blob); if (active) setSrc(objectUrl); else URL.revokeObjectURL(objectUrl); }).catch(() => { if (active) setSrc(null); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [photo.filename, photo.preview]);
  return <div className="group relative h-19 w-19 overflow-hidden rounded-xl border border-[#e2e8e0] bg-[#ecf0e9]">
    {src ? <img alt="Attached photo" src={src} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-[#8ba194]"><ImageIcon size={20}/></div>}
    {onRemove && <button type="button" aria-label="Remove photo" onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-[#172f27]/90 p-1 text-white"><X size={13}/></button>}
  </div>;
}

function Composer({ editingEntry, clearEditing, onSave, notify }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [interim, setInterim] = useState('');
  const [recording, setRecording] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('fil-PH');
  const [isSaving, setIsSaving] = useState(false);
  const [speechSupported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef('');
  const stopRequestedRef = useRef(false);
  const inputRef = useRef(null);
  const pendingRef = useRef([]);
  const attachedCount = existingPhotos.length + pendingPhotos.length;

  useEffect(() => {
    stopRecording();
    if (editingEntry) { setTitle(editingEntry.title || ''); setBody(editingEntry.body || ''); setExistingPhotos(editingEntry.photos || []); }
    else {
      try { const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') || emptyDraft; setTitle(draft.title || ''); setBody(draft.body || ''); } catch { setTitle(''); setBody(''); }
      setExistingPhotos([]);
    }
    setPendingPhotos(old => { old.forEach(p => URL.revokeObjectURL(p.preview)); return []; });
  }, [editingEntry?.id]);

  useEffect(() => {
    if (!editingEntry) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body })); } catch { /* draft is best-effort */ } }
  }, [title, body, editingEntry]);
  useEffect(() => { pendingRef.current = pendingPhotos; }, [pendingPhotos]);
  useEffect(() => () => {
    recognitionRef.current?.abort();
    pendingRef.current.forEach(p => URL.revokeObjectURL(p.preview));
  }, []);

  function commitPendingTranscript() {
    const text = transcriptBufferRef.current.trim();
    transcriptBufferRef.current = '';
    if (text) setBody(prev => prev.trimEnd() ? `${prev.trimEnd()} ${text}` : text);
    setInterim('');
  }

  function stopRecording() {
    const r = recognitionRef.current;
    stopRequestedRef.current = true;
    try { r?.stop(); } catch { /* already stopped */ }
    // Convert the buffered speech only when the user explicitly stops recording.
    if (!r) { commitPendingTranscript(); stopRequestedRef.current = false; }
    setRecording(false); setInterim('');
  }
  function toggleRecording() {
    if (recording) { stopRecording(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { notify('Voice transcription is not available in this browser. Try Chrome or Edge.', 'error'); return; }
    const recognition = new Recognition();
    stopRequestedRef.current = false;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLanguage;
    recognition.onresult = event => {
      let finalText = ''; let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text + ' ';
        else interimText += text;
      }
      if (finalText.trim()) {
        transcriptBufferRef.current = `${transcriptBufferRef.current} ${finalText.trim()}`.trim();
      }
      setInterim(interimText);
    };
    recognition.onerror = event => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') notify(`Microphone: ${event.error}. Check your browser permissions and connection.`, 'error');
    };
    recognition.onend = () => {
      if (stopRequestedRef.current) {
        commitPendingTranscript();
        stopRequestedRef.current = false;
        if (recognitionRef.current === recognition) recognitionRef.current = null;
        setRecording(false); setInterim('');
        return;
      }
      // Some browsers end a speech-recognition segment automatically. Restart it
      // while recording so the user can keep speaking without committing early.
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch { /* browser may already be restarting */ }
      }
    };
    try { recognitionRef.current = recognition; recognition.start(); setRecording(true); }
    catch { recognitionRef.current = null; notify('The microphone could not start.', 'error'); }
  }

  async function addFiles(files) {
    if (!files?.length) return;
    const capacity = Math.max(0, 6 - attachedCount);
    if (!capacity) { notify('You can attach up to 6 photos per entry.', 'error'); return; }
    if (files.length > capacity) notify(`Only ${capacity} more photo(s) can be attached.`, 'error');
    const added = [];
    for (const file of [...files].slice(0, capacity)) {
      try {
        const compressed = await optimizePhoto(file);
        added.push({ file: compressed, preview: URL.createObjectURL(compressed), key: crypto.randomUUID() });
      } catch(e) { notify(e.message || 'Photo could not be processed.', 'error'); }
    }
    setPendingPhotos(old => [...old, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removePending(key) {
    setPendingPhotos(prev => prev.filter(p => { if (p.key === key) URL.revokeObjectURL(p.preview); return p.key !== key; }));
  }

  async function save() {
    if (recording) { notify('Stop the microphone first so your final words finish transcribing, then save.', 'error'); return; }
    if (!body.trim()) { notify('Write something or use the microphone before saving.', 'error'); return; }
    setIsSaving(true);
    const newlySaved = [];
    try {
      for (const p of pendingPhotos) newlySaved.push(await savePhoto(p.file));
      const now = new Date().toISOString();
      const newEntry = {
        id: editingEntry?.id || crypto.randomUUID(),
        title: title.trim() || body.trim().split('\n')[0].slice(0, 64) || 'Untitled entry',
        body: body.trim(),
        createdAt: editingEntry?.createdAt || now,
        updatedAt: now,
        photos: [...existingPhotos, ...newlySaved]
      };
      const worked = await onSave(newEntry, editingEntry);
      if (!worked) throw new Error('Could not save. Your browser storage may be full. Export a backup or free up storage.');
      const removed = (editingEntry?.photos || []).filter(p => !existingPhotos.some(x => x.filename === p.filename));
      await Promise.allSettled(removed.map(p => deletePhoto(p.filename)));
      setTitle(''); setBody(''); setExistingPhotos([]);
      pendingPhotos.forEach(p => URL.revokeObjectURL(p.preview)); setPendingPhotos([]);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* no-op */ }
      notify(editingEntry ? 'Entry updated successfully.' : 'Your entry has been saved.');
      clearEditing();
    } catch(e) {
      await Promise.allSettled(newlySaved.map(p => deletePhoto(p.filename)));
      notify(e.message || 'Something went wrong while saving.', 'error');
    } finally { setIsSaving(false); }
  }

  return <section id="entry-composer" className="rounded-[21px] border border-[#e7ece5] bg-white p-5 soft-shadow sm:p-7">
    <div className="flex items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#edf2eb] text-[#47725a]"><PenLine size={17}/></span><h2 className="text-[16px] font-semibold tracking-[-.025em] text-[#233b2e]">{editingEntry ? 'Edit your entry' : 'Capture a moment'}</h2></div><p className="ml-11 mt-1 text-[12px] text-[#98a69b]">{editingEntry ? 'Make any changes, then save again.' : 'A thought, a memory, or simply how your day went.'}</p></div>
      <span className="hidden items-center gap-1.5 rounded-full bg-[#f1f6ef] px-3 py-1.5 text-[11px] font-medium text-[#658373] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#7cae88]"/>PRIVATE ENTRY</span>
    </div>
    <div className="mt-7"><label className="micro text-[#7c9282]" htmlFor="entry-title">ENTRY TITLE <span className="font-normal normal-case tracking-normal text-[#9cab9f]">(optional)</span></label><input id="entry-title" maxLength={120} placeholder="What would you call this moment?" className="mt-3 w-full rounded-[11px] border border-[#e9ede7] bg-[#fbfcfa] px-4 py-3.5 text-[14px] text-[#21382c] placeholder:text-[#b1bab0] focus:border-[#b0c8b4]" value={title} onChange={e => setTitle(e.target.value)}/></div>
    <div className="mt-5"><label className="micro text-[#7c9282]" htmlFor="entry-body">YOUR WORDS</label><div className="relative mt-3"><textarea id="entry-body" placeholder="Start writing, or tap the microphone and speak freely..." className="block min-h-[220px] w-full resize-y rounded-[13px] border border-[#e9ede7] bg-[#fbfcfa] px-4 py-4 text-[14px] leading-7 text-[#264032] placeholder:text-[#b0b9af] focus:border-[#b0c8b4]" value={body} onChange={e => setBody(e.target.value)}/>{interim && <p className="mx-1 mt-2 rounded-lg bg-[#ecf4eb] px-3 py-2 text-sm italic text-[#72937c]">Hearing: {interim}…</p>}</div></div>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <label htmlFor="speech-language" className="sr-only">Speech recognition language</label>
      <select id="speech-language" value={speechLanguage} onChange={e => setSpeechLanguage(e.target.value)} disabled={recording} className="rounded-xl border border-[#dbe7db] bg-white px-3 py-3 text-[12px] font-medium text-[#42634d] outline-none focus:border-[#8eaf93] disabled:opacity-60" aria-label="Speech recognition language">
        <option value="fil-PH">Filipino / Tagalog</option>
        <option value="en-US">English (US)</option>
        <option value="en-PH">English (Philippines)</option>
      </select>
      <button type="button" onClick={toggleRecording} className={cl('flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[12px] font-semibold transition', recording ? 'border-[#f0b3ab] bg-[#fff3f1] text-[#b6473f]' : 'border-[#dbe7db] bg-[#edf3ec] text-[#2e6044] hover:bg-[#e3eee1]')}><span className={cl('relative', recording && 'recording-ring')}>{recording ? <MicOff size={17}/> : <Mic size={17}/>}</span>{recording ? 'Stop recording' : 'Speak to text'}{recording && <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-[#dc6d61]"/>}</button>
      <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" id="photo-uploads" onChange={e => addFiles(e.target.files)}/>
      <label htmlFor="photo-uploads" className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#e4eae2] bg-white px-4 py-3 text-[12px] font-semibold text-[#577161] hover:bg-[#f7faf5]"><Camera size={16}/> Add photo <span className="font-normal text-[#a2afa4]">optional</span></label>
      <span className="ml-auto text-[11px] text-[#a3afa5]">{body.trim().length} characters</span>
    </div>
    {recording && <p role="status" className="mt-3 flex items-center gap-2 text-[12px] font-medium text-[#bd5b4d]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#db6c5d]"/> Listening… take your time. Speech is added to your journal only when you stop recording.</p>}
    {!speechSupported && <p className="mt-3 text-[12px] text-[#9a806d]">Live speech recognition is unavailable here. Try Chrome or Edge, or type your entry.</p>}
    <p className="mt-3 text-[11px] leading-5 text-[#9daaa0]">Only the text is saved, not an audio recording. Choose Filipino / Tagalog for Filipino speech or English for English speech. There is no dedicated browser setting for Taglish, so mixed Filipino-English speech may be transcribed less accurately. Browser speech recognition may use an online speech service. Transcribed phrases are added after a short 10-second pause, so you have more time to think.</p>
    {attachedCount > 0 && <div className="mt-5 border-t border-[#edf0eb] pt-4"><div className="mb-3 text-[11px] font-semibold text-[#738776]">ATTACHED PHOTOS ({attachedCount}/6)</div><div className="flex flex-wrap gap-2">{existingPhotos.map(p => <PhotoThumb key={p.filename} photo={p} onRemove={() => setExistingPhotos(old => old.filter(x => x.filename !== p.filename))}/>)}{pendingPhotos.map(p => <PhotoThumb key={p.key} photo={p} onRemove={() => removePending(p.key)}/>)}</div></div>}
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0eb] pt-5"><div className="flex items-center gap-2 text-[11px] text-[#92a399]"><LockKeyhole size={13}/>Stored in your browser</div><div className="flex gap-2">{editingEntry && <button onClick={() => { stopRecording(); clearEditing(); }} className="rounded-xl border border-[#e0e8df] px-5 py-3 text-[12px] font-semibold text-[#6b806f] hover:bg-[#f6f9f5]">Cancel</button>}<button type="button" disabled={isSaving || recording} onClick={save} className="flex items-center gap-2 rounded-xl bg-[#1d4331] px-6 py-3 text-[12px] font-semibold text-white shadow-[0_5px_14px_rgba(23,66,40,.12)] hover:bg-[#305a42] disabled:opacity-60"><Check size={16}/>{isSaving ? 'Saving…' : editingEntry ? 'Save changes' : 'Save entry'}<ArrowRight size={15}/></button></div></div>
  </section>;
}

function EntryPreview({ entry, onOpen }) {
  return <button onClick={() => onOpen(entry)} className="group flex w-full items-start gap-4 border-b border-[#edf0eb] px-1 py-5 text-left last:border-0"><div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[11px] bg-[#f0f4ed] text-[#4b745a]"><span className="text-[16px] font-bold leading-none">{new Date(entry.createdAt).getDate()}</span><span className="mt-1 text-[9px] font-semibold uppercase">{new Intl.DateTimeFormat('en-US',{month:'short'}).format(new Date(entry.createdAt))}</span></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h4 className="truncate text-[13px] font-semibold text-[#274031]">{entry.title}</h4><span className="shrink-0 text-[10px] text-[#9ba99e]">{formatTime(entry.createdAt)}</span></div><p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-[12px] leading-6 text-[#8a998e]">{entry.body}</p>{entry.photos?.length > 0 && <span className="mt-2 flex items-center gap-1 text-[10px] text-[#819c8a]"><ImageIcon size={12}/>{entry.photos.length} photo{entry.photos.length > 1 ? 's' : ''}</span>}</div><ChevronRight size={16} className="mt-2 shrink-0 text-[#b4beb5] group-hover:translate-x-0.5"/></button>;
}

function Dashboard({ entries, editingEntry, clearEditing, saveEntry, setPage, openEntry, notify }) {
  const todayKey = localDateKey(new Date());
  const todaysEntries = useMemo(() => entries.filter(e => localDateKey(e.createdAt) === todayKey).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [entries, todayKey]);
  const recent = useMemo(() => [...entries].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,3), [entries]);
  return <div>
    <div className="mb-7"><span className="micro text-[#7c9785]">YOUR PERSONAL SPACE</span><h1 className="serif mt-2 text-[42px] leading-[1.2] text-[#1c3b2d] sm:text-[52px]">A place for your thoughts<span className="text-[#9ab49c]">.</span></h1><p className="mt-2 text-[13px] leading-7 text-[#87998b]">Write it down. Speak it out. Remember it all.</p></div>
    <div className="relative mb-6 overflow-hidden rounded-[22px] bg-[#204735] p-6 text-white sm:p-8"><div className="pointer-events-none absolute -right-16 -top-24 h-[320px] w-[320px] rounded-full border border-white/15"/><div className="pointer-events-none absolute -right-2 -top-10 h-[220px] w-[220px] rounded-full border border-white/15"/><div className="pointer-events-none absolute right-12 top-3 h-[120px] w-[120px] rounded-full border border-white/15"/><div className="relative z-10 flex flex-wrap items-center justify-between gap-4"><div><div className="micro text-[#adccaf]">TODAY, {new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(new Date()).toUpperCase()}</div><h2 className="serif mt-2 text-[31px] leading-tight sm:text-[38px]">{new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date())}</h2><p className="mt-3 text-[12px] text-[#a8c7b2]">{todaysEntries.length ? `${todaysEntries.length} ${todaysEntries.length===1?'memory':'memories'} captured today` : 'A fresh page is waiting for your story.'}</p></div><div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/20 bg-white/10"><Sparkles size={22} className="text-[#cee0cd]"/></div></div></div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.9fr)]">
      <Composer key={editingEntry?.id || 'new-entry'} editingEntry={editingEntry} clearEditing={clearEditing} onSave={saveEntry} notify={notify}/>
      <aside className="flex flex-col gap-5"><div className="rounded-[21px] border border-[#e7ece5] bg-white p-5 soft-shadow sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-[15px] font-semibold text-[#2a4331]">Recent memories</h3><button className="text-[11px] font-semibold text-[#6a9776] hover:text-[#2b603e]" onClick={()=>setPage('history')}>View all <ArrowRight size={13} className="inline"/></button></div><div className="mt-3">{recent.length ? recent.map(e => <EntryPreview key={e.id} entry={e} onOpen={openEntry}/>) : <div className="py-12 text-center"><BookOpenText className="mx-auto mb-3 text-[#a7bbac]" size={27}/><p className="text-[13px] font-medium text-[#617765]">Your story starts here</p><p className="mt-2 text-[11px] text-[#9caca0]">Your saved entries will appear here.</p></div>}</div></div><div className="rounded-[21px] border border-[#e4ebde] bg-[#edf3eb] p-6"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dce9da] text-[#527c5d]"><ShieldCheck size={20}/></div><h3 className="mt-4 text-[14px] font-semibold text-[#345640]">Your moments stay yours.</h3><p className="mt-2 text-[12px] leading-6 text-[#849a87]">Entries are saved locally. Export a backup regularly so you never lose a memory.</p><button onClick={() => setPage('backup')} className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-[#356244]">Go to backup <ArrowRight size={14}/></button></div></aside>
    </div>
  </div>;
}

function EntryDetails({ entry, onClose, onEdit, onDelete }) {
  if (!entry) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14251c]/55 px-4 py-7 backdrop-blur-[3px]" onClick={onClose}><div onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Journal entry details" className="max-h-[90vh] w-full max-w-[650px] overflow-y-auto rounded-[22px] bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-center justify-between gap-4"><span className="micro text-[#789781]">SAVED MEMORY</span><button aria-label="Close entry" onClick={onClose} className="rounded-lg p-2 text-[#7f9484] hover:bg-[#eff3ed]"><X size={19}/></button></div><h2 className="serif mt-5 text-[35px] leading-tight text-[#23442f]">{entry.title}</h2><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#859b8a]"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{formatLongDate(entry.createdAt)}</span><span className="flex items-center gap-1.5"><Clock3 size={14}/>{formatTime(entry.createdAt)} {formatTimeZone(entry.createdAt)}</span></div><div className="mt-7 whitespace-pre-wrap break-words border-y border-[#eef1ec] py-6 text-[14px] leading-8 text-[#3f5445]">{entry.body}</div>{entry.photos?.length > 0 && <div className="mt-5"><div className="mb-3 text-[12px] font-semibold text-[#607c68]">Photos ({entry.photos.length})</div><div className="flex flex-wrap gap-3">{entry.photos.map(p => <PhotoThumb key={p.filename} photo={p}/>)}</div></div>}{entry.updatedAt !== entry.createdAt && <p className="mt-5 text-[11px] text-[#95a398]">Last edited: {formatShortDate(entry.updatedAt)} at {formatTime(entry.updatedAt)}</p>}<div className="mt-7 flex items-center justify-between"><button onClick={() => onDelete(entry)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-[12px] font-semibold text-[#bc6a61] hover:bg-[#fff0ee]"><Trash2 size={15}/>Delete</button><button onClick={() => onEdit(entry)} className="flex items-center gap-2 rounded-xl bg-[#1b4230] px-5 py-3 text-[12px] font-semibold text-white hover:bg-[#315b43]"><Pencil size={15}/>Edit entry</button></div></div></div>;
}

function History({ entries, openEntry }) {
  const [selectedDay, setSelectedDay] = useState(() => localDateKey(new Date()));
  const [allDays, setAllDays] = useState(false);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => [...entries].filter(e => (allDays || localDateKey(e.createdAt) === selectedDay) && (!query || `${e.title} ${e.body}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [entries, selectedDay, allDays, query]);
  const groups = useMemo(() => visible.reduce((acc, e) => { const key = localDateKey(e.createdAt); (acc[key] ||= []).push(e); return acc; }, {}), [visible]);
  function shiftDay(shift) { const dt = new Date(`${selectedDay}T12:00:00`); dt.setDate(dt.getDate() + shift); setSelectedDay(localDateKey(dt)); }
  return <div><div className="mb-8"><span className="micro text-[#7c9785]">LOOK BACK & REMEMBER</span><h1 className="serif mt-2 text-[43px] text-[#1c3b2d] sm:text-[54px]">Your archive<span className="text-[#9ab49c]">.</span></h1><p className="mt-2 text-[13px] text-[#87998b]">Every entry, kept by its exact date and time.</p></div>
    <div className="rounded-[20px] border border-[#e6ece4] bg-white p-5 soft-shadow sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-[16px] font-semibold text-[#284332]">Saved entries</h2><p className="mt-1 text-[12px] text-[#9aaba0]">{entries.length} total journal {entries.length===1?'entry':'entries'}</p></div><button onClick={() => {setAllDays(false);setSelectedDay(localDateKey(new Date()));setQuery('');}} className="flex items-center gap-2 rounded-xl border border-[#e5ece4] px-4 py-2.5 text-[12px] font-semibold text-[#688a72] hover:bg-[#f6f9f4]"><CalendarDays size={15}/>Jump to today</button></div>
    <div className="mt-6 flex flex-col gap-3 border-t border-[#edf1eb] pt-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-2"><button onClick={()=>setAllDays(false)} className={cl('rounded-xl px-4 py-2.5 text-xs font-semibold',!allDays?'bg-[#214b35] text-white':'bg-[#f0f4ee] text-[#748e7b]')}>By date</button><button onClick={()=>setAllDays(true)} className={cl('rounded-xl px-4 py-2.5 text-xs font-semibold',allDays?'bg-[#214b35] text-white':'bg-[#f0f4ee] text-[#748e7b]')}>All days</button>{!allDays && <div className="ml-1 flex items-center gap-2 rounded-xl border border-[#e4eae1] px-2 py-1.5"><button aria-label="Previous day" onClick={()=>shiftDay(-1)} className="rounded-md p-1 text-[#64836c] hover:bg-[#e7efe5]"><ArrowLeft size={15}/></button><input aria-label="Choose entry date" type="date" value={selectedDay} onChange={e=>setSelectedDay(e.target.value)} className="min-w-0 bg-transparent text-[12px] text-[#516f5b]"/><button aria-label="Next day" onClick={()=>shiftDay(1)} className="rounded-md p-1 text-[#64836c] hover:bg-[#e7efe5]"><ArrowRight size={15}/></button></div>}</div><div className="relative w-full lg:max-w-[250px]"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a3b1a5]" size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search entries…" className="w-full rounded-xl border border-[#e6ece5] bg-[#fbfcfa] py-3 pl-10 pr-4 text-[12px] placeholder:text-[#a7b4aa] focus:border-[#a2c4ab]"/></div></div>
    <div className="mt-7">{visible.length===0 ? <div className="py-18 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3eb] text-[#7da087]"><BookOpenText size={24}/></div><h3 className="mt-4 text-[15px] font-semibold text-[#4c6653]">Nothing saved {allDays ? 'yet' : 'on this day'}</h3><p className="mt-2 text-[12px] text-[#97a99b]">{query?'Try a different search.':'Choose another date, or start writing a new entry.'}</p></div> : Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).map(([day, items])=><div key={day} className="mb-8 last:mb-0"><div className="mb-3 flex items-center gap-3"><span className="text-[12px] font-semibold text-[#517258]">{formatLongDate(`${day}T12:00:00`)}</span><span className="h-px flex-1 bg-[#e8eee7]"/><span className="text-[11px] text-[#a6b3a7]">{items.length} {items.length===1?'entry':'entries'}</span></div><div className="space-y-3">{items.map(e=><button key={e.id} onClick={()=>openEntry(e)} className="group flex w-full gap-4 rounded-[14px] border border-[#e8eee7] p-4 text-left transition hover:border-[#c5dac5] hover:bg-[#fbfdf9]"><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#edf3ea] text-[#6b8b70]"><FileText size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-[13px] font-semibold text-[#345640]">{e.title}</h4><span className="flex items-center gap-1 text-[11px] font-medium text-[#819785]"><Clock3 size={12}/>{formatTime(e.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-6 text-[#819485]">{e.body}</p>{e.photos?.length > 0 && <span className="mt-2 flex items-center gap-1 text-[11px] text-[#90a796]"><ImageIcon size={13}/>{e.photos.length} photo{e.photos.length===1?'':'s'}</span>}</div><ChevronRight size={17} className="mt-2 shrink-0 text-[#afc0b0] group-hover:translate-x-0.5"/></button>)}</div></div>)}</div>
    </div>
  </div>;
}

function BackupPage({ entries, onRestore, notify }) {
  const [busy, setBusy] = useState('');
  const fileInput = useRef(null);
  async function run(name, action) {
    setBusy(name);
    try { const missing = await action(); notify(missing?.length ? `Backup downloaded, but ${missing.length} photo(s) could not be found.` : 'Your file has been downloaded.', missing?.length ? 'error' : 'success'); }
    catch(e) { notify(e.message || 'Could not prepare your download.', 'error'); }
    finally { setBusy(''); }
  }
  async function importBackup(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy('restore');
    try { const result = await importCompleteBackup(file, entries); await onRestore(result.entries); notify(`${result.imported} new ${result.imported===1?'entry':'entries'} restored. Existing entries were kept.`); }
    catch(error) { notify(error.message || 'Unable to import this backup.', 'error'); }
    finally { setBusy(''); e.target.value = ''; }
  }
  const downloads = [
    { id:'excel', icon:FileSpreadsheet, title:'Excel spreadsheet', subtitle:'Organized into date, time, title, content and photo columns.', extension:'.XLSX', action:()=>downloadExcel(entries) },
    { id:'text', icon:FileText, title:'Plain text archive', subtitle:'A readable .txt file with all notes in chronological order.', extension:'.TXT', action:()=>downloadText(entries) },
    { id:'complete', icon:FileArchive, title:'Complete backup', subtitle:'One ZIP containing Excel, text, restore data, and a photos/ folder.', extension:'.ZIP', action:()=>downloadCompleteBackup(entries) }
  ];
  return <div><div className="mb-8"><span className="micro text-[#7c9785]">KEEP EVERY MEMORY SAFE</span><h1 className="serif mt-2 text-[43px] text-[#1c3b2d] sm:text-[54px]">Export & backup<span className="text-[#9ab49c]">.</span></h1><p className="mt-2 text-[13px] leading-6 text-[#87998b]">Download your journal, organize it in Excel, or save a full backup.</p></div>
    <div className="grid gap-4">{downloads.map(item => <div key={item.id} className="flex flex-wrap items-center gap-4 rounded-[19px] border border-[#e6ece4] bg-white p-5 soft-shadow sm:flex-nowrap sm:p-6"><div className="grid h-13 w-13 shrink-0 place-items-center rounded-[14px] bg-[#ebf2e9] text-[#4d7d59]"><item.icon size={23} strokeWidth={1.6}/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-[14px] font-semibold text-[#34513b]">{item.title}</h3><span className="rounded-md bg-[#f0f4ee] px-2 py-1 text-[9px] font-semibold text-[#83a087]">{item.extension}</span></div><p className="mt-1.5 text-[12px] leading-6 text-[#90a294]">{item.subtitle}</p></div><button disabled={!!busy} onClick={()=>run(item.id,item.action)} className="flex items-center justify-center gap-2 rounded-[11px] border border-[#dce7db] bg-[#f7faf5] px-5 py-3 text-[12px] font-semibold text-[#426b4c] hover:bg-[#edf5eb] disabled:opacity-60"><Download size={15}/>{busy===item.id?'Preparing…':'Download'}</button></div>)}</div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="rounded-[19px] border border-[#e6ece4] bg-white p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3eb] text-[#63836c]"><UploadCloud size={21}/></div><h3 className="mt-4 text-[15px] font-semibold text-[#32533b]">Restore from a backup</h3><p className="mt-2 text-[12px] leading-6 text-[#84998a]">Import a previously exported Still .zip file. New entries are added; existing entries aren't replaced.</p><input ref={fileInput} type="file" accept=".zip,application/zip" className="hidden" onChange={importBackup}/><button disabled={!!busy} onClick={()=>fileInput.current?.click()} className="mt-5 flex items-center gap-2 rounded-xl bg-[#1c4030] px-4 py-3 text-[12px] font-semibold text-white hover:bg-[#325942] disabled:opacity-60"><UploadCloud size={16}/>{busy==='restore'?'Restoring…':'Choose backup ZIP'}</button></div><div className="rounded-[19px] border border-[#e6ece4] bg-[#edf3eb] p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dae9d9] text-[#557f61]"><HardDrive size={21}/></div><h3 className="mt-4 text-[15px] font-semibold text-[#32533b]">Where your data lives</h3><p className="mt-2 text-[12px] leading-6 text-[#84998a]">Notes are stored in this browser’s localStorage. Photos are kept in a dedicated <strong>photos</strong> directory in the browser’s private local file storage when supported, and in <strong>photos/</strong> inside a ZIP backup.</p><p className="mt-3 text-[11px] leading-5 text-[#859c8b]">Clearing browser data, switching browsers or devices, or using private browsing may erase your entries. Download backups regularly.</p></div></div>
    <div className="mt-7 flex items-center gap-3 rounded-xl border border-[#e6ece4] bg-white px-5 py-4 text-[12px] text-[#7f9586]"><ShieldCheck className="shrink-0 text-[#62866d]" size={19}/><span>Export includes <strong className="text-[#486c52]">{entries.length} entries</strong>. Your password is never included in downloaded files.</span></div>
  </div>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'yes');
  const [entries, setEntries] = useState(loadEntries);
  const [page, setPage] = useState('today');
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const days = new Set(entries.map(e => localDateKey(e.createdAt))).size;
  useEffect(() => { if (!toast) return; const timer=setTimeout(()=>setToast(null), 4500); return ()=>clearTimeout(timer); }, [toast]);
  const notify = (message, type='success') => setToast({ message, type, stamp:Date.now() });
  function login() { sessionStorage.setItem(SESSION_KEY, 'yes'); setAuthenticated(true); }
  function logout() { sessionStorage.removeItem(SESSION_KEY); setAuthenticated(false); setSelectedEntry(null); setEditingEntry(null); }
  async function saveEntry(entry, oldEntry) {
    const next = oldEntry ? entries.map(e=>e.id===entry.id?entry:e) : [entry,...entries];
    try { persistEntries(next); setEntries(next); return true; }
    catch { return false; }
  }
  async function restoreEntries(next) { persistEntries(next); setEntries(next); }
  function editEntry(entry) { setSelectedEntry(null); setEditingEntry(entry); setPage('today'); window.scrollTo({top:0,behavior:'smooth'}); }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const next = entries.filter(e=>e.id!==deleteTarget.id);
      persistEntries(next); setEntries(next); setSelectedEntry(null);
      if (editingEntry?.id===deleteTarget.id) setEditingEntry(null);
      await Promise.allSettled((deleteTarget.photos||[]).map(p=>deletePhoto(p.filename)));
      notify('Entry deleted.');
    } catch { notify('Could not delete the entry.', 'error'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }
  if (!authenticated) return <LoginScreen onLogin={login}/>;
  return <div className="min-h-screen bg-[#f8f9f6] text-[#254130]">
    <Sidebar page={page} setPage={setPage} logout={logout} total={entries.length} days={days}/>
    <div className="min-h-screen md:pl-[253px]"><header className="flex h-[77px] items-center justify-between border-b border-[#ecf0e9] bg-white/85 px-5 backdrop-blur sm:px-9 md:h-[88px] xl:px-12"><div className="flex items-center gap-3"><div className="md:hidden"><Logo/></div><div className="hidden items-center gap-3 md:flex"><span className="micro text-[#99a99b]">PERSONAL JOURNAL</span><ChevronRight size={12} className="text-[#adc0ae]"/><span className="text-[12px] font-semibold text-[#647f6c]">{page==='today'?'My journal':page==='history'?'Entry history':'Export & backup'}</span></div></div><div className="flex items-center gap-4"><span className="hidden items-center gap-2 rounded-full border border-[#edf1ea] bg-[#f9fbf8] px-4 py-2 text-[11px] font-semibold text-[#718f78] sm:flex"><CalendarDays size={14}/>{formatShortDate(new Date())}</span><div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dee9de] bg-[#e8f0e7] text-[11px] font-bold text-[#456950]" title="Anthony's journal">AC</div><button title="Log out" aria-label="Log out" onClick={logout} className="text-[#8ba092] hover:text-[#274b37] md:hidden"><LogOut size={18}/></button></div></header><main className="mx-auto max-w-[1440px] px-5 pb-30 pt-9 sm:px-9 md:pb-15 md:pt-10 xl:px-12">{page==='today'&&<Dashboard entries={entries} editingEntry={editingEntry} clearEditing={()=>setEditingEntry(null)} saveEntry={saveEntry} setPage={setPage} openEntry={setSelectedEntry} notify={notify}/>} {page==='history'&&<History entries={entries} openEntry={setSelectedEntry}/>} {page==='backup'&&<BackupPage entries={entries} onRestore={restoreEntries} notify={notify}/>}</main></div>
    <MobileNavigation page={page} setPage={setPage}/>
    <EntryDetails entry={selectedEntry} onClose={()=>setSelectedEntry(null)} onEdit={editEntry} onDelete={entry=>setDeleteTarget(entry)}/>
    {deleteTarget && <div className="fixed inset-0 z-[60] grid place-items-center bg-[#17251b]/55 p-5" onClick={()=>!deleting&&setDeleteTarget(null)}><div className="w-full max-w-[390px] rounded-2xl bg-white p-7" onClick={e=>e.stopPropagation()}><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ffefed] text-[#c85b52]"><Trash2 size={21}/></div><h3 className="mt-4 text-[19px] font-semibold text-[#284334]">Delete this entry?</h3><p className="mt-2 text-[13px] leading-6 text-[#8b9b8f]">This will permanently remove the note and its attached photos from this browser. This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button disabled={deleting} onClick={()=>setDeleteTarget(null)} className="rounded-xl border border-[#e4ebe2] px-4 py-3 text-[12px] font-semibold text-[#6e8372]">Cancel</button><button disabled={deleting} onClick={confirmDelete} className="rounded-xl bg-[#b9524d] px-4 py-3 text-[12px] font-semibold text-white">{deleting?'Deleting…':'Delete forever'}</button></div></div></div>}
    {toast && <div role="status" key={toast.stamp} className={cl('fixed bottom-23 left-1/2 z-[70] flex max-w-[min(480px,94vw)] -translate-x-1/2 items-center gap-3 rounded-[13px] px-5 py-4 text-[12px] font-semibold shadow-xl md:bottom-7',toast.type==='error'?'bg-[#753f36] text-white':'bg-[#214a35] text-[#f6faf4]')}>{toast.type==='error'?<CircleAlert size={17} className="shrink-0"/>:<Check size={17} className="shrink-0"/>}{toast.message}<button aria-label="Dismiss" onClick={()=>setToast(null)} className="ml-2 opacity-65"><X size={15}/></button></div>}
  </div>;
}
