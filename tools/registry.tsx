import { Code2, FileText, Timer, Calculator, Settings, Braces, Image as ImageIcon, ArrowLeftRight, FileImage, Crop, Info, View, Brush, FileCode, FileStack, FolderOpen, FileArchive, Globe, Camera, Regex, Fingerprint, Palette, QrCode, Hash, GitCompare, Search, Binary, Sigma } from 'lucide-react';
import { ToolCategory } from '../types';

// Import tool components
import JsonFormatter from './developers/JsonFormatter';
import ConfigConverter from './developers/ConfigConverter';
import BrowserInfo from './developers/BrowserInfo';
import CodeBeautifier from './developers/CodeBeautifier';
import RegexTester from './developers/RegexTester';
import UuidGenerator from './developers/UuidGenerator';
import HashGenerator from './developers/HashGenerator';
import EncodingConverter from './developers/EncodingConverter';
import CodeDiff from './developers/CodeDiff';
import BaseConverter from './developers/BaseConverter';
import BaseCalculator from './developers/BaseCalculator';
import BitwiseCalculator from './developers/BitwiseCalculator';
import BigIntCalculator from './developers/BigIntCalculator';
import HttpStatus from './lookup/HttpStatus';
import DnsLookup from './lookup/DnsLookup';
import DnsRecordsInfo from './lookup/DnsRecordsInfo';
import WordCounter from './productivity/WordCounter';
import Pomodoro from './productivity/Pomodoro';
import ImageConverter from './image/ImageConverter';
import IcoConverter from './image/IcoConverter';
import IcoViewer from './image/IcoViewer';
import ImageEditor from './image/ImageEditor';
import MetadataViewer from './image/MetadataViewer';
import SimplePaint from './image/SimplePaint';
import ColorConverter from './image/ColorConverter';
import QrBarCode from './image/QrBarCode';
import PdfTools from './pdf/PdfTools';
import ArchiveExtractor from './files/ArchiveExtractor';

export const toolRegistry: ToolCategory[] = [
  {
    id: 'developers',
    name: 'category.developers',
    icon: Code2,
    tools: [
      {
        id: 'json-formatter',
        name: 'tool.json-formatter.name',
        description: 'tool.json-formatter.desc',
        icon: Braces,
        component: JsonFormatter,
      },
      {
        id: 'base-converter',
        name: 'tool.base-converter.name',
        description: 'tool.base-converter.desc',
        icon: ArrowLeftRight,
        component: BaseConverter,
      },
      {
        id: 'base-calculator',
        name: 'tool.base-calculator.name',
        description: 'tool.base-calculator.desc',
        icon: Calculator,
        component: BaseCalculator,
      },
      {
        id: 'bigint-calculator',
        name: 'tool.bigint-calculator.name',
        description: 'tool.bigint-calculator.desc',
        icon: Sigma,
        component: BigIntCalculator,
      },
      {
        id: 'bitwise-calculator',
        name: 'tool.bitwise-calculator.name',
        description: 'tool.bitwise-calculator.desc',
        icon: Binary,
        component: BitwiseCalculator,
      },
      {
        id: 'code-diff',
        name: 'tool.code-diff.name',
        description: 'tool.code-diff.desc',
        icon: GitCompare,
        component: CodeDiff,
      },
      {
        id: 'hash-generator',
        name: 'tool.hash-generator.name',
        description: 'tool.hash-generator.desc',
        icon: Hash,
        component: HashGenerator,
      },
      {
        id: 'encoding-converter',
        name: 'tool.encoding-converter.name',
        description: 'tool.encoding-converter.desc',
        icon: Binary,
        component: EncodingConverter,
      },
      {
        id: 'uuid-generator',
        name: 'tool.uuid-generator.name',
        description: 'tool.uuid-generator.desc',
        icon: Fingerprint,
        component: UuidGenerator,
      },
      {
        id: 'regex-tester',
        name: 'tool.regex-tester.name',
        description: 'tool.regex-tester.desc',
        icon: Regex,
        component: RegexTester,
      },
      {
        id: 'code-beautifier',
        name: 'tool.code-beautifier.name',
        description: 'tool.code-beautifier.desc',
        icon: Camera,
        component: CodeBeautifier,
      },
      {
        id: 'config-converter',
        name: 'tool.config-converter.name',
        description: 'tool.config-converter.desc',
        icon: FileCode,
        component: ConfigConverter,
      },
      {
        id: 'browser-info',
        name: 'tool.browser-info.name',
        description: 'tool.browser-info.desc',
        icon: Globe,
        component: BrowserInfo,
      },
    ],
  },
  {
    id: 'files',
    name: 'category.files',
    icon: FolderOpen,
    tools: [
      {
        id: 'archive-extractor',
        name: 'tool.archive-extractor.name',
        description: 'tool.archive-extractor.desc',
        icon: FileArchive,
        component: ArchiveExtractor,
      },
      {
        id: 'pdf-tools',
        name: 'tool.pdf-tools.name',
        description: 'tool.pdf-tools.desc',
        icon: FileStack,
        component: PdfTools,
      },
    ],
  },
  {
    id: 'lookup',
    name: 'category.lookup',
    icon: Search,
    tools: [
      {
        id: 'http-status',
        name: 'tool.http-status.name',
        description: 'tool.http-status.desc',
        icon: Globe,
        component: HttpStatus,
      },
      {
        id: 'dns-lookup',
        name: 'tool.dns-lookup.name',
        description: 'tool.dns-lookup.desc',
        icon: Globe,
        component: DnsLookup,
      },
      {
        id: 'dns-records-info',
        name: 'tool.dns-records-info.name',
        description: 'tool.dns-records-info.desc',
        icon: FileText,
        component: DnsRecordsInfo,
      },
    ],
  },
  {
    id: 'productivity',
    name: 'category.productivity',
    icon: Settings,
    tools: [
      {
        id: 'word-counter',
        name: 'tool.word-counter.name',
        description: 'tool.word-counter.desc',
        icon: FileText,
        component: WordCounter,
      },
      {
        id: 'pomodoro',
        name: 'tool.pomodoro.name',
        description: 'tool.pomodoro.desc',
        icon: Timer,
        component: Pomodoro,
      },
    ],
  },
  {
    id: 'image',
    name: 'category.image',
    icon: ImageIcon,
    tools: [
      {
        id: 'qr-barcode',
        name: 'tool.qr-barcode.name',
        description: 'tool.qr-barcode.desc',
        icon: QrCode,
        component: QrBarCode,
      },
      {
        id: 'paint',
        name: 'tool.paint.name',
        description: 'tool.paint.desc',
        icon: Brush,
        component: SimplePaint,
      },
      {
        id: 'color-converter',
        name: 'tool.color-converter.name',
        description: 'tool.color-converter.desc',
        icon: Palette,
        component: ColorConverter,
      },
      {
        id: 'editor',
        name: 'tool.editor.name',
        description: 'tool.editor.desc',
        icon: Crop,
        component: ImageEditor,
      },
      {
        id: 'converter',
        name: 'tool.converter.name',
        description: 'tool.converter.desc',
        icon: ArrowLeftRight,
        component: ImageConverter,
      },
      {
        id: 'ico-converter',
        name: 'tool.ico-converter.name',
        description: 'tool.ico-converter.desc',
        icon: FileImage,
        component: IcoConverter,
      },
      {
        id: 'ico-viewer',
        name: 'tool.ico-viewer.name',
        description: 'tool.ico-viewer.desc',
        icon: View,
        component: IcoViewer,
      },
      {
        id: 'metadata',
        name: 'tool.metadata.name',
        description: 'tool.metadata.desc',
        icon: Info,
        component: MetadataViewer,
      },
    ],
  },
];

export const getToolById = (categoryId: string, toolId: string) => {
  const category = toolRegistry.find(c => c.id === categoryId);
  return category?.tools.find(t => t.id === toolId);
};