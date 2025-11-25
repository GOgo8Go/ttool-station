import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Search, ExternalLink, Calendar, Shield, AlertCircle } from 'lucide-react';

interface Certificate {
    id: number;
    issuer_ca_id: number;
    issuer_name: string;
    common_name: string;
    name_value: string;
    min_cert_id: number;
    min_entry_timestamp: string;
    not_before: string;
    not_after: string;
}

const CertificateSearch: React.FC = () => {
    const { t } = useTranslation();
    const [domain, setDomain] = useState('');
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

    const searchCertificates = async () => {
        if (!domain.trim()) {
            setError(t('tool.certificate-search.enter_domain'));
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);
        setSelectedDomain(null);

        try {
            // crt.sh API endpoint
            const response = await fetch(
                `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
                {
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch certificates');
            }

            const data = await response.json();

            // Remove duplicates based on common_name and issuer
            const uniqueCerts = data.reduce((acc: Certificate[], cert: Certificate) => {
                const exists = acc.find(
                    c => c.common_name === cert.common_name &&
                        c.issuer_name === cert.issuer_name &&
                        c.not_before === cert.not_before
                );
                if (!exists) {
                    acc.push(cert);
                }
                return acc;
            }, []);

            // Sort by not_before date (newest first)
            uniqueCerts.sort((a, b) =>
                new Date(b.not_before).getTime() - new Date(a.not_before).getTime()
            );

            setCertificates(uniqueCerts);
        } catch (err) {
            setError(t('tool.certificate-search.error'));
            console.error('Certificate search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const isExpired = (notAfter: string) => {
        return new Date(notAfter) < new Date();
    };

    const getUniqueSubdomains = () => {
        const subdomains = new Set<string>();
        certificates.forEach(cert => {
            cert.name_value.split('\n').forEach(name => {
                subdomains.add(name.trim());
            });
        });
        return Array.from(subdomains).sort();
    };

    const getFilteredCertificates = () => {
        if (!selectedDomain) return certificates;
        return certificates.filter(cert =>
            cert.name_value.split('\n').some(name => name.trim() === selectedDomain)
        );
    };

    const handleDomainClick = (subdomain: string) => {
        if (selectedDomain === subdomain) {
            setSelectedDomain(null);
        } else {
            setSelectedDomain(subdomain);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.certificate-search.domain')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchCertificates()}
                                placeholder="example.com"
                                className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Button
                                onClick={searchCertificates}
                                disabled={loading}
                                className="h-[50px] px-4"
                            >
                                <div className="flex items-center gap-2">
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Search className="w-5 h-5" />
                                    )}
                                    <span>{t('common.search')}</span>
                                </div>
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </Card>

            {searched && !loading && certificates.length > 0 && (
                <>
                    {/* Summary Card */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            {t('tool.certificate-search.summary')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {certificates.length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('tool.certificate-search.total_certs')}
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {getUniqueSubdomains().length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('tool.certificate-search.unique_domains')}
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {certificates.filter(c => !isExpired(c.not_after)).length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {t('tool.certificate-search.active_certs')}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Subdomains List */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {t('tool.certificate-search.discovered_domains')}
                        </h3>
                        <div className="max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {getUniqueSubdomains().map((subdomain, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleDomainClick(subdomain)}
                                        className={`p-2 rounded border text-sm font-mono break-all text-left transition-all ${selectedDomain === subdomain
                                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                                            : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        {subdomain}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Certificates List */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {t('tool.certificate-search.certificates')}
                                {selectedDomain && (
                                    <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                        ({getFilteredCertificates().length} / {certificates.length})
                                    </span>
                                )}
                            </h3>
                            {selectedDomain && (
                                <button
                                    onClick={() => setSelectedDomain(null)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {t('tool.certificate-search.clear_filter')}
                                </button>
                            )}
                        </div>
                        {selectedDomain && (
                            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300">
                                {t('tool.certificate-search.filtering_by')}: <span className="font-mono font-semibold">{selectedDomain}</span>
                            </div>
                        )}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {getFilteredCertificates().map((cert) => (
                                <div
                                    key={cert.id}
                                    className={`p-4 rounded-lg border ${isExpired(cert.not_after)
                                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {cert.common_name}
                                                </h4>
                                                {isExpired(cert.not_after) && (
                                                    <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                                                        {t('tool.certificate-search.expired')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {formatDate(cert.not_before)} - {formatDate(cert.not_after)}
                                                    </span>
                                                </div>
                                                <div className="text-xs truncate">
                                                    {t('tool.certificate-search.issuer')}: {cert.issuer_name}
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://crt.sh/?id=${cert.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            )}

            {searched && !loading && certificates.length === 0 && !error && (
                <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{t('tool.certificate-search.no_results')}</p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default CertificateSearch;
