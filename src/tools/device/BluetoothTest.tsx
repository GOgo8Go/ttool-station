import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bluetooth, BluetoothConnected, BluetoothSearching, RefreshCw, Signal, Info, Copy, CheckCircle, XCircle, Download, Bell, BellOff } from 'lucide-react';
import { enhanceServiceInfo, initializeBluetoothUuidMaps, getAllServiceMappings, getAllCharacteristicMappings, isUuidMapsLoaded } from './bluetooth-utils';

// Type definitions for Web Bluetooth API
interface BluetoothRemoteGATTServer {
    connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
    uuid: string;
    name?: string;
    getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
    uuid: string;
    name?: string;
    properties: {
        read: boolean;
        write: boolean;
        notify: boolean;
        indicate: boolean;
        broadcast: boolean;
        authenticatedSignedWrites: boolean;
        reliableWrite: boolean;
        writableAuxiliaries: boolean;
    };
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothDevice {
    id: string;
    name: string;
    deviceClass?: number;
    uuids?: string[];
    gatt?: BluetoothRemoteGATTServer;
    services?: BluetoothRemoteGATTService[];
}

interface ServiceInfo {
    uuid: string;
    name: string;
    characteristics?: CharacteristicInfo[];
}

interface CharacteristicInfo {
    uuid: string;
    name: string;
    properties: {
        read: boolean;
        write: boolean;
        notify: boolean;
        indicate: boolean;
    };
    value?: string;
    dataView?: DataView;
    isNotifying?: boolean;
}

// Extend Navigator interface to include bluetooth
declare global {
    interface Navigator {
        bluetooth: {
            requestDevice(options: {
                filters?: Array<{
                    name?: string;
                    namePrefix?: string;
                    services?: string[];
                    manufacturerData?: Array<{ companyIdentifier: number }>;
                }>;
                acceptAllDevices?: boolean;
                optionalServices?: string[];
            }): Promise<any>;
            getDevices(): Promise<any[]>;
        };
    }
}

const BluetoothTest: React.FC = () => {
    const { t } = useTranslation();

    // Get translated name with original English name in parentheses
    const getTranslatedName = (category: 'service' | 'characteristic', name: string) => {
        // Convert name to key format (lowercase, spaces to underscores)
        // Note: This matches the key generation in i18next-prepare.ts
        const key = name.toLowerCase().replace(/\s+/g, '_');
        
        // Try to get translation using the org.bluetooth key format
        const translation = t(`org.bluetooth.${category}.${key}`);
        
        // If translation exists and is different from the key, use it with original name
        if (translation && translation !== key) {
            return `${translation}(${name})`;
        }
        
        // Otherwise, just use the original name
        return name;
    };

    // Get original name with translation in parentheses for debug panel
    const getDebugName = (category: 'service' | 'characteristic', name: string) => {
        // Convert name to key format (lowercase, spaces to underscores)
        // Note: This matches the key generation in i18next-prepare.ts
        const key = name.toLowerCase().replace(/\s+/g, '_');
        
        // Try to get translation using the org.bluetooth key format
        const translation = t(`org.bluetooth.${category}.${key}`);
        
        // If translation exists and is different from the key, use it with original name
        if (translation && translation !== key) {
            return `${name} (${translation})`;
        }
        
        // Otherwise, just use the original name
        return name;
    };
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<BluetoothDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [services, setServices] = useState<ServiceInfo[]>([]);
    const [uuidMapsLoaded, setUuidMapsLoaded] = useState(false);
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    // Check Bluetooth support
    useEffect(() => {
        if ('bluetooth' in navigator) {
            setIsSupported(true);
            addLog('Bluetooth API is supported');
            // Initialize Bluetooth UUID maps
            initializeBluetoothUuidMaps()
                .then(() => {
                    setUuidMapsLoaded(true);
                    addLog('Bluetooth UUID maps loaded successfully');
                })
                .catch((error) => {
                    addLog(`Failed to load Bluetooth UUID maps: ${error}`);
                });
        } else {
            setIsSupported(false);
            addLog('Bluetooth API is not supported in this browser');
        }
    }, []);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 49)]);
    }, []);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            addLog(`Copied to clipboard: ${text.substring(0, 50)}...`);
        } catch (err) {
            addLog(`Copy failed: ${err}`);
        }
    };

    // Scan for Bluetooth devices
    const scanDevices = async () => {
        if (!isSupported) {
            setError(t('tool.bluetooth-test.not_supported'));
            return;
        }

        setIsScanning(true);
        setError(null);
        addLog('Starting Bluetooth scan...');

        try {
            // Request device with optional filters
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    'battery_service',
                    'heart_rate',
                    'cycling_speed_and_cadence',
                    'device_information',
                    'generic_access',
                    'generic_attribute',
                    'alert_notification',
                    'blood_pressure',
                    'current_time',
                    'cycling_power',
                    'environmental_sensing',
                    'glucose',
                    'health_thermometer',
                    'human_interface_device',
                    'immediate_alert',
                    'link_loss',
                    'location_and_navigation',
                    'phone_alert_status',
                    'pulse_oximeter',
                    'running_speed_and_cadence',
                    'scan_parameters',
                    'tx_power',
                    'weight_scale'
                ]
            });

            const newDevice: BluetoothDevice = {
                id: device.id,
                name: device.name || 'Unknown Device',
                deviceClass: device.deviceClass,
                uuids: device.uuids,
                gatt: device.gatt
            };

            setDevices(prev => {
                const exists = prev.find(d => d.id === newDevice.id);
                if (exists) return prev;
                return [...prev, newDevice];
            });

            addLog(`Found device: ${newDevice.name} (${newDevice.id})`);
            
            // Auto-select the found device
            setSelectedDevice(newDevice);
            
        } catch (err: any) {
            if (err.name === 'NotFoundError') {
                addLog('No device selected');
            } else if (err.name === 'NotAllowedError') {
                setError(t('tool.bluetooth-test.permission_denied'));
                addLog('Permission denied');
            } else {
                setError(err.message);
                addLog(`Error: ${err.message}`);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // Connect to device
    const connectDevice = async (device: BluetoothDevice) => {
        if (!device.gatt) {
            setError(t('tool.bluetooth-test.no_gatt'));
            return;
        }

        setConnectionStatus('connecting');
        setError(null);
        addLog(`Connecting to ${device.name}...`);

        try {
            await device.gatt.connect();
            setConnectionStatus('connected');
            addLog(`Connected to ${device.name}`);

            // Discover services
            await discoverServices(device);

        } catch (err: any) {
            setConnectionStatus('disconnected');
            setError(err.message);
            addLog(`Connection failed: ${err.message}`);
        }
    };

    // Discover services and characteristics
    const discoverServices = async (device: BluetoothDevice) => {
        if (!device.gatt || !device.gatt.connected) return;

        try {
            const services = await device.gatt.getPrimaryServices();
            const serviceInfos: ServiceInfo[] = [];

            for (const service of services) {
                const characteristics = await service.getCharacteristics();
                const charInfos: CharacteristicInfo[] = [];

                for (const char of characteristics) {
                    charInfos.push({
                        uuid: char.uuid,
                        name: char.name || 'Unknown Characteristic',
                        properties: {
                            read: char.properties.read,
                            write: char.properties.write,
                            notify: char.properties.notify,
                            indicate: char.properties.indicate
                        },
                        isNotifying: false
                    });
                }

                // Enhance service and characteristic names with Bluetooth assigned numbers
                // Only enhance if UUID maps are loaded, otherwise use original names
                let enhancedService;
                if (uuidMapsLoaded) {
                    enhancedService = enhanceServiceInfo({
                        uuid: service.uuid,
                        name: service.name || 'Unknown Service',
                        characteristics: charInfos
                    });
                } else {
                    enhancedService = {
                        uuid: service.uuid,
                        name: service.name || 'Unknown Service',
                        characteristics: charInfos
                    };
                }
                
                serviceInfos.push(enhancedService);
            }

            setServices(serviceInfos);
            addLog(`Discovered ${serviceInfos.length} services`);

        } catch (err: any) {
            addLog(`Service discovery failed: ${err.message}`);
        }
    };

    // Format DataView to readable string
    const formatDataView = (dataView: DataView): string => {
        // Try to decode as UTF-8 text first
        try {
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const text = decoder.decode(dataView.buffer);
            // Check if it's mostly printable characters
            if (text.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126).length > text.length * 0.7) {
                return text.trim();
            }
        } catch (e) {
            // Ignore decoding errors
        }

        // If not readable text, show as hex bytes
        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        return Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join(' ');
    };

    // Read characteristic value
    const readCharacteristic = async (serviceUuid: string, charUuid: string) => {
        const device = selectedDevice;
        if (!device?.gatt?.connected) return;

        try {
            const service = await device.gatt.getPrimaryService(serviceUuid);
            const characteristic = await service.getCharacteristic(charUuid);
            
            const dataView = await characteristic.readValue();
            const formattedValue = formatDataView(dataView);
            
            addLog(`Read ${charUuid}: ${formattedValue}`);

            // Update services state with the value and raw data
            setServices(prev => prev.map(s => {
                if (s.uuid === serviceUuid) {
                    return {
                        ...s,
                        characteristics: s.characteristics?.map(c =>
                            c.uuid === charUuid ? { ...c, value: formattedValue, dataView } : c
                        )
                    };
                }
                return s;
            }));

        } catch (err: any) {
            addLog(`Read failed: ${err.message}`);
        }
    };

    // Handle characteristic notifications
    const handleCharacteristicNotification = (serviceUuid: string, charUuid: string, event: any) => {
        const dataView = event.target.value;
        const formattedValue = formatDataView(dataView);
        
        addLog(`Notification from ${charUuid}: ${formattedValue}`);

        // Update services state with the new value
        setServices(prev => prev.map(s => {
            if (s.uuid === serviceUuid) {
                return {
                    ...s,
                    characteristics: s.characteristics?.map(c =>
                        c.uuid === charUuid ? { ...c, value: formattedValue, dataView } : c
                    )
                };
            }
            return s;
        }));
    };

    // Start characteristic notifications
    const startNotifications = async (serviceUuid: string, charUuid: string) => {
        const device = selectedDevice;
        if (!device?.gatt?.connected) return;

        try {
            const service = await device.gatt.getPrimaryService(serviceUuid);
            const characteristic = await service.getCharacteristic(charUuid);
            
            // Add event listener for notifications
            characteristic.addEventListener('characteristicvaluechanged',
                (event: any) => handleCharacteristicNotification(serviceUuid, charUuid, event)
            );
            
            await characteristic.startNotifications();
            
            // Update state to show it's notifying
            setServices(prev => prev.map(s => {
                if (s.uuid === serviceUuid) {
                    return {
                        ...s,
                        characteristics: s.characteristics?.map(c =>
                            c.uuid === charUuid ? { ...c, isNotifying: true } : c
                        )
                    };
                }
                return s;
            }));
            
            addLog(`Started notifications for ${charUuid}`);

        } catch (err: any) {
            addLog(`Start notifications failed: ${err.message}`);
        }
    };

    // Stop characteristic notifications
    const stopNotifications = async (serviceUuid: string, charUuid: string) => {
        const device = selectedDevice;
        if (!device?.gatt?.connected) return;

        try {
            const service = await device.gatt.getPrimaryService(serviceUuid);
            const characteristic = await service.getCharacteristic(charUuid);
            
            await characteristic.stopNotifications();
            characteristic.removeEventListener('characteristicvaluechanged',
                (event: any) => handleCharacteristicNotification(serviceUuid, charUuid, event)
            );
            
            // Update state to show it's not notifying
            setServices(prev => prev.map(s => {
                if (s.uuid === serviceUuid) {
                    return {
                        ...s,
                        characteristics: s.characteristics?.map(c =>
                            c.uuid === charUuid ? { ...c, isNotifying: false } : c
                        )
                    };
                }
                return s;
            }));
            
            addLog(`Stopped notifications for ${charUuid}`);

        } catch (err: any) {
            addLog(`Stop notifications failed: ${err.message}`);
        }
    };

    // Disconnect
    const disconnectDevice = () => {
        if (selectedDevice?.gatt) {
            selectedDevice.gatt.disconnect();
            setConnectionStatus('disconnected');
            setServices([]);
            addLog('Disconnected');
        }
    };

    // Reset
    const reset = () => {
        if (selectedDevice?.gatt) {
            selectedDevice.gatt.disconnect();
        }
        setDevices([]);
        setSelectedDevice(null);
        setConnectionStatus('disconnected');
        setServices([]);
        setError(null);
        setLogs([]);
        addLog('Reset completed');
    };

    if (isSupported === null) {
        return (
            <div className="space-y-6">
                <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center">
                    <div className="animate-pulse">
                        <Bluetooth className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (isSupported === false) {
        return (
            <div className="space-y-6">
                <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-center">
                    <Bluetooth className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('tool.bluetooth-test.not_supported_title')}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('tool.bluetooth-test.not_supported_desc')}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <Bluetooth className={`w-6 h-6 mb-1 ${connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-400'}`} />
                    <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                        {t('tool.bluetooth-test.status')}
                    </div>
                    <div className="text-sm font-semibold">
                        {t(`tool.bluetooth-test.status_${connectionStatus}`)}
                    </div>
                </Card>

                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <BluetoothSearching className={`w-6 h-6 mb-1 ${isScanning ? 'text-blue-500 animate-spin' : 'text-gray-400'}`} />
                    <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                        {t('tool.bluetooth-test.scanning')}
                    </div>
                    <div className="text-sm font-semibold">
                        {isScanning ? t('tool.bluetooth-test.yes') : t('tool.bluetooth-test.no')}
                    </div>
                </Card>

                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <BluetoothConnected className="w-6 h-6 mb-1 text-purple-500" />
                    <div className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 mb-1">
                        {t('tool.bluetooth-test.devices')}
                    </div>
                    <div className="text-sm font-semibold">
                        {devices.length}
                    </div>
                </Card>

                <Card 
                    className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={reset}
                >
                    <RefreshCw className="w-6 h-6 text-gray-400 mb-1" />
                    <div className="text-xs font-medium text-gray-500">
                        {t('tool.bluetooth-test.reset')}
                    </div>
                </Card>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="w-5 h-5" />
                        <span className="font-medium">{error}</span>
                    </div>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={scanDevices}
                    disabled={isScanning || connectionStatus === 'connected'}
                    className="gap-2"
                >
                    <BluetoothSearching className="w-4 h-4" />
                    {isScanning ? t('tool.bluetooth-test.scanning') : t('tool.bluetooth-test.scan')}
                </Button>
            </div>

            {/* Devices List */}
            {devices.length > 0 && (
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Bluetooth className="w-5 h-5 text-blue-500" />
                        {t('tool.bluetooth-test.discovered_devices')}
                    </h3>
                    <div className="space-y-2">
                        {devices.map(device => {
                            const isSelected = selectedDevice?.id === device.id;
                            const isConnected = isSelected && connectionStatus === 'connected';
                            const isConnecting = isSelected && connectionStatus === 'connecting';
                            
                            return (
                                <div
                                    key={device.id}
                                    className={`p-3 rounded-lg border transition-all ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => setSelectedDevice(device)}
                                        >
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {device.name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                {device.id}
                                            </div>
                                            {device.deviceClass && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Class: {device.deviceClass.toString(16)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {isConnected ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={disconnectDevice}
                                                    className="gap-1"
                                                >
                                                    <Bluetooth className="w-3 h-3" />
                                                    {t('tool.bluetooth-test.disconnect')}
                                                </Button>
                                            ) : isConnecting ? (
                                                <Button
                                                    size="sm"
                                                    disabled
                                                    className="gap-1"
                                                >
                                                    <BluetoothSearching className="w-3 h-3 animate-spin" />
                                                    {t('tool.bluetooth-test.connecting')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => connectDevice(device)}
                                                    className="gap-1"
                                                    disabled={!device.gatt}
                                                >
                                                    <BluetoothConnected className="w-3 h-3" />
                                                    {t('tool.bluetooth-test.connect')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Services and Characteristics */}
            {services.length > 0 && (
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5 text-purple-500" />
                        {t('tool.bluetooth-test.services')}
                    </h3>
                    <div className="space-y-4">
                        {services.map(service => (
                            <div key={service.uuid} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 dark:bg-gray-900 p-3">
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {getTranslatedName('service', service.name)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                                        {service.uuid}
                                    </div>
                                </div>
                                {service.characteristics && service.characteristics.length > 0 && (
                                    <div className="p-3 space-y-2">
                                        {service.characteristics.map(char => (
                                            <div key={char.uuid} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {getTranslatedName('characteristic', char.name)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                        {char.uuid}
                                                    </div>
                                                    <div className="flex gap-2 mt-1 text-xs">
                                                        {char.properties.read && (
                                                            <span className="text-green-600 dark:text-green-400">R</span>
                                                        )}
                                                        {char.properties.write && (
                                                            <span className="text-blue-600 dark:text-blue-400">W</span>
                                                        )}
                                                        {char.properties.notify && (
                                                            <span className="text-purple-600 dark:text-purple-400">N</span>
                                                        )}
                                                        {char.properties.indicate && (
                                                            <span className="text-orange-600 dark:text-orange-400">I</span>
                                                        )}
                                                    </div>
                                                    {char.value && (
                                                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-100 dark:bg-gray-900 p-1 rounded">
                                                            {char.value}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    {char.properties.read && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => readCharacteristic(service.uuid, char.uuid)}
                                                            className="p-1"
                                                            title="Read value"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    {char.properties.notify && (
                                                        <Button
                                                            size="sm"
                                                            variant={char.isNotifying ? "success" : "ghost"}
                                                            onClick={() => {
                                                                if (char.isNotifying) {
                                                                    stopNotifications(service.uuid, char.uuid);
                                                                } else {
                                                                    startNotifications(service.uuid, char.uuid);
                                                                }
                                                            }}
                                                            className="p-1"
                                                            title={char.isNotifying ? "Stop notifications" : "Start notifications"}
                                                        >
                                                            {char.isNotifying ? (
                                                                <BellOff className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <Bell className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Logs */}
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-gray-500" />
                    {t('tool.bluetooth-test.logs')}
                </h3>
                <div className="bg-gray-900 dark:bg-black rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs">
                    {logs.length === 0 ? (
                        <div className="text-gray-500">
                            {t('tool.bluetooth-test.no_logs')}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log, idx) => (
                                <div key={idx} className="text-gray-300">
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Info Box */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">{t('tool.bluetooth-test.info_title')}</p>
                        <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                            <li>{t('tool.bluetooth-test.info_1')}</li>
                            <li>{t('tool.bluetooth-test.info_2')}</li>
                            <li>{t('tool.bluetooth-test.info_3')}</li>
                            <li>{t('tool.bluetooth-test.info_4')}</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Debug Panel - UUID Mappings */}
            <Card className="p-6 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" />
                        {t("tool.bluetooth-test.uuid_mappings")}
                    </h3>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        {showDebugPanel ? 'Hide' : 'Show'}
                    </Button>
                </div>
                
                {showDebugPanel && (
                    <div className="mt-4 space-y-6">
                        {/* Services Mapping */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('tool.bluetooth-test.serviceName')} ({getAllServiceMappings().length})</h4>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                                {getAllServiceMappings().length === 0 ? (
                                    <div className="text-gray-500 text-sm">No service mappings loaded</div>
                                ) : (
                                    <table className="w-full text-xs">
                                        <thead className="border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="text-left py-1 px-2">UUID</th>
                                                <th className="text-left py-1 px-2">Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getAllServiceMappings().map((service, index) => (
                                                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                    <td className="py-1 px-2 font-mono text-gray-600 dark:text-gray-300">{service.uuid}</td>
                                                    <td className="py-1 px-2 text-gray-900 dark:text-white">{getDebugName('service', service.name)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                        
                        {/* Characteristics Mapping */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('tool.bluetooth-test.characteristicName')} ({getAllCharacteristicMappings().length})</h4>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                                {getAllCharacteristicMappings().length === 0 ? (
                                    <div className="text-gray-500 text-sm">No characteristic mappings loaded</div>
                                ) : (
                                    <table className="w-full text-xs">
                                        <thead className="border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="text-left py-1 px-2">UUID</th>
                                                <th className="text-left py-1 px-2">Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getAllCharacteristicMappings().map((char, index) => (
                                                <tr key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                                                    <td className="py-1 px-2 font-mono text-gray-600 dark:text-gray-300">{char.uuid}</td>
                                                    <td className="py-1 px-2 text-gray-900 dark:text-white">{getDebugName('characteristic', char.name)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BluetoothTest;