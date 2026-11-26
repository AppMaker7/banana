import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./lib/supabase";

type Props = { children: React.ReactNode };

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (authError) throw authError;
        if (data.session) setMessage("Your BANANA account is ready.");
        else setMessage("Account created. Check your email to confirm your address, then log in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }

  const page: React.CSSProperties = {
    minHeight: "100vh", display: "grid", placeItems: "center", padding: 22,
    background: "radial-gradient(ellipse at 50% 15%, #183541 0, #08121b 48%, #050b12 100%)",
    color: "#F1F4ED", fontFamily: "Inter, system-ui, sans-serif",
  };
  const panel: React.CSSProperties = {
    width: "min(100%, 420px)", padding: 28, border: "1px solid #2a3c46",
    borderRadius: 20, background: "rgba(14, 24, 33, .94)",
    boxShadow: "0 24px 90px #0008",
  };
  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", marginTop: 7, padding: "13px 14px",
    border: "1px solid #344752", borderRadius: 9, background: "#09131b",
    color: "#F1F4ED", fontSize: 14, outlineColor: "#35DDF5",
  };
  const label: React.CSSProperties = {
    display: "block", marginTop: 15, color: "#A8B7C2", fontSize: 11,
    letterSpacing: ".08em", textTransform: "uppercase",
  };
  const primary: React.CSSProperties = {
    width: "100%", marginTop: 22, padding: 14, border: 0, borderRadius: 9,
    background: "#FFE44D", color: "#121a1d", fontWeight: 800, fontSize: 13,
    cursor: busy ? "wait" : "pointer",
  };

  if (loading) return <div style={page}>Loading your BANANA account…</div>;

  if (!supabaseConfigured) {
    return (
      <div style={page}>
        <section style={panel}>
          <div style={{ color: "#FFE44D", fontSize: 12, fontWeight: 800, letterSpacing: ".2em" }}>BANANA</div>
          <h1 style={{ fontSize: 27, marginBottom: 8 }}>Connect your database</h1>
          <p style={{ color: "#9AA8B1", lineHeight: 1.6, fontSize: 13 }}>
            The account system is ready, but the Supabase project keys still need to be added to the Vercel environment variables.
          </p>
          <p style={{ color: "#35DDF5", fontSize: 12 }}>Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</p>
        </section>
      </div>
    );
  }

  if (session) {
    return (
      <>
        <div style={{ position: "fixed", zIndex: 50, top: 12, right: 14, display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", border: "1px solid #34434d", borderRadius: 30, background: "#0b151deF", color: "#c5d0d5", fontSize: 11 }}>
          <span style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</span>
          <button onClick={signOut} style={{ border: 0, borderRadius: 20, padding: "6px 9px", background: "#FFE44D", color: "#121a1d", fontWeight: 700, cursor: "pointer" }}>Log out</button>
        </div>
        {error && <div role="alert" style={{ position: "fixed", zIndex: 60, top: 58, right: 14, padding: 10, background: "#512c30", borderRadius: 8, color: "#ffd6d6", fontSize: 12 }}>{error}</div>}
        {children}
      </>
    );
  }

  return (
    <div style={page}>
      <section style={panel}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 26 }}>
          <div style={{ width: 38, height: 38, display: "grid", placeItems: "center", border: "1px solid #FFE44D66", borderRadius: 12, color: "#FFE44D", fontSize: 23 }}>⌁</div>
          <div style={{ color: "#FFE44D", fontSize: 13, fontWeight: 800, letterSpacing: ".2em" }}>BANANA</div>
        </div>
        <p style={{ color: "#35DDF5", fontSize: 9, letterSpacing: ".2em", fontWeight: 800 }}>YOUR PERSONAL ECOSYSTEM</p>
        <h1 style={{ margin: "8px 0", fontSize: 29, letterSpacing: "-.05em" }}>{mode === "login" ? "Welcome back." : "Create your account."}</h1>
        <p style={{ margin: "0 0 20px", color: "#94A3AD", fontSize: 13, lineHeight: 1.5 }}>
          {mode === "login" ? "Log in to pick up where you left off." : "One account for your workouts, focus, and progress."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && <label style={label}>Display name<input style={field} value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={40} required /></label>}
          <label style={label}>Email<input style={field} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label style={label}>Password<input style={field} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
          {error && <p role="alert" style={{ color: "#ff9b9b", fontSize: 12, lineHeight: 1.5 }}>{error}</p>}
          {message && <p role="status" style={{ color: "#8fe0b1", fontSize: 12, lineHeight: 1.5 }}>{message}</p>}
          <button type="submit" disabled={busy} style={{ ...primary, opacity: busy ? .65 : 1 }}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} style={{ width: "100%", marginTop: 17, border: 0, background: "transparent", color: "#AAB8C0", fontSize: 12, cursor: "pointer" }}>
          {mode === "login" ? "New to BANANA? Create an account" : "Already have an account? Log in"}
        </button>
        <p style={{ margin: "20px 0 0", color: "#647681", fontSize: 10, lineHeight: 1.5 }}>Use an email you can access. If email confirmation is enabled, you'll need to confirm before logging in.</p>
      </section>
    </div>
  );
}
