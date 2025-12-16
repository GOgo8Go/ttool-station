import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { 
  Upload, FileText, Trash2, ArrowUp, ArrowDown, Merge, 
  Split, RotateCw, Download, CheckCircle, Loader2, X, MousePointerClick
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { useTranslation } from 'react-i18next';

// Handle potential default export structure from esm.sh or other bundlers
const pdfjs = (pdfjsLib as any).GlobalWorkerOptions ? pdfjsLib : (pdfjsLib as any).default;

// Set worker source for PDF.js
if (pdfjs && pdfjs.GlobalWorkerOptions) {
  // Use cdnjs for the worker script as it is more reliable for importScripts usage
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

interface PageThumbnail {
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  url: string;
  isDeleted: boolean;
  isSelected: boolean;
}

interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

const PdfTools: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'merge' | 'edit'>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Merge State ---
  const [mergeFiles, setMergeFiles] = useState<PdfFile[]>([]);

  // --- Edit State ---
  const [editFile, setEditFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [thumbnailScale, setThumbnailScale] = useState(0.25); // Scale for rendering thumbnails

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when switching modes
  useEffect(() => {
    setError(null);
    setIsProcessing(false);
  }, [mode]);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      pages.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [pages]);

  // ----------------------------------------------------------------
  // MERGE LOGIC
  // ----------------------------------------------------------------

  const handleMergeFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: PdfFile[] = Array.from(e.target.files as FileList).map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f as File,
        name: f.name,
        size: f.size
      }));
      setMergeFiles(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const newFiles = [...mergeFiles];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = temp;
    setMergeFiles(newFiles);
  };

  const removeMergeFile = (id: string) => {
    setMergeFiles(prev => prev.filter(f => f.id !== id));
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      setError(t('tool.pdf-tools.errors.merge_min_files'));
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const fileObj of mergeFiles) {
        const arrayBuffer = await fileObj.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page: any) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      downloadPdf(pdfBytes, 'merged-document.pdf');
    } catch (err: any) {
      console.error(err);
      setError(t('tool.pdf-tools.errors.merge_failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------------------
  // EDITOR LOGIC (Split / Rotate / Delete)
  // ----------------------------------------------------------------

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditFile(file);
    setPages([]);
    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Load with PDF.js for rendering
      // Use the resolved `pdfjs` object which might be the default export
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const newPages: PageThumbnail[] = [];

      // Render thumbnails
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnail
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context!,
          viewport: viewport
        }).promise;

        const url = canvas.toDataURL();
        newPages.push({
          pageIndex: i - 1, // 0-based index for pdf-lib compatibility
          rotation: 0,
          url,
          isDeleted: false,
          isSelected: false
        });
      }

      setPages(newPages);
    } catch (err: any) {
      console.error(err);
      setError(t('tool.pdf-tools.errors.load_failed'));
      setEditFile(null);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePageSelection = (idx: number) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, isSelected: !p.isSelected } : p));
  };

  const rotatePage = (idx: number) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const deletePage = (idx: number) => {
    setPages(prev => prev.map((p, i) => i === idx ? { ...p, isDeleted: !p.isDeleted } : p));
  };

  const selectAll = () => {
    const allSelected = pages.every(p => p.isSelected || p.isDeleted);
    setPages(prev => prev.map(p => ({ ...p, isSelected: !allSelected })));
  };

  const saveChanges = async (onlySelected: boolean) => {
    if (!editFile) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await editFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const activePages = pages.filter(p => !p.isDeleted && (!onlySelected || p.isSelected));

      if (activePages.length === 0) {
        throw new Error(t('tool.pdf-tools.errors.no_pages_selected'));
      }

      // We need to copy pages one by one to handle rotation correctly
      // Note: pdf-lib copyPages takes an array of indices
      const indices = activePages.map(p => p.pageIndex);
      const copiedPages = await newPdf.copyPages(srcPdf, indices);

      copiedPages.forEach((page: any, i: number) => {
        const rotationToAdd = activePages[i].rotation;
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + rotationToAdd));
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      const prefix = onlySelected ? 'split-pages' : 'edited';
      downloadPdf(pdfBytes, `${prefix}-${editFile.name}`);

    } catch (err: any) {
      console.error(err);
      setError(err.message || t('tool.pdf-tools.errors.save_failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ----------------------------------------------------------------
  // SHARED UTILS
  // ----------------------------------------------------------------

  const downloadPdf = (bytes: Uint8Array, filename: string) => {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    // 确保我们传递的是 ArrayBuffer 而不是 SharedArrayBuffer
    const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(buffer.byteLength);
    if (!(buffer instanceof ArrayBuffer)) {
      new Uint8Array(arrayBuffer).set(new Uint8Array(buffer));
    }
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ----------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      {/* Header / Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <SegmentedControl
          value={mode}
          onChange={(v) => {
            setMode(v as 'merge' | 'edit');
            setMergeFiles([]);
            setEditFile(null);
            setPages([]);
          }}
          options={[
            { value: 'merge', label: <><Merge className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.merge_pdfs')}</> },
            { value: 'edit', label: <><Split className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.edit_pages')}</> },
          ]}
        />

        <div className="flex gap-2">
           {mode === 'merge' ? (
             <Button onClick={() => fileInputRef.current?.click()}>
               <Upload className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.add_files')}
             </Button>
           ) : (
             !editFile && (
               <Button onClick={() => fileInputRef.current?.click()}>
                 <Upload className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.open_pdf')}
               </Button>
             )
           )}
           <input
            type="file"
            multiple={mode === 'merge'}
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={mode === 'merge' ? handleMergeFilesSelect : handleEditFileSelect}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center">
           <X className="w-5 h-5 mr-2 cursor-pointer" onClick={() => setError(null)} />
           {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 relative">
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">{t('tool.pdf-tools.processing')}</p>
          </div>
        )}

        {/* --- MERGE VIEW --- */}
        {mode === 'merge' && (
          <div className="h-full flex flex-col">
            {mergeFiles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Merge className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('tool.pdf-tools.no_files')}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {mergeFiles.map((f, idx) => (
                    <Card key={f.id} padding="sm" className="flex items-center gap-4 group">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{f.name}</div>
                        <div className="text-xs text-gray-500">{formatSize(f.size)}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" size="sm" 
                          disabled={idx === 0}
                          onClick={() => moveFile(idx, -1)}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="sm" 
                          disabled={idx === mergeFiles.length - 1}
                          onClick={() => moveFile(idx, 1)}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" size="sm" className="text-red-500 hover:bg-red-50"
                          onClick={() => removeMergeFile(f.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                   <Button onClick={executeMerge} disabled={mergeFiles.length < 2} size="lg">
                     <Merge className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.merge_files', { count: mergeFiles.length })}
                   </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- EDITOR VIEW --- */}
        {mode === 'edit' && (
          <div className="h-full flex flex-col">
            {!editFile ? (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Split className="w-16 h-16 mb-4 opacity-20" />
                <p>{t('tool.pdf-tools.no_file_selected')}</p>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2 text-sm">
                   <div className="font-semibold px-2 border-r border-gray-200 dark:border-gray-700 mr-2 hidden sm:block">
                     {editFile.name} <span className="text-gray-400 font-normal">({t('tool.pdf-tools.pages_count', { count: pages.length })})</span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={selectAll}>
                     <CheckCircle className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.select_all_none')}
                   </Button>
                   <div className="flex-1" />
                   <Button variant="secondary" size="sm" onClick={() => setEditFile(null)}>
                     <X className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.close')}
                   </Button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {pages.map((page, idx) => (
                        <div 
                          key={idx} 
                          className={`
                            relative group rounded-lg border-2 overflow-hidden transition-all bg-white dark:bg-gray-800
                            ${page.isDeleted ? 'opacity-40 grayscale border-gray-200 dark:border-gray-700' : 
                              page.isSelected ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-900' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'}
                          `}
                        >
                          {/* Overlay Controls */}
                          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${page.isDeleted ? 'hidden' : ''}`}>
                             <button 
                               onClick={() => rotatePage(idx)}
                               className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600 hover:scale-110 transition-transform"
                               title={t('tool.pdf-tools.rotate')}
                             >
                               <RotateCw size={16} />
                             </button>
                             <button 
                               onClick={() => deletePage(idx)}
                               className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600 hover:scale-110 transition-transform"
                               title={t('tool.pdf-tools.delete')}
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>

                          {/* Restore Button for deleted */}
                          {page.isDeleted && (
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                                <button onClick={() => deletePage(idx)} className="bg-gray-800 text-white px-3 py-1 rounded text-xs">
                                  {t('tool.pdf-tools.restore')}
                                </button>
                             </div>
                          )}

                          {/* Selection Checkbox */}
                          <div 
                             className="absolute top-2 left-2 z-20 cursor-pointer"
                             onClick={() => togglePageSelection(idx)}
                          >
                             <div className={`w-5 h-5 rounded border bg-white flex items-center justify-center ${page.isSelected ? 'border-primary-500 bg-primary-500 text-white' : 'border-gray-400'}`}>
                                {page.isSelected && <CheckCircle size={14} />}
                             </div>
                          </div>

                          {/* Thumbnail */}
                          <div className="aspect-[3/4] p-2 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                             <img 
                               src={page.url} 
                               alt={`${t('tool.pdf-tools.page')} ${idx + 1}`}
                               className="shadow-md object-contain max-h-full max-w-full transition-transform"
                               style={{ transform: `rotate(${page.rotation}deg)` }}
                             />
                          </div>

                          {/* Page Number */}
                          <div className="text-center text-xs py-1 border-t border-gray-100 dark:border-gray-700 text-gray-500">
                            {t('tool.pdf-tools.page')} {idx + 1}
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
                   <div className="text-sm text-gray-500">
                      {t('tool.pdf-tools.selected_count', { count: pages.filter(p => p.isSelected && !p.isDeleted).length })}
                   </div>
                   <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => saveChanges(true)}
                        disabled={pages.filter(p => p.isSelected && !p.isDeleted).length === 0}
                      >
                         <Split className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.extract_selected')}
                      </Button>
                      <Button onClick={() => saveChanges(false)}>
                         <Download className="w-4 h-4 mr-2" /> {t('tool.pdf-tools.save_pdf')}
                      </Button>
                   </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfTools;






