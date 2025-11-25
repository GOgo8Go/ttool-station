import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Camera, RefreshCw, Image as ImageIcon, Video, VideoOff, Settings, Download } from 'lucide-react';

const CameraTest: React.FC = () => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [isMirrored, setIsMirrored] = useState(true);
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);

    // Get available video devices
    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error('Error enumerating devices:', err);
        }
    }, [selectedDeviceId]);

    useEffect(() => {
        getDevices();
        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getDevices);
        };
    }, [getDevices]);

    // Start camera stream
    const startCamera = async () => {
        stopCamera();
        setError(null);
        try {
            const constraints = {
                video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }

            // Get actual resolution
            const track = newStream.getVideoTracks()[0];
            const settings = track.getSettings();
            if (settings.width && settings.height) {
                setResolution({ width: settings.width, height: settings.height });
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            setError(err.message || t('tool.camera-test.access_error'));
        }
    };

    // Stop camera stream
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setResolution(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // Take snapshot
    const takeSnapshot = () => {
        if (videoRef.current && stream) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (isMirrored) {
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                setSnapshot(dataUrl);
            }
        }
    };

    const downloadSnapshot = () => {
        if (snapshot) {
            const link = document.createElement('a');
            link.href = snapshot;
            link.download = `camera-snapshot-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Main Camera Area */}
                <div className="flex-1 w-full space-y-4">
                    <Card className="p-1 overflow-hidden bg-black rounded-2xl relative aspect-video flex items-center justify-center">
                        {!stream && !error && (
                            <div className="text-center text-gray-500">
                                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>{t('tool.camera-test.click_start')}</p>
                            </div>
                        )}
                        {error && (
                            <div className="text-center text-red-500 p-4">
                                <VideoOff className="w-12 h-12 mx-auto mb-2" />
                                <p>{error}</p>
                                <p className="text-sm mt-2 text-gray-400">{t('tool.camera-test.permission_hint')}</p>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className={`w-full h-full object-contain ${isMirrored ? 'scale-x-[-1]' : ''} ${!stream ? 'hidden' : ''}`}
                        />

                        {/* Resolution Badge */}
                        {resolution && (
                            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md border border-white/10">
                                {resolution.width} x {resolution.height}
                            </div>
                        )}
                    </Card>

                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                            <Settings className="w-5 h-5 text-gray-500" />
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                                disabled={!!stream}
                            >
                                {devices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                    </option>
                                ))}
                                {devices.length === 0 && <option>{t('tool.camera-test.no_devices')}</option>}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            {!stream ? (
                                <Button onClick={startCamera} className="gap-2">
                                    <Video className="w-4 h-4" />
                                    {t('tool.camera-test.start')}
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={takeSnapshot} variant="secondary" className="gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        {t('tool.camera-test.snapshot')}
                                    </Button>
                                    <Button onClick={stopCamera} variant="danger" className="gap-2">
                                        <VideoOff className="w-4 h-4" />
                                        {t('tool.camera-test.stop')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {stream && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="mirror-toggle"
                                checked={isMirrored}
                                onChange={(e) => setIsMirrored(e.target.checked)}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="mirror-toggle" className="text-sm font-medium text-gray-900 dark:text-gray-300 select-none cursor-pointer">
                                {t('tool.camera-test.mirror_mode')}
                            </label>
                        </div>
                    )}
                </div>

                {/* Snapshot Preview */}
                {snapshot && (
                    <div className="w-full md:w-80 space-y-4 animate-in slide-in-from-right duration-300">
                        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-primary-500" />
                                {t('tool.camera-test.last_snapshot')}
                            </h3>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-gray-700">
                                <img src={snapshot} alt="Snapshot" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={downloadSnapshot} size="sm" className="w-full gap-2">
                                    <Download className="w-4 h-4" />
                                    {t('tool.camera-test.download')}
                                </Button>
                                <Button onClick={() => setSnapshot(null)} size="sm" variant="ghost" className="w-full">
                                    {t('tool.camera-test.discard')}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraTest;
