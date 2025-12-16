import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Slider } from '../../components/ui/Slider';
import { 
  Pencil, Minus, Square, Circle as CircleIcon, Eraser, 
  Pipette, PaintBucket, Undo, Redo, Download, Trash2, 
  Upload, Image as ImageIcon, Plus, Settings, Check, X, Copy,
  Type, MoveRight, Hash, Grid3X3, Droplet, RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ToolType = 'pen' | 'line' | 'rect' | 'circle' | 'eraser' | 'picker' | 'fill' | 'arrow' | 'text' | 'mosaic' | 'blur' | 'number';

interface Point {
  x: number;
  y: number;
}

interface TextInputState {
  x: number;
  y: number;
  text: string;
  w?: number; // Approximate width for better UX
}

const COLORS = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
];

const SimplePaint: React.FC = () => {
  const { t } = useTranslation();
  // --- State ---
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // New Tool States
  const [sequenceCount, setSequenceCount] = useState(1);
  const [textInput, setTextInput] = useState<TextInputState | null>(null);
  
  // Resize Modal State
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [tempSize, setTempSize] = useState({ w: 800, h: 600 });

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const startPos = useRef<Point>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingResizeImage = useRef<string | null>(null);

  // --- Initialization ---

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const initialW = clientWidth;
      const initialH = Math.max(600, clientHeight);
      setCanvasSize({ w: initialW, h: initialH });
      setTempSize({ w: initialW, h: initialH });
    }
  }, []);

  useEffect(() => {
    const mainCtx = mainCanvasRef.current?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d');
    
    if (mainCtx && tempCtx) {
      // 1. Fill background with white
      mainCtx.fillStyle = '#ffffff';
      mainCtx.fillRect(0, 0, mainCanvasRef.current!.width, mainCanvasRef.current!.height);

      // 2. Common settings
      const applySettings = (ctx: CanvasRenderingContext2D) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      };
      applySettings(mainCtx);
      applySettings(tempCtx);

      // 3. Handle Content Restoration
      if (pendingResizeImage.current) {
        const img = new Image();
        img.onload = () => {
          mainCtx.drawImage(img, 0, 0);
          saveState();
          pendingResizeImage.current = null;
        };
        img.src = pendingResizeImage.current;
      } else if (historyStep === -1) {
        saveState();
      }
    }
  }, [canvasSize]);

  // --- History Management ---

  const saveState = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(data);
    
    if (newHistory.length > 20) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      restoreState(newStep);
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      restoreState(newStep);
      setHistoryStep(newStep);
    }
  };

  const restoreState = (stepIndex: number) => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && history[stepIndex]) {
      ctx.putImageData(history[stepIndex], 0, 0);
    }
  };

  // --- Drawing Helpers ---

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = tempCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, from: Point, to: Point, width: number) => {
    const headLength = width * 3; // scale head with line width
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(to.x, to.y);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const applyMosaic = (ctx: CanvasRenderingContext2D, start: Point, end: Point, size: number) => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    
    if (w < 1 || h < 1) return;

    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    
    // Block size
    const blockSize = Math.max(4, Math.floor(size * 2)); 

    for (let by = 0; by < h; by += blockSize) {
      for (let bx = 0; bx < w; bx += blockSize) {
        // Calculate average color
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let iy = 0; iy < blockSize && by + iy < h; iy++) {
          for (let ix = 0; ix < blockSize && bx + ix < w; ix++) {
            const pos = ((by + iy) * w + (bx + ix)) * 4;
            r += data[pos];
            g += data[pos + 1];
            b += data[pos + 2];
            count++;
          }
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Fill block
        for (let iy = 0; iy < blockSize && by + iy < h; iy++) {
          for (let ix = 0; ix < blockSize && bx + ix < w; ix++) {
            const pos = ((by + iy) * w + (bx + ix)) * 4;
            data[pos] = r;
            data[pos + 1] = g;
            data[pos + 2] = b;
          }
        }
      }
    }
    
    ctx.putImageData(imageData, x, y);
  };

  const applyBlur = (ctx: CanvasRenderingContext2D, start: Point, end: Point, intensity: number) => {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);

    if (w < 1 || h < 1) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.filter = `blur(${intensity}px)`;
    // Draw the canvas onto itself to apply blur
    // Note: drawImage with same canvas source works in most modern browsers
    ctx.drawImage(ctx.canvas, 0, 0); 
    ctx.filter = 'none';
    ctx.restore();
  };

  const drawNumberMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, num: number, size: number, color: string) => {
    const radius = size * 1.5 + 10;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${radius * 1.2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num.toString(), x, y);
  };

  // --- Main Drawing Handlers ---

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (showSizeModal) return;
    
    // If Text input is active, commit it first if clicking outside
    if (textInput) {
      commitText();
      return;
    }

    const pos = getPos(e);
    startPos.current = pos;

    // Instant Tools (Click based)
    if (tool === 'picker') {
      pickColor(pos.x, pos.y);
      return;
    }
    if (tool === 'fill') {
      floodFill(pos.x, pos.y, color);
      return;
    }
    if (tool === 'text') {
      setTextInput({ x: pos.x, y: pos.y, text: '' });
      return;
    }
    if (tool === 'number') {
      const mainCtx = mainCanvasRef.current?.getContext('2d');
      if (mainCtx) {
        drawNumberMarker(mainCtx, pos.x, pos.y, sequenceCount, lineWidth, color);
        setSequenceCount(s => s + 1);
        saveState();
      }
      return;
    }

    setIsDrawing(true);
    const mainCtx = mainCanvasRef.current?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d');
    if (!mainCtx || !tempCtx) return;

    const ctx = tool === 'pen' || tool === 'eraser' ? mainCtx : tempCtx;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

    if (tool === 'pen' || tool === 'eraser') {
      mainCtx.beginPath();
      mainCtx.moveTo(pos.x, pos.y);
      mainCtx.lineTo(pos.x, pos.y);
      mainCtx.stroke();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    
    const pos = getPos(e);
    const mainCtx = mainCanvasRef.current?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d');
    if (!mainCtx || !tempCtx) return;

    if (tool === 'pen' || tool === 'eraser') {
      mainCtx.lineTo(pos.x, pos.y);
      mainCtx.stroke();
    } else {
      // Shapes & Effects Preview
      tempCtx.clearRect(0, 0, tempCanvasRef.current!.width, tempCanvasRef.current!.height);
      
      const start = startPos.current;

      if (tool === 'line') {
        tempCtx.beginPath();
        tempCtx.moveTo(start.x, start.y);
        tempCtx.lineTo(pos.x, pos.y);
        tempCtx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(tempCtx, start, pos, lineWidth);
      } else if (tool === 'rect' || tool === 'mosaic' || tool === 'blur') {
        // For Mosaic and Blur, we just show the selection rectangle
        tempCtx.beginPath();
        if (tool !== 'rect') {
           tempCtx.setLineDash([5, 5]);
           tempCtx.strokeStyle = '#000000';
           tempCtx.lineWidth = 1;
        }
        tempCtx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
        if (tool !== 'rect') tempCtx.setLineDash([]);
      } else if (tool === 'circle') {
        tempCtx.beginPath();
        const radius = Math.sqrt(Math.pow(pos.x - start.x, 2) + Math.pow(pos.y - start.y, 2));
        tempCtx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        tempCtx.stroke();
      }
    }
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const mainCtx = mainCanvasRef.current?.getContext('2d');
    const tempCtx = tempCanvasRef.current?.getContext('2d');
    if (!mainCtx || !tempCtx) return;

    // Finalize Shapes / Effects
    const start = startPos.current;
    
    // For mouseup events we might need the last position, but relying on temp canvas state 
    // or passing the event pos is tricky if event is missing. 
    // However, the temp canvas already has the visual state for Line/Rect/Circle/Arrow.
    // For Mosaic/Blur we need coordinates. 
    
    // Let's retrieve the last coordinates from the temp drawing (conceptually)
    // Actually, we need the end position for Mosaic/Blur.
    // We can track lastPos in a ref, or just extract from event if needed.
    // If event is not available (mouse leave), we might lose exact end pos.
    // For robustness, let's assume 'draw' updated a ref if needed, but for simplicity
    // we will rely on the passed event `e` to get `end`.
    
    let end = start;
    if (e) {
       end = getPos(e);
    } else {
       // Fallback if we mouseout: just use start to avoid weird effects
       end = start; 
    }

    if (['line', 'rect', 'circle', 'arrow'].includes(tool)) {
       mainCtx.globalCompositeOperation = 'source-over';
       mainCtx.drawImage(tempCanvasRef.current, 0, 0);
    } else if (tool === 'mosaic') {
       applyMosaic(mainCtx, start, end, lineWidth);
    } else if (tool === 'blur') {
       applyBlur(mainCtx, start, end, lineWidth); // Use lineWidth as blur intensity
    }

    // Clear temp
    tempCtx.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);

    saveState();
    mainCtx.globalCompositeOperation = 'source-over';
  };

  // --- Text Tool Logic ---

  const commitText = () => {
    if (!textInput || !textInput.text.trim()) {
      setTextInput(null);
      return;
    }
    const ctx = mainCanvasRef.current?.getContext('2d');
    if (ctx) {
      const fontSize = Math.max(12, lineWidth * 3 + 10);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = color;
      ctx.fillText(textInput.text, textInput.x, textInput.y + fontSize); // Adjust baseline
      saveState();
    }
    setTextInput(null);
  };

  // --- Advanced Tools ---

  const pickColor = (x: number, y: number) => {
    const ctx = mainCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1);
    setColor(hex);
    setTool('pen');
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = mainCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const hex = fillColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const startPos = (Math.floor(startY) * canvas.width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    if (startR === r && startG === g && startB === b && startA === 255) return;

    const stack = [[Math.floor(startX), Math.floor(startY)]];
    
    while (stack.length) {
      const [x, y] = stack.pop()!;
      const pos = (y * canvas.width + x) * 4;

      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      
      if (data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA) {
        data[pos] = r;
        data[pos + 1] = g;
        data[pos + 2] = b;
        data[pos + 3] = 255;

        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveState();
  };

  // --- Resize Handler ---
  
  const handleResizeApply = () => {
    if (mainCanvasRef.current) {
      pendingResizeImage.current = mainCanvasRef.current.toDataURL();
      setHistory([]);
      setHistoryStep(-1);
      setCanvasSize(tempSize);
      setShowSizeModal(false);
    }
  };

  // --- External Actions ---

  const handleClear = () => {
    const ctx = mainCanvasRef.current?.getContext('2d');
    if (ctx && mainCanvasRef.current) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height);
      saveState();
    }
  };

  const handleDownload = () => {
    if (!mainCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'painting.png';
    link.href = mainCanvasRef.current.toDataURL();
    link.click();
  };

  const handleCopy = async () => {
    if (!mainCanvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>(resolve => 
        mainCanvasRef.current!.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Failed to create image blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to copy. ' + (err instanceof Error ? err.message : ''));
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) loadImage(blob);
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const loadImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ctx = mainCanvasRef.current?.getContext('2d');
      if (ctx && mainCanvasRef.current) {
        const x = Math.max(0, (mainCanvasRef.current.width - img.width) / 2);
        const y = Math.max(0, (mainCanvasRef.current.height - img.height) / 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, x, y);
        saveState();
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  };

  // --- Render Helpers ---
  const ToolButton = ({ t, icon: Icon, label }: { t: ToolType, icon: any, label: string }) => (
    <button
      onClick={() => setTool(t)}
      title={label}
      className={`p-2 rounded-lg transition-all ${
        tool === t 
          ? 'bg-primary-500 text-white shadow-md' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] overflow-hidden bg-gray-100 dark:bg-gray-950 -m-6 relative">
      
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-2 flex flex-wrap items-center gap-2 z-10 shadow-sm relative">
        
        <div className="flex flex-wrap bg-gray-50 dark:bg-gray-800 p-1 rounded-lg gap-1 border border-gray-200 dark:border-gray-700">
          <ToolButton t="pen" icon={Pencil} label={t('tool.paint.tools.pencil')} />
          <ToolButton t="eraser" icon={Eraser} label={t('tool.paint.tools.eraser')} />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
          <ToolButton t="line" icon={Minus} label={t('tool.paint.tools.line')} />
          <ToolButton t="arrow" icon={MoveRight} label={t('tool.paint.tools.arrow')} />
          <ToolButton t="rect" icon={Square} label={t('tool.paint.tools.rectangle')} />
          <ToolButton t="circle" icon={CircleIcon} label={t('tool.paint.tools.circle')} />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
          <ToolButton t="text" icon={Type} label={t('tool.paint.tools.text')} />
          <ToolButton t="number" icon={Hash} label={`${t('tool.paint.tools.sequence')} (${sequenceCount})`} />
          <ToolButton t="mosaic" icon={Grid3X3} label={t('tool.paint.tools.mosaic')} />
          <ToolButton t="blur" icon={Droplet} label={t('tool.paint.tools.blur')} />
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
          <ToolButton t="fill" icon={PaintBucket} label={t('tool.paint.tools.fill_bucket')} />
          <ToolButton t="picker" icon={Pipette} label={t('tool.paint.tools.color_picker')} />
        </div>

        {/* Sequence Reset Button - Only show if number tool active or count > 1 */}
        <div className="flex items-center">
            {tool === 'number' && (
              <Button size="sm" variant="ghost" onClick={() => setSequenceCount(1)} title={t('tool.paint.canvas.reset_counter')}>
                <RotateCcw className="w-3 h-3 mr-1" /> {sequenceCount}
              </Button>
            )}
        </div>

        <div className="flex items-center gap-1 px-2 border-l border-r border-gray-200 dark:border-gray-800 h-8">
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden" 
          />
          <div className="grid grid-cols-10 gap-0.5 w-[160px] hidden lg:grid">
             {COLORS.map(c => (
               <button
                 key={c}
                 className="w-4 h-4 rounded-sm border border-gray-300/50 hover:scale-125 transition-transform"
                 style={{ backgroundColor: c }}
                 onClick={() => setColor(c)}
                 title={c}
               />
             ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 w-32">
          <div className="w-2 h-2 bg-black dark:bg-white rounded-full" style={{ transform: `scale(${lineWidth/4})` }} />
          <Slider 
             min={1} max={50} 
             value={lineWidth} 
             onChange={(e) => setLineWidth(Number(e.target.value))}
             className="flex-1"
          />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <div className="text-xs text-gray-500 font-mono mr-2 hidden xl:block">
            {canvasSize.w} x {canvasSize.h}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSizeModal(!showSizeModal)} className={showSizeModal ? 'bg-gray-100 dark:bg-gray-800' : ''} title={t('tool.paint.canvas.size')}>
             <Settings className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyStep <= 0} title={t('tool.paint.canvas.undo')}>
             <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyStep >= history.length - 1} title={t('tool.paint.canvas.redo')}>
             <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title={t('tool.paint.canvas.import')}>
             <Upload className="w-4 h-4" />
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && loadImage(e.target.files[0])} />
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-500 hover:bg-red-50" title={t('tool.paint.canvas.clear_canvas')}>
             <Trash2 className="w-4 h-4" />
          </Button>
          <div className="flex gap-1 ml-2">
            <Button size="sm" variant="secondary" onClick={handleCopy} title={t('common.copy')}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button size="sm" onClick={handleDownload} title={t('tool.paint.canvas.save_image')}>
                <Download className="w-4 h-4 mr-2" /> {t('common.save')}
            </Button>
          </div>
        </div>

        {/* Canvas Size Dialog */}
        {showSizeModal && (
          <div className="absolute top-full right-4 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="text-sm font-semibold mb-3">{t('tool.paint.canvas.size')}</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('tool.paint.canvas.width')}</label>
                <input 
                  type="number" 
                  value={tempSize.w} 
                  onChange={(e) => setTempSize(p => ({ ...p, w: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-900 dark:border-gray-700" 
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t('tool.paint.canvas.height')}</label>
                <input 
                  type="number" 
                  value={tempSize.h} 
                  onChange={(e) => setTempSize(p => ({ ...p, h: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-900 dark:border-gray-700" 
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleResizeApply} className="flex-1">{t('common.apply')}</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSizeModal(false)}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-auto bg-[#e5e5f7] dark:bg-gray-900 cursor-crosshair touch-none"
        style={{
          backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px)', 
          backgroundSize: '20px 20px'
        }}
      >
        <div className="min-w-full min-h-full flex items-center justify-center p-8">
           <div className="relative shadow-2xl bg-white" style={{ width: canvasSize.w, height: canvasSize.h }}>
              <canvas
                ref={mainCanvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                className="block bg-white"
              />
              <canvas
                ref={tempCanvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                className="absolute inset-0 pointer-events-auto touch-none select-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              
              {/* Text Input Overlay */}
              {textInput && (
                <div 
                  className="absolute"
                  style={{ left: textInput.x, top: textInput.y }}
                >
                  <input
                    autoFocus
                    value={textInput.text}
                    onChange={(e) => setTextInput(p => p ? { ...p, text: e.target.value } : null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitText();
                      if (e.key === 'Escape') setTextInput(null);
                    }}
                    onBlur={commitText} // Optional: commit on blur
                    className="bg-transparent border border-primary-500 outline-none p-0 m-0"
                    style={{ 
                      color: color, 
                      fontSize: `${Math.max(12, lineWidth * 3 + 10)}px`,
                      fontFamily: 'Arial',
                      minWidth: '50px'
                    }}
                  />
                  <div className="absolute -top-6 left-0 flex gap-1 bg-white dark:bg-gray-800 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                     <button onMouseDown={commitText} className="text-green-500 hover:bg-green-50 p-0.5 rounded"><Check size={14}/></button>
                     <button onMouseDown={() => setTextInput(null)} className="text-red-500 hover:bg-red-50 p-0.5 rounded"><X size={14}/></button>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePaint;