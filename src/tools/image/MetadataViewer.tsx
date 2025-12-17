import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { 
  Upload, Image as ImageIcon, Camera, MapPin, FileText, 
  Search, Info, X, Aperture, Zap, Map as MapIcon,
  Calendar, Layers, Monitor
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  width?: number;
  height?: number;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MetadataViewer: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [tags, setTags] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'all' | 'gps'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    setLoading(true);
    setError(null);
    setTags(null);
    setFileInfo(null);
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    
    try {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setFile(selectedFile);

      // Get Basic Info
      const img = new Image();
      img.src = url;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image load fails (might be raw)
      });

      setFileInfo({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      // Dynamic Import for ExifReader to prevent load-time crashes
      // @ts-ignore
      const module = await import('exifreader');
      const ExifReader = module.default || module;

      // Parse EXIF
      const tags = await ExifReader.load(selectedFile, { expanded: true });
      setTags(tags);

    } catch (err: any) {
      console.error(err);
      setError(t('tool.metadata.view_metadata') + '. ' + (err.message || t('common.error.general') + ': ' + t('tool.editor.adjust.effects')));
    } finally {
      setLoading(false);
    }
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
  }, []); // Stable because handleFileSelect updates state

  const getTagValue = (group: string, name: string) => {
    if (!tags) return null;
    // @ts-ignore
    return tags[group]?.[name]?.description || tags[group]?.[name]?.value;
  };

  const getGPS = () => {
    if (!tags || !tags.gps) return null;
    // @ts-ignore
    const lat = tags.gps.Latitude;
    // @ts-ignore
    const lon = tags.gps.Longitude;
    if (!lat || !lon) return null;
    return { lat, lon };
  };

  const renderOverview = () => {
    if (!tags || !fileInfo) return null;

    const cameraMake = getTagValue('exif', 'Make');
    const cameraModel = getTagValue('exif', 'Model');
    const lens = getTagValue('exif', 'LensModel') || getTagValue('exif', 'Lens');
    const iso = getTagValue('exif', 'ISOSpeedRatings');
    const fNumber = getTagValue('exif', 'FNumber');
    const exposure = getTagValue('exif', 'ExposureTime');
    const focalLength = getTagValue('exif', 'FocalLength');
    const date = getTagValue('exif', 'DateTimeOriginal');
    const software = getTagValue('exif', 'Software');

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">{t('tool.metadata.camera')}</div>
              <div className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={cameraModel}>
                {cameraModel || t('common.error.general')}
              </div>
              <div className="text-xs text-gray-400">{cameraMake}</div>
            </div>
          </Card>

          <Card padding="md" className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
              <Aperture className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">{t('tool.metadata.lens')}</div>
              <div className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={lens}>
                {lens || t('common.error.general')}
              </div>
              <div className="text-xs text-gray-400">{focalLength ? `${focalLength} mm` : '-'}</div>
            </div>
          </Card>

          <Card padding="md" className="flex flex-col items-center justify-center text-center space-y-2">
             <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">{t('tool.metadata.settings')}</div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                 {fNumber ? `f/${fNumber}` : ''} {exposure ? `${exposure}s` : ''} {iso ? `ISO${iso}` : ''}
              </div>
              <div className="text-xs text-gray-400">{!fNumber && !exposure && !iso ? t('common.error.general') : t('tool.editor.adjust.light_color')}</div>
            </div>
          </Card>

          <Card padding="md" className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold">{t('tool.metadata.date_taken')}</div>
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {date ? new Date(date).toLocaleDateString() : t('common.error.general')}
              </div>
              <div className="text-xs text-gray-400">{date ? new Date(date).toLocaleTimeString() : '-'}</div>
            </div>
          </Card>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Monitor className="w-5 h-5" /> {t('tool.metadata.file_info')}
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-200 dark:divide-gray-700">
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('tool.metadata.dimensions')}</div>
              <div className="font-mono text-sm">{fileInfo.width ? `${fileInfo.width} x ${fileInfo.height}` : 'N/A'} px</div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('tool.metadata.file_size')}</div>
              <div className="font-mono text-sm">{formatBytes(fileInfo.size)}</div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('tool.metadata.mime_type')}</div>
              <div className="font-mono text-sm truncate" title={fileInfo.type}>{fileInfo.type}</div>
            </div>
             <div className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('tool.metadata.software')}</div>
              <div className="font-mono text-sm truncate" title={software}>{software || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAllTags = () => {
    if (!tags) return null;

    // Flatten tags for table
    let allTags: { group: string; name: string; value: string }[] = [];
    Object.keys(tags).forEach(group => {
      if (group === 'thumbnail') return; // Skip base64 thumbnail
      // @ts-ignore
      const groupObj = tags[group];
      Object.keys(groupObj).forEach(key => {
        let val = groupObj[key].description;
        if (typeof val !== 'string' && typeof val !== 'number') {
           val = JSON.stringify(val);
        }
        allTags.push({ group, name: key, value: String(val) });
      });
    });

    const filtered = allTags.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('tool.dns-records-info.search_placeholder')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        
        <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Tag</th>
                <th className="px-4 py-3 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((t, i) => (
                <tr key={`${t.group}-${t.name}-${i}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{t.group}</td>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-200">{t.name}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 break-all">{t.value}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    {t('tool.dns-records-info.no_records_found')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderGPS = () => {
    const coords = getGPS();
    if (!coords) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 border-dashed">
          <MapIcon className="w-10 h-10 mb-2 opacity-20" />
          <p>{t('tool.metadata.no_gps_data')}</p>
        </div>
      );
    }

    const mapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">{t('tool.metadata.location_data_found')}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Latitude: {coords.lat.toFixed(6)}, Longitude: {coords.lon.toFixed(6)}
            </p>
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
            >
              {t('tool.metadata.open_in_maps')} <Search className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
        
        {/* Simple visual representation if we can't load a real map component without API key */}
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
           <div className="text-center">
             <MapIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
             <p className="text-gray-500 text-sm">{t('tool.browser-info.description')}</p>
           </div>
        </div>
      </div>
    );
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
            <Info className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('tool.metadata.view_metadata')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            {t('common.drag_drop_paste_or_click')}.
          </p>
          <Button>{t('common.upload')}</Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
             <img src={previewUrl!} alt="Thumb" className="w-full h-full object-cover" />
          </div>
          <div>
             <h2 className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{file.name}</h2>
             <div className="text-xs text-gray-500">{formatBytes(file.size)} • {file.type}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500">
          <X className="w-4 h-4 mr-2" /> {t('common.close')}
        </Button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Column: Image Preview */}
        <div className="lg:w-1/3 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex items-center justify-center min-h-[300px]">
             <img src={previewUrl!} alt="Preview" className="max-w-full max-h-[500px] object-contain shadow-sm" />
          </div>
        </div>

        {/* Right Column: Metadata */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
           <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
             <SegmentedControl
               value={view}
               onChange={(v) => setView(v as any)}
               options={[
                 { value: 'overview', label: <><ImageIcon className="w-4 h-4 mr-2" /> {t('tool.metadata.name')}</> },
                 { value: 'all', label: <><Layers className="w-4 h-4 mr-2" /> {t('tool.metadata.all_tags')}</> },
                 { value: 'gps', label: <><MapPin className="w-4 h-4 mr-2" /> {t('tool.metadata.gps')}</> },
               ]}
             />
           </div>

           <div className="flex-1 overflow-y-auto p-6">
              {loading && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {t('common.loading')}
                </div>
              )}
              {!loading && !error && (
                <>
                  {view === 'overview' && renderOverview()}
                  {view === 'all' && renderAllTags()}
                  {view === 'gps' && renderGPS()}
                </>
              )}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataViewer;