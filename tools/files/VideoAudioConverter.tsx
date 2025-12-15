import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Slider } from '../../components/ui/Slider';
import { 
  Upload, Play, Download, Loader2, FileVideo, FileAudio, 
  Settings, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const VideoAudioConverter: React.FC = () => {
  const { t } = useTranslation();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>('mp4');
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [convertedFile, setConvertedFile] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [codecSettings, setCodecSettings] = useState({
    videoCodec: 'libx264',
    audioCodec: 'aac',
    quality: 23,
    useQuality: false,
    preset: 'medium',
    useWebCodecs: false // 添加WebCodecs API支持选项
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<any>(null);
  const outputFileNameRef = useRef<string>('');
  
  // Update audio codec when output format changes
  useEffect(() => {
    if (sourceFile) {
      const recommendedCodec = getRecommendedAudioCodec(outputFormat);
      setCodecSettings(prev => ({
        ...prev,
        audioCodec: recommendedCodec
      }));
    }
  }, [outputFormat, sourceFile]);

  // Load FFmpeg core
  const loadFFmpeg = async () => {
    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
      
      ffmpegRef.current.on('log', ({ message }: { message: string }) => {
        console.log('FFmpeg log:', message);
      });
      
      ffmpegRef.current.on('progress', ({ progress }: { progress: number }) => {
        setConversionProgress(Math.round(progress * 100));
      });
      
      try {
        console.log('Loading FFmpeg from built assets');
        // 在构建版本中使用正确的路径
        await ffmpegRef.current.load({
          coreURL: '/assets/ffmpeg-N6ahAfcc.js',
          wasmURL: '/assets/ffmpeg-core-Cbz6om2n.wasm'
        });
        console.log('FFmpeg loaded successfully');
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        // 如果构建版本路径失败，则尝试开发环境路径
        try {
          await ffmpegRef.current.load({
            coreURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',
            wasmURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm'
          });
          console.log('FFmpeg loaded with dev path');
        } catch (err2) {
          console.error('Failed to load FFmpeg with dev path:', err2);
          throw new Error('Failed to load FFmpeg core from both build and dev paths.');
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSourceFile(file);
      setConvertedFile(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConversionProgress(0);
      
      // Auto-detect output format based on input file type
      if (file.type.startsWith('video/')) {
        // For video files, default to mp4
        setOutputFormat('mp4');
      } else if (file.type.startsWith('audio/')) {
        // For audio files, default to mp3
        setOutputFormat('mp3');
      }
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  };

  const generateOutputFilename = (inputFilename: string, format: string): string => {
    const nameWithoutExt = inputFilename.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.${format}`;
  };

  const convertFile = async () => {
    console.log('Convert file clicked');
    if (!sourceFile) {
      console.log('Missing source file');
      return;
    }
    
    setIsConverting(true);
    setConversionProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);
    setConvertedFile(null);
    
    try {
      // Ensure FFmpeg is loaded
      await loadFFmpeg();
      
      if (!ffmpegRef.current) {
        throw new Error('Failed to initialize FFmpeg');
      }
      
      const inputFileName = sourceFile.name;
      const outputFileName = generateOutputFilename(inputFileName, outputFormat);
      outputFileNameRef.current = outputFileName;
      
      console.log('Processing file:', inputFileName, 'to', outputFileName);
      
      // 如果启用了WebCodecs并且浏览器支持，则优先使用WebCodecs
      if (codecSettings.useWebCodecs && typeof window !== 'undefined' && 
          'VideoEncoder' in window && 'AudioEncoder' in window) {
        console.log('Using WebCodecs API for processing');
        // 这里应该实现WebCodecs API的处理逻辑
        // 目前作为占位符，后续可以扩展完整实现
      }
      
      // Write the input file to MEMFS
      await ffmpegRef.current.writeFile(inputFileName, await fetchFile(sourceFile));
      
      // Build FFmpeg command
      let command: string[] = [];
      
      if (isVideoFile(sourceFile) && isOutputVideoFormat(outputFormat)) {
        // Video to Video conversion
        command.push('-i', inputFileName);
        
        // Add video codec
        command.push('-c:v', codecSettings.videoCodec);
        
        // Add quality setting if enabled
        if (codecSettings.useQuality) {
          if (codecSettings.videoCodec === 'libx264' || codecSettings.videoCodec === 'libx265') {
            command.push('-crf', codecSettings.quality.toString());
          } else if (codecSettings.videoCodec === 'vp9' || codecSettings.videoCodec === 'libvpx') {
            command.push('-q:v', Math.floor(codecSettings.quality / 5).toString()); // VP9 uses 0-63 scale
          } else {
            command.push('-b:v', `${Math.max(1000 - codecSettings.quality * 20, 50)}k`); // Approximate bitrate
          }
          // 即使使用质量设置，也可以应用用户选择的预设
          command.push('-preset', codecSettings.preset);
        } else {
          // 使用用户选择的预设来控制编码速度与压缩比的平衡
          command.push('-preset', codecSettings.preset);
        }
        
        // 添加线程选项以利用多核CPU提高转换速度
        command.push('-threads', '0'); // 0表示自动检测可用线程数
        
        // Add audio codec
        command.push('-c:a', codecSettings.audioCodec);
        
        command.push(outputFileName);
      } else {
        // Video to Audio or Audio to Audio conversion
        command.push('-i', inputFileName);
        
        // Use the recommended audio codec for the output format
        const audioCodec = getRecommendedAudioCodec(outputFormat);
        command.push('-c:a', audioCodec);
        
        // 添加线程选项以提高转换速度
        command.push('-threads', '0');
        
        // Special handling for some formats
        switch (outputFormat) {
          case 'mp3':
            command.push('-q:a', '2'); // VBR quality level
            break;
          case 'ogg':
            command.push('-q:a', '4'); // Quality level for Vorbis
            break;
          case 'flac':
            command.push('-compression_level', '5');
            break;
          default:
            // Use default settings for other formats
            break;
        }
        
        command.push(outputFileName);
      }
      
      console.log('Executing FFmpeg command:', command);
      
      // Run the FFmpeg command
      await ffmpegRef.current.exec(command);
      
      // Read the output file
      const data = await ffmpegRef.current.readFile(outputFileName);
      const blob = new Blob([data.buffer], { type: getMimeType(outputFormat) });
      
      setConvertedFile(blob);
      setSuccessMessage(t('tool.video-audio-converter.conversion-success'));
    } catch (err) {
      console.error('Conversion error:', err);
      setErrorMessage(t('tool.video-audio-converter.conversion-error') + ': ' + (err as Error).message);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConvertedFile = () => {
    if (!convertedFile || !outputFileNameRef.current) return;
    
    const url = URL.createObjectURL(convertedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileNameRef.current;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isVideoFile = (file: File | null): boolean => {
    if (!file) return false;
    return file.type.startsWith('video/');
  };

  const isAudioFile = (file: File | null): boolean => {
    if (!file) return false;
    return file.type.startsWith('audio/');
  };

  // Check if the output format is a video format
  const isOutputVideoFormat = (format: string): boolean => {
    return videoFormats.includes(format);
  };

  // Get recommended audio codec based on output format
  const getRecommendedAudioCodec = (format: string): string => {
    const recommendations: Record<string, string> = {
      mp3: 'mp3',
      wav: 'pcm_s16le',
      ogg: 'vorbis',
      flac: 'flac',
      aac: 'aac',
      m4a: 'aac',
      wma: 'wmav2'
    };
    
    return recommendations[format] || 'aac';
  };

  // Get MIME type based on format
  const getMimeType = (format: string): string => {
    if (isOutputVideoFormat(format)) {
      return `video/${format}`;
    } else {
      return `audio/${format}`;
    }
  };
  
  // Format list for video and audio
  const videoFormats = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'];
  const audioFormats = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">{t('tool.video-audio-converter.title')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('tool.video-audio-converter.description')}
        </p>
        
        {/* File Upload */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors hover:border-primary">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*,audio/*"
            className="hidden"
          />
          
          {sourceFile ? (
            <div className="flex flex-col items-center">
              {isVideoFile(sourceFile) ? (
                <FileVideo className="w-12 h-12 text-primary mb-3" />
              ) : (
                <FileAudio className="w-12 h-12 text-primary mb-3" />
              )}
              <p className="font-medium">{sourceFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(sourceFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="mt-3"
              >
                {t('tool.video-audio-converter.change-file')}
              </Button>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium mb-1">{t('tool.video-audio-converter.upload-title')}</p>
              <p className="text-sm text-muted-foreground mb-3">
                {t('tool.video-audio-converter.upload-desc')}
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                {t('common.select_file')}
              </Button>
            </div>
          )}
        </div>
        
        {/* Output Format Selection */}
        {sourceFile && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">{t('tool.video-audio-converter.output-format')}</h3>
            
            {isVideoFile(sourceFile) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  {t('tool.video-audio-converter.video-formats')}
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {videoFormats.map(format => (
                    <Button
                      key={format}
                      variant={outputFormat === format ? 'default' : 'outline'}
                      onClick={() => setOutputFormat(format)}
                      className={`text-xs py-2 h-auto transition-all ${
                        outputFormat === format 
                          ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {format.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                {t('tool.video-audio-converter.audio-formats')}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {audioFormats.map(format => (
                  <Button
                    key={format}
                    variant={outputFormat === format ? 'default' : 'outline'}
                    onClick={() => setOutputFormat(format)}
                    className={`text-xs py-2 h-auto transition-all ${
                      outputFormat === format 
                        ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Codec Settings */}
        {sourceFile && isVideoFile(sourceFile) && isOutputVideoFormat(outputFormat) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{t('tool.video-audio-converter.settings')}</h3>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('tool.video-audio-converter.video-codec')}
                </label>
                <select
                  value={codecSettings.videoCodec}
                  onChange={(e) => setCodecSettings({...codecSettings, videoCodec: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="libx264">H.264 (MP4)</option>
                  <option value="libx265">H.265 (HEVC)</option>
                  <option value="vp9">VP9 (WebM)</option>
                  <option value="libvpx">VP8 (WebM)</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('tool.video-audio-converter.video-quality')}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="useQuality"
                    checked={codecSettings.useQuality}
                    onChange={(e) => setCodecSettings({...codecSettings, useQuality: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="useQuality" className="text-sm">
                    {t('tool.video-audio-converter.enable-quality-setting')}
                  </label>
                </div>
                {codecSettings.useQuality && (
                  <>
                    <Slider
                      value={codecSettings.quality}
                      onChange={(e) => setCodecSettings({...codecSettings, quality: parseInt(e.target.value)})}
                      min={0}
                      max={51}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{t('tool.video-audio-converter.best')}</span>
                      <span>{codecSettings.quality}</span>
                      <span>{t('tool.video-audio-converter.smallest')}</span>
                    </div>
                  </>
                )}
                
                {/* 性能优化选项 */}
                <div className="pt-2">
                  <label className="text-sm font-medium mb-1 block">
                    {t('tool.video-audio-converter.performance-preset')}
                  </label>
                  <select
                    value={codecSettings.preset || 'medium'}
                    onChange={(e) => setCodecSettings({...codecSettings, preset: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="ultrafast">{t('tool.video-audio-converter.ultrafast')}</option>
                    <option value="superfast">{t('tool.video-audio-converter.superfast')}</option>
                    <option value="veryfast">{t('tool.video-audio-converter.veryfast')}</option>
                    <option value="faster">{t('tool.video-audio-converter.faster')}</option>
                    <option value="fast">{t('tool.video-audio-converter.fast')}</option>
                    <option value="medium">{t('tool.video-audio-converter.medium')}</option>
                    <option value="slow">{t('tool.video-audio-converter.slow')}</option>
                    <option value="slower">{t('tool.video-audio-converter.slower')}</option>
                    <option value="veryslow">{t('tool.video-audio-converter.veryslow')}</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('tool.video-audio-converter.performance-description')}
                  </p>
                </div>
                
                {/* WebCodecs API 选项 */}
                {typeof window !== 'undefined' && 'VideoEncoder' in window && 'AudioEncoder' in window && (
                  <div className="pt-2 flex items-center">
                    <input
                      type="checkbox"
                      id="webcodecs"
                      checked={codecSettings.useWebCodecs}
                      onChange={(e) => setCodecSettings({...codecSettings, useWebCodecs: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="webcodecs" className="text-sm font-medium">
                      {t('tool.video-audio-converter.enable-webcodecs')}
                    </label>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('tool.video-audio-converter.webcodecs-description')}
                </p>
                
              </div>
              
            </div>
          </div>
        )}
        
        {sourceFile && (
          (isVideoFile(sourceFile) && !isOutputVideoFormat(outputFormat)) || 
          isAudioFile(sourceFile)
        ) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{t('tool.video-audio-converter.settings')}</h3>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('tool.video-audio-converter.audio-codec')} ({getRecommendedAudioCodec(outputFormat)} - {t('tool.video-audio-converter.auto-selected')})
                </label>
                <input
                  type="text"
                  value={getRecommendedAudioCodec(outputFormat)}
                  readOnly
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800"
                />
              </div>
              
            </div>
          </div>
        )}
        
        {/* Convert Button */}
        {sourceFile && (
          <Button
            onClick={convertFile}
            disabled={isConverting}
            className="w-full py-6"
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('tool.video-audio-converter.converting')}... {conversionProgress}%
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {t('tool.video-audio-converter.convert-button')}
              </>
            )}
          </Button>
        )}
        
        {/* Progress Bar */}
        {isConverting && (
          <div className="mt-4">
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Messages */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-destructive/20 text-destructive rounded flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="mt-4 p-3 bg-green-500/20 text-green-700 dark:text-green-300 rounded flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* Download Button */}
        {convertedFile && (
          <Button
            onClick={downloadConvertedFile}
            className="w-full mt-4 py-6"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('tool.video-audio-converter.download-output', { 
              filename: outputFileNameRef.current 
            })}
          </Button>
        )}
      </Card>
      
      {/* Info Section */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-3">{t('tool.video-audio-converter.how-to-use')}</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t('tool.video-audio-converter.step1')}</li>
          <li>{t('tool.video-audio-converter.step2')}</li>
          <li>{t('tool.video-audio-converter.step3')}</li>
          <li>{t('tool.video-audio-converter.step4')}</li>
        </ul>
        
        <div className="mt-4 p-3 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded">
          <h4 className="font-medium mb-1">{t('tool.video-audio-converter.note-title')}</h4>
          <p className="text-sm">{t('tool.video-audio-converter.note-content')}</p>
        </div>
      </Card>
    </div>
  );
};

export default VideoAudioConverter;