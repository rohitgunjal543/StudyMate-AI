import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  text: string;
}

export function MarkdownRenderer({ text }: MarkdownRendererProps) {
  if (!text) return null;

  // Split text into paragraphs or code blocks
  // Simple custom parser to render headers, bold text, code blocks, and lists cleanly
  const sections: React.ReactNode[] = [];
  const lines = text.split("\n");

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLanguage = "text";

  let inTable = false;
  let tableRows: string[][] = [];

  const handleBoldAndCodeSpan = (txt: string): React.ReactNode[] => {
    // Matches **bold** or `code`
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const parts = txt.split(regex);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-extrabold text-slate-950 bg-slate-100/30 px-1 py-0.5 rounded">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="px-1.5 py-0.5 mx-0.5 text-xs font-mono bg-slate-100 text-rose-700 rounded border border-slate-200 uppercase-none font-bold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const CodeSnippet = ({ code, language }: { code: string; language: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="my-4 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs font-mono text-slate-400">
          <span>{language || "code"}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-emerald-400 select-all whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  const TableComponent = ({ rows }: { rows: string[][] }) => {
    if (rows.length === 0) return null;
    const headerRow = rows[0];
    const bodyRows = rows.slice(1).filter((r) => r.length > 0 && !r.every((cell) => cell.trim().startsWith("-")));

    return (
      <div className="my-4 overflow-x-auto rounded-lg border border-slate-200 shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              {headerRow.map((cell, idx) => (
                <th key={idx} className="px-4 py-3 font-semibold border-r border-slate-200 last:border-0">
                  {cell.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {bodyRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-2.5 text-xs text-slate-600 border-r border-slate-150 last:border-0">
                    {handleBoldAndCodeSpan(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle Code Blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        sections.push(
          <div key={`code-block-${i}`}>
            <CodeSnippet
              code={codeBlockContent.join("\n")}
              language={codeBlockLanguage}
            />
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLanguage = line.trim().slice(3) || "code";
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle Tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      // Skip markdown table separators like |---|---|
      const isSeparator = cells.every((cell) => /^[:\s-]*$/.test(cell));
      if (!isSeparator) {
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable) {
        sections.push(
          <div key={`table-${i}`}>
            <TableComponent rows={tableRows} />
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    }

    // Handle Headings
    if (line.startsWith("# ")) {
      sections.push(
        <h1 key={`h1-${i}`} className="mt-6 mb-3 text-2xl font-bold tracking-tight text-slate-950 border-b pb-1">
          {handleBoldAndCodeSpan(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      sections.push(
        <h2 key={`h2-${i}`} className="mt-5 mb-2.5 text-xl font-bold tracking-tight text-slate-950">
          {handleBoldAndCodeSpan(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      sections.push(
        <h3 key={`h3-${i}`} className="mt-4 mb-2 text-base font-bold tracking-tight text-slate-950">
          {handleBoldAndCodeSpan(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Handle Lists
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      sections.push(
        <div key={`bullet-${i}`} className={`flex items-start my-1.5 ${indent > 0 ? "ml-6" : "ml-2"}`}>
          <span className="mr-2 text-indigo-500 font-bold select-none">•</span>
          <span className="text-sm text-slate-800 flex-1">{handleBoldAndCodeSpan(bulletMatch[2])}</span>
        </div>
      );
      continue;
    }

    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberMatch) {
      const indent = numberMatch[1].length;
      const originalNumber = line.match(/^\s*(\d+)/)?.[1] || "1";
      sections.push(
        <div key={`number-${i}`} className={`flex items-start my-1.5 ${indent > 0 ? "ml-6" : "ml-2"}`}>
          <span className="mr-2 text-indigo-600 font-mono text-xs font-semibold select-none">{originalNumber}.</span>
          <span className="text-sm text-slate-800 flex-1">{handleBoldAndCodeSpan(numberMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Blank lines
    if (line.trim() === "") {
      sections.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    // Standard Paragraph
    sections.push(
      <p key={`p-${i}`} className="my-2 text-sm leading-relaxed text-slate-800">
        {handleBoldAndCodeSpan(line)}
      </p>
    );
  }

  // Push remaining table if reached end of text
  if (inTable && tableRows.length > 0) {
    sections.push(
      <div key="table-final">
        <TableComponent rows={tableRows} />
      </div>
    );
  }

  return <div className="space-y-0.5">{sections}</div>;
}
