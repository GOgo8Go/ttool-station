import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Volume2, Volume1, VolumeX, Play, Pause, Headphones } from 'lucide-react';

const SpeakerTest: React.FC = () => {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeChannel, setActiveChannel] = useState<'left' | 'right' | 'both' | null>(null);
    const [frequency, setFrequency] = useState(440);
    const [volume, setVolume] = useState(0.5);
    const [waveform, setWaveform] = useState<OscillatorType>('sine');

    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const pannerNodeRef = useRef<StereoPannerNode | null>(null);

    // Initialize AudioContext
    useEffect(() => {
        return () => {
            stopSound();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    const playSound = (channel: 'left' | 'right' | 'both') => {
        initAudioContext();
        stopSound(); // Stop any existing sound

        if (!audioContextRef.current) return;

        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();

        osc.type = waveform;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);

        // Set panning
        if (channel === 'left') {
            panner.pan.setValueAtTime(-1, ctx.currentTime);
        } else if (channel === 'right') {
            panner.pan.setValueAtTime(1, ctx.currentTime);
        } else {
            panner.pan.setValueAtTime(0, ctx.currentTime);
        }

        osc.connect(panner);
        panner.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        oscillatorRef.current = osc;
        gainNodeRef.current = gain;
        pannerNodeRef.current = panner;

        setIsPlaying(true);
        setActiveChannel(channel);
    };

    const stopSound = () => {
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
                oscillatorRef.current.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
            oscillatorRef.current = null;
        }
        setIsPlaying(false);
        setActiveChannel(null);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.setValueAtTime(newVolume, audioContextRef.current.currentTime);
        }
    };

    const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFreq = parseInt(e.target.value);
        setFrequency(newFreq);
        if (oscillatorRef.current && audioContextRef.current) {
            oscillatorRef.current.frequency.setValueAtTime(newFreq, audioContextRef.current.currentTime);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Controls */}
                <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center space-y-8">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                            <Headphones className="w-6 h-6 text-blue-500" />
                            {t('tool.speaker-test.stereo_test')}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {t('tool.speaker-test.stereo_desc')}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-8 w-full">
                        {/* Left Channel */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => activeChannel === 'left' ? stopSound() : playSound('left')}
                                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${activeChannel === 'left'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400 scale-110 shadow-lg shadow-blue-500/20'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                <Volume2 className={`w-10 h-10 ${activeChannel === 'left' ? 'animate-pulse' : ''}`} />
                            </button>
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{t('tool.speaker-test.left')}</span>
                        </div>

                        {/* Center / Both */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => activeChannel === 'both' ? stopSound() : playSound('both')}
                                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${activeChannel === 'both'
                                        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-600 dark:text-purple-400 scale-110 shadow-lg shadow-purple-500/20'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-purple-300 dark:hover:border-purple-700'
                                    }`}
                            >
                                {activeChannel === 'both' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </button>
                            <span className="font-medium text-xs text-gray-500 dark:text-gray-400">{t('tool.speaker-test.both')}</span>
                        </div>

                        {/* Right Channel */}
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => activeChannel === 'right' ? stopSound() : playSound('right')}
                                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${activeChannel === 'right'
                                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400 scale-110 shadow-lg shadow-blue-500/20'
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                <Volume2 className={`w-10 h-10 ${activeChannel === 'right' ? 'animate-pulse' : ''}`} />
                            </button>
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">{t('tool.speaker-test.right')}</span>
                        </div>
                    </div>
                </Card>

                {/* Settings */}
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Volume1 className="w-5 h-5 text-gray-500" />
                        {t('tool.speaker-test.settings')}
                    </h3>

                    <div className="space-y-4">
                        {/* Frequency Control */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('tool.speaker-test.frequency')}</label>
                                <span className="text-sm text-gray-500 font-mono">{frequency} Hz</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="2000"
                                step="10"
                                value={frequency}
                                onChange={handleFrequencyChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>20 Hz</span>
                                <span>1000 Hz</span>
                                <span>2000 Hz</span>
                            </div>
                        </div>

                        {/* Volume Control */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('tool.speaker-test.volume')}</label>
                                <span className="text-sm text-gray-500 font-mono">{Math.round(volume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                            />
                        </div>

                        {/* Waveform Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('tool.speaker-test.waveform')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {['sine', 'square', 'sawtooth', 'triangle'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setWaveform(type as OscillatorType);
                                            if (oscillatorRef.current) {
                                                oscillatorRef.current.type = type as OscillatorType;
                                            }
                                        }}
                                        className={`px-3 py-2 text-xs font-medium rounded-md capitalize transition-colors ${waveform === type
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                                : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {t(`tool.speaker-test.wave_${type}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SpeakerTest;
