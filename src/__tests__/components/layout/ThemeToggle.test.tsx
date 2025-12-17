import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { ThemeToggle } from '../../../components/layout/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    // 清除 localStorage mock
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
  });

  afterEach(() => {
    // 清理 DOM 类
    document.documentElement.classList.remove('dark');
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /切换主题/i });
    expect(button).toBeInTheDocument();
  });

  it('shows monitor icon for system theme by default', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('浅色模式')).toBeInTheDocument();
      expect(screen.getByText('深色模式')).toBeInTheDocument();
      expect(screen.getByText('跟随系统')).toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('浅色模式')).toBeInTheDocument();
    });
    
    // 点击外部
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('浅色模式')).not.toBeInTheDocument();
    });
  });

  it('switches to light mode when light mode is clicked', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const lightModeButton = await screen.findByText('浅色模式');
    fireEvent.click(lightModeButton);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('themeMode', 'light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('switches to dark mode when dark mode is clicked', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const darkModeButton = await screen.findByText('深色模式');
    fireEvent.click(darkModeButton);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('switches to system mode when system mode is clicked', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    const systemModeButton = await screen.findByText('跟随系统');
    fireEvent.click(systemModeButton);
    
    expect(localStorage.setItem).toHaveBeenCalledWith('themeMode', 'system');
  });

  it('loads saved theme from localStorage on mount', () => {
    (localStorage.getItem as any).mockReturnValue('dark');
    
    render(<ThemeToggle />);
    
    expect(localStorage.getItem).toHaveBeenCalledWith('themeMode');
  });

  it('applies dark theme when system prefers dark mode', () => {
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

  it('applies light theme when system prefers light mode', () => {
    // Mock system prefers light mode
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
    
    (localStorage.getItem as any).mockReturnValue('system');
    
    render(<ThemeToggle />);
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('shows current theme in dropdown button title', () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', '当前主题: 跟随系统');
  });

  it('shows system theme status in dropdown', async () => {
    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('(浅色)')).toBeInTheDocument();
    });
  });

  it('listens to system theme changes when in system mode', () => {
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
    
    expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
