import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Zap, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface OrientationData {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
}

interface MotionData {
    acceleration: { x: number | null; y: number | null; z: number | null } | null;
    accelerationIncludingGravity: { x: number | null; y: number | null; z: number | null } | null;
    rotationRate: { alpha: number | null; beta: number | null; gamma: number | null } | null;
}

export interface SensorStatus {
    deviceOrientation: boolean | null;
    deviceMotion: boolean | null;
    ambientLight: boolean | null;
    accelerometer: boolean | null;
    gyroscope: boolean | null;
    magnetometer: boolean | null;
    geolocation: boolean | null;
}

interface GenericSensorData {
    accelerometer?: { x: number | null; y: number | null; z: number | null };
    gyroscope?: { x: number | null; y: number | null; z: number | null };
    magnetometer?: { x: number | null; y: number | null; z: number | null };
}

interface GeolocationData {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}

const SensorTest: React.FC = () => {
    const { t } = useTranslation();
    const [orientation, setOrientation] = useState<OrientationData>({ alpha: null, beta: null, gamma: null });
    const [motion, setMotion] = useState<MotionData>({
        acceleration: null,
        accelerationIncludingGravity: null,
        rotationRate: null,
    });
    const [illuminance, setIlluminance] = useState<number | null>(null);
    const [genericSensorData, setGenericSensorData] = useState<GenericSensorData>({});
    const [geolocation, setGeolocation] = useState<GeolocationData>({
        latitude: null,
        longitude: null,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
    });
    const [listening, setListening] = useState<boolean>(false);
    const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
    const [sensorStatus, setSensorStatus] = useState<SensorStatus>({
        deviceOrientation: null,
        deviceMotion: null,
        ambientLight: null,
        accelerometer: null,
        gyroscope: null,
        magnetometer: null,
        geolocation: null
    });

    // 检测浏览器支持的传感器
    useEffect(() => {
        // 检测基础传感器支持
        setSensorStatus(prev => ({
            ...prev,
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            ambientLight: 'AmbientLightSensor' in window,
            accelerometer: 'Accelerometer' in window,
            gyroscope: 'Gyroscope' in window,
            magnetometer: 'Magnetometer' in window,
            geolocation: 'geolocation' in navigator
        }));
    }, []);

    const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
        setOrientation({ alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    }, []);

    const handleMotion = useCallback((e: DeviceMotionEvent) => {
        setMotion({
            acceleration: e.acceleration,
            accelerationIncludingGravity: e.accelerationIncludingGravity,
            rotationRate: e.rotationRate,
        });
    }, []);

    const startListening = async () => {
        if (typeof window !== 'undefined') {
            try {
                // 请求设备方向和运动权限（适用于较新的浏览器）
                if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission !== 'granted') {
                        setPermissionDenied(true);
                        return;
                    }
                }

                // 添加事件监听器
                if (sensorStatus.deviceOrientation) {
                    window.addEventListener('deviceorientation', handleOrientation);
                }

                if (sensorStatus.deviceMotion) {
                    window.addEventListener('devicemotion', handleMotion);
                }

                setListening(true);
                setPermissionDenied(false);
            } catch (error) {
                setPermissionDenied(true);
            }
        }
    };

    const stopListening = () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('devicemotion', handleMotion);
            setListening(false);
        }
    };

    // 清理事件监听器
    useEffect(() => {
        return () => {
            stopListening();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 将传感器分为支持和不支持两类
    const supportedSensors = Object.entries(sensorStatus).filter(([, supported]) => supported === true);
    const unsupportedSensors = Object.entries(sensorStatus).filter(([, supported]) => supported === false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <RotateCcw className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('tool.sensor-test.title')}</h3>
                </div>
            </div>

            {permissionDenied && (
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t('tool.sensor-test.permission_denied')}</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('tool.sensor-test.permission_hint')}</p>
                    </div>
                </div>
            )}

            {/* 传感器支持状态 */}
            <div>
                <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.supported_sensors')}</h4>

                {/* 支持的传感器 */}
                {supportedSensors.length > 0 && (
                    <div className="mb-2">
                        <div className="text-sm text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {t('tool.sensor-test.supported')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {supportedSensors.map(([sensor]) => (
                                <div key={sensor} className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                                    <span className="capitalize text-green-700 dark:text-green-300">
                                        {t(`tool.sensor-test.sensors.${sensor}`)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 不支持的传感器 */}
                {unsupportedSensors.length > 0 && (
                    <div>
                        <div className="text-sm text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {t('tool.sensor-test.not_supported')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {unsupportedSensors.map(([sensor]) => (
                                <div key={sensor} className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                                    <span className="capitalize text-red-700 dark:text-red-300">
                                        {t(`tool.sensor-test.sensors.${sensor}`)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 设备方向传感器 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.orientation')}</h4>
                    {orientation.alpha !== null || orientation.beta !== null || orientation.gamma !== null ? (
                        <>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.alpha')}: {orientation.alpha?.toFixed(1) ?? '—'}°</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.beta')}: {orientation.beta?.toFixed(1) ?? '—'}°</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.gamma')}: {orientation.gamma?.toFixed(1) ?? '—'}°</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('tool.sensor-test.no_sensor_data')}
                        </p>
                    )}
                </div>

                {/* 设备运动传感器 - 加速度 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.acceleration')}</h4>
                    {motion.acceleration ? (
                        <>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.x')}: {motion.acceleration.x?.toFixed(2) ?? '—'} m/s²</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.y')}: {motion.acceleration.y?.toFixed(2) ?? '—'} m/s²</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.z')}: {motion.acceleration.z?.toFixed(2) ?? '—'} m/s²</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('tool.sensor-test.no_sensor_data')}
                        </p>
                    )}
                </div>

                {/* 重力加速度 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.acceleration_with_gravity')}</h4>
                    {motion.accelerationIncludingGravity ? (
                        <>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.x')}: {motion.accelerationIncludingGravity.x?.toFixed(2) ?? '—'} m/s²</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.y')}: {motion.accelerationIncludingGravity.y?.toFixed(2) ?? '—'} m/s²</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.z')}: {motion.accelerationIncludingGravity.z?.toFixed(2) ?? '—'} m/s²</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('tool.sensor-test.no_sensor_data')}
                        </p>
                    )}
                </div>

                {/* 旋转速率 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                    <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.rotation_rate')}</h4>
                    {motion.rotationRate ? (
                        <>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.alpha')}: {motion.rotationRate.alpha?.toFixed(2) ?? '—'} °/s</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.beta')}: {motion.rotationRate.beta?.toFixed(2) ?? '—'} °/s</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.gamma')}: {motion.rotationRate.gamma?.toFixed(2) ?? '—'} °/s</p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {t('tool.sensor-test.no_sensor_data')}
                        </p>
                    )}
                </div>

                {/* 环境光传感器数据显示 */}
                {sensorStatus.ambientLight && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.ambient_light')}</h4>
                        {illuminance !== null ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {t('tool.sensor-test.illuminance')}: {illuminance.toFixed(1)} lux
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('tool.sensor-test.no_sensor_data')}
                            </p>
                        )}
                    </div>
                )}

                {/* 地理位置传感器数据显示 */}
                {sensorStatus.geolocation && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded">
                        <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">{t('tool.sensor-test.geolocation')}</h4>
                        {geolocation.latitude !== null ? (
                            <>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.latitude')}: {geolocation.latitude.toFixed(6)}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.longitude')}: {geolocation.longitude.toFixed(6)}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">{t('tool.sensor-test.accuracy')}: {geolocation.accuracy?.toFixed(0) ?? '—'} m</p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('tool.sensor-test.no_sensor_data')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                {!listening ? (
                    <button
                        onClick={startListening}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center justify-center gap-2"
                        disabled={!sensorStatus.deviceOrientation && !sensorStatus.deviceMotion}
                    >
                        <Zap className="w-4 h-4" />
                        {t('tool.sensor-test.start')}
                    </button>
                ) : (
                    <button
                        onClick={stopListening}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('tool.sensor-test.stop')}
                    </button>
                )}

                {listening && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {t('tool.sensor-test.listening')}
                    </div>
                )}
            </div>

            {!listening && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>{t('tool.sensor-test.hint')}</p>
                </div>
            )}
        </div>
    );
};

export default SensorTest;