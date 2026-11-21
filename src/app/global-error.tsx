"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f2e9",
          color: "#1b1a16",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6b675c",
            }}
          >
            Trace
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "2.25rem",
              lineHeight: 1.05,
              fontWeight: 500,
            }}
          >
            The app could not start.
          </h1>
          <p
            style={{
              margin: "1rem 0 0",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              color: "#4d4a42",
            }}
          >
            An unexpected error stopped Trace from rendering. Reload the page,
            or try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              height: "2.25rem",
              padding: "0 0.9rem",
              border: "1px solid #1b1a16",
              borderRadius: "3px",
              background: "#1b1a16",
              color: "#f6f2e9",
              font: "inherit",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.6rem",
                color: "#6b675c",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
