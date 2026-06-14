import { useEffect, useState } from "react";
import type { Coordinate } from "~/lib/coords";
import { CopyButton } from "./CopyButton";

const KEY_STORAGE = "w3w-api-key";

/**
 * what3words address for the coordinate. Converting coordinates to a 3-word
 * address requires the what3words API, which needs a (free) API key, so this is
 * strictly opt-in: nothing is requested until the user supplies their own key.
 */
export function What3Words({ coord }: { coord: Coordinate }) {
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [words, setWords] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    setApiKey(localStorage.getItem(KEY_STORAGE) ?? "");
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setWords(null);
      return;
    }
    setStatus("loading");
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url =
          `https://api.what3words.com/v3/convert-to-3wa?key=${encodeURIComponent(apiKey)}` +
          `&coordinates=${coord.lat},${coord.lon}&format=json`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        if (data?.words) {
          setWords(data.words);
          setStatus("idle");
        } else {
          setWords(null);
          setStatus("error");
        }
      } catch {
        if (!ctrl.signal.aborted) {
          setWords(null);
          setStatus("error");
        }
      }
    }, 600);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [apiKey, coord.lat, coord.lon]);

  const saveKey = () => {
    const k = keyInput.trim();
    localStorage.setItem(KEY_STORAGE, k);
    setApiKey(k);
    setEditing(false);
  };

  const clearKey = () => {
    localStorage.removeItem(KEY_STORAGE);
    setApiKey("");
    setWords(null);
    setStatus("idle");
  };

  return (
    <section className="card">
      <h2>what3words</h2>

      {apiKey && !editing ? (
        <dl className="rows">
          <div className="row">
            <dt>Address</dt>
            <dd>
              {status === "loading" && <code className="muted">…</code>}
              {status === "error" && (
                <code className="muted">key rejected or unavailable</code>
              )}
              {status === "idle" && words && (
                <>
                  <a
                    href={`https://what3words.com/${words}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>///{words}</code>
                  </a>
                  <CopyButton value={`///${words}`} />
                </>
              )}
            </dd>
          </div>
          <p className="w3w-note">
            Your coordinate is sent to the what3words API using your key.{" "}
            <button type="button" className="link-btn" onClick={clearKey}>
              Remove key
            </button>
          </p>
        </dl>
      ) : (
        <div className="w3w-setup">
          <p className="w3w-note">
            Needs a free{" "}
            <a
              href="https://accounts.what3words.com/create-api-key"
              target="_blank"
              rel="noopener noreferrer"
            >
              what3words API key
            </a>
            . It is stored only in this browser.
          </p>
          <div className="w3w-key-row">
            <input
              type="text"
              className="w3w-key-input"
              placeholder="what3words API key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              type="button"
              className="w3w-save"
              onClick={saveKey}
              disabled={!keyInput.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
