import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Upload, Download, AlertCircle, X, FileImage, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface IcoImage {
  width: number;
  height: number;
  bitDepth: number;
  size: number;
  url: string;
  type: 'png' | 'bmp';
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const IcoViewer: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<IcoImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup URLs on unmount or when images change
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const parseIco = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    
    // Revoke old URLs
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const data = new DataView(buffer);

      // Read Header (6 bytes)
      const reserved = data.getUint16(0, true);
      const type = data.getUint16(2, true);
      const count = data.getUint16(4, true);

      if (reserved !== 0 || type !== 1) {
        throw new Error(t('tool.ico-viewer.view_ico') + '. ' + t('tool.metadata.no_gps_data'));
      }

      const newImages: IcoImage[] = [];

      for (let i = 0; i < count; i++) {
        const dirOffset = 6 + (i * 16);
        
        let width = data.getUint8(dirOffset);
        let height = data.getUint8(dirOffset + 1);
        // 0 means 256px
        if (width === 0) width = 256;
        if (height === 0) height = 256;

        let bitCount = data.getUint16(dirOffset + 6, true);
        const size = data.getUint32(dirOffset + 8, true);
        const offset = data.getUint32(dirOffset + 12, true);

        // Safety check
        if (offset + size > buffer.byteLength) {
          console.warn(`Image ${i} data exceeds file size, skipping.`);
          continue;
        }

        const imgData = new Uint8Array(buffer, offset, size);
        let blob: Blob;
        let imgType: 'png' | 'bmp' = 'bmp';

        // Check for PNG signature: 89 50 4E 47 0D 0A 1A 0A
        const isPng = 
          imgData[0] === 0x89 && 
          imgData[1] === 0x50 && 
          imgData[2] === 0x4E && 
          imgData[3] === 0x47;

        if (isPng) {
          blob = new Blob([imgData], { type: 'image/png' });
          imgType = 'png';
          // PNGs in ICO store bit depth in the PNG header, usually the dir entry is accurate or 0
          if (bitCount === 0) bitCount = 32; // Assume 32-bit for PNGs if 0
        } else {
          // BMP (DIB)
          // To display a DIB in the browser, we must prepend a BITMAPFILEHEADER (14 bytes)
          
          // DIB Header Analysis to find Pixel Offset
          const biSize = data.getUint32(offset, true); // Header size (usually 40)
          const dibBitCount = data.getUint16(offset + 14, true);
          let biClrUsed = data.getUint32(offset + 32, true);
          
          // Update bitCount from DIB header if valid
          if (dibBitCount > 0) bitCount = dibBitCount;

          // Calculate Palette Size
          if (biClrUsed === 0 && bitCount <= 8) {
             biClrUsed = 1 << bitCount;
          }
          const paletteSize = biClrUsed * 4;
          
          // Construct File Header
          const fileHeader = new DataView(new ArrayBuffer(14));
          fileHeader.setUint8(0, 0x42); // 'B'
          fileHeader.setUint8(1, 0x4D); // 'M'
          fileHeader.setUint32(2, 14 + size, true); // Total File Size
          fileHeader.setUint16(6, 0, true); // Reserved
          fileHeader.setUint16(8, 0, true); // Reserved
          
          // Offset to Pixel Data = FileHeader(14) + DIBHeaderSize + PaletteSize
          const pixelOffset = 14 + biSize + paletteSize;
          fileHeader.setUint32(10, pixelOffset, true);
          
          blob = new Blob([fileHeader.buffer, imgData], { type: 'image/bmp' });
        }

        newImages.push({
          width,
          height,
          bitDepth: bitCount,
          size,
          type: imgType,
          url: URL.createObjectURL(blob)
        });
      }

      setImages(newImages);

    } catch (err: any) {
      console.error(err);
      setError(err.message || t('common.error.general') + ': ' + t('tool.editor.adjust.effects'));
    }
  };

  const handleFileSelect = (f: File) => {
    if (f.name.toLowerCase().endsWith('.ico')) {
      parseIco(f);
    } else {
      setError(t('tool.ico-viewer.view_ico') + '.');
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.name.endsWith('.ico') || pastedFile.type === 'image/x-icon') {
          e.preventDefault();
          handleFileSelect(pastedFile);
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleDownload = (img: IcoImage, index: number) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `${file?.name.split('.')[0]}-${img.width}x${img.height}.${img.type}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (img: IcoImage, index: number) => {
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (e) {
      console.error(e);
      alert(t('common.error.general') + ': ' + t('tool.qr-barcode.scanner.copy_text'));
    }
  };

  if (!file) {
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
            <FileImage className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('tool.ico-viewer.view_ico')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            {t('common.drag_drop_paste_or_click')} .ico.
          </p>
          <Button>{t('common.select_file')}</Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".ico,image/x-icon" 
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
          />
          {error && <p className="mt-4 text-sm text-red-500 flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
             <FileImage className="w-6 h-6" />
          </div>
          <div>
             <h2 className="font-semibold text-gray-900 dark:text-white">{file.name}</h2>
             <div className="text-xs text-gray-500">{images.length} {t('tool.ico-viewer.icons_found')} • {formatBytes(file.size)}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500">
          <X className="w-4 h-4 mr-2" /> {t('common.close')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <Card key={index} className="flex flex-col group overflow-hidden" padding="none">
              <div className="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2U1ZjdkYiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZGIiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==')] dark:bg-none dark:bg-gray-800/50 p-4 flex items-center justify-center relative">
                 <img 
                    src={img.url} 
                    alt={`${img.width}x${img.height}`} 
                    className="max-w-full max-h-full object-contain shadow-sm group-hover:scale-110 transition-transform duration-300" 
                 />
                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">
                      {img.type}
                    </span>
                 </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{img.width} x {img.height}</div>
                      <div className="text-xs text-gray-400">{img.bitDepth}-bit • {formatBytes(img.size)}</div>
                    </div>
                 </div>
                 <div className="flex gap-1">
                   <Button 
                      onClick={() => handleCopy(img, index)} 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1 text-xs h-8 px-0"
                      title={t('tool.qr-barcode.scanner.copy_text')}
                   >
                      {copiedIndex === index ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                   </Button>
                   <Button 
                      onClick={() => handleDownload(img, index)} 
                      variant="secondary" 
                      size="sm" 
                      className="flex-[2] text-xs h-8"
                   >
                      <Download className="w-3 h-3 mr-1" /> {t('tool.ico-viewer.save')}
                   </Button>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IcoViewer;