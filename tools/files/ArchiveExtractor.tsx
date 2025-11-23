import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Upload, FileArchive, Folder, File as FileIcon,
  ChevronRight, ChevronDown, Download, Lock, FileText,
  Image as ImageIcon, X, AlertCircle, Loader2
} from 'lucide-react';
// @ts-ignore
import * as zip from '@zip.js/zip.js';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  entry?: any; // ZipEntry
  children: FileNode[];
  parent?: FileNode;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ArchiveExtractor: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'image' | 'binary' | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tree Expansion State
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleExpand = (path: string) => {
    const newSet = new Set(expandedPaths);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setExpandedPaths(newSet);
  };

  const handleFileSelect = async (f: File) => {
    setFile(f);
    setRootNode(null);
    setSelectedNode(null);
    setPreviewContent(null);
    setExpandedPaths(new Set());
    setError(null);
    setIsProcessing(true);

    if (f.size === 0) {
      setError("The selected file is empty.");
      setIsProcessing(false);
      return;
    }

    let reader: any = null;

    try {
      reader = new zip.ZipReader(new zip.BlobReader(f));
      const entries = await reader.getEntries();

      // Build Tree
      const root: FileNode = { name: 'Root', path: '', isDir: true, children: [] };
      const nodeMap = new Map<string, FileNode>();
      nodeMap.set('', root);

      entries.forEach((entry: any) => {
        const pathParts = entry.filename.split('/').filter((p: string) => p);
        let currentPath = '';
        let parent = root;

        pathParts.forEach((part: string, index: number) => {
          const isLast = index === pathParts.length - 1;

          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!nodeMap.has(currentPath)) {
            const newNode: FileNode = {
              name: part,
              path: currentPath,
              // If it's the last part, rely on entry.directory. If intermediate, it must be a dir.
              isDir: isLast ? entry.directory : true,
              entry: isLast ? entry : undefined,
              children: [],
              parent: parent
            };
            nodeMap.set(currentPath, newNode);
            parent.children.push(newNode);
          }
          parent = nodeMap.get(currentPath)!;
        });
      });

      // Sort: Folders first, then files
      const sortNode = (node: FileNode) => {
        node.children.sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortNode);
      };
      sortNode(root);

      setRootNode(root);
      // Expand root by default
      setExpandedPaths(new Set(['']));

    } catch (err: any) {
      console.error(err);
      let msg = err.message || t('tool.archive-extractor.unknown_error');
      // Case insensitive check for common zip errors
      if (msg.toLowerCase().includes("end of central directory")) {
        msg = t('tool.archive-extractor.invalid_zip_error');
      }
      setError(t('tool.archive-extractor.read_error', { error: msg }));
    } finally {
      if (reader) {
        try {
          await reader.close();
        } catch (e) {
          console.error("Error closing zip reader", e);
        }
      }
      setIsProcessing(false);
    }
  };

  const handleEntryClick = async (node: FileNode) => {
    if (node.isDir) {
      toggleExpand(node.path);
      return;
    }

    setSelectedNode(node);
    setPreviewContent(null);
    setPreviewType(null);

    // Try to preview if small text or image
    if (node.entry && !node.entry.encrypted) {
      const ext = node.name.split('.').pop()?.toLowerCase();

      if (['txt', 'md', 'json', 'xml', 'js', 'css', 'html', 'ts', 'tsx', 'yml', 'log', 'ini', 'conf'].includes(ext || '')) {
        readEntry(node.entry, 'text');
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext || '')) {
        readEntry(node.entry, 'image');
      } else {
        setPreviewType('binary');
      }
    } else if (node.entry?.encrypted) {
      setPreviewType('binary'); // Locked
    }
  };

  const readEntry = async (entry: any, type: 'text' | 'image' | 'blob', pwd?: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      let data;
      if (type === 'text') {
        const writer = new zip.TextWriter();
        data = await entry.getData(writer, { password: pwd });
        setPreviewContent(data);
        setPreviewType('text');
      } else if (type === 'image') {
        const writer = new zip.BlobWriter();
        const blob = await entry.getData(writer, { password: pwd });
        const url = URL.createObjectURL(blob);
        setPreviewContent(url);
        setPreviewType('image');
      } else {
        // Blob for download
        const writer = new zip.BlobWriter();
        const blob = await entry.getData(writer, { password: pwd });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = entry.filename.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      setShowPasswordModal(false);
      setPassword('');
    } catch (err: any) {
      if (err.message.includes('password') || err.message.includes('encrypted')) {
        setPendingEntry({ entry, type });
        setShowPasswordModal(true);
      } else {
        setError(t('tool.archive-extractor.entry_read_error', { error: err.message }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (pendingEntry) {
      readEntry(pendingEntry.entry, pendingEntry.type, password);
    }
  };

  // --- Recursive Tree Component ---
  const FileTreeNode: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
    // Safety check for null nodes to prevent crashes if recursion logic fails or during unmount
    if (!node) return null;

    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedNode === node;

    // Don't render root container itself, just children
    if (!node.parent && node.name === 'Root') {
      return <>{node.children.map(child => <FileTreeNode key={child.path} node={child} depth={0} />)}</>;
    }

    return (
      <div className="select-none">
        <div
          className={`
            flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors text-sm whitespace-nowrap rounded-md
            ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}
          `}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => handleEntryClick(node)}
        >
          {node.isDir ? (
            <div className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }}>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}

          {node.isDir ? <Folder className="w-4 h-4 text-yellow-500" /> : <FileIcon className="w-4 h-4 text-gray-400" />}

          <span className="truncate">{node.name}</span>

          {node.entry?.encrypted && <Lock className="w-3 h-3 text-orange-400 ml-auto" />}
        </div>

        {/* Recursion */}
        {node.isDir && isExpanded && (
          <div>
            {node.children.map(child => <FileTreeNode key={child.path} node={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    );
  };

  if (!file) {
    return (
      <div className="h-[calc(100vh-16rem)] flex flex-col items-center justify-center">
        <div
          className="w-full max-w-xl flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl cursor-pointer transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
        >
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
            <FileArchive className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('tool.archive-extractor.open_archive')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            {t('tool.archive-extractor.drag_drop_hint')}
          </p>
          <Button>{t('tool.archive-extractor.select_file')}</Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {error && <div className="mt-4 text-red-500 flex items-center gap-2 text-sm"><AlertCircle size={16} /> {error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
            <FileArchive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{file.name}</h3>
            <p className="text-xs text-gray-500">{formatSize(file.size)} • {rootNode ? t('tool.archive-extractor.ready') : t('tool.archive-extractor.loading')}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500">
          <X className="w-4 h-4 mr-2" /> {t('tool.archive-extractor.close')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar: Tree */}
        <Card className="w-1/3 flex flex-col min-w-[250px]" padding="none">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50">
            {t('tool.archive-extractor.file_structure')}
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {rootNode ? (
              <FileTreeNode node={rootNode} depth={0} />
            ) : (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            )}
          </div>
        </Card>

        {/* Preview / Info */}
        <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
          {selectedNode ? (
            <>
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  {selectedNode.isDir ? <Folder className="w-4 h-4 text-yellow-500" /> : <FileIcon className="w-4 h-4 text-gray-400" />}
                  <span className="font-medium text-sm truncate">{selectedNode.name}</span>
                </div>
                {!selectedNode.isDir && (
                  <Button size="sm" variant="secondary" onClick={() => readEntry(selectedNode.entry, 'blob', password)}>
                    <Download className="w-4 h-4 mr-2" /> {t('tool.archive-extractor.download')}
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900 relative">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex flex-col items-center justify-center z-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-2" />
                    <span className="text-sm text-gray-500">{t('tool.archive-extractor.extracting')}</span>
                  </div>
                )}

                {previewType === 'text' && (
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all text-gray-800 dark:text-gray-300">
                    {previewContent}
                  </pre>
                )}

                {previewType === 'image' && (
                  <div className="flex items-center justify-center h-full">
                    <img src={previewContent!} alt={selectedNode.name} className="max-w-full max-h-full object-contain shadow-sm" />
                  </div>
                )}

                {previewType === 'binary' && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {selectedNode.entry?.encrypted && !previewContent ? t('tool.archive-extractor.encrypted_file') : t('tool.archive-extractor.binary_file')}
                    </p>
                    <p className="text-sm max-w-xs">
                      {selectedNode.entry?.encrypted && !previewContent
                        ? t('tool.archive-extractor.decrypt_hint')
                        : t('tool.archive-extractor.preview_unavailable')
                      }
                    </p>
                  </div>
                )}

                {selectedNode.isDir && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                    <Folder className="w-16 h-16 mb-4 opacity-20" />
                    <p>{t('tool.archive-extractor.select_file_to_view')}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FileArchive className="w-16 h-16 mb-4 opacity-20" />
              <p>{t('tool.archive-extractor.select_file_preview')}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-orange-500">
              <Lock className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('tool.archive-extractor.password_required')}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              <Trans i18nKey="tool.archive-extractor.password_prompt" values={{ filename: pendingEntry?.entry.filename }} components={{ strong: <strong /> }} />
            </p>
            <input
              type="password"
              autoFocus
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              placeholder={t('tool.archive-extractor.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowPasswordModal(false); setPendingEntry(null); setPassword(''); }}>{t('tool.archive-extractor.cancel')}</Button>
              <Button onClick={handlePasswordSubmit}>{t('tool.archive-extractor.unlock')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveExtractor;