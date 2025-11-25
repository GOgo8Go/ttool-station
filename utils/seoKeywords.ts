// SEO keywords mapping for each tool
// Maps tool IDs to their specific keywords for better search engine optimization

export const toolKeywords: Record<string, string[]> = {
    // Developer Tools
    'json-formatter': ['JSON格式化', 'JSON验证', 'JSON美化', 'JSON压缩', 'JSON工具'],
    'base-converter': ['进制转换', '二进制转换', '十六进制转换', '八进制转换', '进制计算器'],
    'base-calculator': ['进制计算器', '二进制计算', '十六进制计算', 'IEEE754', '浮点数'],
    'bigint-calculator': ['大数计算器', '任意精度', '整数运算', 'BigInt', '大整数'],
    'bitwise-calculator': ['位运算', '位运算计算器', 'AND', 'OR', 'XOR', '移位运算'],
    'code-diff': ['代码对比', 'Diff工具', '代码差异', '文件对比', '代码比较'],
    'hash-generator': ['哈希生成', 'MD5', 'SHA256', '哈希计算', '文件哈希'],
    'encoding-converter': ['编码转换', 'Base64', 'URL编码', '十六进制编码', '编码解码'],
    'regex-tester': ['正则表达式', '正则测试', 'Regex', '正则匹配', '正则工具'],
    'code-beautifier': ['代码美化', '代码格式化', '代码截图', '代码高亮', '代码快照'],
    'config-converter': ['配置转换', 'JSON转YAML', 'YAML转JSON', 'TOML', 'XML转换'],
    'jwt-decoder': ['JWT解码', 'JWT解析', 'Token解码', 'JWT工具', 'JSON Web Token'],
    'cron-generator': ['Cron生成器', 'Cron表达式', '定时任务', 'Cron工具', '计划任务'],
    'curl-converter': ['cURL转换', 'cURL工具', 'HTTP请求', 'API测试', 'cURL命令'],
    'sql-formatter': ['SQL格式化', 'SQL美化', 'SQL工具', 'SQL查询', 'SQL代码'],
    'http-status': ['HTTP状态码', 'HTTP错误', '状态码查询', 'HTTP响应', '错误代码'],
    'dns-records-info': ['DNS记录', 'DNS类型', 'A记录', 'CNAME', 'MX记录'],

    // Text & Data Processing
    'case-converter': ['大小写转换', 'camelCase', 'snake_case', 'PascalCase', '命名转换'],
    'csv-json': ['CSV转JSON', 'JSON转CSV', 'CSV工具', '数据转换', '表格转换'],
    'lorem-ipsum': ['Lorem Ipsum', '占位文本', '假文生成', '测试文本', '填充文本'],
    'text-escaper': ['文本转义', 'HTML转义', 'URL转义', 'JSON转义', '字符转义'],

    // Network & System
    'ip-subnet': ['IP子网计算器', 'CIDR', '子网掩码', 'IP计算', '网络计算器'],
    'unix-timestamp': ['Unix时间戳', '时间戳转换', '时间转换', 'Epoch时间', 'Unix时间'],
    'user-agent': ['User Agent解析', 'UA解析', '浏览器检测', '设备检测', 'User Agent'],

    // Security & Crypto
    'password-generator': ['密码生成器', '随机密码', '强密码', '密码工具', '安全密码'],
    'rsa-generator': ['RSA密钥', 'RSA生成器', '公钥私钥', 'RSA加密', '密钥对生成'],

    // Math & Unit
    'unit-converter': ['单位转换', '长度转换', '重量转换', '温度转换', '单位换算'],

    // File Tools
    'archive-extractor': ['ZIP解压', '压缩包查看', 'ZIP工具', '解压工具', '压缩文件'],

    // Lookup Tools
    'browser-info': ['浏览器信息', '浏览器检测', '系统信息', '设备信息', 'User Agent'],
    'dns-lookup': ['DNS查询', 'DNS解析', '域名查询', 'DNS工具', '域名解析'],
    'certificate-search': ['SSL证书查询', 'TLS证书', 'crt.sh', '证书搜索', '子域名发现', '证书透明度', 'CT日志'],
    'ip-lookup': ['IP查询', 'IP地址查询', 'IP定位', 'IP归属地', 'IP地理位置', 'IP信息', 'IP代理检测'],

    // Productivity Tools
    'uuid-generator': ['UUID生成', 'GUID生成', 'UUID工具', '唯一标识符', 'UUID'],
    'latex-editor': ['LaTeX编辑器', '数学公式', 'LaTeX工具', '公式编辑', 'MathJax'],
    'qr-barcode': ['二维码生成', '条形码', 'QR码', '二维码扫描', '条码生成'],
    'color-converter': ['颜色转换', 'HEX转RGB', 'RGB转HSL', '颜色工具', '色彩转换'],
    'pomodoro': ['番茄钟', '专注计时', 'Pomodoro', '时间管理', '番茄工作法'],
    'word-counter': ['字数统计', '字符统计', '单词计数', '文本统计', '字数工具'],

    // Image Tools
    'editor': ['图片编辑', '图像编辑器', '裁剪', '旋转', '图片调整'],
    'converter': ['图片转换', '格式转换', 'PNG转JPG', 'WEBP', '图片格式'],
    'ico-converter': ['ICO转换', 'Favicon生成', 'ICO工具', '图标转换', 'ICO生成器'],
    'ico-viewer': ['ICO查看', 'ICO解析', '图标查看', 'ICO文件', '图标提取'],
    'metadata': ['图片元数据', 'EXIF信息', '照片信息', 'GPS数据', '元数据查看'],
    'paint': ['画板', '绘图工具', '简易画板', '在线画图', '画图板'],

    // PDF Tools
    'pdf-tools': ['PDF工具', 'PDF合并', 'PDF分割', 'PDF编辑', 'PDF旋转'],

    // Device Test Tools
    'camera-test': ['摄像头测试', '相机测试', '摄像头检测', 'Camera Test', '摄像头工具'],
    'mic-test': ['麦克风测试', '耳机测试', '音频测试', '麦克风检测', '声音测试'],
    'speaker-test': ['扬声器测试', '音响测试', '左右声道', '音频测试', '喇叭测试'],
    'sensor-test': ['传感器测试', '陀螺仪', '加速度计', '设备传感器', '方向传感器'],
    'screen-test': ['屏幕测试', '坏点检测', '显示器测试', '亮点检测', '色彩测试'],
    'mouse-test': ['鼠标测试', '鼠标按键', '鼠标回报率', '鼠标检测', '鼠标工具'],
    'keyboard-test': ['键盘测试', '按键测试', '键盘检测', '按键检测', '键盘工具'],
    'gamepad-test': ['手柄测试', '游戏手柄', '手柄检测', '摇杆测试', '手柄按键'],
    'touch-test': ['触屏测试', '多点触控', '触摸测试', '触控检测', '触摸屏'],
};

// Get keywords for a specific tool
export const getToolKeywords = (toolId: string): string[] => {
    return toolKeywords[toolId] || [];
};

// Get all keywords for SEO meta tag in index.html
export const getAllKeywords = (): string[] => {
    const allKeywords = new Set<string>([
        '前端工具',
        '开发者工具',
        '生产力工具',
        '在线工具',
        '免费工具',
    ]);

    Object.values(toolKeywords).forEach(keywords => {
        keywords.forEach(keyword => allKeywords.add(keyword));
    });

    return Array.from(allKeywords);
};
