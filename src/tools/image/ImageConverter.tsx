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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!file) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom(z => Math.min(5, z + 0.1));
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(0.1, z - 0.1));
      }
      if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file]);

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
    img.onerror = () => setError(t('common.error.general') + ': ' + t('tool.converter.failed_to_load_dimensions'));
    img.src = url;

    setFile(selectedFile);
    setOriginalUrl(url);
    setOriginalSize(selectedFile.size);
    setProcessedUrl(url);
    setProcessedSize(selectedFile.size);
    setZoom(1);
    setError(null);
    setCopied(false);

    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (!file || !originalUrl) return;
    const timer = setTimeout(processImage, 400);
    return () => clearTimeout(timer);
  }, [file, originalUrl, settings]);

  const processImage = async () => {
    if (!originalUrl || !file) return;

    const requestId = Date.now();
    lastRequestId.current = requestId;
    setIsProcessing(true);
    setError(null);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error(t('common.error.general') + ': ' + t('tool.converter.failed_to_load_original')));
        img.src = originalUrl;
      });

      let targetWidth = img.width;
      let targetHeight = img.height;

      if (settings.resizeMode === 'percent') {
        targetWidth = Math.round(img.width * settings.scale);
        targetHeight = Math.round(img.height * settings.scale);
      } else if (settings.resizeMode === 'fixed' && settings.width && settings.height) {
        targetWidth = settings.width;
        targetHeight = settings.height;
      }

      if (targetWidth <= 0) targetWidth = 1;
      if (targetHeight <= 0) targetHeight = 1;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(t('tool.converter.canvas_context_failed'));

      if (settings.format === 'image/jpeg') {
        ctx.fillStyle = settings.fillTransparent;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), settings.format, settings.quality);
      });

      if (!blob) throw new Error(t('tool.converter.conversion_failed'));

      if (requestId === lastRequestId.current) {
        if (processedUrl && processedUrl !== originalUrl) URL.revokeObjectURL(processedUrl);
        const newUrl = URL.createObjectURL(blob);
        setProcessedUrl(newUrl);
        setProcessedSize(blob.size);
      }
    } catch (err: any) {
      if (requestId === lastRequestId.current) {
        console.error('Processing failed:', err);
        setError(err.message || t('common.error.general') + ': ' + t('tool.converter.unexpected_error'));
      }
    } finally {
      if (requestId === lastRequestId.current) setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl || !file) return;
    const link = document.createElement('a');
    link.href = processedUrl;
    const ext = settings.format.split('/')[1].replace('jpeg', 'jpg');
    link.download = `processed-${file.name.split('.')[0]}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!processedUrl || !file) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = processedUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(t('tool.converter.failed_to_load_processed')));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(t('tool.converter.canvas_context_failed'));

      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error(t('tool.converter.png_blob_failed'));

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      alert(t('tool.converter.copy_failed') + (err instanceof Error ? err.message : ''));
    }
  };

  const updateSetting = <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      if (prev.keepAspectRatio && prev.resizeMode === 'fixed' && dimensions.width > 0) {
        const ratio = dimensions.height / dimensions.width;
        if (key === 'width') {
          next.height = Math.round((value as number) * ratio);
        } else if (key === 'height') {
          next.width = Math.round((value as number) / ratio);
        }
      }
      return next;
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(z => Math.max(0.1, Math.min(5, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.slider-handle')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && viewportRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      viewportRef.current.scrollLeft -= dx;
      viewportRef.current.scrollTop -= dy;
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleClose = () => {
    setFile(null);
    setOriginalUrl(null);
    setProcessedUrl(null);
    setError(null);
    setDimensions({ width: 0, height: 0 });
    setOriginalSize(0);
    setProcessedSize(0);
    setZoom(1);
    setSplitPosition(50);
  };

  const hasImage = !!file && !!originalUrl;

  // ==================== 关键：没有了早返回的 if 判断！始终渲染完整布局 ====================
  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-16rem)] -m-6 bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* 左侧：预览区（有图显示对比，无图显示上传提示） */}
      <div className="flex-1 relative flex flex-col overflow-hidden min-h-[400px] lg:min-h-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2U1ZjdkYiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZGIiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==')] dark:bg-none dark:bg-gray-900">
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm rounded-lg p-1.5 pointer-events-auto flex items-center gap-1 border border-gray-200 dark:border-gray-700">
            {hasImage && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="h-8 w-8 p-0"><ZoomOut size={16} /></Button>
                <span className="text-xs font-mono w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="h-8 w-8 p-0"><ZoomIn size={16} /></Button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="text-xs h-8 px-2">{t('common.fit')}</Button>
              </>
            )}
          </div>
          {hasImage && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-sm pointer-events-auto text-red-500 hover:text-red-600 border border-gray-200 dark:border-gray-700"
              onClick={handleClose}
            >
              <X size={16} className="mr-2" /> {t('common.close')}
            </Button>
          )}
        </div>

        <div
          ref={viewportRef}
          className={`flex-1 overflow-auto flex items-center justify-center relative ${hasImage ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          onWheel={hasImage ? handleWheel : undefined}
          onMouseDown={hasImage ? handleMouseDown : undefined}
          onMouseMove={hasImage ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {hasImage ? (
            /* 有图片：显示对比视图 */
            <div
              ref={containerRef}
              className="relative shadow-2xl transition-transform duration-75 ease-out origin-center"
              style={{
                width: dimensions.width * zoom,
                height: dimensions.height * zoom,
              }}
            >
              <img src={originalUrl!} alt="Original" className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" draggable={false} />
              <div className="absolute inset-0 overflow-hidden select-none pointer-events-none" style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}>
                {processedUrl && <img src={processedUrl} alt="Processed" className="absolute inset-0 w-full h-full object-contain" draggable={false} />}
              </div>
              <div
                className="slider-handle absolute inset-y-0 w-1 bg-white cursor-ew-resize hover:bg-primary-400 active:bg-primary-500 transition-colors z-10 group"
                style={{ left: `${splitPosition}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const container = containerRef.current;
                  if (!container) return;
                  const handleMove = (moveEvent: MouseEvent) => {
                    const rect = container.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                    setSplitPosition(percent);
                  };
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                    setIsDraggingSlider(false);
                  };
                  setIsDraggingSlider(true);
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform border border-gray-100">
                  <ArrowLeftRight size={16} />
                </div>
              </div>
            </div>
          ) : (
            /* 无图片：显示上传提示 */
            <div
              className="flex flex-col items-center justify-center text-center p-8 cursor-pointer w-full h-full"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
              }}
            >
              <div className="p-6 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
                <Upload className="w-16 h-16 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t('tool.converter.upload_image')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                {t('common.drag_drop_paste_or_click')}
              </p>
              <Button size="lg">{t('common.select_file')}</Button>
            </div>
          )}
        </div>

        {hasImage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 text-xs bg-black/50 text-white px-2 py-1 rounded">
            {t('common.scroll_to_zoom_drag_to_pan')}
          </div>
        )}
      </div>

      {/* 右侧控制面板：始终显示！ */}
      <div className="w-full lg:w-80 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col h-[50vh] lg:h-full shadow-xl lg:shadow-none">
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar min-h-0">
          {/* 统计信息 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              <span>{t('tool.converter.compression')}</span>
              <span className={hasImage && processedSize < originalSize ? 'text-green-500' : 'text-gray-400'}>
                {hasImage ? `${Math.round((processedSize / originalSize) * 100 - 100)}%` : '0%'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <div className="bg-white dark:bg-gray-800 p-2 text-center">
                <div className="text-[10px] text-gray-400">{t('common.original')}</div>
                <div className="font-mono text-sm font-medium">{formatSize(originalSize)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 text-center relative overflow-hidden">
                <div className="text-[10px] text-gray-400">{t('common.result')}</div>
                <div className="font-mono text-sm font-medium text-primary-600 dark:text-primary-400">{formatSize(processedSize)}</div>
                {isProcessing && <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10"><Loader2 className="w-4 h-4 animate-spin text-primary-500" /></div>}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800/30 flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="leading-tight">{error}</span>
            </div>
          )}

          {/* 设置区域 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('common.settings')}</h3>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('tool.converter.settings.export_format')}</label>
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
                min="0.1"
                max="1"
                step="0.01"
                value={settings.quality}
                onChange={(e) => updateSetting('quality', parseFloat(e.target.value))}
              />
            )}

            {settings.format === 'image/jpeg' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('tool.converter.settings.background_fill')}</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.fillTransparent} onChange={(e) => updateSetting('fillTransparent', e.target.value)} className="h-8 w-12 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
                  <span className="text-xs font-mono self-center text-gray-500">{settings.fillTransparent}</span>
                </div>
              </div>
            )}
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* 调整大小 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('tool.converter.resize.title')}</h3>
              <SegmentedControl<ResizeMode>
                size="sm"
                value={settings.resizeMode}
                onChange={(v) => updateSetting('resizeMode', v)}
                options={[
                  { value: 'percent', label: '%' },
                  { value: 'fixed', label: 'PX' }
                ]}
              />
            </div>

            {settings.resizeMode === 'percent' ? (
              <div className="space-y-1">
                <Slider
                  label={t('tool.converter.resize.scale')}
                  valueDisplay={`${Math.round(settings.scale * 100)}%`}
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.scale}
                  onChange={(e) => updateSetting('scale', parseFloat(e.target.value))}
                />
                {hasImage && (
                  <div className="text-xs text-gray-400 text-center font-mono mt-1">
                    {Math.round(dimensions.width * settings.scale)} x {Math.round(dimensions.height * settings.scale)}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{t('tool.converter.resize.width')}</label>
                    <input
                      type="number"
                      value={settings.width ?? ''}
                      onChange={(e) => updateSetting('width', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-transparent dark:border-gray-700"
                      disabled={!hasImage}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">{t('tool.converter.resize.height')}</label>
                    <input
                      type="number"
                      value={settings.height ?? ''}
                      onChange={(e) => updateSetting('height', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border rounded bg-transparent dark:border-gray-700"
                      disabled={!hasImage}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ratio"
                    checked={settings.keepAspectRatio}
                    onChange={(e) => updateSetting('keepAspectRatio', e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="ratio" className="text-xs text-gray-600 dark:text-gray-300 select-none">{t('tool.converter.resize.lock_aspect_ratio')}</label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex-shrink-0 p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 flex gap-2">
          <Button onClick={handleCopy} disabled={!hasImage || isProcessing || !!error} variant="secondary" className="flex-1 h-11 text-sm">
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />} {t('common.copy')}
          </Button>
          <Button onClick={handleDownload} disabled={!hasImage || isProcessing || !!error} className="flex-[2] h-11 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.processing')}...</> : <><Download className="w-4 h-4 mr-2" /> {t('common.download')}</>}
          </Button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
      />
    </div>
  );
};

export default ImageConverter;
