import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Copy, Trash2, CheckCircle, AlertCircle, Code, AlignLeft, FileJson, X } from 'lucide-react';

type IndentType = 2 | 4 | 'tab';

// Highlighting colors (Tailwind classes)
const TOKENS = {
  key: 'text-purple-600 dark:text-purple-400 font-bold',
  string: 'text-green-600 dark:text-green-400',
  number: 'text-orange-600 dark:text-orange-400',
  boolean: 'text-blue-600 dark:text-blue-400 font-bold',
  null: 'text-gray-500 dark:text-gray-400 italic',
  punctuation: 'text-gray-600 dark:text-gray-300',
};

const JsonFormatter: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Settings
  const [indent, setIndent] = useState<IndentType>(2);
  const [viewMode, setViewMode] = useState<'text' | 'code'>('text');

  // Performance threshold: 50KB for live highlighting
  const LARGE_FILE_THRESHOLD = 50000;

  const formatJson = () => {
    try {
      if (!input.trim()) {
        setInput('');
        setError(null);
        return;
      }
      const parsed = JSON.parse(input);
      const space = indent === 'tab' ? '\t' : indent;
      setInput(JSON.stringify(parsed, null, space));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const compressJson = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError(null);
      setViewMode('text'); // Force text mode on minify
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setError(null);
  };

  // Syntax Highlighter Logic
  const highlightedCode = useMemo(() => {
    if (viewMode !== 'code' || !input) return null;

    // Safety check for large files
    if (input.length > LARGE_FILE_THRESHOLD) {
      return (
        <span className="text-gray-500 italic">
          File too large for syntax highlighting ({Math.round(input.length / 1024)}KB).
          Switch to Text Edit mode to view raw data.
        </span>
      );
    }

    try {
      // Ensure it's valid JSON before trying to highlight to prevent regex weirdness on raw text
      JSON.parse(input);

      // Escape HTML entities to prevent XSS in the display
      const escaped = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Regex to tokenize JSON
      // Captures: 1. Key ("key":), 2. String, 3. Number/Bool/Null
      const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

      const html = escaped.replace(regex, (match) => {
        let cls = TOKENS.number;

        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = TOKENS.key;
            // Separate the colon for coloring if desired, or keep it part of key span
            return `<span class="${cls}">${match.slice(0, -1)}</span><span class="${TOKENS.punctuation}">:</span>`;
          } else {
            cls = TOKENS.string;
          }
        } else if (/true|false/.test(match)) {
          cls = TOKENS.boolean;
        } else if (/null/.test(match)) {
          cls = TOKENS.null;
        }

        return `<span class="${cls}">${match}</span>`;
      });

      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    } catch (e) {
      // If regex fails or not valid json (should rely on parser check usually)
      return <span className="text-red-500">Invalid JSON cannot be highlighted. Fix errors in Text mode.</span>;
    }
  }, [input, viewMode]);

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] space-y-4">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">

        {/* Main Actions */}
        <div className="flex gap-2">
          <Button onClick={formatJson} size="sm">
            <AlignLeft className="w-4 h-4 mr-2" /> {t('common.prettify')}
          </Button>
          <Button onClick={compressJson} variant="secondary" size="sm">
            {t('common.minify')}
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Indent Settings */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 hidden sm:inline">{t('common.indent')}:</span>
          <SegmentedControl<IndentType>
            size="sm"
            value={indent}
            onChange={setIndent}
            options={[
              { value: 2, label: '2' },
              { value: 4, label: '4' },
              { value: 'tab', label: 'Tab' },
            ]}
          />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* View Mode */}
        <div className="flex items-center gap-2">
          <SegmentedControl<'text' | 'code'>
            size="sm"
            value={viewMode}
            onChange={(v) => {
              // Only allow code view if input is present, otherwise it's just empty
              if (v === 'code' && (!input.trim() || error)) {
                // Allow switching but the memoized logic will show error
              }
              setViewMode(v);
            }}
            options={[
              { value: 'text', label: t('common.editor') },
              { value: 'code', label: t('common.colorized') },
            ]}
          />
        </div>

        <div className="flex-1" />

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <Button onClick={clear} variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">{t('common.clear')}</span>
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? <CheckCircle className="w-4 h-4 sm:mr-2 text-green-500" /> : <Copy className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">{copied ? t('common.copied') : t('common.copy')}</span>
          </Button>
        </div>
      </div>

      {/* Editor / Viewer Area */}
      <div className="relative flex-1 group">

        {viewMode === 'text' ? (
          <textarea
            className={`w-full h-full p-4 font-mono text-sm bg-white dark:bg-gray-900 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            placeholder={t('common.paste_placeholder')}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            spellCheck={false}
          />
        ) : (
          <div className="w-full h-full p-4 font-mono text-sm bg-[#fafafa] dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg overflow-auto leading-relaxed custom-scrollbar">
            <pre className="whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200">
              {highlightedCode}
            </pre>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start shadow-lg border border-red-200 dark:border-red-800 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h5 className="font-semibold text-sm mb-1">{t('common.invalid_json')}</h5>
              <p className="text-sm opacity-90 font-mono break-all">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-2 hover:bg-red-100 dark:hover:bg-red-800 rounded p-1">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Info Text */}
        <div className="absolute top-2 right-4 text-xs text-gray-400 pointer-events-none bg-white/50 dark:bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
          {input.length > 0 && `${(input.length / 1024).toFixed(2)} KB`}
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;