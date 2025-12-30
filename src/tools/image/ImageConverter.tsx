import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Slider } from '../../components/ui/Slider';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Upload, Download, X, ZoomIn, ZoomOut, Loader2, ArrowLeftRight, AlertCircle, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
type ResizeMode = 'percent' | 'fixed';

interface ImageSettings {
  format: ImageFormat;
  quality: number;
  resizeMode: ResizeMode;
  scale: number;
  width?: number;
  height?: number;
  keepAspectRatio: boolean;
  fillTransparent: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImageConverter: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [processedSize, setProcessedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [copied, setCopied] = useState(false);

  const [settings, setSettings] = useState<ImageSettings>({
    format: 'image/jpeg',
    quality: 0.8,
    resizeMode: 'percent',
    scale: 1,
    keepAspectRatio: true,
    fillTransparent: '#ffffff'
  });

  const [splitPosition, setSplitPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastRequestId = useRef<number>(0);
  const urlsRef = useRef({ original: null as string | null, processed: null as string | null });
  
  useEffect(() => {
    urlsRef.current = { original: originalUrl, processed: processedUrl };
  }, [originalUrl, processedUrl]);

  useEffect(() => {
    return () => {
      if (urlsRef.current.original) URL.revokeObjectURL(urlsRef.current.original);
      if (urlsRef.current.processed) URL.revokeObjectURL(urlsRef.current.processed);
    };
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    lastRequestId.current = Date.now();
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);

    const url = URL.createObjectURL(selectedFile);
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
      setSettings(prev => ({ 
        ...prev, 
        width: img.width, 
        height: img.height,
        scale: 1
      }));
    };
    img.src = url;

    setFile(selectedFile);
    setOriginalUrl(url);
    setOriginalSize(selectedFile.size);
    setProcessedUrl(url);
    setProcessedSize(selectedFile.size);
    setZoom(1);
    setError(null);
  };

  useEffect(() => {
    if (!file || !originalUrl) return;
    const timer = setTimeout(processImage, 400);
    return () => clearTimeout(timer);
  }, [file, originalUrl, settings]);

  const processImage = async () => {
    if (!originalUrl || !file) return;
    const requestId = Date.now();
    lastRequestId.current = requestId;
    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => { 
        img.onload = () => resolve(true); 
        img.onerror = () => reject(new Error('Failed to load'));
        img.src = originalUrl;
      });

      let targetWidth = settings.resizeMode === 'percent' ? Math.round(img.width * settings.scale) : (settings.width || img.width);
      let targetHeight = settings.resizeMode === 'percent' ? Math.round(img.height * settings.scale) : (settings.height || img.height);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (settings.format === 'image/jpeg') {
        ctx.fillStyle = settings.fillTransparent;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), settings.format, settings.quality);
      });

      if (blob && requestId === lastRequestId.current) {
        if (processedUrl && processedUrl !== originalUrl) URL.revokeObjectURL(processedUrl);
        setProcessedUrl(URL.createObjectURL(blob));
        setProcessedSize(blob.size);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (requestId === lastRequestId.current) setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `processed-${file?.name || 'image'}`;
    link.click();
  };

  const handleCopy = async () => {
    if (!processedUrl) return;
    try {
      const img = new Image();
      img.src = processedUrl;
      await new Promise(r => img.onload = r);
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) { alert('Copy failed'); }
  };

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (prev.keepAspectRatio && prev.resizeMode === 'fixed' && dimensions.width > 0) {
        if (key === 'width') next.height = Math.round((value as number) * (dimensions.height / dimensions.width));
        else if (key === 'height') next.width = Math.round((value as number) * (dimensions.width / dimensions.height));
      }
      return next;
    });
  };

  const hasFile = !!(file && originalUrl);

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-16rem)] -m-6 bg-gray-100 dark:bg-gray-950 overflow-hidden">
      
      {/* Main Canvas Area */}
      <div className="flex-1 relative flex flex-col overflow-hidden min-h-[400px] lg:min-h-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2U1ZjdkYiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZGIiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==')] dark:bg-none dark:bg-gray-900">
        
        {!hasFile ? (
          /* Empty State / Upload Dropzone */
          <div 
            className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
            }}
          >
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
              <Upload className="w-10 h-10 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{t('tool.converter.upload_image')}</h3>
            <p className="text-sm text-gray-500">{t('common.drag_drop_paste_or_click')}</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
          </div>
        ) : (
          /* Active Preview State */
          <>
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm rounded-lg p-1.5 pointer-events-auto flex items-center gap-1 border border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="h-8 w-8 p-0"><ZoomOut size={16} /></Button>
                  <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="h-8 w-8 p-0"><ZoomIn size={16} /></Button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="text-xs h-8 px-2">{t('common.fit')}</Button>
              </div>
              <Button variant="secondary" size="sm" className="bg-white/90 dark:bg-gray-800/90 pointer-events-auto text-red-500" onClick={() => {setFile(null); setOriginalUrl(null);}}>
                <X size={16} className="mr-2" /> {t('common.close')}
              </Button>
            </div>

            <div 
              ref={viewportRef}
              className={`flex-1 overflow-auto flex items-center justify-center relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
              onWheel={(e) => { e.preventDefault(); setZoom(z => Math.max(0.1, Math.min(5, z + (-e.deltaY * 0.001)))); }}
              onMouseDown={(e) => { setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY }); }}
              onMouseMove={(e) => {
                if (isPanning && viewportRef.current) {
                  viewportRef.current.scrollLeft -= (e.clientX - panStart.x);
                  viewportRef.current.scrollTop -= (e.clientY - panStart.y);
                  setPanStart({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseUp={() => setIsPanning(false)}
              onMouseLeave={() => setIsPanning(false)}
            >
              <div ref={containerRef} className="relative shadow-2xl" style={{ width: dimensions.width * zoom, height: dimensions.height * zoom }}>
                <img src={originalUrl!} alt="Original" className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}>
                    {processedUrl && <img src={processedUrl} alt="Processed" className="absolute inset-0 w-full h-full object-contain" />}
                </div>
                <div 
                  className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-10"
                  style={{ left: `${splitPosition}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const handleMove = (moveEvent: MouseEvent) => {
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (rect) setSplitPosition(Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100)));
                    };
                    const handleUp = () => { document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 border border-gray-100">
                      <ArrowLeftRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar Controls - Always Visible */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col h-[50vh] lg:h-full z-10 shadow-xl lg:shadow-none">
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar min-h-0">
            {/* Stats */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  <span>{t('tool.converter.compression')}</span>
                  <span className={processedSize < originalSize ? 'text-green-500' : 'text-red-500'}>
                    {hasFile ? `${Math.round((processedSize / originalSize) * 100 - 100)}%` : '0%'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 p-2 text-center">
                    <div className="text-[10px] text-gray-400">{t('common.original')}</div>
                    <div className="font-mono text-sm font-medium">{hasFile ? formatSize(originalSize) : '--'}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-2 text-center relative">
                    <div className="text-[10px] text-gray-400">{t('common.result')}</div>
                    <div className="font-mono text-sm font-medium text-primary-600">{hasFile ? formatSize(processedSize) : '--'}</div>
                    {isProcessing && <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-primary-500" /></div>}
                  </div>
                </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Settings */}
            <div className={`space-y-4 ${!hasFile ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('common.settings')}</h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500">{t('tool.converter.settings.export_format')}</label>
                <SegmentedControl<ImageFormat>
                  variant="grid"
                  value={settings.format}
                  onChange={(val) => updateSetting('format', val)}
                  options={(['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const).map(fmt => ({
                    value: fmt,
                    label: fmt.split('/')[1].toUpperCase().replace('JPEG', 'JPG')
                  }))}
                />
              </div>

              {settings.format !== 'image/png' && (
                  <Slider
                    label={t('tool.converter.settings.quality')}
                    valueDisplay={`${Math.round(settings.quality * 100)}%`}
                    min="0.1" max="1" step="0.01"
                    value={settings.quality}
                    onChange={(e) => updateSetting('quality', parseFloat(e.target.value))}
                  />
              )}

              {settings.format === 'image/jpeg' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500">{t('tool.converter.settings.background_fill')}</label>
                    <div className="flex gap-2">
                        <input type="color" value={settings.fillTransparent} onChange={(e) => updateSetting('fillTransparent', e.target.value)} className="h-8 w-12 rounded border cursor-pointer" />
                        <span className="text-xs font-mono self-center text-gray-500">{settings.fillTransparent}</span>
                    </div>
                  </div>
              )}

              <hr className="border-gray-100 dark:border-gray-800" />

              {/* Resize */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{t('tool.converter.resize.title')}</h3>
                    <SegmentedControl<ResizeMode>
                      size="sm"
                      value={settings.resizeMode}
                      onChange={(v) => updateSetting('resizeMode', v)}
                      options={[{ value: 'percent', label: '%' }, { value: 'fixed', label: 'PX' }]}
                    />
                </div>

                {settings.resizeMode === 'percent' ? (
                  <div className="space-y-1">
                    <Slider
                      label={t('tool.converter.resize.scale')}
                      valueDisplay={`${Math.round(settings.scale * 100)}%`}
                      min="0.1" max="1" step="0.05"
                      value={settings.scale}
                      onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">{t('tool.converter.resize.width')}</label>
                          <input type="number" value={settings.width || 0} onChange={(e) => updateSetting('width', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border rounded bg-transparent" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">{t('tool.converter.resize.height')}</label>
                          <input type="number" value={settings.height || 0} onChange={(e) => updateSetting('height', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm border rounded bg-transparent" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="ratio" checked={settings.keepAspectRatio} onChange={(e) => updateSetting('keepAspectRatio', e.target.checked)} className="rounded text-primary-600" />
                        <label htmlFor="ratio" className="text-xs text-gray-600 select-none">{t('tool.converter.resize.lock_aspect_ratio')}</label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 flex gap-2">
            <Button onClick={handleCopy} disabled={!hasFile || isProcessing} variant="secondary" className="flex-1 h-11 text-sm">
                {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />} {t('common.copy')}
            </Button>
            <Button onClick={handleDownload} disabled={!hasFile || isProcessing} className="flex-[2] h-11 text-sm shadow-lg">
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.processing')}...</> : <><Download className="w-4 h-4 mr-2" /> {t('common.download')}</>}
            </Button>
          </div>
      </div>
    </div>
  );
};

export default ImageConverter;
