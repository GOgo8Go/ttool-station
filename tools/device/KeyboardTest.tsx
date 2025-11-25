import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Keyboard as KeyboardIcon, RefreshCw, Lock, Unlock, History } from 'lucide-react';

interface KeyInfo {
    code: string;
    key: string;
    keyCode: number;
    location: number;
    timestamp: number;
}

const KeyboardTest: React.FC = () => {
    const { t } = useTranslation();
    const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
    const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
    const [lastKeyPress, setLastKeyPress] = useState<KeyInfo | null>(null);
    const [keyHistory, setKeyHistory] = useState<KeyInfo[]>([]);
    const [preventDefault, setPreventDefault] = useState(true);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (preventDefault) {
            e.preventDefault();
        }

        const keyInfo: KeyInfo = {
            code: e.code,
            key: e.key,
            keyCode: e.keyCode,
            location: e.location,
            timestamp: Date.now()
        };

        setLastKeyPress(keyInfo);
        setKeyHistory(prev => [keyInfo, ...prev].slice(0, 20));
        setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.add(e.code);
            return newSet;
        });
        setTestedKeys(prev => {
            const newSet = new Set(prev);
            newSet.add(e.code);
            return newSet;
        });
    }, [preventDefault]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        if (preventDefault) {
            e.preventDefault();
        }
        setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(e.code);
            return newSet;
        });
    }, [preventDefault]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    const resetTest = () => {
        setTestedKeys(new Set());
        setKeyHistory([]);
        setLastKeyPress(null);
    };

    // Keyboard Layout Definitions
    const renderKey = (code: string, label: string | React.ReactNode, width: string = 'w-10', height: string = 'h-10') => {
        const isActive = activeKeys.has(code);
        const isTested = testedKeys.has(code);

        let bgClass = 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
        if (isActive) {
            bgClass = 'bg-blue-500 border-blue-600 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transform translate-y-0.5';
        } else if (isTested) {
            bgClass = 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400';
        }

        return (
            <div
                key={code}
                className={`${width} ${height} flex items-center justify-center border-b-4 rounded-md m-0.5 text-xs sm:text-sm font-medium transition-all duration-75 select-none ${bgClass}`}
                title={code}
            >
                {label}
            </div>
        );
    };

    const Spacer = ({ width = 'w-4' }) => <div className={width}></div>;

    return (
        <div className="space-y-6">
            {/* Top Stats & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400">{t('tool.keyboard-test.last_key')}</div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreventDefault(!preventDefault)}
                                className={preventDefault ? 'text-green-600' : 'text-gray-400'}
                                title={t('tool.keyboard-test.lock_hint')}
                            >
                                {preventDefault ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={resetTest} title={t('tool.keyboard-test.reset')}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    {lastKeyPress ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Key:</span> <span className="font-mono font-bold">{lastKeyPress.key}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Code:</span> <span className="font-mono">{lastKeyPress.code}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Which:</span> <span className="font-mono">{lastKeyPress.keyCode}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Location:</span> <span className="font-mono">{lastKeyPress.location}</span></div>
                        </div>
                    ) : (
                        <div className="h-20 flex items-center justify-center text-gray-400 text-sm italic">
                            {t('tool.keyboard-test.press_any_key')}
                        </div>
                    )}
                </Card>

                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 md:col-span-2 flex flex-col">
                    <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                        <History className="w-3 h-3" />
                        {t('tool.keyboard-test.history')}
                    </div>
                    <div className="flex-1 overflow-x-auto flex items-center gap-2 pb-2">
                        {keyHistory.map((k, i) => (
                            <div key={k.timestamp + i} className="flex flex-col items-center min-w-[3rem] p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-bold font-mono">{k.key === ' ' ? 'Space' : k.key}</span>
                                <span className="text-[10px] text-gray-400">{k.code}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Keyboard Visualization */}
            <Card className="p-2 sm:p-6 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 overflow-x-auto">
                <div className="min-w-[800px] flex flex-col gap-1 select-none">
                    {/* Row 1: Esc, F-Keys */}
                    <div className="flex">
                        {renderKey('Escape', 'Esc', 'w-12')}
                        <Spacer width="w-8" />
                        {renderKey('F1', 'F1')}
                        {renderKey('F2', 'F2')}
                        {renderKey('F3', 'F3')}
                        {renderKey('F4', 'F4')}
                        <Spacer width="w-4" />
                        {renderKey('F5', 'F5')}
                        {renderKey('F6', 'F6')}
                        {renderKey('F7', 'F7')}
                        {renderKey('F8', 'F8')}
                        <Spacer width="w-4" />
                        {renderKey('F9', 'F9')}
                        {renderKey('F10', 'F10')}
                        {renderKey('F11', 'F11')}
                        {renderKey('F12', 'F12')}
                        <Spacer width="w-4" />
                        {renderKey('PrintScreen', 'PrtSc')}
                        {renderKey('ScrollLock', 'ScrLk')}
                        {renderKey('Pause', 'Pause')}
                    </div>

                    <Spacer width="h-2" />

                    {/* Main Block + Nav + Numpad */}
                    <div className="flex gap-4">
                        {/* Main Alphanumeric Block */}
                        <div className="flex flex-col gap-1">
                            {/* Row 2: Numbers */}
                            <div className="flex">
                                {renderKey('Backquote', '`')}
                                {renderKey('Digit1', '1')}
                                {renderKey('Digit2', '2')}
                                {renderKey('Digit3', '3')}
                                {renderKey('Digit4', '4')}
                                {renderKey('Digit5', '5')}
                                {renderKey('Digit6', '6')}
                                {renderKey('Digit7', '7')}
                                {renderKey('Digit8', '8')}
                                {renderKey('Digit9', '9')}
                                {renderKey('Digit0', '0')}
                                {renderKey('Minus', '-')}
                                {renderKey('Equal', '=')}
                                {renderKey('Backspace', 'Backspace', 'w-20')}
                            </div>
                            {/* Row 3: QWERTY */}
                            <div className="flex">
                                {renderKey('Tab', 'Tab', 'w-14')}
                                {renderKey('KeyQ', 'Q')}
                                {renderKey('KeyW', 'W')}
                                {renderKey('KeyE', 'E')}
                                {renderKey('KeyR', 'R')}
                                {renderKey('KeyT', 'T')}
                                {renderKey('KeyY', 'Y')}
                                {renderKey('KeyU', 'U')}
                                {renderKey('KeyI', 'I')}
                                {renderKey('KeyO', 'O')}
                                {renderKey('KeyP', 'P')}
                                {renderKey('BracketLeft', '[')}
                                {renderKey('BracketRight', ']')}
                                {renderKey('Backslash', '\\', 'w-16')}
                            </div>
                            {/* Row 4: ASDF */}
                            <div className="flex">
                                {renderKey('CapsLock', 'Caps', 'w-16')}
                                {renderKey('KeyA', 'A')}
                                {renderKey('KeyS', 'S')}
                                {renderKey('KeyD', 'D')}
                                {renderKey('KeyF', 'F')}
                                {renderKey('KeyG', 'G')}
                                {renderKey('KeyH', 'H')}
                                {renderKey('KeyJ', 'J')}
                                {renderKey('KeyK', 'K')}
                                {renderKey('KeyL', 'L')}
                                {renderKey('Semicolon', ';')}
                                {renderKey('Quote', "'")}
                                {renderKey('Enter', 'Enter', 'w-[88px]')}
                            </div>
                            {/* Row 5: ZXCV */}
                            <div className="flex">
                                {renderKey('ShiftLeft', 'Shift', 'w-24')}
                                {renderKey('KeyZ', 'Z')}
                                {renderKey('KeyX', 'X')}
                                {renderKey('KeyC', 'C')}
                                {renderKey('KeyV', 'V')}
                                {renderKey('KeyB', 'B')}
                                {renderKey('KeyN', 'N')}
                                {renderKey('KeyM', 'M')}
                                {renderKey('Comma', ',')}
                                {renderKey('Period', '.')}
                                {renderKey('Slash', '/')}
                                {renderKey('ShiftRight', 'Shift', 'w-[104px]')}
                            </div>
                            {/* Row 6: Mods */}
                            <div className="flex">
                                {renderKey('ControlLeft', 'Ctrl', 'w-12')}
                                {renderKey('MetaLeft', 'Win', 'w-12')}
                                {renderKey('AltLeft', 'Alt', 'w-12')}
                                {renderKey('Space', 'Space', 'w-[248px]')}
                                {renderKey('AltRight', 'Alt', 'w-12')}
                                {renderKey('MetaRight', 'Win', 'w-12')}
                                {renderKey('ContextMenu', 'Menu', 'w-12')}
                                {renderKey('ControlRight', 'Ctrl', 'w-12')}
                            </div>
                        </div>

                        {/* Navigation Block */}
                        <div className="flex flex-col gap-1">
                            <div className="flex">
                                {renderKey('Insert', 'Ins')}
                                {renderKey('Home', 'Home')}
                                {renderKey('PageUp', 'PgUp')}
                            </div>
                            <div className="flex">
                                {renderKey('Delete', 'Del')}
                                {renderKey('End', 'End')}
                                {renderKey('PageDown', 'PgDn')}
                            </div>
                            <div className="h-10"></div>
                            <div className="flex justify-center">
                                {renderKey('ArrowUp', '↑')}
                            </div>
                            <div className="flex">
                                {renderKey('ArrowLeft', '←')}
                                {renderKey('ArrowDown', '↓')}
                                {renderKey('ArrowRight', '→')}
                            </div>
                        </div>

                        {/* Numpad Block */}
                        <div className="flex flex-col gap-1">
                            <div className="flex">
                                {renderKey('NumLock', 'Num')}
                                {renderKey('NumpadDivide', '/')}
                                {renderKey('NumpadMultiply', '*')}
                                {renderKey('NumpadSubtract', '-')}
                            </div>
                            <div className="flex">
                                <div className="flex flex-col gap-1">
                                    <div className="flex">
                                        {renderKey('Numpad7', '7')}
                                        {renderKey('Numpad8', '8')}
                                        {renderKey('Numpad9', '9')}
                                    </div>
                                    <div className="flex">
                                        {renderKey('Numpad4', '4')}
                                        {renderKey('Numpad5', '5')}
                                        {renderKey('Numpad6', '6')}
                                    </div>
                                    <div className="flex">
                                        {renderKey('Numpad1', '1')}
                                        {renderKey('Numpad2', '2')}
                                        {renderKey('Numpad3', '3')}
                                    </div>
                                    <div className="flex">
                                        {renderKey('Numpad0', '0', 'w-[84px]')}
                                        {renderKey('NumpadDecimal', '.')}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {renderKey('NumpadAdd', '+', 'w-10', 'h-[84px]')}
                                    {renderKey('NumpadEnter', 'Ent', 'w-10', 'h-[84px]')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {t('tool.keyboard-test.instruction')}
            </div>
        </div>
    );
};

export default KeyboardTest;
