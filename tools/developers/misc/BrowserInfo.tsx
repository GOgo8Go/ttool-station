import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  Monitor, Cpu, Globe, Wifi, Battery, Layers, Copy,
  Check, Info, Smartphone, Eye
} from 'lucide-react';

interface InfoGroup {
  title: string;
  icon: React.ElementType;
  items: { label: string; value: string | number | boolean | null }[];
}

const BrowserInfo: React.FC = () => {
  const { t } = useTranslation();
  const [battery, setBattery] = useState<any>(null);
  const [ipInfo, setIpInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Collect Synchronous Data
  const getSyncData = (): InfoGroup[] => {
    const nav = navigator as any;

    // Attempt to detect browser name more nicely
    let browserName = t('tool.browser-info.unknown');
    if (nav.userAgent.indexOf("Firefox") !== -1) browserName = "Mozilla Firefox";
    else if (nav.userAgent.indexOf("SamsungBrowser") !== -1) browserName = "Samsung Internet";
    else if (nav.userAgent.indexOf("Opera") !== -1 || nav.userAgent.indexOf("OPR") !== -1) browserName = "Opera";
    else if (nav.userAgent.indexOf("Trident") !== -1) browserName = "Microsoft Internet Explorer";
    else if (nav.userAgent.indexOf("Edge") !== -1) browserName = "Microsoft Edge";
    else if (nav.userAgent.indexOf("Chrome") !== -1) browserName = "Google Chrome";
    else if (nav.userAgent.indexOf("Safari") !== -1) browserName = "Apple Safari";

    return [
      {
        title: t('tool.browser-info.system_browser'),
        icon: Layers,
        items: [
          { label: t('tool.browser-info.browser'), value: browserName },
          { label: t('tool.browser-info.platform'), value: nav.platform }, // Deprecated but requested
          { label: t('tool.browser-info.user_agent'), value: nav.userAgent },
          { label: t('tool.browser-info.vendor'), value: nav.vendor },
          { label: t('tool.browser-info.product'), value: nav.product },
          { label: t('tool.browser-info.cookies_enabled'), value: nav.cookieEnabled ? t('tool.browser-info.yes') : t('tool.browser-info.no') },
          { label: t('tool.browser-info.do_not_track'), value: nav.doNotTrack || t('tool.browser-info.unspecified') },
        ]
      },
      {
        title: t('tool.browser-info.screen_display'),
        icon: Monitor,
        items: [
          { label: t('tool.browser-info.screen_resolution'), value: `${window.screen.width} x ${window.screen.height}` },
          { label: t('tool.browser-info.available_space'), value: `${window.screen.availWidth} x ${window.screen.availHeight}` },
          { label: t('tool.browser-info.window_inner_size'), value: `${window.innerWidth} x ${window.innerHeight}` },
          { label: t('tool.browser-info.device_pixel_ratio'), value: window.devicePixelRatio },
          { label: t('tool.browser-info.color_depth'), value: `${window.screen.colorDepth}-bit` },
          { label: t('tool.browser-info.pixel_depth'), value: `${window.screen.pixelDepth}-bit` },
          { label: t('tool.browser-info.orientation'), value: window.screen.orientation?.type || t('tool.browser-info.unknown') },
        ]
      },
      {
        title: t('tool.browser-info.hardware'),
        icon: Cpu,
        items: [
          { label: t('tool.browser-info.cpu_cores'), value: nav.hardwareConcurrency || t('tool.browser-info.unknown') },
          { label: t('tool.browser-info.device_memory'), value: nav.deviceMemory ? `~${nav.deviceMemory} GB` : `${t('tool.browser-info.unknown')}/Hidden` },
          { label: t('tool.browser-info.max_touch_points'), value: nav.maxTouchPoints },
          { label: t('tool.browser-info.pdf_viewer_enabled'), value: nav.pdfViewerEnabled ? t('tool.browser-info.yes') : t('tool.browser-info.no') },
        ]
      },
      {
        title: t('tool.browser-info.locale_time'),
        icon: Globe,
        items: [
          { label: t('tool.browser-info.language'), value: nav.language },
          { label: t('tool.browser-info.languages'), value: nav.languages?.join(", ") },
          { label: t('tool.browser-info.timezone'), value: Intl.DateTimeFormat().resolvedOptions().timeZone },
          { label: t('tool.browser-info.local_time'), value: new Date().toLocaleString() },
        ]
      },
      {
        title: t('tool.browser-info.network'),
        icon: Wifi,
        items: [
          { label: t('tool.browser-info.online_status'), value: nav.onLine ? t('tool.browser-info.online') : t('tool.browser-info.offline') },
          { label: t('tool.browser-info.downlink_speed'), value: nav.connection?.downlink ? `~${nav.connection.downlink} Mbps` : t('tool.browser-info.unknown') },
          { label: t('tool.browser-info.effective_type'), value: nav.connection?.effectiveType || t('tool.browser-info.unknown') },
          { label: t('tool.browser-info.rtt'), value: nav.connection?.rtt ? `${nav.connection.rtt} ms` : t('tool.browser-info.unknown') },
        ]
      }
    ];
  };

  useEffect(() => {
    // Battery API
    const nav = navigator as any;
    if (nav.getBattery) {
      nav.getBattery().then((batt: any) => {
        setBattery({
          level: Math.round(batt.level * 100) + '%',
          charging: batt.charging ? t('tool.browser-info.yes') : t('tool.browser-info.no'),
          chargingTime: batt.chargingTime === Infinity ? t('tool.browser-info.unknown') : batt.chargingTime + 's',
          dischargingTime: batt.dischargingTime === Infinity ? t('tool.browser-info.unknown') : batt.dischargingTime + 's'
        });

        // Listeners for updates
        batt.addEventListener('levelchange', () => setBattery((prev: any) => ({ ...prev, level: Math.round(batt.level * 100) + '%' })));
        batt.addEventListener('chargingchange', () => setBattery((prev: any) => ({ ...prev, charging: batt.charging ? t('tool.browser-info.yes') : t('tool.browser-info.no') })));
      });
    }
  }, []);

  const infoGroups = getSyncData();

  if (battery) {
    infoGroups.push({
      title: t('tool.browser-info.battery_status'),
      icon: Battery,
      items: [
        { label: t('tool.browser-info.level'), value: battery.level },
        { label: t('tool.browser-info.charging'), value: battery.charging },
        { label: t('tool.browser-info.time_to_charge'), value: battery.chargingTime },
        { label: t('tool.browser-info.time_to_discharge'), value: battery.dischargingTime },
      ]
    });
  }

  const handleCopy = () => {
    const report: Record<string, any> = {};
    infoGroups.forEach(group => {
      report[group.title] = {};
      group.items.forEach(item => {
        report[group.title][item.label] = item.value;
      });
    });

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg flex items-start gap-3 text-sm flex-1">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            {t('tool.browser-info.description')}
          </p>
        </div>
        <Button onClick={handleCopy} className="whitespace-nowrap">
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? t('tool.browser-info.copied_json') : t('tool.browser-info.copy_report')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {infoGroups.map((group) => (
          <Card key={group.title} className="overflow-hidden flex flex-col h-full" padding="none">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-primary-600 dark:text-primary-400">
                <group.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{group.title}</h3>
            </div>
            <div className="p-4 flex-1">
              <dl className="space-y-3">
                {group.items.map((item) => (
                  <div key={item.label} className="flex justify-between items-start text-sm group">
                    <dt className="text-gray-500 dark:text-gray-400 truncate pr-4">{item.label}</dt>
                    <dd className="font-mono font-medium text-gray-900 dark:text-gray-200 text-right break-all">
                      {item.value !== null && item.value !== undefined ? String(item.value) : '-'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BrowserInfo;
