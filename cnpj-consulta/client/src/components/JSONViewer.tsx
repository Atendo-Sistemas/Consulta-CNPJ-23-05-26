/**
 * JSONViewer — Consulta CNPJ
 * Visualizador de JSON com syntax highlighting, copiar e fechar.
 * Design: Data Dashboard Minimalista / Governo Digital
 */

import { useState, useCallback } from "react";

interface JSONViewerProps {
  data: unknown;
  onClose: () => void;
}

/** Aplica syntax highlighting ao JSON stringificado */
function highlightJSON(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "json-key";
          } else {
            cls = "json-string";
          }
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export function JSONViewer({ data, onClose }: JSONViewerProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [jsonString]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <span className="text-sm font-semibold text-foreground font-mono">
              JSON Bruto
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {jsonString.length.toLocaleString("pt-BR")} caracteres
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão Copiar */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95"
              style={{
                background: copied
                  ? "var(--status-active-bg)"
                  : "var(--color-secondary)",
                color: copied
                  ? "var(--status-active)"
                  : "var(--color-secondary-foreground)",
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar JSON
                </>
              )}
            </button>
            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* JSON Content */}
        <div className="overflow-auto flex-1 p-5">
          <pre
            className="text-xs leading-relaxed font-mono whitespace-pre"
            dangerouslySetInnerHTML={{
              __html: highlightJSON(jsonString),
            }}
          />
        </div>
      </div>
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
