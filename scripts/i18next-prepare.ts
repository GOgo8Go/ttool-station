import fs from 'fs';
import { toolRegistry } from '@/tools/registry';
import { FLAGS, CHEATSHEET } from '@/tools/developers/misc/RegexTester';
import { HTTP_STATUS } from '@/tools/lookup/HttpStatus';
import { DNS_RECORDS_INFO } from '@/tools/lookup/DnsRecordsInfo';
import { QR_DOT_STYLES, QR_LINE_STYLES, QR_CENTER_STYLES } from '@/tools/image/QrBarCode';
import { UNIT_CATEGORIES } from '@/tools/math/UnitConverter';

const registry = toolRegistry.flatMap(cate => [
  cate.name,
  ...cate.tools.flatMap(tool => [
    tool.name,
    tool.description,
  ])
]);


const regexTest = [
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

const sensorTest = [
    'deviceOrientation', 'deviceMotion', 'ambientLight', 'accelerometer', 'gyroscope', 'magnetometer', 'geolocation',
  ].map(v => `tool.sensor-test.sensors.${v}`)

const speakerTest = ['sine', 'square', 'sawtooth', 'triangle'].map(v => `tool.speaker-test.wave_${v}`);

const httpStatus = [
  ...Object.keys(HTTP_STATUS).map(v => `tool.http-status.category.${v}xx`),
  ...Object.entries(HTTP_STATUS).flatMap(([k, vs]) =>
    vs.flatMap(v => {
      const code = `${k}${String(v).padStart(2, '0')}`;
      return ['title', 'description'].map(prefix => `tool.http-status.${prefix}.${code}`);
    })
  )
];

const dnsRecordsInfo = 
  DNS_RECORDS_INFO.flatMap(( {descriptionKey, exampleKey, useCaseKey}) => [descriptionKey, exampleKey, useCaseKey]);

const qrBarCode = new Set([QR_LINE_STYLES, QR_DOT_STYLES, QR_CENTER_STYLES]);
const passwordGenerator = ['uppercase', 'lowercase', 'numbers', 'symbols'].map(v => `tool.password-generator.${v}`);

const unitConverter = UNIT_CATEGORIES.flatMap(([cat, { units }]) => [
  `tool.unit-converter.categories.${cat}`, 
  ...Object.keys(units).map(v => `tool.unit-converter.units.${v}`)
]);

const iNeedTheseTranslationKeys = [
  ...registry,
  ...regexTest,
  ...sensorTest,
  ...speakerTest,
  ...httpStatus,
  ...dnsRecordsInfo,
  ...qrBarCode,
  ...passwordGenerator
];



let text = "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();";
for (const key of iNeedTheseTranslationKeys) {
  text += `\nt('${key}');`
}

fs.writeFileSync('src/.iNeedTheseTranslation.tsx', text);
