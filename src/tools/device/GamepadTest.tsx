import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Gamepad2, RefreshCw, AlertCircle } from 'lucide-react';

interface GamepadState {
    id: string;
    index: number;
    buttons: readonly GamepadButton[];
    axes: readonly number[];
    timestamp: number;
    vibrationActuator?: GamepadHapticActuator;
}

interface StickHistory {
    x: number;
    y: number;
}

const CIRCULARITY_SAMPLES = 1000;

const GamepadTest: React.FC = () => {
    const { t } = useTranslation();
    const [gamepads, setGamepads] = useState<Record<number, GamepadState>>({});
    const [stickHistory, setStickHistory] = useState<Record<string, StickHistory[]>>({});
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(false);
    const requestRef = useRef<number>();
    const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    const updateGamepads = () => {
        const pads = navigator.getGamepads();
        const newGamepads: Record<number, GamepadState> = {};

        for (let i = 0; i < pads.length; i++) {
            const pad = pads[i];
            if (pad) {
                newGamepads[pad.index] = {
                    id: pad.id,
                    index: pad.index,
                    buttons: pad.buttons,
                    axes: pad.axes,
                    timestamp: pad.timestamp,
                    vibrationActuator: pad.vibrationActuator
                };

                if (isRecordingRef.current) {
                    const keyL = `${pad.index}-L`;
                    const keyR = `${pad.index}-R`;

                    setStickHistory(prev => {
                        const newHistory = { ...prev };

                        // Left Stick
                        if (!newHistory[keyL]) newHistory[keyL] = [];
                        if (Math.abs(pad.axes[0]) > 0.05 || Math.abs(pad.axes[1]) > 0.05) {
                            newHistory[keyL] = [...newHistory[keyL], { x: pad.axes[0], y: pad.axes[1] }].slice(-CIRCULARITY_SAMPLES);
                        }

                        // Right Stick
                        if (!newHistory[keyR]) newHistory[keyR] = [];
                        if (Math.abs(pad.axes[2]) > 0.05 || Math.abs(pad.axes[3]) > 0.05) {
                            newHistory[keyR] = [...newHistory[keyR], { x: pad.axes[2], y: pad.axes[3] }].slice(-CIRCULARITY_SAMPLES);
                        }

                        return newHistory;
                    });
                }
            }
        }

        setGamepads(newGamepads);
        requestRef.current = requestAnimationFrame(updateGamepads);
    };

    useEffect(() => {
        // Start polling immediately
        requestRef.current = requestAnimationFrame(updateGamepads);

        const handleConnect = (e: GamepadEvent) => {
            console.log("Gamepad connected:", e.gamepad);
            // Force an update when connection event fires
            updateGamepads();
        };

        const handleDisconnect = (e: GamepadEvent) => {
            console.log("Gamepad disconnected:", e.gamepad);
            updateGamepads();
        };

        window.addEventListener("gamepadconnected", handleConnect);
        window.addEventListener("gamepaddisconnected", handleDisconnect);

        return () => {
            window.removeEventListener("gamepadconnected", handleConnect);
            window.removeEventListener("gamepaddisconnected", handleDisconnect);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    const renderButton = (pressed: boolean, label: string, value?: number) => (
        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-75 ${pressed ? 'bg-blue-500 border-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500'}`}>
            <span className="text-xs font-bold">{label}</span>
            {value !== undefined && value > 0 && (
                <span className="text-[10px]">{value.toFixed(2)}</span>
            )}
        </div>
    );

    const renderAxis = (x: number, y: number, label: string, pressed: boolean = false) => (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                <div
                    className={`absolute w-4 h-4 rounded-full shadow-sm transition-transform duration-75 ${pressed ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] scale-125' : 'bg-blue-500'}`}
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${x * 40}px), calc(-50% + ${y * 40}px))`
                    }}
                />
                {/* Crosshair lines */}
                <div className="absolute top-1/2 left-0 w-full h-px bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
                <div className="absolute top-0 left-1/2 w-px h-full bg-gray-200 dark:bg-gray-700 -translate-x-1/2" />
            </div>
            <div className="text-xs text-gray-500 font-mono">
                {label}: {x.toFixed(2)}, {y.toFixed(2)}
            </div>
        </div>
    );

    const renderGamepadVisual = (pad: GamepadState) => {
        // Standard mapping assumption (Xbox style)
        // B0: A, B1: B, B2: X, B3: Y
        // B4: LB, B5: RB, B6: LT, B7: RT
        // B8: Back, B9: Start, B10: LStick, B11: RStick
        // B12: Up, B13: Down, B14: Left, B15: Right
        // B16: Guide

        return (
            <div className="relative w-[600px] h-[380px] bg-white dark:bg-gray-800 rounded-3xl border-4 border-gray-200 dark:border-gray-700 shadow-xl p-8 mx-auto">
                {/* Triggers & Bumpers */}
                <div className="absolute -top-6 left-12 flex gap-2">
                    <div className={`w-24 h-8 rounded-t-lg border-2 border-b-0 transition-all ${pad.buttons[6]?.pressed ? 'bg-blue-500 border-blue-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                        <div className="text-center text-[10px] mt-1 text-gray-500 dark:text-gray-400">LT {pad.buttons[6]?.value.toFixed(2)}</div>
                    </div>
                    <div className={`w-24 h-6 mt-2 rounded-t-md border-2 border-b-0 transition-all ${pad.buttons[4]?.pressed ? 'bg-blue-500 border-blue-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                        <div className="text-center text-[10px] text-gray-500 dark:text-gray-400">LB</div>
                    </div>
                </div>
                <div className="absolute -top-6 right-12 flex gap-2 flex-row-reverse">
                    <div className={`w-24 h-8 rounded-t-lg border-2 border-b-0 transition-all ${pad.buttons[7]?.pressed ? 'bg-blue-500 border-blue-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                        <div className="text-center text-[10px] mt-1 text-gray-500 dark:text-gray-400">RT {pad.buttons[7]?.value.toFixed(2)}</div>
                    </div>
                    <div className={`w-24 h-6 mt-2 rounded-t-md border-2 border-b-0 transition-all ${pad.buttons[5]?.pressed ? 'bg-blue-500 border-blue-600' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                        <div className="text-center text-[10px] text-gray-500 dark:text-gray-400">RB</div>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex justify-between h-full pt-8">
                    {/* Left Side */}
                    <div className="flex flex-col items-center gap-8 w-1/3">
                        {/* Left Stick */}
                        {renderAxis(pad.axes[0] || 0, pad.axes[1] || 0, "L-Stick", pad.buttons[10]?.pressed)}

                        {/* D-Pad */}
                        <div className="relative w-32 h-32">
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-t bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${pad.buttons[12]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} />
                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-b bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${pad.buttons[13]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} />
                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-l bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${pad.buttons[14]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} />
                            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-r bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${pad.buttons[15]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>

                    {/* Center */}
                    <div className="flex flex-col items-center justify-start pt-12 gap-4 w-1/3">
                        <div className="flex gap-4">
                            <div className={`w-8 h-4 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${pad.buttons[8]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} title="Select/Back" />
                            <div className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center ${pad.buttons[16]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} title="Guide">
                                <Gamepad2 className="w-6 h-6 opacity-50" />
                            </div>
                            <div className={`w-8 h-4 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 ${pad.buttons[9]?.pressed ? '!bg-blue-500 !border-blue-600' : ''}`} title="Start" />
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex flex-col items-center gap-8 w-1/3">
                        {/* Face Buttons */}
                        <div className="relative w-40 h-40">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                                {renderButton(pad.buttons[0]?.pressed, "A")}
                            </div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                {renderButton(pad.buttons[1]?.pressed, "B")}
                            </div>
                            <div className="absolute left-0 top-1/2 -translate-y-1/2">
                                {renderButton(pad.buttons[2]?.pressed, "X")}
                            </div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2">
                                {renderButton(pad.buttons[3]?.pressed, "Y")}
                            </div>
                        </div>

                        {/* Right Stick */}
                        {renderAxis(pad.axes[2] || 0, pad.axes[3] || 0, "R-Stick", pad.buttons[11]?.pressed)}
                    </div>
                </div>
            </div>
        );
    };

    const hasGamepads = Object.keys(gamepads).length > 0;

    return (
        <div className="space-y-6">
            {!hasGamepads ? (
                <Card className="p-12 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-900 border-dashed">
                    <Gamepad2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('tool.gamepad-test.no_gamepad')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md">
                        {t('tool.gamepad-test.connect_hint')}
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-md">
                            <AlertCircle className="w-4 h-4" />
                            {t('tool.gamepad-test.press_button_hint')}
                        </div>
                        <button
                            onClick={updateGamepads}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                            {t('tool.gamepad-test.scan')}
                        </button>
                    </div>
                </Card>
            ) : (
                Object.values(gamepads).map((pad: GamepadState) => (
                    <Card key={pad.id} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Gamepad2 className="w-6 h-6 text-blue-500" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md" title={pad.id}>
                                        {pad.id}
                                    </h3>
                                    <div className="text-xs text-gray-500">Index: {pad.index} • {pad.buttons.length} Buttons • {pad.axes.length} Axes</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {pad.vibrationActuator && (
                                    <button
                                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                        onClick={() => {
                                            pad.vibrationActuator?.playEffect('dual-rumble', {
                                                startDelay: 0,
                                                duration: 500,
                                                weakMagnitude: 1.0,
                                                strongMagnitude: 1.0,
                                            });
                                        }}
                                    >
                                        {t('tool.gamepad-test.test_vibration')}
                                    </button>
                                )}
                                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                    Connected
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-4">
                            {renderGamepadVisual(pad)}
                        </div>

                        {/* Raw Data View */}
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Buttons</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {pad.buttons.map((btn, i) => (
                                        <div key={i} className={`p-2 rounded text-center text-xs border ${btn.pressed ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                                            <div className="font-bold">B{i}</div>
                                            <div className="opacity-75">{btn.value.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Axes</h4>
                                <div className="space-y-2">
                                    {pad.axes.map((axis, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs">
                                            <span className="w-8 font-mono font-bold text-gray-500">AX{i}</span>
                                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-75"
                                                    style={{
                                                        width: '50%',
                                                        transform: `translateX(${axis * 100}%)`
                                                    }}
                                                />
                                            </div>
                                            <span className="w-12 text-right font-mono">{axis.toFixed(4)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Professional Circularity Test */}
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    {t('tool.gamepad-test.circularity_test')}
                                </h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsRecording(!isRecording);
                                            if (!isRecording) {
                                                // Clear history on start
                                                setStickHistory(prev => {
                                                    const next = { ...prev };
                                                    delete next[`${pad.index}-L`];
                                                    delete next[`${pad.index}-R`];
                                                    return next;
                                                });
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}
                                    >
                                        {isRecording ? t('tool.gamepad-test.stop_recording') : t('tool.gamepad-test.start_recording')}
                                    </button>
                                    <button
                                        onClick={() => setStickHistory(prev => {
                                            const next = { ...prev };
                                            delete next[`${pad.index}-L`];
                                            delete next[`${pad.index}-R`];
                                            return next;
                                        })}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        {t('tool.gamepad-test.clear')}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { label: 'Left Stick', key: `${pad.index}-L`, axes: [0, 1] },
                                    { label: 'Right Stick', key: `${pad.index}-R`, axes: [2, 3] }
                                ].map((stick) => {
                                    const history = stickHistory[stick.key] || [];
                                    const maxDist = history.reduce((max, p) => Math.max(max, Math.sqrt(p.x * p.x + p.y * p.y)), 0);
                                    const avgError = history.length > 0
                                        ? (history.reduce((sum, p) => sum + Math.abs(1 - Math.sqrt(p.x * p.x + p.y * p.y)), 0) / history.length * 100)
                                        : 0;

                                    return (
                                        <div key={stick.label} className="flex flex-col items-center">
                                            <div className="text-xs font-bold text-gray-500 mb-2">{stick.label} Circularity</div>
                                            <div className="relative w-48 h-48 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-700 mb-2">
                                                {/* Reference Circle */}
                                                <div className="absolute top-0 left-0 w-full h-full rounded-full border border-dashed border-gray-300 dark:border-gray-600 pointer-events-none" />

                                                {/* Points */}
                                                <canvas
                                                    width={192}
                                                    height={192}
                                                    className="absolute top-0 left-0 w-full h-full"
                                                    ref={el => {
                                                        if (el) {
                                                            const ctx = el.getContext('2d');
                                                            if (ctx) {
                                                                ctx.clearRect(0, 0, 192, 192);

                                                                // Draw center lines
                                                                ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
                                                                ctx.beginPath();
                                                                ctx.moveTo(96, 0); ctx.lineTo(96, 192);
                                                                ctx.moveTo(0, 96); ctx.lineTo(192, 96);
                                                                ctx.stroke();

                                                                // Draw history points
                                                                ctx.fillStyle = '#3b82f6';
                                                                history.forEach(p => {
                                                                    ctx.beginPath();
                                                                    ctx.arc(96 + p.x * 96, 96 + p.y * 96, 1.5, 0, Math.PI * 2);
                                                                    ctx.fill();
                                                                });

                                                                // Draw current position
                                                                const currX = pad.axes[stick.axes[0]];
                                                                const currY = pad.axes[stick.axes[1]];
                                                                ctx.fillStyle = '#ef4444';
                                                                ctx.beginPath();
                                                                ctx.arc(96 + currX * 96, 96 + currY * 96, 4, 0, Math.PI * 2);
                                                                ctx.fill();
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 text-[10px] text-gray-500">
                                                <div>Samples: {history.length}</div>
                                                <div>Avg Error: {avgError.toFixed(1)}%</div>
                                                <div>Max Reach: {(maxDist * 100).toFixed(1)}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="mt-4 text-xs text-gray-400 text-center">
                                {t('tool.gamepad-test.circularity_hint')}
                            </p>
                        </div>

                    </Card >
                ))
            )}
        </div >
    );
};

export default GamepadTest;
