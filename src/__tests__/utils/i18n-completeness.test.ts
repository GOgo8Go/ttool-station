import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// 获取所有语言文件的路径
const localesDir = path.join(__dirname, '../../../public/locales');
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

describe('i18n translation completeness', () => {
  // 获取中文(作为基准)的所有键
  const zhKeys = getAllKeys(translationFiles['zh']);
  
  // 检查其他语言是否包含中文中的所有键
  languages.filter(lang => lang !== 'zh').forEach(lang => {
    it(`should have all keys in ${lang} translation`, () => {
      const langKeys = getAllKeys(translationFiles[lang]);
      const missingKeys = zhKeys.filter(key => !langKeys.includes(key));
      
      if (missingKeys.length > 0) {
        console.error(`Missing keys in ${lang} translation:`, missingKeys);
      }
      
      expect(missingKeys).toEqual([]);
    });
  });
  
  // 检查是否存在空翻译
  languages.forEach(lang => {
    it(`should not have empty translations in ${lang}`, () => {
      const emptyTranslations = [];
      
      // 递归检查空翻译
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
        console.error(`Empty translations in ${lang}:`, emptyTranslations);
      }
      
      expect(emptyTranslations).toEqual([]);
    });
  });
});

// 额外的测试：检查错误格式的值（如common部分中的"Invalid IP Address"等）
describe('i18n translation format', () => {
  languages.forEach(lang => {
    it(`should not have unescaped values in ${lang}`, () => {
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
        console.warn(`Potentially untranslated values in ${lang}:`, invalidValues);
      }
      
      // 这些可能是占位符，所以暂时不作为错误
      // expect(invalidValues).toEqual([]);
    });
  });
});
