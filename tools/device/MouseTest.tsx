import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MousePointer2, RefreshCw, Activity, Move, Mouse } from 'lucide-react';

const MouseTest: React.FC = () => {
    const { t } = useTranslation();

    // State for button clicks
    const [buttons, setButtons] = useState({
        left: false,
        middle: false,
        right: false,
        back: false,
        forward: false
    });

    // State for double click
    const [doubleClickStatus, setDoubleClickStatus] = useState<'waiting' | 'success'>('waiting');

    // State for scroll
    const [scroll, setScroll] = useState({ up: false, down: false });

    // State for polling rate
    const [pollingRate, setPollingRate] = useState(0);
    const [maxPollingRate, setMaxPollingRate] = useState(0);
    const eventCountRef = useRef(0);
    const lastTimeRef = useRef(Date.now());

    // State for coordinates
    const [coords, setCoords] = useState({ x: 0, y: 0 });

    // Drawing canvas for precision test
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Handle mouse down
    const handleMouseDown = useCallback((e: MouseEvent) => {
        // Prevent default context menu for right click testing
        if (e.button === 2) {
            // We don't prevent default here globally to allow user to leave, 
            // but we will inside the specific test area if needed.
        }

        const newButtons = { ...buttons };
        switch (e.button) {
            case 0: newButtons.left = true; break;
            case 1: newButtons.middle = true; break;
            case 2: newButtons.right = true; break;
            case 3:
                newButtons.back = true;
                e.preventDefault();
                break;
            case 4:
                newButtons.forward = true;
                e.preventDefault();
                break;
        }
        setButtons(prev => ({ ...prev, ...newButtons }));
    }, [buttons]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (e.button === 3 || e.button === 4) {
            e.preventDefault();
        }
        const newButtons = { ...buttons };
        switch (e.button) {
            case 0: newButtons.left = false; break;
            case 1: newButtons.middle = false; break;
            case 2: newButtons.right = false; break;
            case 3: newButtons.back = false; break;
            case 4: newButtons.forward = false; break;
        }
        setButtons(prev => ({ ...prev, ...newButtons }));
    }, [buttons]);

    // Handle scroll
    const scrollTimeoutRef = useRef<number | null>(null);
    const handleWheel = useCallback((e: WheelEvent) => {
        // Clear any existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        // Set scroll direction
        if (e.deltaY < 0) setScroll({ up: true, down: false });
        if (e.deltaY > 0) setScroll({ up: false, down: true });
        // Reset after 200ms
        scrollTimeoutRef.current = setTimeout(() => {
            setScroll({ up: false, down: false });
            scrollTimeoutRef.current = null;
        }, 200);
    }, []);

    // Handle mouse move for polling rate and coords
    const handleMouseMove = useCallback((e: MouseEvent) => {
        setCoords({ x: e.clientX, y: e.clientY });
        eventCountRef.current++;

        // Drawing logic
        if (isDrawing && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = canvasRef.current.width / rect.width;
                const scaleY = canvasRef.current.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;

                ctx.lineTo(x, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
        }
    }, [isDrawing]);

    // Polling rate calculator
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastTimeRef.current;
            if (elapsed >= 1000) {
                const rate = Math.round((eventCountRef.current * 1000) / elapsed);
                setPollingRate(rate);
                if (rate > maxPollingRate) setMaxPollingRate(rate);

                eventCountRef.current = 0;
                lastTimeRef.current = now;
            }
        }, 100); // Check more frequently but calculate for last second window ideally, simplified here

        return () => clearInterval(interval);
    }, [maxPollingRate]);

    // Global event listeners
    useEffect(() => {
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('wheel', handleWheel);
        window.addEventListener('mousemove', handleMouseMove);

        // Disable context menu on the test area to allow right click testing
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.getElementById('mouse-test-area')?.addEventListener('contextmenu', handleContextMenu);

        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mousemove', handleMouseMove);
            document.getElementById('mouse-test-area')?.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [handleMouseDown, handleWheel, handleMouseMove]);

    const resetTest = () => {
        setButtons({ left: false, middle: false, right: false, back: false, forward: false });
        setScroll({ up: false, down: false });
        setDoubleClickStatus('waiting');
        setMaxPollingRate(0);
        setPollingRate(0);

        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        setIsDrawing(true);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = canvasRef.current.width / rect.width;
                const scaleY = canvasRef.current.height / rect.height;
                ctx.beginPath();
                ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                ctx.strokeStyle = '#3b82f6'; // blue-500
                ctx.lineWidth = 2;
            }
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.beginPath();
        }
    };

    return (
        <div className="space-y-6" id="mouse-test-area">
            {/* Top Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">{t('tool.mouse-test.coordinates')}</div>
                    <div className="text-xl font-mono font-semibold text-primary-600">
                        {coords.x}, {coords.y}
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">{t('tool.mouse-test.polling_rate')}</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-mono font-semibold text-green-600">{pollingRate}</span>
                        <span className="text-xs text-gray-400">Hz</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Max: {maxPollingRate} Hz</div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold mb-1">{t('tool.mouse-test.buttons_pressed')}</div>
                    <div className="text-xl font-mono font-semibold text-purple-600">
                        {Object.values(buttons).filter(Boolean).length} / 5
                    </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={resetTest}>
                    <RefreshCw className="w-6 h-6 text-gray-400 mb-1" />
                    <div className="text-xs font-medium text-gray-500">{t('tool.mouse-test.reset')}</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visual Mouse Representation */}
                <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="relative w-64 h-96 border-4 border-gray-300 dark:border-gray-600 rounded-[4rem] bg-gray-50 dark:bg-gray-900 shadow-xl">
                        {/* Left Button */}
                        <div className={`absolute top-0 left-0 w-1/2 h-32 border-r-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-tl-[3.5rem] transition-all duration-100 ${buttons.left ? 'bg-blue-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <span className={`absolute top-12 left-8 text-xs font-bold ${buttons.left ? 'text-white' : 'text-gray-400'}`}>{t('tool.mouse-test.left_click')}</span>
                        </div>

                        {/* Right Button */}
                        <div className={`absolute top-0 right-0 w-1/2 h-32 border-l-2 border-b-2 border-gray-300 dark:border-gray-600 rounded-tr-[3.5rem] transition-all duration-100 ${buttons.right ? 'bg-blue-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                            <span className={`absolute top-12 right-8 text-xs font-bold ${buttons.right ? 'text-white' : 'text-gray-400'}`}>{t('tool.mouse-test.right_click')}</span>
                        </div>

                        {/* Middle Button / Scroll Wheel */}
                        <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-8 h-20 border-2 border-gray-300 dark:border-gray-600 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-100 ${buttons.middle ? 'bg-blue-500 border-blue-600' : 'bg-white dark:bg-gray-800'}`}>
                            <div className={`w-4 h-4 rounded-full transition-colors ${scroll.up ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            <div className={`w-4 h-4 rounded-full transition-colors ${scroll.down ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        </div>

                        {/* Body */}
                        <div className="absolute top-32 w-full h-64 rounded-b-[4rem] flex flex-col items-center pt-8">
                            <Mouse className="w-12 h-12 text-gray-300 dark:text-gray-700 opacity-20" />
                        </div>

                        {/* Side Buttons (Simulated on left side) */}
                        <div className={`absolute top-40 -left-1 w-4 h-12 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md transition-all duration-100 ${buttons.forward ? 'bg-blue-500 !border-blue-600' : ''}`} title={t('tool.mouse-test.forward')} />
                        <div className={`absolute top-56 -left-1 w-4 h-12 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-l-md transition-all duration-100 ${buttons.back ? 'bg-blue-500 !border-blue-600' : ''}`} title={t('tool.mouse-test.back')} />
                    </div>
                    <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                        {t('tool.mouse-test.instruction')}
                    </p>
                </Card>

                <div className="space-y-6">
                    {/* Double Click Test */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <MousePointer2 className="w-5 h-5 text-purple-500" />
                            {t('tool.mouse-test.double_click_test')}
                        </h3>
                        <div
                            className={`w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-200 ${doubleClickStatus === 'success'
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                                }`}
                            onDoubleClick={() => {
                                setDoubleClickStatus('success');
                                setTimeout(() => setDoubleClickStatus('waiting'), 1000);
                            }}
                        >
                            <span className="font-medium">
                                {doubleClickStatus === 'success' ? t('tool.mouse-test.double_click_success') : t('tool.mouse-test.double_click_here')}
                            </span>
                        </div>
                    </Card>

                    {/* Precision / Drawing Test */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            {t('tool.mouse-test.precision_test')}
                        </h3>
                        <div className="relative w-full h-48 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-crosshair">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={300}
                                className="w-full h-full"
                                onMouseDown={handleCanvasMouseDown}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400 pointer-events-none">
                                {t('tool.mouse-test.draw_hint')}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MouseTest;
