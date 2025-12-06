import { useEffect, useState } from 'react';

// 预设颜色方案
export const PRESET_COLORS = [
    { name: '天空蓝', value: '#0ea5e9', id: 'sky' },
    { name: '翡翠绿', value: '#10b981', id: 'emerald' },
    { name: '紫罗兰', value: '#8b5cf6', id: 'violet' },
    { name: '玫瑰红', value: '#f43f5e', id: 'rose' },
    { name: '琥珀橙', value: '#f59e0b', id: 'amber' },
    { name: '靛青蓝', value: '#6366f1', id: 'indigo' },
];

const DEFAULT_COLOR = PRESET_COLORS[0].value;

// 将十六进制颜色转换为 RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}

// 调整颜色亮度
function adjustColor(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (value: number) => {
        const adjusted = Math.round(value + (255 - value) * percent);
        return Math.max(0, Math.min(255, adjusted));
    };

    const r = adjust(rgb.r);
    const g = adjust(rgb.g);
    const b = adjust(rgb.b);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 调整颜色深度（用于深色）
function darkenColor(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (value: number) => {
        const adjusted = Math.round(value * (1 - percent));
        return Math.max(0, Math.min(255, adjusted));
    };

    const r = adjust(rgb.r);
    const g = adjust(rgb.g);
    const b = adjust(rgb.b);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// 应用主题颜色到 CSS 变量
function applyThemeColor(color: string) {
    const root = document.documentElement;

    // 生成不同亮度的颜色
    const color50 = adjustColor(color, 0.95);
    const color100 = adjustColor(color, 0.88);
    const color500 = color;
    const color600 = darkenColor(color, 0.15);
    const color700 = darkenColor(color, 0.3);
    const color900 = darkenColor(color, 0.6);

    // 设置主色调 CSS 变量
    root.style.setProperty('--color-primary-50', color50);
    root.style.setProperty('--color-primary-100', color100);
    root.style.setProperty('--color-primary-500', color500);
    root.style.setProperty('--color-primary-600', color600);
    root.style.setProperty('--color-primary-700', color700);
    root.style.setProperty('--color-primary-900', color900);

    // 生成深色模式背景色（带有主题色调的深色背景）
    const rgb = hexToRgb(color);
    if (rgb) {
        // 创建非常深的、带有主题色调的背景色
        // 使用低饱和度的主题色与深灰色混合
        const darkBg900 = `rgb(${Math.round(rgb.r * 0.08 + 15)}, ${Math.round(rgb.g * 0.08 + 15)}, ${Math.round(rgb.b * 0.08 + 20)})`; // 主背景
        const darkBg800 = `rgb(${Math.round(rgb.r * 0.12 + 25)}, ${Math.round(rgb.g * 0.12 + 25)}, ${Math.round(rgb.b * 0.12 + 30)})`; // 次级背景
        const darkBg700 = `rgb(${Math.round(rgb.r * 0.15 + 45)}, ${Math.round(rgb.g * 0.15 + 45)}, ${Math.round(rgb.b * 0.15 + 50)})`; // 边框色

        root.style.setProperty('--color-dark-bg-900', darkBg900);
        root.style.setProperty('--color-dark-bg-800', darkBg800);
        root.style.setProperty('--color-dark-bg-700', darkBg700);
    }
}

export function useThemeColor() {
    const [themeColor, setThemeColorState] = useState<string>(DEFAULT_COLOR);

    useEffect(() => {
        // 从 localStorage 读取保存的颜色
        const savedColor = localStorage.getItem('themeColor');
        const initialColor = savedColor || DEFAULT_COLOR;

        setThemeColorState(initialColor);
        applyThemeColor(initialColor);
    }, []);

    const setThemeColor = (color: string) => {
        setThemeColorState(color);
        applyThemeColor(color);
        localStorage.setItem('themeColor', color);
    };

    return { themeColor, setThemeColor };
}
