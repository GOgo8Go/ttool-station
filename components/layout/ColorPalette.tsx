import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useThemeColor, PRESET_COLORS } from '../../utils/useThemeColor';

export const ColorPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { themeColor, setThemeColor } = useThemeColor();
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // 点击外部关闭面板
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                panelRef.current &&
                buttonRef.current &&
                !panelRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleColorSelect = (color: string) => {
        setThemeColor(color);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Theme Color Palette"
                title="自定义主题颜色"
            >
                <Palette className="w-5 h-5" />
            </button>

            {isOpen && (
                <div
                    ref={panelRef}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50"
                >
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        选择主题颜色
                    </h3>

                    {/* 预设颜色 */}
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">预设方案</p>
                        <div className="grid grid-cols-3 gap-2">
                            {PRESET_COLORS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => handleColorSelect(preset.value)}
                                    className={`group relative h-12 rounded-md transition-all hover:scale-105 ${themeColor.toLowerCase() === preset.value.toLowerCase()
                                            ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500'
                                            : ''
                                        }`}
                                    style={{ backgroundColor: preset.value }}
                                    title={preset.name}
                                >
                                    {themeColor.toLowerCase() === preset.value.toLowerCase() && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <svg
                                                className="w-5 h-5 text-white drop-shadow-md"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                    <span className="sr-only">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 自定义颜色 */}
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">自定义颜色</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={themeColor}
                                onChange={(e) => handleColorSelect(e.target.value)}
                                className="w-12 h-12 rounded-md cursor-pointer border border-gray-300 dark:border-gray-600"
                                title="选择自定义颜色"
                            />
                            <input
                                type="text"
                                value={themeColor}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                                        if (value.length === 7) {
                                            handleColorSelect(value);
                                        }
                                    }
                                }}
                                placeholder="#0ea5e9"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
