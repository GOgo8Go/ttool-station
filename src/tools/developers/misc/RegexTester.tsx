import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { AlertCircle, Check, Copy, Info, X, Zap } from 'lucide-react';

export const FLAGS = [
  { char: 'g', label: 'Global' },
  { char: 'i', label: 'Insensitive' },
  { char: 'm', label: 'Multiline' },
  { char: 's', label: 'Single line' },
  { char: 'u', label: 'Unicode' },
  { char: 'y', label: 'Sticky' },
];

export const CHEATSHEET = [
  {
    category: 'Character Classes', items: [
      { no: 1, code: '.' },
      { no: 2, code: '\\w \\d \\s' },
      { no: 3, code: '[abc]' },
      { no: 4, code: '[^abc]' },
      { no: 5, code: '[a-z]' },
    ]
  },
  {
    category: 'Anchors', items: [
      { no: 1, code: '^abc' },
      { no: 2, code: 'abc$' },
      { no: 3, code: '\\b' },
    ]
  },
  {
    category: 'Quantifiers', items: [
      { no: 1, code: 'a*' },
      { no: 2, code: 'a+' },
      { no: 3, code: 'a?' },
      { no: 4, code: 'a{2}' },
      { no: 5, code: 'a{2,}' },
      { no: 6, code: 'a{2,5}' },
    ]
  },
  {
    category: 'Groups', items: [
      { no: 1, code: '(...)' },
      { no: 2, code: '(?:...)' },
      { no: 3, code: '\\1' },
    ]
  },
];

const RegexTester: React.FC = () => {
  const { t } = useTranslation();
  const [pattern, setPattern] = useState(String.raw`(\w+)\s(\d+)`);
  const [flags, setFlags] = useState<string[]>(['g', 'i']);
  const [text, setText] = useState('Item 123\nProduct 456\nOrder 789');
  const [replaceStr, setReplaceStr] = useState('ID: $2, Name: $1');
  const [mode, setMode] = useState<'match' | 'replace'>('match');
  const [copied, setCopied] = useState(false);

  // Computed results
  const result = useMemo(() => {
    if (!pattern) return { matches: [], error: null, replaced: '' };

    try {
      const regex = new RegExp(pattern, flags.join(''));
      const matches = [];

      // Logic for collecting matches
      // Note: matchAll is best for 'g', but if 'g' is missing, exec works once.
      // We unify logic:
      let match;

      // Clone regex for iteration to avoid state issues if global
      const iterRegex = new RegExp(pattern, flags.includes('g') ? flags.join('') : flags.join('') + 'g');

      // If original didn't have global, we only want the first match, but matchAll/exec loop 
      // is easier if we just take one.

      if (!flags.includes('g')) {
        const m = regex.exec(text);
        if (m) {
          matches.push({
            index: m.index,
            length: m[0].length,
            content: m[0],
            groups: Array.from(m).slice(1),
            input: m.input
          });
        }
      } else {
        // Global search
        while ((match = iterRegex.exec(text)) !== null) {
          matches.push({
            index: match.index,
            length: match[0].length,
            content: match[0],
            groups: Array.from(match).slice(1),
            input: match.input
          });
          // Prevent infinite loop with zero-width matches
          if (match.index === iterRegex.lastIndex) {
            iterRegex.lastIndex++;
          }
        }
      }

      // Replacement
      let replaced = '';
      if (mode === 'replace') {
        replaced = text.replace(regex, replaceStr);
      }

      return { matches, error: null, replaced };
    } catch (e: any) {
      return { matches: [], error: e.message, replaced: '' };
    }
  }, [pattern, flags, text, replaceStr, mode]);

  const toggleFlag = (char: string) => {
    setFlags(prev =>
      prev.includes(char) ? prev.filter(f => f !== char) : [...prev, char]
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render text with highlights
  const renderHighlightedText = () => {
    if (result.error) return <span className="text-gray-500">{text}</span>;
    if (result.matches.length === 0) return <span>{text}</span>;

    const segments = [];
    let lastIndex = 0;

    result.matches.forEach((m, i) => {
      // Text before match
      if (m.index > lastIndex) {
        segments.push(<span key={`text-${i}`}>{text.slice(lastIndex, m.index)}</span>);
      }
      // Match
      segments.push(
        <span
          key={`match-${i}`}
          className="bg-primary-200 dark:bg-primary-900/60 border-b-2 border-primary-500 text-gray-900 dark:text-gray-100 relative group cursor-default rounded-sm px-0.5"
        >
          {m.content}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {t('tool.regex-tester.match')} {i + 1} ({t('tool.regex-tester.index')}: {m.index})
          </span>
        </span>
      );
      lastIndex = m.index + m.length;
    });

    // Remaining text
    if (lastIndex < text.length) {
      segments.push(<span key="text-end">{text.slice(lastIndex)}</span>);
    }

    return (
      <pre className="font-mono text-sm whitespace-pre-wrap break-all text-gray-800 dark:text-gray-300 leading-relaxed">
        {segments}
      </pre>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row -m-6 bg-gray-50 dark:bg-gray-900">

      {/* Left: Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full p-6 space-y-4">

        {/* 1. Regex Input */}
        <Card className="flex flex-col gap-3 p-4 border-l-4 border-l-primary-500">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('tool.regex-tester.regex_input')}</label>
          <div className="flex items-center gap-2 font-mono text-lg bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary-500">
            <span className="text-gray-400">/</span>
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. ([a-z]+)"
            />
            <span className="text-gray-400">/</span>
            <div className="flex gap-1">
              {flags.map(f => <span key={f} className="text-primary-600 dark:text-primary-400 font-bold">{f}</span>)}
            </div>
          </div>

          {/* Flags Toggles */}
          <div className="flex flex-wrap gap-2 pt-2">
            {FLAGS.map(flag => (
              <button
                key={flag.char}
                onClick={() => toggleFlag(flag.char)}
                className={`
                  px-2 py-1 text-xs font-medium rounded transition-colors border
                  ${flags.includes(flag.char)
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                  }
                `}
                title={t(`tool.regex-tester.flags_desc.${flag.label.toLowerCase().replace(' ', '_')}`)}
              >
                {t(`tool.regex-tester.flags.${flag.label.toLowerCase().replace(' ', '_')}`)} <span className="opacity-50 font-mono">({flag.char})</span>
              </button>
            ))}
          </div>

          {result.error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm">
              <AlertCircle size={16} />
              {result.error}
            </div>
          )}
        </Card>

        {/* 2. Test Input */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <SegmentedControl<'match' | 'replace'>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'match', label: 'Match' },
                { value: 'replace', label: 'Replace' }
              ]}
              size="sm"
            />
            <div className="text-xs text-gray-500">
              {result.matches.length} {t('tool.regex-tester.matches_found')}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-[300px]">

            {/* Test String Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('tool.regex-tester.test_string')}</label>
              <textarea
                className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('tool.regex-tester.enter_test_text')}
                spellCheck={false}
              />
            </div>

            {/* Output / Highlight */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {mode === 'match' ? t('tool.regex-tester.live_preview') : t('tool.regex-tester.replacement_result')}
              </label>

              {mode === 'match' ? (
                <div className="flex-1 w-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-auto custom-scrollbar">
                  {renderHighlightedText()}
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-bold text-gray-400 px-2">{t('tool.regex-tester.subst')}</span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent outline-none font-mono text-sm"
                      value={replaceStr}
                      onChange={(e) => setReplaceStr(e.target.value)}
                      placeholder={t('tool.regex-tester.replacement_placeholder')}
                    />
                  </div>
                  <div className="flex-1 p-4 font-mono text-sm bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-gray-800 rounded-lg overflow-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {result.replaced}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Match Details Table */}
        {result.matches.length > 0 && mode === 'match' && (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('tool.regex-tester.match_details')}</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 w-16 text-center">#</th>
                    <th className="px-4 py-2">{t('tool.regex-tester.match')}</th>
                    <th className="px-4 py-2">{t('tool.regex-tester.groups')}</th>
                    <th className="px-4 py-2 w-24">{t('tool.regex-tester.index')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {result.matches.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-center font-mono text-gray-400">{i + 1}</td>
                      <td className="px-4 py-2 font-mono break-all text-primary-600 dark:text-primary-400 font-medium">
                        {m.content}
                      </td>
                      <td className="px-4 py-2">
                        {m.groups.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {m.groups.map((g, gi) => (
                              <span key={gi} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                <span className="opacity-50 mr-1">${gi + 1}:</span> {g}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">{t('tool.regex-tester.no_groups')}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">
                        {m.index} - {m.index + m.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right: Sidebar / Cheatsheet */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Info size={16} /> {t('tool.regex-tester.cheatsheet')}
          </h3>
        </div>
        <div className="p-4 space-y-6 pb-6">
          {CHEATSHEET.map((section) => {
            const label = section.category.toLowerCase().replace(/ /g, '_');
            return (
              <div key={section.category}>
                <h4 
                  className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                  title={t(`tool.regex-tester.categories_desc.${label}`)}
                >
                  {t(`tool.regex-tester.categories.${label}`)}
                </h4>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => setPattern(p => p + item.code)}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group text-left"
                      title={t('tool.regex-tester.click_append')}
                    >
                      <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-primary-600 dark:text-primary-400 border border-gray-200 dark:border-gray-700 group-hover:border-primary-300">
                        {item.code}
                      </code>
                      <span className="text-xs text-gray-500">{t(`tool.regex-tester.categories_example.${label}.${item.no}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  );
};

export default RegexTester;
