import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Mic, MicOff, Play, Square, Volume2, Settings, RefreshCw } from 'lucide-react';

const MicrophoneTest: React.FC = () => {
    const { t } = useTranslation();
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [volume, setVolume] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number>();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Get available audio devices
    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioDevices = devices.filter(device => device.kind === 'audioinput');
            setDevices(audioDevices);
            if (audioDevices.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(audioDevices[0].deviceId);
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

    // Visualize audio
    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            // Calculate volume for the meter
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setVolume(average);

            // Draw visualizer
            ctx.fillStyle = 'rgb(20, 20, 20)'; // Dark background
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                // Gradient color
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#4f46e5'); // Indigo 600
                gradient.addColorStop(1, '#818cf8'); // Indigo 400

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    };

    // Start microphone
    const startMicrophone = async () => {
        stopMicrophone();
        setError(null);
        setAudioUrl(null);

        try {
            const constraints = {
                audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);

            // Setup Audio Context for visualization
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(newStream);

            source.connect(analyser);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;

            drawVisualizer();

            // Setup MediaRecorder
            const mediaRecorder = new MediaRecorder(newStream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
            };

        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            setError(err.message || t('tool.mic-test.access_error'));
        }
    };

    // Stop microphone
    const stopMicrophone = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setVolume(0);
        setIsRecording(false);
    };

    useEffect(() => {
        return () => {
            stopMicrophone();
        };
    }, []);

    const toggleRecording = () => {
        if (!mediaRecorderRef.current) return;

        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            chunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visualizer Card */}
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Volume2 className={`w-5 h-5 ${stream ? 'text-green-500' : 'text-gray-400'}`} />
                            {t('tool.mic-test.visualizer')}
                        </h3>
                        {stream && (
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                {t('tool.mic-test.volume')}: {Math.round(volume)}%
                            </span>
                        )}
                    </div>

                    <div className="bg-black rounded-xl overflow-hidden h-48 relative mb-4 border border-gray-200 dark:border-gray-700">
                        {!stream && !error && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                <p>{t('tool.mic-test.click_start')}</p>
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                                <MicOff className="w-8 h-8 mb-2" />
                                <p>{error}</p>
                            </div>
                        )}
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={200}
                            className="w-full h-full"
                        />
                    </div>

                    {/* Controls */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                                disabled={!!stream}
                            >
                                {devices.map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                    </option>
                                ))}
                                {devices.length === 0 && <option>{t('tool.mic-test.no_devices')}</option>}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            {!stream ? (
                                <Button onClick={startMicrophone} className="w-full gap-2">
                                    <Mic className="w-4 h-4" />
                                    {t('tool.mic-test.start')}
                                </Button>
                            ) : (
                                <Button onClick={stopMicrophone} variant="danger" className="w-full gap-2">
                                    <MicOff className="w-4 h-4" />
                                    {t('tool.mic-test.stop')}
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Recording & Playback Card */}
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-blue-500" />
                        {t('tool.mic-test.record_playback')}
                    </h3>

                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <Mic className={`w-10 h-10 ${isRecording ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>

                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {isRecording ? t('tool.mic-test.recording') : audioUrl ? t('tool.mic-test.recorded') : t('tool.mic-test.ready_record')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('tool.mic-test.record_hint')}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full max-w-xs">
                            <Button
                                onClick={toggleRecording}
                                disabled={!stream}
                                variant={isRecording ? "danger" : "secondary"}
                                className="flex-1 gap-2"
                            >
                                {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                                {isRecording ? t('tool.mic-test.stop_record') : t('tool.mic-test.start_record')}
                            </Button>
                        </div>

                        {audioUrl && (
                            <div className="w-full max-w-xs pt-4 border-t border-gray-100 dark:border-gray-700">
                                <audio src={audioUrl} controls className="w-full" />
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MicrophoneTest;
