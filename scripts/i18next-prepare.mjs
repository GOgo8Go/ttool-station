import fs from 'fs';
import path from 'path';

function extractTranslationKeys() {
  // 读取 registry 文件
  const registryPath = path.join(process.cwd(), 'src/tools/registry.tsx');
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  
  // 使用正则表达式提取翻译键
  const nameMatches = registryContent.match(/name:\s*'([^']+)'/g) || [];
  const descMatches = registryContent.match(/description:\s*'([^']+)'/g) || [];
  
  let txt = "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();\n";
  
  // 处理 name 键
  for (const match of nameMatches) {
    const key = match.match(/name:\s*'([^']+)'/)[1];
    txt += `\nt('${key}');`;
  }
  
  // 处理 description 键
  for (const match of descMatches) {
    const key = match.match(/description:\s*'([^']+)'/)[1];
    txt += `\nt('${key}');`;
  }
  
  // 处理 category name 键
  const categoryNameMatches = registryContent.match(/name:\s*'([^']+)'/g) || [];
  for (const match of categoryNameMatches) {
    const key = match.match(/name:\s*'([^']+)'/)[1];
    // 只处理 category 的 name（根据上下文判断）
    if (key.startsWith('category.')) {
      txt += `\nt('${key}');`;
    }
  }

  fs.writeFileSync('./src/.iNeedTheseTranslation.tsx', txt);
  console.log('Successfully generated .iNeedTheseTranslation.tsx');
}

extractTranslationKeys();