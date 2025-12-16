import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础URL
const BASE_URL = 'https://www.zinc233.top';

// 临时创建一个JS版本的工具注册表以便Node.js可以读取
const registryTsPath = path.join(__dirname, '..', 'src', 'tools', 'registry.tsx');
const tempRegistryJsPath = path.join(__dirname, 'temp-registry.js');

// 使用正则表达式提取工具信息
function extractToolsFromRegistry(content) {
  const tools = [];
  
  // 匹配分类信息
  const categoryRegex = /id:\s*['"]([^'"]+)['"][^}]*?tools:\s*\[([^\]]+)/gs;
  let categoryMatch;
  
  while ((categoryMatch = categoryRegex.exec(content)) !== null) {
    const categoryId = categoryMatch[1];
    const toolsSection = categoryMatch[2];
    
    // 匹配工具信息
    const toolRegex = /id:\s*['"]([^'"]+)['"][^}]*?name:\s*['"]([^'"]+)['"]/g;
    let toolMatch;
    
    while ((toolMatch = toolRegex.exec(toolsSection)) !== null) {
      tools.push({
        categoryId: categoryId,
        toolId: toolMatch[1],
        toolName: toolMatch[2]
      });
    }
  }
  
  return tools;
}

// 从工具注册表中获取所有工具信息
function getToolsRegistry() {
  const registryContent = fs.readFileSync(registryTsPath, 'utf-8');
  return extractToolsFromRegistry(registryContent);
}

// 生成sitemap.xml内容
function generateSitemap() {
  const tools = getToolsRegistry();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // 添加主页
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += '    <lastmod>2025-11-24</lastmod>\n';
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // 为每个工具添加URL
  tools.forEach(tool => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/#/tools/${tool.categoryId}/${tool.toolId}</loc>\n`;
    xml += '    <lastmod>2025-11-24</lastmod>\n';
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
}

// 确保dist目录存在
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 写入sitemap.xml文件到public目录和dist目录
const sitemapContent = generateSitemap();
fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), sitemapContent);
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent);

console.log('Sitemap generated successfully!');
console.log(`Total tools indexed: ${getToolsRegistry().length}`);