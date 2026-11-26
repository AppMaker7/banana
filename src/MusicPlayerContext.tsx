import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { readAudioFile } from "./audioStorage";

export type Track = {
  id: string; playlist_id: string; title: string; artist: string | null;
  source: "external" | "uploaded"; source_url: string | null;
  storage_path: string | null; position: number;
};

type PlayerValue = {
  currentTrack: Track | null;
  isPlaying: boolean;
  playerError: string;
  setQueue: (tracks: Track[]) => void;
  playTrack: (track: Track) => Promise<void>;
  togglePlayback: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
};

const MusicPlayerContext = createContext<PlayerValue | null>(null);

export function useMusicPlayer() {
  const value = useContext(MusicPlayerContext);
  if (!value) throw new Error("useMusicPlayer must be used inside MusicPlayerProvider.");
  return value;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentRef = useRef<Track | null>(null);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerError, setPlayerError] = useState("");

  function setQueue(tracks: Track[]) {
    queueRef.current = tracks;
    setQueueState(tracks);
  }

  async function playTrack(track: Track) {
    setPlayerError("");
    try {
      let source = track.source_url ?? "";
      if (track.source === "uploaded") {
        const id = track.storage_path?.replace(/^local:/, "") ?? "";
        const blob = id ? await readAudioFile(id) : null;
        if (!blob) throw new Error("This audio file isn't stored on this device. Re-import it here to play it.");
        if (objectUrlRef.current) window.URL.revokeObjectURL(objectUrlRef.current);
        source = window.URL.createObjectURL(blob);
        objectUrlRef.current = source;
      }
      const audio = audioRef.current;
      if (!source || !audio) throw new Error("This track doesn't have a playable audio source.");
      currentRef.current = track;
      setCurrentTrack(track);
      audio.src = source;
      audio.load();
      await audio.play();
    } catch (caught) {
      setIsPlaying(false);
      setPlayerError(caught instanceof Error ? caught.message : "Couldn't play this track.");
    }
  }

  async function nextTrack() {
    const list = queueRef.current;
    const current = currentRef.current;
    if (!current || list.length < 2) return;
    const index = list.findIndex((track) => track.id === current.id);
    await playTrack(list[(index + 1 + list.length) % list.length]);
  }

  async function previousTrack() {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const list = queueRef.current;
    const current = currentRef.current;
    if (!current || list.length < 2) return;
    const index = list.findIndex((track) => track.id === current.id);
    await playTrack(list[(index - 1 + list.length) % list.length]);
  }

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      void audio.play().catch(() => setPlayerError("Tap play again to start audio."));
    } else {
      audio.pause();
    }
  }

  useEffect(() => () => {
    if (objectUrlRef.current) window.URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const value: PlayerValue = {
    currentTrack, isPlaying, playerError, setQueue, playTrack, togglePlayback, nextTrack, previousTrack,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <div className={currentTrack ? "banana-mini-player visible" : "banana-mini-player"} aria-label="BANANA mini player">
        <div className="mini-player-track">
          <span className="mini-player-art">♫</span>
          <span><strong>{currentTrack?.title ?? "BANANA Music"}</strong><small>{currentTrack?.artist ?? (currentTrack ? "Your playlist" : "Choose a track in Music")}</small></span>
        </div>
        <audio
          ref={audioRef}
          controls={Boolean(currentTrack)}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => void nextTrack()}
        />
        {currentTrack && <div className="mini-player-buttons">
          <button onClick={() => void previousTrack()} aria-label="Previous track">|◀</button>
          <button onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}>{isPlaying ? "Ⅱ" : "▶"}</button>
          <button onClick={() => void nextTrack()} aria-label="Next track">▶|</button>
        </div>}
        {playerError && <span className="mini-player-error" role="status">{playerError}</span>}
      </div>
    </MusicPlayerContext.Provider>
  );
}
