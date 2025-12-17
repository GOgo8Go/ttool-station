// 简单的主题切换功能测试脚本
// 在浏览器控制台中运行此脚本来测试主题功能

console.log('🎨 主题切换功能测试');

// 测试 1: 检查 ThemeToggle 组件是否存在
const themeToggleElement = document.querySelector('[aria-label="切换主题"]');
if (themeToggleElement) {
    console.log('✅ 主题切换按钮已找到');
} else {
    console.log('❌ 主题切换按钮未找到');
}

// 测试 2: 检查初始主题状态
const currentTheme = localStorage.getItem('themeMode');
console.log('📋 当前保存的主题模式:', currentTheme || 'system (默认)');

// 测试 3: 检查系统主题检测
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
console.log('🖥️ 系统主题偏好:', systemPrefersDark ? '深色' : '浅色');

// 测试 4: 检查当前应用的主题
const hasDarkClass = document.documentElement.classList.contains('dark');
console.log('🌓 当前应用的主题:', hasDarkClass ? '深色' : '浅色');

// 测试 5: 模拟点击主题切换按钮
console.log('🖱️ 模拟点击主题切换按钮...');
if (themeToggleElement) {
    themeToggleElement.click();
    setTimeout(() => {
        // 检查下拉菜单是否出现
        const dropdown = document.querySelector('.absolute.right-0.mt-2.w-48');
        if (dropdown) {
            console.log('✅ 主题下拉菜单已打开');
            
            // 检查三个选项是否存在
            const lightOption = dropdown.querySelector('button:has(.lucide-moon)');
            const darkOption = dropdown.querySelector('button:has(.lucide-sun)');
            const systemOption = dropdown.querySelector('button:has(.lucide-monitor)');
            
            console.log('📝 主题选项检查:');
            console.log('  - 浅色模式选项:', lightOption ? '✅' : '❌');
            console.log('  - 深色模式选项:', darkOption ? '✅' : '❌');
            console.log('  - 跟随系统选项:', systemOption ? '✅' : '❌');
            
            // 关闭下拉菜单
            setTimeout(() => {
                themeToggleElement.click();
                console.log('🔄 测试完成');
            }, 1000);
        } else {
            console.log('❌ 主题下拉菜单未打开');
        }
    }, 100);
}

console.log('\n🔧 手动测试步骤:');
console.log('1. 点击顶栏的主题切换按钮（月亮/太阳/显示器图标）');
console.log('2. 从下拉菜单中选择不同的主题模式');
console.log('3. 验证主题是否正确应用');
console.log('4. 刷新页面检查主题设置是否保持');
console.log('5. 如果选择"跟随系统"，更改系统主题设置并验证是否自动切换');
