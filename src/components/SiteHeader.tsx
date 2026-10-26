import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function SiteHeader() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(localStorage.getItem("reduce-motion") === "1");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduce);
  }, [reduce]);

  const nav = "px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-panel/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="font-display text-lg font-bold tracking-widest">
          PLENÁRIO<span className="text-signal">_</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1">
          <Link to="/" className={nav} activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>Seleção</Link>
          <Link to="/comparar" className={nav} activeProps={{ className: "text-foreground" }}>Comparar</Link>
          <Link to="/metodologia" className={nav} activeProps={{ className: "text-foreground" }}>Metodologia</Link>
          <button
            onClick={() => {
              const v = !reduce;
              setReduce(v);
              localStorage.setItem("reduce-motion", v ? "1" : "0");
            }}
            aria-pressed={reduce}
            className="ml-2 rounded border border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            {reduce ? "Animações: off" : "Animações: on"}
          </button>
        </nav>
      </div>
    </header>
  );
}
