import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import {
    Copy, Check, Download, Eye, EyeOff, FileText, AlertCircle, Info, Maximize2, Minimize2, ChevronDown, Image as ImageIcon, FileCode
} from 'lucide-react';

// @ts-ignore
import katex from 'katex';
import 'katex/dist/katex.min.css';

// @ts-ignore
import html2canvas from 'html2canvas';

const LatexEditor: React.FC = () => {
    const { t } = useTranslation();
    const [latex, setLatex] = useState<string>('');
    const [debouncedLatex, setDebouncedLatex] = useState<string>('');
    const [displayMode, setDisplayMode] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const renderRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    // Example templates
    const EXAMPLE_TEMPLATES = [
        {
            nameT: t('tool.latex-editor.template_quadratic_formula'),
            name: 'Quadratic Formula',
            latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
        },
        {
            nameT: t('tool.latex-editor.template_integral'),
            name: 'Integral',
            latex: '\\int_{a}^{b} f(x) \\, dx'
        },
        {
            nameT: t('tool.latex-editor.template_matrix'),
            name: 'Matrix',
            latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}'
        },
        {
            nameT: t('tool.latex-editor.template_sum'),
            name: 'Sum',
            latex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}'
        },
        {
            nameT: t('tool.latex-editor.template_limit'),
            name: 'Limit',
            latex: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0'
        },
        {
            nameT: t('tool.latex-editor.template_greek_letters'),
            name: 'Greek Letters',
            latex: '\\alpha, \\beta, \\gamma, \\delta, \\epsilon, \\theta, \\lambda, \\mu, \\pi, \\sigma, \\phi, \\omega'
        },
    ];

    // Debounce latex input to avoid heavy rendering on every keystroke
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedLatex(latex);
        }, 300);

        return () => clearTimeout(handler);
    }, [latex]);

    // Render LaTeX when debounced latex changes
    useEffect(() => {
        if (renderRef.current && debouncedLatex.trim()) {
            try {
                setError(null);
                katex.render(debouncedLatex, renderRef.current, {
                    displayMode: displayMode,
                    throwOnError: true,
                    errorColor: '#ff5555',
                    strict: 'warn',
                    trust: false,
                    macros: {
                        "\\RR": "\\mathbb{R}",
                        "\\NN": "\\mathbb{N}",
                        "\\ZZ": "\\mathbb{Z}",
                        "\\QQ": "\\mathbb{Q}",
                    }
                });
            } catch (err: any) {
                console.error('KaTeX rendering error:', err);
                setError(err.message || t('tool.latex-editor.render_error'));
                // Display error in the render area
                if (renderRef.current) {
                    renderRef.current.innerHTML = `<span style="color: #ff5555;">${err.message || 'Render Error'}</span>`;
                }
            }
        } else if (renderRef.current && !debouncedLatex.trim()) {
            renderRef.current.innerHTML = `<span style="color: #888; font-style: italic;">${t('tool.latex-editor.empty_placeholder')}</span>`;
        }
    }, [debouncedLatex, displayMode, t]);

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showExportMenu]);

    const handleCopy = () => {
        navigator.clipboard.writeText(latex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPNG = async () => {
        if (!renderRef.current || !latex.trim()) return;
        setIsExporting(true);
        setShowExportMenu(false);

        try {
            // Create a temporary container with white background
            const container = document.createElement('div');
            container.style.cssText = 'position: fixed; left: -9999px; top: -9999px; background: white; padding: 50px;';

            // Inject styles to fix html2canvas rendering issues
            const style = document.createElement('style');
            style.innerHTML = `
                .katex { line-height: 1.2 !important; }
                .frac-line { transform: translateY(5px) !important; border-bottom-width: 1.5px !important; margin-top: 2px !important; }
            `;
            container.appendChild(style);

            // Clone the rendered content
            const clone = renderRef.current.cloneNode(true) as HTMLElement;
            clone.style.cssText = `color: #000; font-size: ${displayMode ? '2em' : '1.5em'};`;
            container.appendChild(clone);
            document.body.appendChild(container);

            // Capture the canvas
            const canvas = await html2canvas(container, {
                backgroundColor: '#ffffff',
                scale: 3, // Higher quality
                logging: false,
            });

            // Clean up
            document.body.removeChild(container);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `latex-${Date.now()}.png`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            });
        } catch (err) {
            console.error('PNG export error:', err);
            alert(t('tool.latex-editor.export_error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSVG = () => {
        if (!renderRef.current || !latex.trim()) return;
        setIsExporting(true);
        setShowExportMenu(false);

        try {
            // Get the rendered content
            const content = renderRef.current.innerHTML;

            // Calculate dimensions with generous padding
            const contentWidth = Math.max(renderRef.current.offsetWidth, renderRef.current.scrollWidth);
            const contentHeight = Math.max(renderRef.current.offsetHeight, renderRef.current.scrollHeight);

            const width = contentWidth + 80;
            const height = contentHeight + 80;

            // Use foreignObject for vector quality.
            // We import the KaTeX CSS from CDN to ensure fonts and styles are loaded.
            // Note: This requires the viewer to have internet access to load fonts.
            const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: black; background: white; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
      <style>
        @import url('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css');
        .katex { font-size: ${displayMode ? '2em' : '1.5em'}; }
      </style>
      <div>
        ${content}
      </div>
    </div>
  </foreignObject>
</svg>`;

            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `latex-${Date.now()}.svg`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('SVG export error:', err);
            alert(t('tool.latex-editor.export_error'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportHTML = () => {
        if (!renderRef.current || !latex.trim()) return;
        setShowExportMenu(false);

        // Create HTML document with rendered LaTeX
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LaTeX Render</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.25/dist/katex.min.css">
  <style>
    body {
      font-family: 'KaTeX_Main', 'Times New Roman', serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.6;
    }
    .latex-content {
      font-size: 1.2em;
      ${displayMode ? 'text-align: center;' : ''}
    }
  </style>
</head>
<body>
  <div class="latex-content">
    ${renderRef.current.innerHTML}
  </div>
  <hr style="margin-top: 40px; border: none; border-top: 1px solid #ddd;">
  <p style="color: #666; font-size: 0.9em;">LaTeX Source:</p>
  <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;"><code>${latex}</code></pre>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `latex-render-${Date.now()}.html`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const loadTemplate = (template: string) => {
        setLatex(template);
        setDebouncedLatex(template);
    };

    return (
        <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6' : 'h-[calc(100vh-16rem)]'} space-y-4`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {t('tool.latex-editor.title')}
                    </span>
                </div>

                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {t('tool.latex-editor.display_mode')}:
                    </label>
                    <Button
                        size="sm"
                        variant={displayMode ? "primary" : "ghost"}
                        onClick={() => setDisplayMode(!displayMode)}
                        className="h-8"
                    >
                        {displayMode ? t('tool.latex-editor.display') : t('tool.latex-editor.inline')}
                    </Button>
                </div>

                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPreview(!showPreview)}
                    className="h-8"
                >
                    {showPreview ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                    {showPreview ? t('tool.latex-editor.hide_preview') : t('tool.latex-editor.show_preview')}
                </Button>

                <div className="flex-1" />

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFullscreen(!fullscreen)}
                        className="h-8"
                        title={fullscreen ? t('tool.latex-editor.exit_fullscreen') : t('tool.latex-editor.enter_fullscreen')}
                    >
                        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleCopy}
                        variant="secondary"
                        className="h-8"
                    >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? t('tool.latex-editor.copied') : t('tool.latex-editor.copy')}
                    </Button>
                    <div className="relative" ref={exportMenuRef}>
                        <Button
                            size="sm"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={!latex.trim() || isExporting}
                            className="h-8"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {t('tool.latex-editor.exporting')}
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    {t('tool.latex-editor.export')}
                                    <ChevronDown className="w-3 h-3 ml-1" />
                                </>
                            )}
                        </Button>

                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
                                <button
                                    onClick={handleExportPNG}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    {t('tool.latex-editor.export_png')}
                                </button>
                                <button
                                    onClick={handleExportSVG}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    {t('tool.latex-editor.export_svg')}
                                </button>
                                <button
                                    onClick={handleExportHTML}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <FileCode className="w-4 h-4" />
                                    {t('tool.latex-editor.export_html')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Templates */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-3 rounded-lg border border-blue-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                        {t('tool.latex-editor.templates')}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {EXAMPLE_TEMPLATES.map((template, index) => (
                        <button
                            key={index}
                            onClick={() => loadTemplate(template.latex)}
                            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 hover:border-blue-400 transition-all"
                        >
                            {t(template.nameT)}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`flex-1 flex ${showPreview ? 'flex-col lg:flex-row' : 'flex-col'} gap-4 min-h-0 overflow-hidden`}>
                {/* Input Area */}
                <div className={`${showPreview ? 'flex-1' : 'w-full'} flex flex-col min-h-[200px]`}>
                    <div className="flex justify-between items-center mb-2 px-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                            {t('tool.latex-editor.latex_input')}
                        </span>
                        <span className="text-xs text-gray-400">
                            {latex.length} {t('tool.latex-editor.characters')}
                        </span>
                    </div>
                    <textarea
                        value={latex}
                        onChange={(e) => setLatex(e.target.value)}
                        className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                        placeholder={t('tool.latex-editor.input_placeholder')}
                        spellCheck={false}
                    />
                    {error && (
                        <div className="mt-2 text-xs text-red-500 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                {/* Preview Area */}
                {showPreview && (
                    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-semibold text-gray-500 uppercase">
                                {t('tool.latex-editor.preview')}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className={displayMode ? 'text-primary-600 font-medium' : ''}>
                                    {displayMode ? t('tool.latex-editor.display_mode_desc') : t('tool.latex-editor.inline_mode_desc')}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                            <div
                                className="min-h-full flex items-center justify-center"
                                style={{
                                    fontSize: displayMode ? '1.5em' : '1.2em',
                                }}
                            >
                                <div
                                    ref={renderRef}
                                    className="latex-render max-w-full break-words"
                                    style={{
                                        color: 'var(--tw-prose-body)',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Reference Card */}
            {!fullscreen && (
                <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                    <div className="p-3">
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                                    {t('tool.latex-editor.quick_reference')}
                                </p>
                                <div className="text-xs text-yellow-800 dark:text-yellow-400 space-y-1">
                                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                                        <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">^{'{'}...{'}'}</code>
                                        <span>{t('tool.latex-editor.superscript')}</span>
                                        <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">_{'{'}...{'}'}</code>
                                        <span>{t('tool.latex-editor.subscript')}</span>
                                        <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">\frac{'{'}a{'}'}{'{'} b{'}'}</code>
                                        <span>{t('tool.latex-editor.fraction')}</span>
                                        <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">\sqrt{'{'}...{'}'}</code>
                                        <span>{t('tool.latex-editor.square_root')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default LatexEditor;