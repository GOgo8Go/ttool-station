import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Search, Globe, Mail, FileText, Server, User, Calendar, ArrowRight, Shield } from 'lucide-react';

// 定义DNS记录类型信息接口
interface DnsRecordInfo {
  type: string;
  icon: React.ElementType;
  descriptionKey: string;
  exampleKey: string;
  useCaseKey: string;
}

// DNS记录类型信息数据
const DNS_RECORDS_INFO: DnsRecordInfo[] = [
  {
    type: 'A',
    icon: Globe,
    descriptionKey: 'tool.dns-records-info.a.description',
    exampleKey: 'tool.dns-records-info.a.example',
    useCaseKey: 'tool.dns-records-info.a.useCase'
  },
  {
    type: 'AAAA',
    icon: Globe,
    descriptionKey: 'tool.dns-records-info.aaaa.description',
    exampleKey: 'tool.dns-records-info.aaaa.example',
    useCaseKey: 'tool.dns-records-info.aaaa.useCase'
  },
  {
    type: 'CNAME',
    icon: ArrowRight,
    descriptionKey: 'tool.dns-records-info.cname.description',
    exampleKey: 'tool.dns-records-info.cname.example',
    useCaseKey: 'tool.dns-records-info.cname.useCase'
  },
  {
    type: 'MX',
    icon: Mail,
    descriptionKey: 'tool.dns-records-info.mx.description',
    exampleKey: 'tool.dns-records-info.mx.example',
    useCaseKey: 'tool.dns-records-info.mx.useCase'
  },
  {
    type: 'TXT',
    icon: FileText,
    descriptionKey: 'tool.dns-records-info.txt.description',
    exampleKey: 'tool.dns-records-info.txt.example',
    useCaseKey: 'tool.dns-records-info.txt.useCase'
  },
  {
    type: 'NS',
    icon: Server,
    descriptionKey: 'tool.dns-records-info.ns.description',
    exampleKey: 'tool.dns-records-info.ns.example',
    useCaseKey: 'tool.dns-records-info.ns.useCase'
  },
  {
    type: 'SOA',
    icon: Calendar,
    descriptionKey: 'tool.dns-records-info.soa.description',
    exampleKey: 'tool.dns-records-info.soa.example',
    useCaseKey: 'tool.dns-records-info.soa.useCase'
  },
  {
    type: 'PTR',
    icon: ArrowRight,
    descriptionKey: 'tool.dns-records-info.ptr.description',
    exampleKey: 'tool.dns-records-info.ptr.example',
    useCaseKey: 'tool.dns-records-info.ptr.useCase'
  },
  {
    type: 'CAA',
    icon: Shield,
    descriptionKey: 'tool.dns-records-info.caa.description',
    exampleKey: 'tool.dns-records-info.caa.example',
    useCaseKey: 'tool.dns-records-info.caa.useCase'
  }
];

const DnsRecordsInfo: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // 过滤记录类型
  const filteredRecords = DNS_RECORDS_INFO.filter(record => 
    record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t(record.descriptionKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
    t(record.useCaseKey).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t('tool.dns-records-info.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('tool.dns-records-info.description')}
        </p>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('tool.dns-records-info.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((record) => {
            const Icon = record.icon;
            return (
              <Card key={record.type} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {record.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t(record.descriptionKey)}
                    </p>
                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 text-gray-800 dark:text-gray-200">
                      {t('tool.dns-records-info.example')}: {t(record.exampleKey)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {t('tool.dns-records-info.useCase')}: {t(record.useCaseKey)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('tool.dns-records-info.no_records_found')}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DnsRecordsInfo;