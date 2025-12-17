import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Slider } from '../../components/ui/Slider';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Card } from '../../components/ui/Card';
import { 
  Upload, Download, X, RotateCw, FlipHorizontal, FlipVertical, 
  Crop as CropIcon, Check, Undo, Redo, Sun, Moon, Droplet, 
  Zap, Contrast, SlidersHorizontal, Image as ImageIcon,
  Lock, Copy
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- Types ---

interface Adjustments {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  saturation: number; // 0-200, default 100
  grayscale: number;  // 0-100, default 0
  sepia: number;      // 0-100, default 0
  invert: number;     // 0-100, default 0
  hue: number;        // 0-360, default 0
  blur: number;       // 0-20, default 0
  gamma: number;      // 0.2-2.2, default 1
}

interface Transform {
  rotate: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  hue: 0,
  blur: 0,
  gamma: 1,
};

const DEFAULT_TRANSFORM: Transform = {
  rotate: 0,
  flipH: false,
  flipV: false,
};

// --- Helper: Crop Overlay Component ---

const CropOverlay: React.FC<{
  rect: CropRect;
  containerWidth: number;
  containerHeight: number;
  onChange: (rect: CropRect) => void;
}> = ({ rect, containerWidth, containerHeight, onChange }) => {
  const isDragging = useRef<string | null>(null);
  const startPos = useRef({ x: 0, y: 0 }); // Mouse start position
  const startRect = useRef<CropRect>({ x: 0, y: 0, width: 0, height: 0 }); // Rect at start of drag

  const handleStart = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    isDragging.current = type;
    startPos.current = { x: e.clientX, y: e.clientY };
    startRect.current = { ...rect };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  const handleMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    
    const sRect = startRect.current;
    let next = { ...sRect };

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const MIN_SIZE = 20;

    if (isDragging.current === 'move') {
      next.x = clamp(sRect.x + dx, 0, containerWidth - sRect.width);
      next.y = clamp(sRect.y + dy, 0, containerHeight - sRect.height);
    } else {
      // For resizing, we calculate based on the initial rect + delta
      
      if (isDragging.current.includes('e')) {
        next.width = Math.max(MIN_SIZE, Math.min(containerWidth - sRect.x, sRect.width + dx));
      }
      if (isDragging.current.includes('s')) {
        next.height = Math.max(MIN_SIZE, Math.min(containerHeight - sRect.y, sRect.height + dy));
      }
      if (isDragging.current.includes('w')) {
        // Calculate potential new width
        const maxDelta = sRect.width - MIN_SIZE;
        const effectiveDx = Math.min(maxDelta, Math.max(-sRect.x, dx));
        next.x = sRect.x + effectiveDx;
        next.width = sRect.width - effectiveDx;
      }
      if (isDragging.current.includes('n')) {
        const maxDelta = sRect.height - MIN_SIZE;
        const effectiveDy = Math.min(maxDelta, Math.max(-sRect.y, dy));
        next.y = sRect.y + effectiveDy;
        next.height = sRect.height - effectiveDy;
      }
    }

    onChange(next);
  };

  const handleEnd = () => {
    isDragging.current = null;
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleEnd);
  };

  // Render handles helper
  const renderHandle = (cursor: string, type: string, style: React.CSSProperties) => (
    <div 
      className={`absolute w-3 h-3 bg-white border border-gray-400 ${cursor} z-30`} 
      style={style}
      onMouseDown={(e) => handleStart(e, type)} 
    />
  );

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Dark overlay with hole */}
      <div 
        className="absolute inset-0 bg-black/50 transition-all duration-75" 
        style={{ 
          clipPath: `polygon(0% 0%, 0% 100%, ${rect.x}px 100%, ${rect.x}px ${rect.y}px, ${rect.x + rect.width}px ${rect.y}px, ${rect.x + rect.width}px ${rect.y + rect.height}px, ${rect.x}px ${rect.y + rect.height}px, ${rect.x}px 100%, 100% 100%, 100% 0%)` 
        }}
      />
      
      {/* Crop Box */}
      <div 
        className="absolute border border-white pointer-events-auto cursor-move shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
        style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
        onMouseDown={(e) => handleStart(e, 'move')}
      >
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
          <div className="flex-1 border-b border-white/50"></div>
          <div className="flex-1 border-b border-white/50"></div>
          <div className="flex-1"></div>
        </div>
        <div className="absolute inset-0 flex pointer-events-none opacity-40">
          <div className="flex-1 border-r border-white/50"></div>
          <div className="flex-1 border-r border-white/50"></div>
          <div className="flex-1"></div>
        </div>

        {/* Corner Handles */}
        {renderHandle('cursor-nw-resize', 'nw', { top: -6, left: -6 })}
        {renderHandle('cursor-ne-resize', 'ne', { top: -6, right: -6 })}
        {renderHandle('cursor-sw-resize', 'sw', { bottom: -6, left: -6 })}
        {renderHandle('cursor-se-resize', 'se', { bottom: -6, right: -6 })}
        
        {/* Edge Handles */}
        {renderHandle('cursor-n-resize', 'n', { top: -6, left: '50%', marginLeft: -6 })}
        {renderHandle('cursor-s-resize', 's', { bottom: -6, left: '50%', marginLeft: -6 })}
        {renderHandle('cursor-w-resize', 'w', { left: -6, top: '50%', marginTop: -6 })}
        {renderHandle('cursor-e-resize', 'e', { right: -6, top: '50%', marginTop: -6 })}
      </div>
    </div>
  );
};

// --- Main Component ---

const ImageEditor: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [trans, setTrans] = useState<Transform>(DEFAULT_TRANSFORM);
  const [mode, setMode] = useState<'adjust' | 'transform'>('transform');
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Dimensions of the displayed image in the UI (for crop math)
  const [displayDims, setDisplayDims] = useState({ w: 0, h: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Image Loading ---

  const handleFileSelect = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(f);
    setImageUrl(url);
    setFile(f);
    setAdj(DEFAULT_ADJUSTMENTS);
    setTrans(DEFAULT_TRANSFORM);
    setIsCropping(false);
    setCopied(false);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith('image/')) {
          e.preventDefault();
          handleFileSelect(pastedFile);
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, []);

  // --- Rendering Pipeline (Preview) ---

  const filterStyle = {
    filter: `
      brightness(${adj.brightness}%) 
      contrast(${adj.contrast}%) 
      saturate(${adj.saturation}%) 
      grayscale(${adj.grayscale}%) 
      sepia(${adj.sepia}%) 
      invert(${adj.invert}%) 
      hue-rotate(${adj.hue}deg) 
      blur(${adj.blur}px)
      url(#gamma-filter)
    `,
  };

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      if (isCropping) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        return;
      }

      const rad = (trans.rotate * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.save();
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rad);
      ctx.scale(trans.flipH ? -1 : 1, trans.flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    };
  }, [imageUrl, trans, isCropping]);

  // Update display dimensions for Overlay positioning
  useEffect(() => {
    const updateDims = () => {
      if (canvasRef.current) {
        setDisplayDims({
          w: canvasRef.current.clientWidth,
          h: canvasRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDims);
    const interval = setInterval(updateDims, 500);
    setTimeout(updateDims, 100); 
    return () => {
      window.removeEventListener('resize', updateDims);
      clearInterval(interval);
    };
  }, [imageUrl, trans, isCropping]);

  // --- Handlers ---

  const updateAdj = (key: keyof Adjustments, val: number) => {
    setAdj(prev => ({ ...prev, [key]: val }));
  };

  const rotate = () => setTrans(p => ({ ...p, rotate: (p.rotate + 90) % 360 }));
  const flipH = () => setTrans(p => ({ ...p, flipH: !p.flipH }));
  const flipV = () => setTrans(p => ({ ...p, flipV: !p.flipV }));

  // --- Crop Logic ---

  const startCrop = async () => {
    if (!imageUrl) return;
    
    // 1. Bake current transforms into a temporary image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;
    await new Promise(r => img.onload = r);

    const rad = (trans.rotate * Math.PI) / 180;
    const newWidth = img.width * Math.abs(Math.cos(rad)) + img.height * Math.abs(Math.sin(rad));
    const newHeight = img.width * Math.abs(Math.sin(rad)) + img.height * Math.abs(Math.cos(rad));

    canvas.width = newWidth;
    canvas.height = newHeight;
    
    if (ctx) {
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(rad);
      ctx.scale(trans.flipH ? -1 : 1, trans.flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
    }

    const bakedUrl = canvas.toDataURL();
    setImageUrl(bakedUrl);
    setTrans(DEFAULT_TRANSFORM);

    // 2. Initialize Crop Rect based on Display Dimensions
    // We wait for a tick to ensure canvas renders the new baked image
    setIsCropping(true);
    setCropRect(null); // Will be set by effect once dims catch up
  };

  useEffect(() => {
    if (isCropping && !cropRect && displayDims.w > 0) {
      const w = displayDims.w * 0.8;
      const h = displayDims.h * 0.8;
      setCropRect({
        x: (displayDims.w - w) / 2,
        y: (displayDims.h - h) / 2,
        width: w,
        height: h
      });
    }
  }, [isCropping, displayDims, cropRect]);

  const applyCrop = async () => {
    if (!imageUrl || !cropRect || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    // Calculate scale between Display pixels and Actual Image pixels
    const scaleX = canvas.width / canvas.clientWidth;
    const scaleY = canvas.height / canvas.clientHeight;

    const realX = cropRect.x * scaleX;
    const realY = cropRect.y * scaleY;
    const realW = cropRect.width * scaleX;
    const realH = cropRect.height * scaleY;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = realW;
    tempCanvas.height = realH;
    const ctx = tempCanvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;
    await new Promise(r => img.onload = r);

    ctx?.drawImage(img, realX, realY, realW, realH, 0, 0, realW, realH);

    const newUrl = tempCanvas.toDataURL();
    setImageUrl(newUrl);
    setIsCropping(false);
  };

  const cancelCrop = () => {
    setIsCropping(false);
  };

  // --- Export Helper ---

  const generateOutputCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!imageUrl) return null;
    
    const sourceImg = new Image();
    sourceImg.src = imageUrl;
    await new Promise(r => sourceImg.onload = r);

    const rad = (trans.rotate * Math.PI) / 180;
    const newWidth = sourceImg.width * Math.abs(Math.cos(rad)) + sourceImg.height * Math.abs(Math.sin(rad));
    const newHeight = sourceImg.width * Math.abs(Math.sin(rad)) + sourceImg.height * Math.abs(Math.cos(rad));

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(rad);
    ctx.scale(trans.flipH ? -1 : 1, trans.flipV ? -1 : 1);
    ctx.drawImage(sourceImg, -sourceImg.width / 2, -sourceImg.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const filterCanvas = document.createElement('canvas');
    filterCanvas.width = newWidth;
    filterCanvas.height = newHeight;
    const fCtx = filterCanvas.getContext('2d');
    if (!fCtx) return null;

    const filterString = `
      brightness(${adj.brightness}%) 
      contrast(${adj.contrast}%) 
      saturate(${adj.saturation}%) 
      grayscale(${adj.grayscale}%) 
      sepia(${adj.sepia}%) 
      invert(${adj.invert}%) 
      hue-rotate(${adj.hue}deg) 
      blur(${adj.blur}px)
    `;

    fCtx.filter = filterString;
    fCtx.drawImage(canvas, 0, 0);
    
    if (adj.gamma !== 1) {
      const imageData = fCtx.getImageData(0, 0, newWidth, newHeight);
      const data = imageData.data;
      const invGamma = 1 / adj.gamma;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 * Math.pow(data[i] / 255, invGamma);
        data[i+1] = 255 * Math.pow(data[i+1] / 255, invGamma);
        data[i+2] = 255 * Math.pow(data[i+2] / 255, invGamma);
      }
      fCtx.putImageData(imageData, 0, 0);
    }
    
    return filterCanvas;
  };

  const handleDownload = async () => {
    const canvas = await generateOutputCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `edited-${file?.name || 'image.png'}`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleCopy = async () => {
    try {
      const canvas = await generateOutputCanvas();
      if (!canvas) return;
      
      const blob = await new Promise<Blob | null>(resolve => 
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Failed to create image blob');

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Failed to copy image to clipboard.");
    }
  };

  if (!file || !imageUrl) {
    return (
      <div className="h-full flex flex-col">
        <div 
          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer min-h-[400px] border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
             e.preventDefault();
             if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
        >
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('common.open_image')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            {t('common.paste_or_drag_image')}
          </p>
          <Button>{t('common.select_file')}</Button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-16rem)] -m-6 bg-gray-100 dark:bg-gray-950 overflow-hidden">
      
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="gamma-filter">
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent={adj.gamma} offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent={adj.gamma} offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent={adj.gamma} offset="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Main Stage */}
      <div className="flex-1 relative flex flex-col min-h-[500px] lg:min-h-0 bg-[#e5e5f7] dark:bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444cf7 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>
        
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden" ref={containerRef}>
          <div className="relative shadow-2xl">
            <canvas 
              ref={canvasRef}
              className="max-w-full max-h-[70vh] object-contain transition-all duration-200"
              style={filterStyle} 
            />
            {isCropping && cropRect && (
              <CropOverlay 
                rect={cropRect}
                containerWidth={displayDims.w}
                containerHeight={displayDims.h}
                onChange={setCropRect}
              />
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
           <Button variant="secondary" size="sm" onClick={() => { setFile(null); setImageUrl(null); }}>
             <X className="w-4 h-4 mr-2" /> {t('common.close')}
           </Button>
        </div>

        {isCropping && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-40">
            <span className="text-sm font-medium">{t('common.adjust_selection')}</span>
            <div className="h-4 w-px bg-gray-700"></div>
            <button onClick={cancelCrop} className="hover:text-red-400 transition-colors"><X size={20} /></button>
            <button onClick={applyCrop} className="text-green-400 hover:text-green-300 transition-colors"><Check size={20} /></button>
          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      <div className={`w-full lg:w-80 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col h-[50vh] lg:h-full z-10 shadow-xl transition-all ${isCropping ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => setMode('transform')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${mode === 'transform' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <CropIcon size={16} /> {t('tool.editor.transform.title')}
          </button>
          <button 
            onClick={() => setMode('adjust')}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${mode === 'adjust' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <SlidersHorizontal size={16} /> {t('tool.editor.adjust.title')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative">
          {/* Overlay Lock Message when cropping */}
          {isCropping && (
             <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-[1px]">
                <div className="bg-gray-900/80 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium">
                   <Lock className="w-4 h-4 mr-2" /> {t('tool.editor.transform.finish_crop_first')}
                </div>
             </div>
          )}

          {mode === 'transform' ? (
            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{t('tool.editor.transform.geometry')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={rotate}>
                    <RotateCw className="w-4 h-4 mr-2" /> {t('tool.editor.transform.rotate_90')}
                  </Button>
                  <Button variant="outline" onClick={startCrop} disabled={isCropping}>
                    <CropIcon className="w-4 h-4 mr-2" /> {t('tool.editor.transform.crop')}
                  </Button>
                  <Button variant="outline" onClick={flipH}>
                    <FlipHorizontal className="w-4 h-4 mr-2" /> {t('tool.editor.transform.flip_h')}
                  </Button>
                  <Button variant="outline" onClick={flipV}>
                    <FlipVertical className="w-4 h-4 mr-2" /> {t('tool.editor.transform.flip_v')}
                  </Button>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('tool.editor.adjust.light_color')}</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-gray-400" />
                    <Slider 
                      value={adj.brightness} 
                      min={0} max={200} 
                      onChange={(e) => updateAdj('brightness', Number(e.target.value))} 
                      className="flex-1"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Contrast className="w-4 h-4 text-gray-400" />
                    <Slider 
                      value={adj.contrast} 
                      min={0} max={200} 
                      onChange={(e) => updateAdj('contrast', Number(e.target.value))} 
                      className="flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Droplet className="w-4 h-4 text-gray-400" />
                    <Slider 
                      value={adj.saturation} 
                      min={0} max={200} 
                      onChange={(e) => updateAdj('saturation', Number(e.target.value))} 
                      className="flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <Slider 
                        label={t('tool.editor.adjust.gamma')}
                        value={adj.gamma} 
                        min={0.2} max={2.2} step={0.1}
                        onChange={(e) => updateAdj('gamma', Number(e.target.value))} 
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('tool.editor.adjust.effects')}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('tool.editor.adjust.grayscale')}</span>
                    <input type="checkbox" checked={adj.grayscale > 0} onChange={(e) => updateAdj('grayscale', e.target.checked ? 100 : 0)} className="rounded text-primary-600 focus:ring-primary-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('tool.editor.adjust.invert')}</span>
                    <input type="checkbox" checked={adj.invert > 0} onChange={(e) => updateAdj('invert', e.target.checked ? 100 : 0)} className="rounded text-primary-600 focus:ring-primary-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{t('tool.editor.adjust.sepia')}</span>
                    <input type="checkbox" checked={adj.sepia > 0} onChange={(e) => updateAdj('sepia', e.target.checked ? 100 : 0)} className="rounded text-primary-600 focus:ring-primary-500" />
                  </div>
                </div>
              </section>

              <Button variant="ghost" size="sm" onClick={() => setAdj(DEFAULT_ADJUSTMENTS)} className="w-full">
                {t('tool.editor.adjust.reset_adjustments')}
              </Button>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-2">
          <Button onClick={handleCopy} variant="secondary" className="flex-1 h-11" disabled={isCropping}>
             {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />} {t('common.copy')}
          </Button>
          <Button onClick={handleDownload} className="flex-[2] h-11 shadow-lg" disabled={isCropping}>
            <Download className="w-4 h-4 mr-2" /> {t('tool.editor.export')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;