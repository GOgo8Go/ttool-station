import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Search, Globe, Clock, Database, AlertCircle, Loader2 } from 'lucide-react';

type RecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'PTR' | 'CAA';

interface DnsRecord {
    name: string;
    type: number;
    TTL: number;
    data: string;
}

interface DnsResponse {
    Status: number;
    Answer?: DnsRecord[];
    Authority?: DnsRecord[];
}

// DNS 提供商类型 - 只包含支持浏览器 CORS 访问的 DoH 服务商
type DnsProvider = 'google' | 'cloudflare' | 'alidns';

const RECORD_TYPES: { value: RecordType; label: string; typeNum: number }[] = [
    { value: 'A', label: 'A', typeNum: 1 },
    { value: 'AAAA', label: 'AAAA', typeNum: 28 },
    { value: 'CNAME', label: 'CNAME', typeNum: 5 },
    { value: 'MX', label: 'MX', typeNum: 15 },
    { value: 'TXT', label: 'TXT', typeNum: 16 },
    { value: 'NS', label: 'NS', typeNum: 2 },
    { value: 'SOA', label: 'SOA', typeNum: 6 },
    { value: 'PTR', label: 'PTR', typeNum: 12 },
    { value: 'CAA', label: 'CAA', typeNum: 257 },
];

// DNS over HTTPS (DoH) 提供商配置
// 只包含确认支持浏览器 CORS 访问的服务商
const DNS_PROVIDERS: { value: DnsProvider; label: string; url: string; useJsonApi?: boolean }[] = [
    { value: 'google', label: 'Google DNS', url: 'https://dns.google/resolve', useJsonApi: true },
    { value: 'cloudflare', label: 'Cloudflare (1.1.1.1)', url: 'https://cloudflare-dns.com/dns-query', useJsonApi: false },
    { value: 'alidns', label: 'AliDNS (阿里)', url: 'https://dns.alidns.com/resolve', useJsonApi: true },
];

const DnsLookup: React.FC = () => {
    const { t } = useTranslation();
    const [domain, setDomain] = useState('');
    const [recordType, setRecordType] = useState<RecordType>('A');
    const [dnsProvider, setDnsProvider] = useState<DnsProvider>('google'); // 默认使用Google DNS
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<DnsRecord[] | null>(null);

    const queryDns = async () => {
        if (!domain.trim()) {
            setError(t('tool.dns-lookup.error.empty_domain'));
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const typeNum = RECORD_TYPES.find(rt => rt.value === recordType)?.typeNum || 1;
            const provider = DNS_PROVIDERS.find(p => p.value === dnsProvider);

            if (!provider) {
                throw new Error('Invalid DNS provider');
            }

            let url: string;
            let headers: HeadersInit = {};

            // 构建URL和请求头
            if (provider.useJsonApi) {
                // Google DNS 和 AliDNS 使用 JSON API
                url = `${provider.url}?name=${encodeURIComponent(domain)}&type=${typeNum}`;
            } else {
                // Cloudflare 和 DNSPod 使用标准 DoH 格式
                url = `${provider.url}?name=${encodeURIComponent(domain)}&type=${typeNum}`;
                headers = {
                    'Accept': 'application/dns-json'
                };
            }

            const response = await fetch(url, { headers });

            if (!response.ok) {
                throw new Error(`DNS query failed with status ${response.status}`);
            }

            const data: DnsResponse = await response.json();

            if (data.Status !== 0) {
                setError(t('tool.dns-lookup.error.query_failed'));
                return;
            }

            if (!data.Answer || data.Answer.length === 0) {
                setError(t('tool.dns-lookup.error.no_records'));
                return;
            }

            setResults(data.Answer);
        } catch (err: any) {
            console.error('DNS query error:', err);
            setError(t('tool.dns-lookup.error.network_error', { error: err.message }));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            queryDns();
        }
    };

    const getRecordTypeName = (typeNum: number): string => {
        const record = RECORD_TYPES.find(rt => rt.typeNum === typeNum);
        return record ? record.value : `TYPE${typeNum}`;
    };

    return (
        <div className="space-y-6">
            {/* Query Section */}
            <Card>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.dns-lookup.domain_label')}
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={t('tool.dns-lookup.domain_placeholder')}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.dns-lookup.record_type_label')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {RECORD_TYPES.map((rt) => (
                                <button
                                    key={rt.value}
                                    onClick={() => setRecordType(rt.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordType === rt.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {rt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 添加DNS提供商选择 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.dns-lookup.dns_provider_label')}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DNS_PROVIDERS.map((provider) => (
                                <button
                                    key={provider.value}
                                    onClick={() => setDnsProvider(provider.value)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dnsProvider === provider.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {provider.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button onClick={queryDns} disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t('tool.dns-lookup.querying')}
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                {t('tool.dns-lookup.query_button')}
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Error Display */}
            {error && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
                    </div>
                </Card>
            )}

            {/* Results Display */}
            {results && results.length > 0 && (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary-600" />
                        {t('tool.dns-lookup.results_title')}
                    </h3>
                    <div className="space-y-3">
                        {results.map((record, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {t('tool.dns-lookup.record_type')}
                                        </div>
                                        <div className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">
                                            {getRecordTypeName(record.type)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {t('tool.dns-lookup.ttl')}
                                        </div>
                                        <div className="font-mono text-sm text-gray-700 dark:text-gray-300">
                                            {record.TTL}s
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {t('tool.dns-lookup.data')}
                                        </div>
                                        <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                                            {record.data}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        {t('tool.dns-lookup.info_text')}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default DnsLookup;