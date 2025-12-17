import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 解决ES模块中__dirname未定义的问题
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取所有语言文件的路径
const localesDir = path.join(__dirname, '../public/locales');
const languages = fs.readdirSync(localesDir).filter(item => 
  fs.statSync(path.join(localesDir, item)).isDirectory()
);

// 读取所有语言文件内容
const translationFiles = {};
languages.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  if (fs.existsSync(filePath)) {
    translationFiles[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
});

// 递归获取嵌套对象中的所有键路径
function getAllKeys(obj, prefix = '') {
 let keys = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys = keys.concat(getAllKeys(obj[key], newKey));
      } else {
        keys.push(newKey);
      }
    }
 }
  return keys;
}

// 生成翻译完整性报告
function generateCompletenessReport() {
 console.log('🔍 i18n 翻译完整性报告\n');
  
  // 获取中文(作为基准)的所有键
  const zhKeys = getAllKeys(translationFiles['zh']);
  console.log(`基准语言: zh (共 ${zhKeys.length} 个翻译键)\n`);
  
  // 检查其他语言是否包含中文中的所有键
  languages.filter(lang => lang !== 'zh').forEach(lang => {
    console.log(`\n📋 ${lang} 语言翻译状态:`);
    
    const langKeys = getAllKeys(translationFiles[lang]);
    const missingKeys = zhKeys.filter(key => !langKeys.includes(key));
    const coveragePercentage = ((langKeys.length / zhKeys.length) * 100).toFixed(2);
    
    console.log(`  总键数: ${langKeys.length}/${zhKeys.length} (${coveragePercentage}% 覆盖率)`);
    
    if (missingKeys.length > 0) {
      console.log(`  ❌ 缺失的键 (${missingKeys.length} 个):`);
      missingKeys.forEach(key => console.log(`    - ${key}`));
    } else {
      console.log('  ✅ 所有键都已翻译');
    }
    
    // 检查空翻译
    const emptyTranslations = [];
    
    function checkEmptyTranslations(obj, prefix = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'string') {
            if (obj[key].trim() === '') {
              emptyTranslations.push(newKey);
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            checkEmptyTranslations(obj[key], newKey);
          }
        }
      }
    }
    
    checkEmptyTranslations(translationFiles[lang]);
    
    if (emptyTranslations.length > 0) {
      console.log(`  🚫 空翻译 (${emptyTranslations.length} 个):`);
      emptyTranslations.forEach(key => console.log(`    - ${key}`));
    } else {
      console.log('  ✅ 无空翻译');
    }
 });
  
  // 检查所有语言中的空翻译
  console.log('\n🔍 全局空翻译检查:');
  languages.forEach(lang => {
    const emptyTranslations = [];
    
    function checkEmptyTranslations(obj, prefix = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'string') {
            if (obj[key].trim() === '') {
              emptyTranslations.push(newKey);
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            checkEmptyTranslations(obj[key], newKey);
          }
        }
      }
    }
    
    checkEmptyTranslations(translationFiles[lang]);
    
    if (emptyTranslations.length > 0) {
      console.log(`\n  ${lang} 中的空翻译 (${emptyTranslations.length} 个):`);
      emptyTranslations.forEach(key => console.log(`    - ${key}`));
    }
  });
  
  // 检查错误格式的值（如common部分中的"Invalid IP Address"等）
  console.log('\n🔍 潜在未翻译的值检查:');
  languages.forEach(lang => {
    const invalidValues = [];
    
    function checkInvalidValues(obj, prefix = '') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'string') {
            // 检查是否包含类似"Invalid IP Address"这样的值，这些值应该被翻译
            if (obj[key].match(/^[A-Z][^a-z]* [A-Z][^a-z]*( [A-Z][^a-z]*)*$/)) {
              invalidValues.push(`${newKey}: "${obj[key]}"`);
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            checkInvalidValues(obj[key], newKey);
          }
        }
      }
    }
    
    checkInvalidValues(translationFiles[lang]);
    
    if (invalidValues.length > 0) {
      console.log(`\n  ${lang} 中的潜在问题值 (${invalidValues.length} 个):`);
      invalidValues.forEach(item => console.log(`    - ${item}`));
    }
  });
  
  // 总结
  console.log('\n📊 翻译完成度总结:');
  languages.forEach(lang => {
    const langKeys = getAllKeys(translationFiles[lang]);
    const emptyTranslations = [];
    
    function checkEmptyTranslations(obj) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'string') {
            if (obj[key].trim() === '') {
              emptyTranslations.push(key);
            }
          } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            checkEmptyTranslations(obj[key]);
          }
        }
      }
    }
    
    checkEmptyTranslations(translationFiles[lang]);
    const nonEmptyCount = langKeys.length - emptyTranslations.length;
    const completeness = ((nonEmptyCount / langKeys.length) * 100).toFixed(2);
    
    console.log(`  ${lang}: ${nonEmptyCount}/${langKeys.length} 非空翻译 (${completeness}% 完成度)`);
  });
}

// 运行检查
generateCompletenessReport();
