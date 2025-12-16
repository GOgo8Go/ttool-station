import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Fingerprint, Trash2, Maximize2, Minimize2, Info, Activity } from 'lucide-react';

interface TouchPoint {
    identifier: number;
    clientX: number;
    clientY: number;
    radiusX: number;
    radiusY: number;
    rotationAngle: number;
    force: number;
    color: string;
}

interface TouchLog {
    id: number;
    type: string;
    timestamp: string;
    details: string;
}

const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

const TouchTest: React.FC = () => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeTouches, setActiveTouches] = useState<TouchPoint[]>([]);
    const [logs, setLogs] = useState<TouchLog[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    const [maxTouchPoints, setMaxTouchPoints] = useState(0);

    useEffect(() => {
        if (typeof navigator !== 'undefined') {
            setMaxTouchPoints(navigator.maxTouchPoints || 0);
        }
    }, []);

    const addLog = useCallback((type: string, details: string) => {
        setLogs(prev => {
            const newLog = {
                id: Date.now() + Math.random(),
                type,
                timestamp: new Date().toLocaleTimeString(),
                details
            };
            return [newLog, ...prev].slice(0, 50); // Keep last 50 logs
        });
    }, []);

    const getTouchColor = (id: number) => COLORS[id % COLORS.length];

    const handleTouch = useCallback((e: React.TouchEvent | TouchEvent) => {
        // Prevent default to stop scrolling/zooming while testing
        if (e.cancelable) {
            e.preventDefault();
        }

        const touches = Array.from(e.touches).map((touch: any) => ({
            identifier: touch.identifier,
            clientX: touch.clientX,
            clientY: touch.clientY,
            radiusX: touch.radiusX || 0,
            radiusY: touch.radiusY || 0,
            rotationAngle: touch.rotationAngle || 0,
            force: touch.force || 0,
            color: getTouchColor(touch.identifier)
        }));

        setActiveTouches(touches);

        // Log events
        if (e.type === 'touchstart' || e.type === 'touchend') {
            addLog(e.type, `${e.changedTouches.length} points`);
        }
    }, [addLog]);

    // Set up non-React event listeners for better control (especially preventing default)
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const options = { passive: false };

        element.addEventListener('touchstart', handleTouch as any, options);
        element.addEventListener('touchmove', handleTouch as any, options);
        element.addEventListener('touchend', handleTouch as any, options);
        element.addEventListener('touchcancel', handleTouch as any, options);

        return () => {
            element.removeEventListener('touchstart', handleTouch as any);
            element.removeEventListener('touchmove', handleTouch as any);
            element.removeEventListener('touchend', handleTouch as any);
            element.removeEventListener('touchcancel', handleTouch as any);
        };
    }, [handleTouch]);

    // Canvas drawing for trails
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const resizeCanvas = () => {
            if (containerRef.current) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Draw active touches
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // We don't clear the canvas automatically to allow drawing trails
        // But for this specific "Touch Test" visualization where we show active circles, 
        // we might want to clear or maybe have a separate layer for trails.
        // Let's implement a simple trail effect by fading out.

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        activeTouches.forEach(touch => {
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            ctx.beginPath();
            ctx.arc(x, y, Math.max(20, touch.radiusX || 20), 0, 2 * Math.PI);
            ctx.fillStyle = touch.color;
            ctx.fill();

            // Draw crosshair
            ctx.beginPath();
            ctx.moveTo(x - 10, y);
            ctx.lineTo(x + 10, y);
            ctx.moveTo(x, y - 10);
            ctx.lineTo(x, y + 10);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw info text near touch
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText(`ID: ${touch.identifier}`, x + 25, y - 10);
            ctx.fillText(`X: ${Math.round(x)} Y: ${Math.round(y)}`, x + 25, y + 5);
            if (touch.force) ctx.fillText(`Force: ${touch.force.toFixed(2)}`, x + 25, y + 20);
        });
    }, [activeTouches]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setLogs([]);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-end p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">

                <div className="flex items-center space-x-2">
                    <div className="hidden md:flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300 mr-2">
                        <Activity className="w-3 h-3 mr-2" />
                        Max Touch Points: {maxTouchPoints}
                    </div>

                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className={`p-2 rounded-lg transition-colors ${showInfo ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title={t('tool.touch-test.toggle_info')}
                    >
                        <Info className="w-5 h-5" />
                    </button>

                    <button
                        onClick={clearCanvas}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={t('common.clear')}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={isFullscreen ? t('tool.touch-test.exit_fullscreen') : t('tool.touch-test.enter_fullscreen')}
                    >
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Main Test Area */}
            <div className="flex-1 relative flex overflow-hidden">
                {/* Touch Area */}
                <div
                    ref={containerRef}
                    className="flex-1 relative bg-black touch-none cursor-crosshair select-none"
                >
                    <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full"
                    />

                    {/* Overlay Info (if no touches) */}
                    {activeTouches.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center text-gray-500">
                                <Fingerprint className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="text-xl font-medium opacity-50">{t('tool.touch-test.touch_here')}</p>
                                <p className="text-sm opacity-30 mt-2">{t('tool.touch-test.multi_touch_support')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info Panel */}
                {showInfo && (
                    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out z-20">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center">
                                <Activity className="w-4 h-4 mr-2 text-blue-500" />
                                {t('tool.touch-test.active_points')} ({activeTouches.length})
                            </h3>

                            {activeTouches.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">{t('tool.touch-test.no_active_touches')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {activeTouches.map(touch => (
                                        <div key={touch.identifier} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded text-xs">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold" style={{ color: touch.color }}>ID: {touch.identifier}</span>
                                                <span className="text-gray-500">
                                                    {Math.round(touch.clientX)}, {Math.round(touch.clientY)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-500 dark:text-gray-400">
                                                <span>Radius: {touch.radiusX.toFixed(1)}x{touch.radiusY.toFixed(1)}</span>
                                                <span>Angle: {touch.rotationAngle.toFixed(1)}°</span>
                                                <span>Force: {touch.force.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="font-medium text-gray-800 dark:text-white mb-2 sticky top-0 bg-white dark:bg-gray-800 pb-2">
                                {t('tool.touch-test.event_log')}
                            </h3>
                            <div className="space-y-1 font-mono text-xs">
                                {logs.map(log => (
                                    <div key={log.id} className="flex space-x-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700/50 py-1 last:border-0">
                                        <span className="text-gray-400 select-none">{log.timestamp}</span>
                                        <span className={`font-medium ${log.type === 'touchstart' ? 'text-green-500' :
                                            log.type === 'touchend' ? 'text-red-500' :
                                                log.type === 'touchmove' ? 'text-blue-500' : 'text-gray-500'
                                            }`}>{log.type}</span>
                                        <span className="truncate">{log.details}</span>
                                    </div>
                                ))}
                                {logs.length === 0 && (
                                    <p className="text-gray-400 italic text-center py-4">{t('tool.touch-test.no_events')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TouchTest;
