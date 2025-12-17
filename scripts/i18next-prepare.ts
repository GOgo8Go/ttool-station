import { toolRegistry } from '../src/tools/registry';
import { FLAGS, CHEATSHEET } from '../src/tools/developers/misc/RegexTester';
import fs from 'fs';

const iNeedTheseTranslationKeys = [
  ...iNeedTheseTranslationForRegistry(),
  ...iNeedTheseTranslationForRegex(),
];

function iNeedTheseTranslationForRegistry() {
  let keys: string[] = [];
  for (const cate of toolRegistry.values()) {
    keys.push(cate.name)
    for (const tool of cate.tools) {
      keys.push(tool.name)
      keys.push(tool.description)
    }
  }
  return keys;
}

function iNeedTheseTranslationForRegex() {
  let keys: string[] = [];
  for (const flag of FLAGS) {
    const label = flag.label.toLowerCase().replace(' ', '_');
    keys.push(`tool.regex-tester.flags.${label}`);
    keys.push(`tool.regex-tester.flag_desc.${label}`);
  }
  for (const section of CHEATSHEET) {
    const label = section.category.toLowerCase().replace(' ', '_');
    keys.push(`tool.regex-tester.categories.${label}`);
    keys.push(`tool.regex-tester.categories_desc.${label}`);
  }

  return keys;
}



let text = "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();";
for (const key of iNeedTheseTranslationKeys) {
  text += `\nt(${key});`
}

fs.writeFileSync('src/.iNeedTheseTranslation.tsx', text);
