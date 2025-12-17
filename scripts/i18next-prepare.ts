import { toolRegistry } from '../src/tools/registry';
import { FLAGS, CHEATSHEET } from '../src/tools/developers/misc/RegexTester';
import { HTTP_STATUS } from '@/tools/lookup/HttpStatus';
import fs from 'fs';

// function iNeedTheseTranslationForRegistry() {
//   let keys: string[] = [];
//   for (const cate of toolRegistry.values()) {
//     keys.push(cate.name)
//     for (const tool of cate.tools) {
//       keys.push(tool.name)
//       keys.push(tool.description)
//     }
//   }
//   return keys;
// }

const iNeedTheseTranslationForRegistry = toolRegistry.flatMap(cate => [
  cate.name,
  ...cate.tools.flatMap(tool => [
    tool.name,
    tool.description,
  ])
]);

// function iNeedTheseTranslationForRegex() {
//   let keys: string[] = [];
//   for (const flag of FLAGS) {
//     const label = flag.label.toLowerCase().replace(' ', '_');
//     keys.push(`tool.regex-tester.flags.${label}`);
//     keys.push(`tool.regex-tester.flags_desc.${label}`);
//   }
//   for (const section of CHEATSHEET) {
//     const label = section.category.toLowerCase().replace(' ', '_');
//     keys.push(`tool.regex-tester.categories.${label}`);
//     keys.push(`tool.regex-tester.categories_desc.${label}`);
//     for (const item of section.items) {
//       const label2 = item.no;
//       keys.push(`tool.regex-tester.categories_example.${label}.${label2}`); 
//     }
//   }

//   return keys;
// }

const iNeedTheseTranslationForRegexTest = [
  ...FLAGS.flatMap(flag => ['', '_desc'].map(p => {
    const label = flag.label.toLowerCase().replace(' ', '_');
    return `tool.regex-tester.flags${p}.${label}`;
  })),
  ...CHEATSHEET.flatMap(section => {
    const label = section.category.toLowerCase().replace(' ', '_');
    const items = section.items.map(item => {
      const label2 = item.no;
      return `tool.regex-tester.categories_example.${label}.${label2}`;
    });
    return [
      `tool.regex-tester.categories.${label}`,
      `tool.regex-tester.categories_desc.${label}`,
      ...items,
    ];
  })
];

const iNeedTheseTranslationForSensorTest = [
    'deviceOrientation', 'deviceMotion', 'ambientLight', 'accelerometer', 'gyroscope', 'magnetometer', 'geolocation',
  ].map(v => `tool.sensor-test.sensors.${v}`)

const iNeedTheseTranslationForSpeakerTest = ['sine', 'square', 'sawtooth', 'triangle'].map(v => `tool.speaker-test.wave_${v}`);

const iNeedTheseTranslationForHttpStatus = [
  ...Object.keys(HTTP_STATUS).map(v => `tool.http-status.category.${v}xx`),
  ...Object.entries(HTTP_STATUS).flatMap(([k, vs]) =>
    vs.flatMap(v => {
      const code = `${k}${String(v).padStart(2, '0')}`;
      return ['title', 'description'].map(prefix => `tool.http-status.${prefix}.${code}`);
    })
  )
];

const iNeedTheseTranslationKeys = [
  ...iNeedTheseTranslationForRegistry,
  ...iNeedTheseTranslationForRegexTest,
  ...iNeedTheseTranslationForSensorTest,
  ...iNeedTheseTranslationForSpeakerTest,
  ...iNeedTheseTranslationForHttpStatus,
];



let text = "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();";
for (const key of iNeedTheseTranslationKeys) {
  text += `\nt('${key}');`
}

fs.writeFileSync('src/.iNeedTheseTranslation.tsx', text);
