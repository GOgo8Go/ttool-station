import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Search,
    MapPin,
    Globe,
    Server,
    Clock,
    DollarSign,
    Flag,
    Network,
    Shield,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';

interface IPProvider {
    id: string;
    name: string;
    url: (ip?: string) => string;
}

const IP_PROVIDERS: IPProvider[] = [
    {
        id: 'ip-sb',
        name: 'IP.SB',
        url: (ip) => ip ? `https://api.ip.sb/geoip/${ip}` : 'https://api.ip.sb/geoip/'
    },
    {
        id: 'ip-api-io',
        name: 'IP-API.io',
        url: (ip) => ip ? `https://ip-api.io/json?ip=${ip}` : 'https://ip-api.io/json'
    },
    {
        id: 'ipapi-co',
        name: 'IPAPI.co',
        url: (ip) => ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/'
    },
    {
        id: 'freeipapi',
        name: 'FreeIPAPI',
        url: (ip) => ip ? `https://freeipapi.com/api/json/${ip}` : 'https://freeipapi.com/api/json'
    },
    {
        id: 'ipwhois',
        name: 'IPWhois',
        url: (ip) => ip ? `https://ipwhois.app/json/${ip}?format=json` : 'https://ipwhois.app/json/?format=json'
    }
];

const IpLookup: React.FC = () => {
    const { t } = useTranslation();
    const [ipAddress, setIpAddress] = useState('');
    const [selectedProvider, setSelectedProvider] = useState(IP_PROVIDERS[0].id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ipData, setIpData] = useState<any>(null);

    // Load default IP info on mount
    useEffect(() => {
        const loadDefaultIP = async () => {
            setLoading(true);
            try {
                const response = await fetch('https://ip.zinc233.top/');
                if (response.ok) {
                    const data = await response.json();
                    // Transform zinc233.top format to standard format
                    if (data.eo) {
                        const transformedData = {
                            ip: data.eo.clientIp,
                            country: data.eo.geo.countryName,
                            countryCode: data.eo.geo.countryCodeAlpha2,
                            region: data.eo.geo.regionName,
                            city: data.eo.geo.cityName,
                            latitude: data.eo.geo.latitude,
                            longitude: data.eo.geo.longitude,
                            isp: data.eo.geo.cisp,
                            asn: data.eo.geo.asn,
                        };
                        setIpData(transformedData);
                        setIpAddress(data.eo.clientIp);
                    }
                }
            } catch (err) {
                console.error('Failed to load default IP:', err);
            } finally {
                setLoading(false);
            }
        };

        loadDefaultIP();
    }, []);

    const lookupIP = async () => {
        setLoading(true);
        setError(null);

        try {
            const provider = IP_PROVIDERS.find(p => p.id === selectedProvider);
            if (!provider) throw new Error('Provider not found');

            const url = provider.url(ipAddress.trim() || undefined);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            setIpData(data);
        } catch (err: any) {
            setError(t('tool.ip-lookup.error'));
            console.error('IP lookup error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getMyIP = async () => {
        setIpAddress('');
        lookupIP();
    };

    // WGS84 to GCJ-02 coordinate conversion (for China)
    const transformWGS84ToGCJ02 = (lat: number, lng: number) => {
        const a = 6378245.0; // 长半轴
        const ee = 0.00669342162296594323; // 偏心率平方

        const transformLat = (x: number, y: number) => {
            let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
            ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
            return ret;
        };

        const transformLng = (x: number, y: number) => {
            let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
            ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
            ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
            ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
            return ret;
        };

        let dLat = transformLat(lng - 105.0, lat - 35.0);
        let dLng = transformLng(lng - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);

        return {
            lat: lat + dLat,
            lng: lng + dLng
        };
    };

    // Get map URL (use Amap for China, Google Maps for others)
    const getMapUrl = (lat: number, lng: number, countryCode?: string) => {
        // For China, convert to GCJ-02 and use Amap
        if (countryCode === 'CN') {
            const converted = transformWGS84ToGCJ02(lat, lng);
            return `https://uri.amap.com/marker?position=${converted.lng},${converted.lat}&name=IP位置`;
        }
        // For other countries, use Google Maps with WGS84
        return `https://www.google.com/maps?q=${lat},${lng}`;
    };

    // Normalize data from different providers
    const getNormalizedData = () => {
        if (!ipData) return null;

        return {
            ip: ipData.ip || ipData.ipAddress,
            country: ipData.country || ipData.country_name || ipData.countryName,
            countryCode: ipData.country_code || ipData.countryCode,
            region: ipData.region || ipData.region_name || ipData.regionName,
            city: ipData.city || ipData.cityName,
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            timezone: ipData.timezone || ipData.time_zone || ipData.timeZone,
            isp: ipData.isp || ipData.org || ipData.organisation || ipData.organization,
            asn: ipData.asn || ipData.asn_organization,
            currency: ipData.currency || ipData.currency_code || ipData.currency?.code,
            currencySymbol: ipData.currencySymbol || ipData.currency_symbol || ipData.currency?.name,
            isProxy: ipData.isProxy || ipData.suspiciousFactors?.isProxy,
            postal: ipData.postal || ipData.zip_code || ipData.zipCode,
            languages: ipData.languages || ipData.language,
            callingCode: ipData.callingCode || ipData.country_calling_code || ipData.country_phone,
        };
    };

    const normalized = getNormalizedData();

    return (
        <div className="space-y-6">
            {/* Search Card */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.ip-lookup.ip_address')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ipAddress}
                                onChange={(e) => setIpAddress(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && lookupIP()}
                                placeholder="8.8.8.8"
                                className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Button
                                onClick={lookupIP}
                                disabled={loading}
                                className="h-[50px] px-4"
                            >
                                <div className="flex items-center gap-2">
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Search className="w-5 h-5" />
                                    )}
                                    <span>{t('common.search')}</span>
                                </div>
                            </Button>
                            <Button
                                onClick={getMyIP}
                                disabled={loading}
                                variant="secondary"
                                className="h-[50px] px-4"
                            >
                                {t('tool.ip-lookup.my_ip')}
                            </Button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.ip-lookup.provider')}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {IP_PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => setSelectedProvider(provider.id)}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${selectedProvider === provider.id
                                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {provider.name}
                                </button>
                            ))}
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

            {/* Results */}
            {normalized && (
                <>
                    {/* Main Info Card */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {normalized.ip}
                                </h3>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    <span>{normalized.city}, {normalized.region}, {normalized.country}</span>
                                </div>
                            </div>
                            {normalized.isProxy !== undefined && (
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${normalized.isProxy
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    }`}>
                                    {normalized.isProxy ? (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            <span>{t('tool.ip-lookup.proxy_detected')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            <span>{t('tool.ip-lookup.not_proxy')}</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Location */}
                            {(normalized.country || normalized.region || normalized.city) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t('tool.ip-lookup.location')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {normalized.country && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.country')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {normalized.country} {normalized.countryCode && `(${normalized.countryCode})`}
                                                </span>
                                            </div>
                                        )}
                                        {normalized.region && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.region')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{normalized.region}</span>
                                            </div>
                                        )}
                                        {normalized.city && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.city')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{normalized.city}</span>
                                            </div>
                                        )}
                                        {normalized.postal && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.postal')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{normalized.postal}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Coordinates */}
                            {(normalized.latitude !== undefined && normalized.longitude !== undefined) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Globe className="w-5 h-5 text-green-500" />
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t('tool.ip-lookup.coordinates')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.latitude')}:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{normalized.latitude}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.longitude')}:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{normalized.longitude}</span>
                                        </div>
                                        <a
                                            href={getMapUrl(normalized.latitude, normalized.longitude, normalized.countryCode)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline mt-2"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            {t('tool.ip-lookup.view_map')}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Network */}
                            {(normalized.isp || normalized.asn) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Server className="w-5 h-5 text-purple-500" />
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t('tool.ip-lookup.network')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {normalized.isp && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">ISP:</span>
                                                <span className="font-medium text-gray-900 dark:text-white truncate ml-2">{normalized.isp}</span>
                                            </div>
                                        )}
                                        {normalized.asn && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">ASN:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{normalized.asn}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Timezone */}
                            {normalized.timezone && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t('tool.ip-lookup.timezone')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.timezone')}:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{normalized.timezone}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Currency */}
                            {normalized.currency && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-5 h-5 text-yellow-500" />
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t('tool.ip-lookup.currency')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.code')}:</span>
                                            <span className="font-medium text-gray-900 dark:text-white">{normalized.currency}</span>
                                        </div>
                                        {normalized.currencySymbol && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.symbol')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{normalized.currencySymbol}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            {(normalized.languages || normalized.callingCode) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Flag className="w-5 h-5 text-red-500" />
                                        <h4 className="font-semibold text-gray-900 dark:text-white">
                                            {t('tool.ip-lookup.additional')}
                                        </h4>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        {normalized.callingCode && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.calling_code')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{normalized.callingCode}</span>
                                            </div>
                                        )}
                                        {normalized.languages && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">{t('tool.ip-lookup.languages')}:</span>
                                                <span className="font-medium text-gray-900 dark:text-white truncate ml-2">
                                                    {typeof normalized.languages === 'string' ? normalized.languages.split(',')[0] : normalized.languages}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Raw Data Card */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Network className="w-5 h-5 text-gray-500" />
                            {t('tool.ip-lookup.raw_data')}
                        </h3>
                        <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-x-auto text-sm text-gray-700 dark:text-gray-300">
                            {JSON.stringify(ipData, null, 2)}
                        </pre>
                    </Card>
                </>
            )}
        </div>
    );
};

export default IpLookup;
