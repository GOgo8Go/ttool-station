# 测试指南

本项目使用 Vitest + React Testing Library 进行测试。

## 运行测试

```bash
# 运行所有测试
npm run test

# 运行测试并监听文件变化
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试 UI 界面
npm run test:ui
```

## 测试结构

```
src/__tests__/
├── setup.ts                 # 测试环境配置
├── utils/                   # 测试工具函数
│   └── testUtils.tsx       # 通用测试工具
├── components/              # 组件测试
│   ├── layout/             # 布局组件测试
│   │   └── ThemeToggle.test.tsx
│   └── ui/                 # UI 组件测试
│       └── Button.test.tsx
├── utils/                   # 工具函数测试
│   └── i18n.test.ts
└── integration/             # 集成测试
    └── theme.test.tsx
```

## 测试覆盖范围

### 已覆盖的功能

1. **核心组件**
   - `ThemeToggle` - 主题切换功能
   - `Button` - UI 按钮组件

2. **工具函数**
   - `i18n` - 国际化配置

3. **集成测试**
   - 主题系统集成测试
   - localStorage 持久化
   - 系统主题检测

### 测试覆盖率

- **总体覆盖率**: 98.3%
- **语句覆盖率**: 98.24%
- **分支覆盖率**: 90.24%
- **函数覆盖率**: 100%

## 测试最佳实践

### 1. 组件测试
- 测试组件渲染
- 测试用户交互
- 测试 props 变化
- 测试可访问性

### 2. 工具函数测试
- 测试正常输入
- 测试边界情况
- 测试错误处理

### 3. 集成测试
- 测试组件间协作
- 测试完整用户流程
- 测试全局状态管理

## Mock 策略

### 已 Mock 的 API
- `localStorage` - 本地存储
- `sessionStorage` - 会话存储
- `matchMedia` - 媒体查询
- `clipboard` - 剪贴板 API
- `ResizeObserver` - 尺寸观察器
- `IntersectionObserver` - 交叉观察器
- `File` / `Blob` - 文件 API
- `URL.createObjectURL` - 对象 URL
- `AudioContext` - 音频上下文
- Canvas 2D 上下文

## 添加新测试

### 1. 组件测试

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../utils/testUtils';
import YourComponent from '../../../components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### 2. 工具函数测试

```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../../../utils/yourUtil';

describe('yourFunction', () => {
  it('returns expected result', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### 3. 集成测试

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../../utils/testUtils';
import { YourComponent } from '../../../components/YourComponent';

describe('YourComponent Integration', () => {
  beforeEach(() => {
    // 设置测试环境
  });

  afterEach(() => {
    // 清理测试环境
  });

  it('completes full user flow', async () => {
    render(<YourComponent />);
    // 测试完整流程
  });
});
```

## 调试测试

### 1. 使用 console.log
```typescript
it('debug test', () => {
  console.log('Debug info');
  // 测试代码
});
```

### 2. 使用 screen.debug()
```typescript
import { screen } from '@testing-library/react';

it('debug test', () => {
  render(<YourComponent />);
  screen.debug(); // 打印当前 DOM
});
```

### 3. 使用 VS Code 调试
- 在测试文件中设置断点
- 使用 `npm run test:run -- --no-coverage` 运行测试
- 使用 VS Code 调试器附加到进程

## 持续集成

测试已配置为在 CI/CD 环境中运行：

```yaml
- name: Run tests
  run: npm run test:coverage
```

## 常见问题

### 1. 测试环境问题
- 确保所有必要的 API 都已 mock
- 检查 `setup.ts` 中的配置

### 2. 异步测试问题
- 使用 `await` 等待异步操作
- 使用 `waitFor` 等待 DOM 更新

### 3. 样式测试问题
- 测试类名而不是样式
- 使用 `toHaveClass` 而不是样式属性

## 测试命令参考

```bash
# 运行特定测试文件
npm run test Button.test.tsx

# 运行匹配模式的测试
npm run test -- --grep "Button"

# 运行特定测试用例
npm run test -- --testNamePattern "should render"

# 监听模式（开发时使用）
npm run test -- --watch

# 生成覆盖率报告
npm run test -- --coverage
