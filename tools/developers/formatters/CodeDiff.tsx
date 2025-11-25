import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { ArrowLeftRight, Columns, Rows, Trash2, GitCompare } from 'lucide-react';
// @ts-ignore
import * as Diff from 'diff';

const SAMPLE_OLD = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`;

const SAMPLE_NEW = `function calculateTotal(items) {
  // Use reduce for cleaner code
  return items.reduce((sum, item) => {
    return sum + item.price;
  }, 0);
}`;

interface DiffLine {
  type: 'added' | 'removed' | 'neutral';
  value: string;
  lineNumOld?: number | null;
  lineNumNew?: number | null;
}

const CodeDiff: React.FC = () => {
  const { t } = useTranslation();
  const [oldCode, setOldCode] = useState(SAMPLE_OLD);
  const [newCode, setNewCode] = useState(SAMPLE_NEW);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  // --- Diff Calculation ---
  const diffData = useMemo(() => {
    // Determine diff method
    const diffFn = ignoreWhitespace ? Diff.diffTrimmedLines : Diff.diffLines;
    const changes = diffFn(oldCode, newCode);

    // Process changes into renderable lines
    const lines: DiffLine[] = [];
    let lineCountOld = 1;
    let lineCountNew = 1;

    changes.forEach((part: any) => {
      // split by newline but keep the structure
      const partLines = part.value.split('\n');
      // remove the last empty string if value ends with newline
      if (partLines.length > 0 && part.value.endsWith('\n')) {
        partLines.pop();
      } else if (partLines.length === 1 && partLines[0] === '') {
        // Handle empty parts (rare but possible with some diff algos)
        return;
      }

      partLines.forEach((line: string) => {
        if (part.added) {
          lines.push({ type: 'added', value: line, lineNumNew: lineCountNew++ });
        } else if (part.removed) {
          lines.push({ type: 'removed', value: line, lineNumOld: lineCountOld++ });
        } else {
          lines.push({
            type: 'neutral',
            value: line,
            lineNumOld: lineCountOld++,
            lineNumNew: lineCountNew++
          });
        }
      });
    });

    return lines;
  }, [oldCode, newCode, ignoreWhitespace]);

  // --- Split View Alignment Logic ---
  const splitRows = useMemo(() => {
    if (viewMode !== 'split') return [];

    const rows: { left?: DiffLine; right?: DiffLine }[] = [];
    let i = 0;
    while (i < diffData.length) {
      const current = diffData[i];

      if (current.type === 'neutral') {
        rows.push({ left: current, right: current });
        i++;
      } else if (current.type === 'removed') {
        // Check if immediately followed by Added (Modification)
        const next = diffData[i + 1];
        if (next && next.type === 'added') {
          rows.push({ left: current, right: next });
          i += 2;
        } else {
          // Just removed
          rows.push({ left: current, right: undefined });
          i++;
        }
      } else if (current.type === 'added') {
        // Just added (should have been handled above if modification, but handles standalone adds)
        rows.push({ left: undefined, right: current });
        i++;
      }
    }
    return rows;
  }, [diffData, viewMode]);

  const handleSwap = () => {
    setOldCode(newCode);
    setNewCode(oldCode);
  };

  const handleClear = () => {
    setOldCode('');
    setNewCode('');
  };

  // --- Render Helpers ---

  const renderLineContent = (content: string, type: 'added' | 'removed' | 'neutral') => {
    let bgClass = '';
    let textClass = 'text-gray-800 dark:text-gray-300';
    let prefix = ' ';

    if (type === 'added') {
      bgClass = 'bg-green-100 dark:bg-green-900/30';
      textClass = 'text-green-900 dark:text-green-100';
      prefix = '+';
    } else if (type === 'removed') {
      bgClass = 'bg-red-100 dark:bg-red-900/30';
      textClass = 'text-red-900 dark:text-red-100';
      prefix = '-';
    }

    return (
      <div className={`flex w-full ${bgClass}`}>
        <span className="w-6 select-none text-center opacity-50 text-[10px] py-0.5">{prefix}</span>
        <span className={`font-mono text-sm whitespace-pre-wrap break-all py-0.5 ${textClass}`}>
          {content || ' '}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <SegmentedControl<'split' | 'unified'>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'split', label: <><Columns className="w-4 h-4 mr-2" /> {t('tool.code-diff.split')}</> },
              { value: 'unified', label: <><Rows className="w-4 h-4 mr-2" /> {t('tool.code-diff.unified')}</> },
            ]}
          />
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={e => setIgnoreWhitespace(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            {t('tool.code-diff.ignore_whitespace')}
          </label>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSwap} title={t('tool.code-diff.swap_tooltip')}>
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleClear} className="text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" /> {t('common.clear')}
          </Button>
        </div>
      </div>

      {/* Input Area (Collapsible or just always visible? Let's keep visible for quick edits) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[150px] max-h-[30vh]">
        <div className="flex flex-col gap-2 h-full">
          <span className="text-xs font-bold text-gray-500 uppercase px-1">{t('tool.code-diff.original')}</span>
          <textarea
            className="flex-1 w-full p-3 font-mono text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
            value={oldCode}
            onChange={(e) => setOldCode(e.target.value)}
            placeholder={t('tool.code-diff.paste_original')}
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-2 h-full">
          <span className="text-xs font-bold text-gray-500 uppercase px-1">{t('tool.code-diff.modified')}</span>
          <textarea
            className="flex-1 w-full p-3 font-mono text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder={t('tool.code-diff.paste_modified')}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Output Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs text-center text-gray-500 font-medium">
          {t('tool.code-diff.diff_preview')}
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar">
          {diffData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <GitCompare className="w-16 h-16 mb-4" />
              <p>{t('tool.code-diff.no_diffs')}</p>
            </div>
          ) : (
            <div className="min-w-full">
              {viewMode === 'unified' ? (
                // Unified View
                <div className="w-full">
                  {diffData.map((line, i) => (
                    <div key={i} className="flex hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {/* Line Numbers */}
                      <div className="w-12 flex-shrink-0 flex text-[10px] text-gray-400 font-mono border-r border-gray-200 dark:border-gray-700 select-none bg-gray-50 dark:bg-gray-900/50">
                        <span className="w-6 text-center">{line.lineNumOld || ''}</span>
                        <span className="w-6 text-center">{line.lineNumNew || ''}</span>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {renderLineContent(line.value, line.type)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Split View
                <div className="w-full table table-fixed">
                  {splitRows.map((row, i) => (
                    <div key={i} className="flex border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {/* LEFT PANE */}
                      <div className="w-1/2 flex min-w-0 border-r border-gray-200 dark:border-gray-700">
                        <div className="w-8 flex-shrink-0 text-[10px] text-gray-400 font-mono text-center select-none bg-gray-50 dark:bg-gray-900/50 py-0.5">
                          {row.left?.lineNumOld || ''}
                        </div>
                        <div className={`flex-1 min-w-0 overflow-hidden ${!row.left ? 'bg-gray-50/50 dark:bg-black/20' : ''}`}>
                          {row.left ? renderLineContent(row.left.value, row.left.type === 'neutral' ? 'neutral' : 'removed') : null}
                        </div>
                      </div>

                      {/* RIGHT PANE */}
                      <div className="w-1/2 flex min-w-0">
                        <div className="w-8 flex-shrink-0 text-[10px] text-gray-400 font-mono text-center select-none bg-gray-50 dark:bg-gray-900/50 py-0.5">
                          {row.right?.lineNumNew || ''}
                        </div>
                        <div className={`flex-1 min-w-0 overflow-hidden ${!row.right ? 'bg-gray-50/50 dark:bg-black/20' : ''}`}>
                          {row.right ? renderLineContent(row.right.value, row.right.type === 'neutral' ? 'neutral' : 'added') : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeDiff;