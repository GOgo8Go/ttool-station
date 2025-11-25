import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Network, Calculator } from 'lucide-react';

const IpSubnet: React.FC = () => {
    const { t } = useTranslation();
    const [ip, setIp] = useState('192.168.1.1');
    const [mask, setMask] = useState('24');
    const [result, setResult] = useState<any>(null);

    const calculate = () => {
        try {
            const ipParts = ip.split('.').map(Number);
            if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
                throw new Error(t('common.error.invalid_ip', 'Invalid IP Address'));
            }

            const cidr = parseInt(mask);
            if (isNaN(cidr) || cidr < 0 || cidr > 32) {
                throw new Error(t('common.error.invalid_subnet', 'Invalid Subnet Mask'));
            }

            const ipNum = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
            const maskNum = 0xffffffff << (32 - cidr);

            const networkNum = ipNum & maskNum;
            const broadcastNum = networkNum | (~maskNum);

            const numHosts = Math.pow(2, 32 - cidr) - 2;

            const toIp = (num: number) => {
                return [
                    (num >>> 24) & 255,
                    (num >>> 16) & 255,
                    (num >>> 8) & 255,
                    num & 255
                ].join('.');
            };

            setResult({
                networkAddress: toIp(networkNum),
                broadcastAddress: toIp(broadcastNum),
                firstHost: toIp(networkNum + 1),
                lastHost: toIp(broadcastNum - 1),
                numHosts: numHosts > 0 ? numHosts : 0,
                mask: toIp(maskNum),
                wildcard: toIp(~maskNum)
            });
        } catch (e) {
            setResult(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.ip-subnet.ip_address', 'IP Address')}
                        </label>
                        <input
                            type="text"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="192.168.1.1"
                            className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.ip-subnet.subnet_mask', 'CIDR')}
                        </label>
                        <div className="flex items-center">
                            <span className="mr-2 text-gray-500">/</span>
                            <input
                                type="number"
                                min="0"
                                max="32"
                                value={mask}
                                onChange={(e) => setMask(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <Button onClick={calculate} className="w-full md:w-auto">
                        <Calculator className="w-4 h-4 mr-2" />
                        {t('tool.ip-subnet.calculate', 'Calculate')}
                    </Button>
                </div>
            </Card>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Network className="w-5 h-5 text-blue-500" />
                            {t('tool.ip-subnet.network_details', 'Network Details')}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.network_address', 'Network Address')}</span>
                                <span className="font-mono font-medium">{result.networkAddress}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.broadcast_address', 'Broadcast Address')}</span>
                                <span className="font-mono font-medium">{result.broadcastAddress}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.subnet_mask', 'Subnet Mask')}</span>
                                <span className="font-mono font-medium">{result.mask}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.wildcard_mask', 'Wildcard Mask')}</span>
                                <span className="font-mono font-medium">{result.wildcard}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Network className="w-5 h-5 text-green-500" />
                            {t('tool.ip-subnet.host_range', 'Host Range')}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.first_usable', 'First Host')}</span>
                                <span className="font-mono font-medium">{result.firstHost}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.last_usable', 'Last Host')}</span>
                                <span className="font-mono font-medium">{result.lastHost}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-gray-500">{t('tool.ip-subnet.total_hosts', 'Total Hosts')}</span>
                                <span className="font-mono font-medium">{result.numHosts.toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default IpSubnet;
