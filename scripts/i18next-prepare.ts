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

const qrBarCode = Array.from(new Set([...QR_LINE_STYLES, ...QR_DOT_STYLES, ...QR_CENTER_STYLES]), v => `tool.qr-barcode.generator.styles.${v}`);
const passwordGenerator = ['uppercase', 'lowercase', 'numbers', 'symbols'].map(v => `tool.password-generator.${v}`);

const unitConverter = Object.entries(UNIT_CATEGORIES).flatMap(([cat, { units }]) => [
  `tool.unit-converter.categories.${cat}`,
 ...Object.keys(units).map(v => `tool.unit-converter.units.${v}`)
]);

// Function to read and parse YAML files to extract Bluetooth service and characteristic names
const parseYaml = (yamlText: string): any => {
 const lines = yamlText.split('\n');
  const result: any = { uuids: [] };
 let currentEntry: any = null;
  let inUuidsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Check if we're entering the uuids section
    if (trimmedLine === 'uuids:') {
      inUuidsSection = true;
      continue;
    }
    
    if (!inUuidsSection) {
      continue;
    }
    
    // Check for new entry (starts with -)
    if (line.trimStart().startsWith('- ')) {
      // Save previous entry if exists
      if (currentEntry) {
        result.uuids.push(currentEntry);
      }
      
      // Start new entry
      currentEntry = {};
      
      // Parse the current line for uuid
      const uuidMatch = line.match(/- uuid:\s*(.+)/);
      if (uuidMatch) {
        currentEntry.uuid = uuidMatch[1].trim();
      }
      
      // Look ahead for name and id on subsequent lines
      let nextLineIndex = i + 1;
      while (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex];
        const nextTrimmed = nextLine.trim();
        
        // Stop if we hit a new entry or end of file
        if (nextTrimmed === '' || nextTrimmed.startsWith('#') || nextLine.trimStart().startsWith('- ')) {
          break;
        }
        
        // Check for name
        const nameMatch = nextLine.match(/\s*name:\s*(.+)/);
        if (nameMatch) {
          currentEntry.name = nameMatch[1].trim();
        }
        
        // Check for id
        const idMatch = nextLine.match(/\s*id:\s*(.+)/);
        if (idMatch) {
          currentEntry.id = idMatch[1].trim();
        }
        
        nextLineIndex++;
      }
      
      // Skip the lines we've already processed
      i = nextLineIndex - 1;
    }
  }
  
  // Add the last entry
  if (currentEntry) {
    result.uuids.push(currentEntry);
  }
  
  return result;
};

// Function to extract Bluetooth service names and generate translation keys
const getBluetoothServiceKeys = (): string[] => {
  try {
    const serviceYamlContent = fs.readFileSync('public/bluetooth/assigned_numbers/uuids/service_uuids.yaml', 'utf8');
    const servicesYaml = parseYaml(serviceYamlContent);
    
    if (servicesYaml && Array.isArray(servicesYaml.uuids)) {
      return servicesYaml.uuids.map((service: any) => service.id);
    }
  } catch (error) {
    console.error('Error reading service UUIDs file:', error);
  }
 return [];
};

// Function to extract Bluetooth characteristic names and generate translation keys
const getBluetoothCharacteristicKeys = (): string[] => {
  try {
    const characteristicYamlContent = fs.readFileSync('public/bluetooth/assigned_numbers/uuids/characteristic_uuids.yaml', 'utf8');
    const characteristicsYaml = parseYaml(characteristicYamlContent);
    
    if (characteristicsYaml && Array.isArray(characteristicsYaml.uuids)) {
      return characteristicsYaml.uuids.map((characteristic: any) => characteristic.id);
    }
 } catch (error) {
    console.error('Error reading characteristic UUIDs file:', error);
  }
 return [];
};


const iNeedTheseTranslationKeys = [
  ...registry,
  ...regexTest,
  ...sensorTest,
  ...speakerTest,
  ...httpStatus,
  ...dnsRecordsInfo,
  ...qrBarCode,
  ...passwordGenerator,
  ...unitConverter,
  ...getBluetoothServiceKeys(),
  ...getBluetoothCharacteristicKeys(),
];



let text = "import { useTranslation } from 'react-i18next';\nconst { t } = useTranslation();";
for (const key of iNeedTheseTranslationKeys) {
  text += `\nt('${key}');`
}

fs.writeFileSync('src/.iNeedTheseTranslation.tsx', text);
