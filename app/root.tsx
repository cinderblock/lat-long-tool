import { useEffect } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "@fontsource-variable/inter";
import "./styles/global.css";

const base = import.meta.env.BASE_URL;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Tell the browser we support both schemes and paint the right
            background on the very first frame, before global.css loads. */}
        <meta name="color-scheme" content="light dark" />
        <style
          dangerouslySetInnerHTML={{
            __html:
              ":root{color-scheme:light dark;background-color:#fafafa}" +
              "@media(prefers-color-scheme:dark){:root:not([data-force-light]){background-color:#0f0f1a}}",
          }}
        />
        <meta
          name="theme-color"
          content="#fafafa"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0f0f1a"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="icon"
          href={`${base}favicon-light.svg`}
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href={`${base}favicon-dark.svg`}
          media="(prefers-color-scheme: dark)"
        />
        <link rel="apple-touch-icon" href={`${base}apple-touch-icon.png`} />
        <link rel="manifest" href={`${base}manifest.webmanifest`} />
        <Meta />
        <Links />
        {import.meta.env.DEV && (
          <script
            dangerouslySetInnerHTML={{
              __html: `if(new URLSearchParams(location.search).has('light'))document.documentElement.dataset.forceLight=''`,
            }}
          />
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Register the service worker so the tool works offline and is installable.
  // Production only — a dev service worker would cache stale assets and fight
  // HMR / tests.
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch(() => {
        // Service worker is a progressive enhancement; ignore failures.
      });
  }, []);

  return <Outlet />;
}
