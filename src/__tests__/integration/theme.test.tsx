import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import { ThemeToggle } from '../../components/layout/ThemeToggle';

describe('Theme Integration', () => {
  beforeEach(() => {
    // 清除 localStorage 和 mocks
    localStorage.clear();
    vi.clearAllMocks();
    
    // 重置 matchMedia mock
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    // 清理 DOM 类
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('should persist theme preference across sessions', async () => {
    // 第一次访问 - 设置主题
    const { unmount } = render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const darkModeButton = await screen.findByText('深色模式');
    fireEvent.click(darkModeButton);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    unmount();
    
    // 模拟新的会话 - 从 localStorage 读取主题
    (localStorage.getItem as any).mockReturnValue('dark');
    
    render(<ThemeToggle />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should respond to system theme changes', async () => {
    const mockMediaQuery = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    
    window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery);
    (localStorage.getItem as any).mockReturnValue('system');
    
    render(<ThemeToggle />);
    
    // 初始状态应该是浅色
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // 模拟系统主题变化
    mockMediaQuery.matches = true;
    
    // 获取事件监听器回调
    const addEventListenerCall = mockMediaQuery.addEventListener.mock.calls.find(
      call => call[0] === 'change'
    );
    
    if (addEventListenerCall && addEventListenerCall[1]) {
      // 触发系统主题变化事件
      addEventListenerCall[1]({ matches: true });
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    }
  });

  it('should apply correct theme classes', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // 测试浅色模式
    const lightModeButton = await screen.findByText('浅色模式');
    fireEvent.click(lightModeButton);
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    
    // 测试深色模式
    fireEvent.click(button);
    const darkModeButton = await screen.findByText('深色模式');
    fireEvent.click(darkModeButton);
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should handle system preference correctly', () => {
    // Mock system prefers dark mode
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    (localStorage.getItem as any).mockReturnValue('system');
    
    render(<ThemeToggle />);
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should update theme UI state correctly', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // 初始状态应该是跟随系统
    expect(button).toHaveAttribute('title', '当前主题: 跟随系统');
    
    // 切换到浅色模式
    fireEvent.click(button);
    const lightModeButton = await screen.findByText('浅色模式');
    fireEvent.click(lightModeButton);
    
    // 重新打开下拉菜单检查状态
    fireEvent.click(button);
    await waitFor(() => {
      const lightModeItem = screen.getByText('浅色模式').closest('button');
      expect(lightModeItem).toHaveClass('bg-primary-100');
    });
  });

  it('should handle invalid localStorage values gracefully', () => {
    (localStorage.getItem as any).mockReturnValue('invalid-theme');
    
    render(<ThemeToggle />);
    
    // 应该回退到默认值
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should handle missing localStorage gracefully', () => {
    (localStorage.getItem as any).mockReturnValue(null);
    
    render(<ThemeToggle />);
    
    // 应该使用默认主题
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
