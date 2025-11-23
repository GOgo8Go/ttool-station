import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Card } from '../../components/ui/Card';
import {
  Play, Download, Copy, Check, FileCode, Palette,
  Image as ImageIcon, Wand2, Loader2, AlertCircle, WrapText, AlignLeft
} from 'lucide-react';

// Dynamic imports are handled via importmap
// @ts-ignore
import * as prettier from 'prettier';
// @ts-ignore
import parserBabel from 'prettier/plugins/babel';
// @ts-ignore
import parserEstree from 'prettier/plugins/estree';
// @ts-ignore
import parserHtml from 'prettier/plugins/html';
// @ts-ignore
import parserPostcss from 'prettier/plugins/postcss';
// @ts-ignore
import parserYaml from 'prettier/plugins/yaml';
// @ts-ignore
import parserGraphql from 'prettier/plugins/graphql';

// @ts-ignore
import Prism from 'prismjs';
// @ts-ignore
import html2canvas from 'html2canvas';

// Side-effect imports for Prism languages


type Language = 'javascript' | 'typescript' | 'html' | 'css' | 'json' | 'yaml' | 'graphql' | 'python' | 'java' | 'c' | 'cpp' | 'csharp' | 'go' | 'rust' | 'sql' | 'bash';

interface LanguageConfig {
  value: Language;
  label: string;
  parser: string | null; // Null means formatting is not supported (only highlighting)
  plugins: any[];
}

const LANGUAGES: LanguageConfig[] = [
  { value: 'javascript', label: 'JavaScript', parser: 'babel', plugins: [parserBabel, parserEstree] },
  { value: 'typescript', label: 'TypeScript', parser: 'babel-ts', plugins: [parserBabel, parserEstree] },
  { value: 'html', label: 'HTML', parser: 'html', plugins: [parserHtml] },
  { value: 'css', label: 'CSS', parser: 'css', plugins: [parserPostcss] },
  { value: 'json', label: 'JSON', parser: 'json', plugins: [parserBabel, parserEstree] },
  { value: 'yaml', label: 'YAML', parser: 'yaml', plugins: [parserYaml] },
  { value: 'graphql', label: 'GraphQL', parser: 'graphql', plugins: [parserGraphql] },
  // Format-unsupported languages (Highlight only)
  { value: 'python', label: 'Python', parser: null, plugins: [] },
  { value: 'java', label: 'Java', parser: null, plugins: [] },
  { value: 'csharp', label: 'C#', parser: null, plugins: [] },
  { value: 'cpp', label: 'C++', parser: null, plugins: [] },
  { value: 'c', label: 'C', parser: null, plugins: [] },
  { value: 'go', label: 'Go', parser: null, plugins: [] },
  { value: 'rust', label: 'Rust', parser: null, plugins: [] },
  { value: 'sql', label: 'SQL', parser: null, plugins: [] },
  { value: 'bash', label: 'Bash', parser: null, plugins: [] },
];

const GRADIENTS = [
  'bg-gradient-to-br from-blue-400 to-indigo-600',
  'bg-gradient-to-br from-purple-400 to-pink-600',
  'bg-gradient-to-br from-green-400 to-teal-600',
  'bg-gradient-to-br from-orange-400 to-red-600',
  'bg-gradient-to-br from-gray-700 to-gray-900',
  'bg-transparent',
];

const CodeBeautifier: React.FC = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState<string>(t('tool.code-beautifier.paste_code_here') + '\nconst hello = "world";');
  const [debouncedCode, setDebouncedCode] = useState<string>(code);
  const [language, setLanguage] = useState<Language>('javascript');
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [padding, setPadding] = useState(32);
  const [wrapLines, setWrapLines] = useState(false);

  const [isFormatting, setIsFormatting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const codeBlockRef = useRef<HTMLElement>(null);

  // Debounce code input to avoid heavy rendering/highlighting on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCode(code);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [code]);

  // Highlight when debounced code changes
  useEffect(() => {
    if (codeBlockRef.current) {
      // Small timeout to allow React to render the text content first
      setTimeout(() => {
        if (codeBlockRef.current) Prism.highlightElement(codeBlockRef.current);
      }, 0);
    }
  }, [debouncedCode, language]);

  const handleFormat = async () => {
    setIsFormatting(true);
    setError(null);
    try {
      const langConfig = LANGUAGES.find(l => l.value === language);
      if (!langConfig) throw new Error(t('tool.code-beautifier.unsupported_language'));

      if (!langConfig.parser) {
        throw new Error(t('tool.code-beautifier.formatting_not_supported'));
      }

      const formatted = await prettier.format(code, {
        parser: langConfig.parser,
        plugins: langConfig.plugins,
        printWidth: wrapLines ? 60 : 80, // Narrower print width if we intend to wrap visually
        tabWidth: 2,
        semi: true,
        singleQuote: true,
      });
      setCode(formatted);
      // Immediately update debounced to avoid flicker/delay after explicit format action
      setDebouncedCode(formatted);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleExportImage = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const element = previewRef.current;

      // Calculate optimized scale to prevent browser crash on huge images
      const { scrollWidth, scrollHeight } = element;
      const area = scrollWidth * scrollHeight;
      // Max safe area ~ 16 megapixels roughly? limit scale if huge.
      let scale = 2; // Default retina
      if (area > 4000000) scale = 1; // Drop to 1x if > 4MP
      if (area > 10000000) scale = 0.5; // Drop to 0.5x if huge

      const canvas = await html2canvas(element, {
        scale: scale,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        // Ensure we capture full scroll width/height
        width: scrollWidth,
        height: scrollHeight,
        windowWidth: scrollWidth,
        windowHeight: scrollHeight,
        onclone: (clonedDoc) => {
          // Force the cloned element to be fully visible/expanded
          const clonedEl = clonedDoc.querySelector('[data-preview-container]') as HTMLElement;
          if (clonedEl) {
            clonedEl.style.width = 'max-content';
            clonedEl.style.height = 'max-content';
            clonedEl.style.overflow = 'visible';
            clonedEl.style.display = 'inline-block'; // Forces expansion
            clonedEl.style.margin = '0'; // Reset margin to ensure capture starts at 0,0
          }
        }
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `code-snap-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error(err);
      alert(t('tool.code-beautifier.image_generation_failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLang = LANGUAGES.find(l => l.value === language);
  const canFormat = !!currentLang?.parser;

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('tool.code-beautifier.language')}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent font-medium text-sm outline-none cursor-pointer text-gray-700 hover:text-primary-600 dark:text-gray-200 max-w-[150px]"
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('tool.code-beautifier.background')}</label>
          <div className="flex gap-1">
            {GRADIENTS.map((g, i) => (
              <button
                key={i}
                onClick={() => setGradient(g)}
                className={`w-5 h-5 rounded-full border border-gray-200 ${g} ${gradient === g ? 'ring-2 ring-offset-1 ring-primary-500' : ''}`}
                title={g.includes('transparent') ? t('tool.code-beautifier.transparent') : `${t('tool.code-beautifier.gradient')} ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

        <div className="flex flex-col gap-1 w-24">
          <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('tool.code-beautifier.padding')}</label>
          <input
            type="range" min="16" max="100" step="8"
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600"
          />
        </div>

        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center">
          <Button
            size="sm"
            variant={wrapLines ? "primary" : "ghost"}
            onClick={() => setWrapLines(!wrapLines)}
            className="h-8"
            title={t('tool.code-beautifier.toggle_wrap')}
          >
            {wrapLines ? <WrapText className="w-4 h-4 mr-2" /> : <AlignLeft className="w-4 h-4 mr-2" />}
            <span className="text-xs">{wrapLines ? t('tool.code-beautifier.wrap') : t('tool.code-beautifier.scroll')}</span>
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleFormat}
            disabled={isFormatting || !canFormat}
            variant="secondary"
            title={canFormat ? t('tool.code-beautifier.prettify') : t('tool.code-beautifier.formatting_not_supported_title')}
            className={!canFormat ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isFormatting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
            {t('tool.code-beautifier.format')}
          </Button>
          <Button size="sm" onClick={handleExportImage} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
            {t('tool.code-beautifier.snap')}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">

        {/* Input Area */}
        <div className="flex-1 flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t('tool.code-beautifier.source_code')}</span>
            <button
              onClick={handleCopy}
              className="text-xs flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? t('tool.code-beautifier.copied') : t('tool.code-beautifier.copy')}
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
            placeholder={t('tool.code-beautifier.paste_placeholder')}
            spellCheck={false}
          />
          {error && (
            <div className="mt-2 text-xs text-red-500 flex items-center">
              <AlertCircle size={12} className="mr-1" /> {error}
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden relative">
          <div className="absolute inset-0 overflow-auto custom-scrollbar p-4 flex">

            <div
              ref={previewRef}
              data-preview-container
              className={`${gradient} transition-all duration-300 rounded-lg shadow-2xl m-auto`}
              style={{
                padding: `${padding}px`,
                // If wrapping, fit width normally (constrained by container). 
                // If scrolling (no wrap), allow expansion beyond container.
                width: wrapLines ? '100%' : 'max-content',
                maxWidth: wrapLines ? '100%' : 'none',
              }}
            >
              {/* Window Chrome */}
              <div className="bg-[#282c34] rounded-lg overflow-hidden shadow-lg min-w-[300px]">
                <div className="bg-[#21252b] px-4 py-3 flex items-center gap-2 select-none sticky top-0 left-0 right-0 z-10">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <div className="flex-1 text-center text-xs text-gray-500 font-mono opacity-0">code.{language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}</div>
                </div>

                <div className={`p-4 ${wrapLines ? '' : 'overflow-x-auto'}`}>
                  <pre
                    className={`language-${language} !bg-transparent !m-0 !p-0 !text-sm !shadow-none`}
                    style={{
                      whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
                      wordBreak: wrapLines ? 'break-all' : 'normal'
                    }}
                  >
                    <code ref={codeBlockRef} className={`language-${language}`}>
                      {debouncedCode}
                    </code>
                  </pre>
                </div>
              </div>
            </div>

          </div>
          <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 bg-white/50 dark:bg-black/50 px-2 py-1 rounded pointer-events-none">
            {debouncedCode.length > 50000 ? t('tool.code-beautifier.large_file_warning') : t('tool.code-beautifier.preview')}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CodeBeautifier;