import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "./lib/supabase";

type Playlist = { id: string; name: string };
type Track = {
  id: string; playlist_id: string; title: string; artist: string | null;
  source: "external" | "uploaded"; source_url: string | null;
  storage_path: string | null; position: number;
};

const DB_NAME = "banana-audio-library";
const STORE_NAME = "audio-files";

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Couldn't open local audio storage."));
  });
}

async function saveAudio(id: string, file: Blob) {
  const db = await openAudioDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Couldn't save the audio file."));
  });
  db.close();
}

async function readAudio(id: string): Promise<Blob | null> {
  const db = await openAudioDb();
  const result = await new Promise<Blob | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Couldn't read the audio file."));
  });
  db.close();
  return result;
}

async function removeAudio(id: string) {
  const db = await openAudioDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Couldn't remove the audio file."));
  });
  db.close();
}

export default function MusicModule() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistId, setPlaylistId] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlistName, setPlaylistName] = useState("Workout mix");
  const [trackTitle, setTrackTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPlaylists() {
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from("playlists").select("id,name").order("created_at", { ascending: false });
    if (loadError) { setError(loadError.message); return; }
    const rows = (data ?? []) as Playlist[];
    setPlaylists(rows);
    if (!playlistId && rows.length) setPlaylistId(rows[0].id);
  }

  async function loadTracks(id: string) {
    if (!supabase) return;
    const { data, error: loadError } = await supabase.from("playlist_tracks")
      .select("id,playlist_id,title,artist,source,source_url,storage_path,position")
      .eq("playlist_id", id).order("position", { ascending: true });
    if (loadError) { setError(loadError.message); return; }
    setTracks((data ?? []) as Track[]);
  }

  useEffect(() => { void loadPlaylists(); }, []);
  useEffect(() => { if (playlistId) void loadTracks(playlistId); else setTracks([]); }, [playlistId]);
  useEffect(() => () => {
    if (objectUrlRef.current) window.URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  async function createPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !playlistName.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Log in again to create a playlist.");
      const { data, error: insertError } = await supabase.from("playlists")
        .insert({ user_id: userData.user.id, name: playlistName.trim() }).select("id,name").single();
      if (insertError) throw insertError;
      const row = data as Playlist;
      setPlaylists((current) => [row, ...current]);
      setPlaylistId(row.id);
      setMessage("Playlist created.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't create that playlist.");
    } finally { setBusy(false); }
  }

  async function saveTrackRow(values: { title: string; artist: string | null; source: "external" | "uploaded"; source_url: string | null; storage_path: string | null }) {
    if (!supabase || !playlistId) throw new Error("Create or select a playlist first.");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error("Log in again to add music.");
    const { error: insertError } = await supabase.from("playlist_tracks").insert({
      user_id: userData.user.id, playlist_id: playlistId, ...values, position: tracks.length,
    });
    if (insertError) throw insertError;
    await loadTracks(playlistId);
  }

  async function addExternalTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trackTitle.trim() || !trackUrl.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const parsed = new URL(trackUrl.trim());
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Use a normal web audio link.");
      await saveTrackRow({ title: trackTitle.trim(), artist: artist.trim() || null, source: "external", source_url: parsed.toString(), storage_path: null });
      setTrackTitle(""); setArtist(""); setTrackUrl("");
      setMessage("Track added. The link must point directly to a browser-playable audio file.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't add that track.");
    } finally { setBusy(false); }
  }

  async function addUploadedTrack(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setError("Choose an audio file."); return; }
    if (file.size > 30 * 1024 * 1024) { setError("This version supports audio files up to 30 MB."); return; }
    if (!playlistId) { setError("Create or select a playlist first."); return; }
    setBusy(true); setError(""); setMessage("");
    const id = window.crypto.randomUUID();
    try {
      await saveAudio(id, file);
      try {
        await saveTrackRow({ title: file.name.replace(/\.[^.]+$/, ""), artist: null, source: "uploaded", source_url: null, storage_path: "local:" + id });
      } catch (caught) {
        await removeAudio(id);
        throw caught;
      }
      setMessage("Audio imported on this device.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't import that audio file.");
    } finally { setBusy(false); }
  }

  async function playTrack(track: Track) {
    setError("");
    try {
      let source = track.source_url ?? "";
      if (track.source === "uploaded") {
        const id = track.storage_path?.replace(/^local:/, "") ?? "";
        const blob = id ? await readAudio(id) : null;
        if (!blob) throw new Error("This audio file isn't stored on this device. Re-import it here to play it.");
        if (objectUrlRef.current) window.URL.revokeObjectURL(objectUrlRef.current);
        source = window.URL.createObjectURL(blob);
        objectUrlRef.current = source;
      }
      if (!source || !audioRef.current) throw new Error("This track doesn't have a playable audio source.");
      setCurrentTrack(track);
      audioRef.current.src = source;
      audioRef.current.load();
      await audioRef.current.play();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't play this track.");
    }
  }

  async function playNext() {
    if (!currentTrack || tracks.length < 2) return;
    const index = tracks.findIndex((track) => track.id === currentTrack.id);
    await playTrack(tracks[(index + 1) % tracks.length]);
  }

  async function removeTrack(track: Track) {
    if (!supabase) return;
    setError(""); setMessage("");
    try {
      const { error: deleteError } = await supabase.from("playlist_tracks").delete().eq("id", track.id);
      if (deleteError) throw deleteError;
      if (track.source === "uploaded" && track.storage_path?.startsWith("local:")) {
        await removeAudio(track.storage_path.slice(6));
      }
      if (currentTrack?.id === track.id) {
        audioRef.current?.pause();
        setCurrentTrack(null);
      }
      await loadTracks(playlistId);
      setMessage("Track removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't remove that track.");
    }
  }

  return (
    <section className="banana-module">
      <div className="module-heading">
        <div><p className="eyebrow">PHASE 5 · MUSIC</p><h2>Your soundtrack.</h2><p>Build playlists, import audio, and keep playback controls in BANANA.</p></div>
        <span className="module-pill">PLAYER BETA</span>
      </div>
      {(error || message) && <p className={error ? "module-alert error" : "module-alert"} role="status">{error || message}</p>}
      <div className="module-grid two">
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">PLAYLISTS</p><h3>Your library</h3></div><span>{playlists.length} LISTS</span></div>
          <form className="playlist-create" onSubmit={createPlaylist}><input className="module-input" value={playlistName} onChange={(event) => setPlaylistName(event.target.value)} placeholder="Playlist name" maxLength={100} /><button className="module-small-button" disabled={busy || !playlistName.trim()}>Create</button></form>
          {playlists.length === 0 ? <p className="module-empty">Create your first playlist to start building a soundtrack.</p> : <label className="module-label">Selected playlist<select className="module-input" value={playlistId} onChange={(event) => setPlaylistId(event.target.value)}>{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}</select></label>}
          <div className="music-track-list">
            {tracks.map((track) => <div className={currentTrack?.id === track.id ? "music-track active" : "music-track"} key={track.id}>
              <button className="music-track-play" onClick={() => void playTrack(track)} aria-label={"Play " + track.title}>▶</button>
              <div><strong>{track.title}</strong><small>{track.artist || (track.source === "uploaded" ? "Imported on this device" : "External audio link")}</small></div>
              <button className="music-track-remove" onClick={() => void removeTrack(track)} aria-label={"Remove " + track.title}>×</button>
            </div>)}
            {playlistId && tracks.length === 0 && <p className="module-empty">No tracks yet. Add an audio file or direct audio URL.</p>}
          </div>
        </article>
        <article className="module-card">
          <div className="module-card-head"><div><p className="eyebrow">ADD TO PLAYLIST</p><h3>Bring your music</h3></div><span>02</span></div>
          <label className="module-label upload-audio">Import audio file<input type="file" accept="audio/*" onChange={(event) => void addUploadedTrack(event)} disabled={busy || !playlistId} /><small>Up to 30 MB. The audio file stays in this browser on this device; only its playlist details sync to your account.</small></label>
          <div className="module-divider-label">OR ADD A DIRECT AUDIO LINK</div>
          <form className="music-link-form" onSubmit={addExternalTrack}>
            <label className="module-label">Track title<input className="module-input" value={trackTitle} onChange={(event) => setTrackTitle(event.target.value)} maxLength={120} required /></label>
            <label className="module-label">Artist (optional)<input className="module-input" value={artist} onChange={(event) => setArtist(event.target.value)} maxLength={120} /></label>
            <label className="module-label">Direct audio URL<input className="module-input" type="url" value={trackUrl} onChange={(event) => setTrackUrl(event.target.value)} placeholder="https://example.com/audio.mp3" required /></label>
            <button className="module-primary" disabled={busy || !playlistId}>Add track</button>
          </form>
          <p className="module-footnote">A Spotify page link isn't a direct audio file. Spotify playback needs a separate supported integration.</p>
        </article>
      </div>
      <article className="module-card music-player-card">
        <div className="music-player-top"><div className="music-art">♫</div><div><p className="eyebrow">NOW PLAYING</p><h3>{currentTrack?.title ?? "Choose a track"}</h3><p>{currentTrack?.artist ?? (currentTrack ? "BANANA playlist" : "Your soundtrack will appear here.")}</p></div><span className="module-pill">BANANA PLAYER</span></div>
        <audio ref={audioRef} controls preload="metadata" onEnded={() => void playNext()} onError={() => setError("This link could not be played. Try a direct MP3, WAV, or other browser-supported audio file.")} />
        <div className="music-player-actions"><button className="module-secondary" onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; void audioRef.current.play().catch(() => setError("Tap play to start audio.")); } }} disabled={!currentTrack}>Replay</button><button className="module-small-button" onClick={() => void playNext()} disabled={tracks.length < 2}>Next track →</button></div>
      </article>
    </section>
  );
}
