import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { vi } from 'vitest';
import i18n from '@/tools/i18n';

// 自定义渲染函数，包含必要的 providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// 重导出所有 testing-library 的工具
export * from '@testing-library/react';
export { customRender as render };

// 通用测试工具函数
export const createMockFile = (name: string, type: string, size: number = 1024) => {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
};

export const createMockImageFile = (name: string = 'test.png') => {
  return createMockFile(name, 'image/png');
};

export const createMockTextFile = (name: string = 'test.txt', content: string = 'test content') => {
  return new File([content], name, { type: 'text/plain' });
};

export const waitForTimeout = (ms: number = 100) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockClipboard = {
  writeText: vi.fn(),
  readText: vi.fn(),
};

export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

export const setupClipboardMock = () => {
  Object.assign(navigator, { clipboard: mockClipboard });
};

export const setupLocalStorageMock = () => {
  Object.assign(window, { localStorage: mockLocalStorage });
};

export const cleanupMocks = () => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
};
