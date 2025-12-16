import { toolRegistry } from '../src/tools/registry';
import fs from 'fs';
function iNeedTheseTranslation() {
  let txt = "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();";
  for (const cate of toolRegistry.values()) {
    txt += `\nt(${cate.name});`
    for (const tool of cate.tools) {
      txt += `\nt(${tool.name});`
      txt += `\nt(${tool.description});`
    }
  }

  fs.writeFileSync('../src/.iNeedTheseTranslation.tsx', txt);
}

iNeedTheseTranslation();