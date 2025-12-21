import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { loadFFmpeg } from '../../utils/ffmpegLoader';
import {
  Play, Download, Loader2, FileVideo, FileAudio,
  AlertCircle, ChevronDown, ChevronRight, Folder, FileIcon,
  Upload, Trash2, Terminal as TerminalIcon, RefreshCw,
  Plus, FolderPlus, FolderMinus, Eye, Edit3
} from 'lucide-react';
import JSZip from 'jszip';

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  file?: File;
  children: FileNode[];
  parent?: FileNode;
}

const FFmpegTool: React.FC = () => {
  const { t } = useTranslation();
  const [command, setCommand] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isFfmpegLoading, setIsFfmpegLoading] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [rootNode, setRootNode] = useState<FileNode | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  interface SelectedFile {
    file: File;
    path: string;
  }
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('.');
  const [lastUploadedFile, setLastUploadedFile] = useState<string>('input.mp4');
  const [outputFiles, setOutputFiles] = useState<{name: string, data: Uint8Array}[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('format_conversion');
  const [functionConfig, setFunctionConfig] = useState<Record<string, any>>({});
  const [ffmpegVersion, setFfmpegVersion] = useState<'single' | 'multi'>('single');
  const [commandType, setCommandType] = useState<'ffmpeg' | 'ffprobe'>('ffmpeg');
  
  const ffmpegRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [dragOverNode, setDragOverNode] = useState<FileNode | null>(null);

  // Initialize FFmpeg and load file system
  useEffect(() => {
    const initFFmpeg = async () => {
      setIsFfmpegLoading(true);
      try {
        const useMultithreading = ffmpegVersion === 'multi';
        ffmpegRef.current = await loadFFmpeg(useMultithreading);
        
        // Set up event listeners
        ffmpegRef.current.on('log', ({ message }: { message: string }) => {
          setLogs(prev => [...prev, message]);
        });
        
        ffmpegRef.current.on('progress', ({ progress, time }: { progress: number; time: number }) => {
          const percentage = Math.round(progress * 100);
          setExecutionProgress(percentage);
          setLogs(prev => [...prev, `Progress: ${percentage}% (transcoded time: ${time / 1000000} s)`]);
        });

        // Load initial file system
        await loadFileSystem();
        setLogs(prev => [...prev, 'FFmpeg loaded successfully']);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        setLogs(prev => [...prev, `Error loading FFmpeg: ${(error as Error).message}`]);
        throw error;
      } finally {
        setIsFfmpegLoading(false);
      }
    };

    initFFmpeg();
  }, []);

  // Reload FFmpeg when version changes
  useEffect(() => {
    if (rootNode) {
      // Clear existing FFmpeg instance
      ffmpegRef.current = null;
      // Set loading state
      setIsFfmpegLoading(true);
      // Reinitialize with new version
      const initFFmpeg = async () => {
        try {
          const useMultithreading = ffmpegVersion === 'multi';
          ffmpegRef.current = await loadFFmpeg(useMultithreading);
          
          // Set up event listeners
          ffmpegRef.current.on('log', ({ message }: { message: string }) => {
            setLogs(prev => [...prev, message]);
          });
          
          ffmpegRef.current.on('progress', ({ progress, time }: { progress: number; time: number }) => {
            const percentage = Math.round(progress * 100);
            setExecutionProgress(percentage);
            setLogs(prev => [...prev, `Progress: ${percentage}% (transcoded time: ${time / 1000000} s)`]);
          });

          // Refresh file system with new FFmpeg instance
          await refreshFileSystem();
          setLogs(prev => [...prev, `FFmpeg ${ffmpegVersion === 'multi' ? 'multi-thread' : 'single-thread'} loaded successfully`]);
        } catch (error) {
          console.error('Failed to reload FFmpeg:', error);
          setLogs(prev => [...prev, `Error loading FFmpeg: ${(error as Error).message}`]);
        } finally {
          setIsFfmpegLoading(false);
        }
      };

      initFFmpeg();
    }
  }, [ffmpegVersion]);

  // Update active category when switching between ffmpeg/ffprobe
  useEffect(() => {
    if (commandType === 'ffprobe') {
      setActiveCategory('quick_commands');
    }
  }, [commandType]);

  // Load file system from FFmpeg WASM
  const loadFileSystem = async (path: string = '.') => {
    if (!ffmpegRef.current) return;

    try {
      const files = await ffmpegRef.current.listDir(path);
      const root: FileNode = { name: path === '.' ? 'Root' : path.split('/').pop() || 'Root', path: path, isDir: true, children: [] };
      const nodeMap = new Map<string, FileNode>();
      nodeMap.set(path, root);

      files.forEach((file: any) => {
        if (file.name === '.' || file.name === '..') return;
        
        // 隐藏根目录下的 dev 和 proc 目录
        if (path === '.' && file.isDir && (file.name === 'dev' || file.name === 'proc')) {
          return;
        }
        
        const fullPath = path === '.' ? file.name : `${path}/${file.name}`;
        const newNode: FileNode = {
          name: file.name,
          path: fullPath,
          isDir: file.isDir,
          children: [],
          parent: root
        };
        nodeMap.set(fullPath, newNode);
        root.children.push(newNode);
      });

      // Sort: folders first, then files
      root.children.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      setRootNode(root);
      setExpandedPaths(new Set([path])); // Expand current path by default
    } catch (error) {
      console.error('Failed to load file system:', error);
      // Create empty root node if no files exist
      setRootNode({ name: path === '.' ? 'Root' : path.split('/').pop() || 'Root', path: path, isDir: true, children: [] });
      setExpandedPaths(new Set([path]));
    }
  };

  // Load subdirectory files
  const loadSubdirectory = async (node: FileNode) => {
    if (!ffmpegRef.current || !node.isDir) return;

    try {
      const files = await ffmpegRef.current.listDir(node.path);
      const updatedNode: FileNode = { ...node, children: [] };

      files.forEach((file: any) => {
        if (file.name === '.' || file.name === '..') return;
        
        // 隐藏根目录下的 dev 和 proc 目录
        if (node.path === '.' && file.isDir && (file.name === 'dev' || file.name === 'proc')) {
          return;
        }
        
        const fullPath = node.path === '.' ? file.name : `${node.path}/${file.name}`;
        const newNode: FileNode = {
          name: file.name,
          path: fullPath,
          isDir: file.isDir,
          children: [],
          parent: updatedNode
        };
        updatedNode.children.push(newNode);
      });

      // Sort: folders first, then files
      updatedNode.children.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      // Update the tree structure
      const updateNodeInTree = (currentNode: FileNode): FileNode => {
        if (currentNode.path === node.path) {
          return updatedNode;
        }
        
        if (currentNode.children && currentNode.children.length > 0) {
          return {
            ...currentNode,
            children: currentNode.children.map(updateNodeInTree)
          };
        }
        
        return currentNode;
      };

      if (rootNode) {
        const updatedRoot = updateNodeInTree(rootNode);
        setRootNode(updatedRoot);
      }
    } catch (error) {
      console.error('Failed to load subdirectory:', error);
    }
  };

  // Refresh file system
  const refreshFileSystem = async (expandPath: string | null = null) => {
    // Simply reload the entire file system from root
    await loadFileSystem();
    
    // If we have a specific path to ensure is expanded, we'll handle it separately
    if (expandPath && expandPath !== '.') {
      // Expand the target path and all its parents
      const newExpandedPaths = new Set<string>();
      newExpandedPaths.add('.'); // Always expand root
      
      const parts = expandPath.split('/');
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        newExpandedPaths.add(currentPath);
      }
      
      setExpandedPaths(newExpandedPaths);
      
      // Now load subdirectories for the expanded paths
      if (rootNode) {
        const loadExpandedSubdirs = async (node: FileNode) => {
          if (newExpandedPaths.has(node.path) && node.isDir) {
            await loadSubdirectory(node);
            for (const child of node.children) {
              await loadExpandedSubdirs(child);
            }
          }
        };
        
        // Note: This still has the same async state issue, but for most cases it should work
        // For a more robust solution, we'd need to restructure the file system loading
        setTimeout(async () => {
          if (rootNode) {
            await loadExpandedSubdirs(rootNode);
          }
        }, 0);
      }
    }
  };

  // 定义功能类别
  const categories = [
    { id: 'quick_commands', name: t('tool.ffmpeg.categories.quick_commands') },
    { id: 'format_conversion', name: t('tool.ffmpeg.categories.format_conversion') },
    { id: 'video_processing', name: t('tool.ffmpeg.categories.video_processing') },
    { id: 'audio_processing', name: t('tool.ffmpeg.categories.audio_processing') },
    { id: 'filters', name: t('tool.ffmpeg.categories.filters') },
    { id: 'streaming', name: t('tool.ffmpeg.categories.streaming') },
    { id: 'advanced_video', name: t('tool.ffmpeg.categories.advanced_video') },
    { id: 'effects', name: t('tool.ffmpeg.categories.effects') },
    { id: 'text_graphics', name: t('tool.ffmpeg.categories.text_graphics') },
  ];

  // 定义FFmpeg功能
  const ffmpeg_functions = {
    quick_commands: [
      { id: 'convert_video', name: t('tool.ffmpeg.functions.convert_video'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'convert_audio', name: t('tool.ffmpeg.functions.convert_audio'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'convert_container', name: t('tool.ffmpeg.functions.convert_container'), icon: FileIcon, tool: 'ffmpeg' },
      { id: 'resize', name: t('tool.ffmpeg.functions.resize'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'trim', name: t('tool.ffmpeg.functions.trim'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'crop', name: t('tool.ffmpeg.functions.crop'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'rotate', name: t('tool.ffmpeg.functions.rotate'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'watermark', name: t('tool.ffmpeg.functions.watermark'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'extract_audio', name: t('tool.ffmpeg.functions.extract_audio'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'mix_audio', name: t('tool.ffmpeg.functions.mix_audio'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'adjust_volume', name: t('tool.ffmpeg.functions.adjust_volume'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'brightness_contrast', name: t('tool.ffmpeg.functions.brightness_contrast'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'denoise', name: t('tool.ffmpeg.functions.denoise'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'deinterlace', name: t('tool.ffmpeg.functions.deinterlace'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'hls_segment', name: t('tool.ffmpeg.functions.hls_segment'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'dash_segment', name: t('tool.ffmpeg.functions.dash_segment'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'concat_videos', name: t('tool.ffmpeg.functions.concat_videos'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_speed', name: t('tool.ffmpeg.functions.video_speed'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_loop', name: t('tool.ffmpeg.functions.video_loop'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_stabilize', name: t('tool.ffmpeg.functions.video_stabilize'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_reverse', name: t('tool.ffmpeg.functions.video_reverse'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'fade_in_out', name: t('tool.ffmpeg.functions.fade_in_out'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'image_overlay', name: t('tool.ffmpeg.functions.image_overlay'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'picture_in_picture', name: t('tool.ffmpeg.functions.picture_in_picture'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'ken_burns_effect', name: t('tool.ffmpeg.functions.ken_burns_effect'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'add_subtitle', name: t('tool.ffmpeg.functions.add_subtitle'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'add_text', name: t('tool.ffmpeg.functions.add_text'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'draw_box', name: t('tool.ffmpeg.functions.draw_box'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'generate_video_from_image', name: t('tool.ffmpeg.functions.generate_video_from_image'), icon: FileVideo, tool: 'ffmpeg' },
    ],
    format_conversion: [
      { id: 'convert_video', name: t('tool.ffmpeg.functions.convert_video'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'convert_audio', name: t('tool.ffmpeg.functions.convert_audio'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'convert_container', name: t('tool.ffmpeg.functions.convert_container'), icon: FileIcon, tool: 'ffmpeg' },
    ],
    video_processing: [
      { id: 'resize', name: t('tool.ffmpeg.functions.resize'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'trim', name: t('tool.ffmpeg.functions.trim'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'crop', name: t('tool.ffmpeg.functions.crop'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'rotate', name: t('tool.ffmpeg.functions.rotate'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'watermark', name: t('tool.ffmpeg.functions.watermark'), icon: FileVideo, tool: 'ffmpeg' },
    ],
    audio_processing: [
      { id: 'extract_audio', name: t('tool.ffmpeg.functions.extract_audio'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'mix_audio', name: t('tool.ffmpeg.functions.mix_audio'), icon: FileAudio, tool: 'ffmpeg' },
      { id: 'adjust_volume', name: t('tool.ffmpeg.functions.adjust_volume'), icon: FileAudio, tool: 'ffmpeg' },
    ],
    filters: [
      { id: 'brightness_contrast', name: t('tool.ffmpeg.functions.brightness_contrast'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'denoise', name: t('tool.ffmpeg.functions.denoise'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'deinterlace', name: t('tool.ffmpeg.functions.deinterlace'), icon: FileVideo, tool: 'ffmpeg' },
    ],
    streaming: [
      { id: 'hls_segment', name: t('tool.ffmpeg.functions.hls_segment'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'dash_segment', name: t('tool.ffmpeg.functions.dash_segment'), icon: FileVideo, tool: 'ffmpeg' },
    ],
    advanced_video: [
      { id: 'concat_videos', name: t('tool.ffmpeg.functions.concat_videos'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_speed', name: t('tool.ffmpeg.functions.video_speed'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_loop', name: t('tool.ffmpeg.functions.video_loop'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_stabilize', name: t('tool.ffmpeg.functions.video_stabilize'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'video_reverse', name: t('tool.ffmpeg.functions.video_reverse'), icon: FileVideo, tool: 'ffmpeg' },
    ],
    effects: [
      { id: 'fade_in_out', name: t('tool.ffmpeg.functions.fade_in_out'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'image_overlay', name: t('tool.ffmpeg.functions.image_overlay'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'picture_in_picture', name: t('tool.ffmpeg.functions.picture_in_picture'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'ken_burns_effect', name: t('tool.ffmpeg.functions.ken_burns_effect'), icon: FileVideo, tool: 'ffmpeg' },
    ],
    text_graphics: [
      { id: 'add_subtitle', name: t('tool.ffmpeg.functions.add_subtitle'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'add_text', name: t('tool.ffmpeg.functions.add_text'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'draw_box', name: t('tool.ffmpeg.functions.draw_box'), icon: FileVideo, tool: 'ffmpeg' },
      { id: 'generate_video_from_image', name: t('tool.ffmpeg.functions.generate_video_from_image'), icon: FileVideo, tool: 'ffmpeg' },
    ],
  };

  // 定义FFprobe功能
  const ffprobe_functions = {
    quick_commands: [
      { id: 'show_format', name: t('tool.ffmpeg.functions.ffprobe_show_format_info'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_streams', name: t('tool.ffmpeg.functions.ffprobe_show_streams_info'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_duration', name: t('tool.ffmpeg.functions.ffprobe_show_duration'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_resolution', name: t('tool.ffmpeg.functions.ffprobe_show_resolution'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_bitrate', name: t('tool.ffmpeg.functions.ffprobe_show_bitrate'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_fps', name: t('tool.ffmpeg.functions.ffprobe_show_FPS'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_codec', name: t('tool.ffmpeg.functions.ffprobe_show_codec_info'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_metadata', name: t('tool.ffmpeg.functions.ffprobe_show_metadata'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_chapters', name: t('tool.ffmpeg.functions.ffprobe_show_chapters'), icon: FileIcon, tool: 'ffprobe' },
      { id: 'show_frame_count', name: t('tool.ffmpeg.functions.ffprobe_show_frame_count'), icon: FileIcon, tool: 'ffprobe' },
    ],
  };

  // 定义各个功能的配置项
  const functionDetails: Record<string, any> = {
    convert_video: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'format', label: t('tool.ffmpeg.inputs.output_format'), type: 'select', options: [
          { value: 'mp4', label: 'MP4 (.mp4)' },
          { value: 'avi', label: 'AVI (.avi)' },
          { value: 'mkv', label: 'MKV (.mkv)' },
          { value: 'mov', label: 'MOV (.mov)' },
          { value: 'webm', label: 'WebM (.webm)' },
        ], required: true },
        { id: 'codec', label: t('tool.ffmpeg.inputs.video_codec'), type: 'select', options: [
          { value: 'libx264', label: 'H.264 (libx264)' },
          { value: 'libx265', label: 'H.265 (libx265)' },
          { value: 'vp9', label: 'VP9 (vp9)' },
          { value: 'copy', label: t('tool.ffmpeg.options.copy') },
        ] },
        { id: 'quality', label: t('tool.ffmpeg.inputs.quality'), type: 'select', options: [
          { value: 'low', label: t('tool.ffmpeg.options.low_quality') },
          { value: 'medium', label: t('tool.ffmpeg.options.medium_quality') },
          { value: 'high', label: t('tool.ffmpeg.options.high_quality') },
        ] },
        { id: 'preset', label: t('tool.ffmpeg.inputs.preset'), type: 'select', options: [
          { value: 'ultrafast', label: t('tool.ffmpeg.options.ultrafast') },
          { value: 'superfast', label: t('tool.ffmpeg.options.superfast') },
          { value: 'veryfast', label: t('tool.ffmpeg.options.veryfast') },
          { value: 'faster', label: t('tool.ffmpeg.options.faster') },
          { value: 'fast', label: t('tool.ffmpeg.options.fast') },
          { value: 'medium', label: t('tool.ffmpeg.options.medium') },
          { value: 'slow', label: t('tool.ffmpeg.options.slow') },
          { value: 'slower', label: t('tool.ffmpeg.options.slower') },
          { value: 'veryslow', label: t('tool.ffmpeg.options.veryslow') },
        ] },
      ]
    },
    convert_audio: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'format', label: t('tool.ffmpeg.inputs.output_format'), type: 'select', options: [
          { value: 'mp3', label: 'MP3 (.mp3)' },
          { value: 'wav', label: 'WAV (.wav)' },
          { value: 'aac', label: 'AAC (.aac)' },
          { value: 'flac', label: 'FLAC (.flac)' },
          { value: 'ogg', label: 'OGG (.ogg)' },
        ], required: true },
        { id: 'codec', label: t('tool.ffmpeg.inputs.audio_codec'), type: 'select', options: [
          { value: 'aac', label: 'AAC (aac)' },
          { value: 'libmp3lame', label: 'MP3 (libmp3lame)' },
          { value: 'flac', label: 'FLAC (flac)' },
          { value: 'libvorbis', label: 'Vorbis (libvorbis)' },
          { value: 'copy', label: t('tool.ffmpeg.options.copy') },
        ] },
        { id: 'bitrate', label: t('tool.ffmpeg.inputs.bitrate'), type: 'select', options: [
          { value: '64k', label: '64 kbps' },
          { value: '128k', label: '128 kbps' },
          { value: '192k', label: '192 kbps' },
          { value: '256k', label: '256 kbps' },
          { value: '320k', label: '320 kbps' },
        ] },
      ]
    },
    convert_container: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'format', label: t('tool.ffmpeg.inputs.output_format'), type: 'select', options: [
          { value: 'mp4', label: 'MP4 (.mp4)' },
          { value: 'avi', label: 'AVI (.avi)' },
          { value: 'mkv', label: 'MKV (.mkv)' },
          { value: 'mov', label: 'MOV (.mov)' },
          { value: 'ts', label: 'MPEG-TS (.ts)' },
        ], required: true },
      ]
    },
    resize: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'width', label: t('tool.ffmpeg.inputs.width'), type: 'number', placeholder: '1920' },
        { id: 'height', label: t('tool.ffmpeg.inputs.height'), type: 'number', placeholder: '1080' },
        { id: 'algorithm', label: t('tool.ffmpeg.inputs.algorithm'), type: 'select', options: [
          { value: 'lanczos', label: t('tool.ffmpeg.options.lanczos') },
          { value: 'bicubic', label: t('tool.ffmpeg.options.bicubic') },
          { value: 'bilinear', label: t('tool.ffmpeg.options.bilinear') },
        ] },
      ]
    },
    trim: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'start_time', label: t('tool.ffmpeg.inputs.start_time'), type: 'text', placeholder: '00:00:00' },
        { id: 'end_time', label: t('tool.ffmpeg.inputs.end_time'), type: 'text', placeholder: '00:01:00' },
      ]
    },
    crop: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'width', label: t('tool.ffmpeg.inputs.width'), type: 'number', placeholder: '1280' },
        { id: 'height', label: t('tool.ffmpeg.inputs.height'), type: 'number', placeholder: '720' },
        { id: 'x', label: t('tool.ffmpeg.inputs.x_position'), type: 'number', placeholder: '0' },
        { id: 'y', label: t('tool.ffmpeg.inputs.y_position'), type: 'number', placeholder: '0' },
      ]
    },
    rotate: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'angle', label: t('tool.ffmpeg.inputs.angle'), type: 'select', options: [
          { value: '90', label: t('tool.ffmpeg.options.clockwise_90') },
          { value: '-90', label: t('tool.ffmpeg.options.counter_clockwise_90') },
          { value: '180', label: t('tool.ffmpeg.options.clockwise_180') },
        ] },
      ]
    },
    watermark: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'watermark', label: t('tool.ffmpeg.inputs.watermark_file'), type: 'file', required: true },
        { id: 'position', label: t('tool.ffmpeg.inputs.position'), type: 'select', options: [
          { value: 'top-left', label: t('tool.ffmpeg.options.top_left') },
          { value: 'top-right', label: t('tool.ffmpeg.options.top_right') },
          { value: 'bottom-left', label: t('tool.ffmpeg.options.bottom_left') },
          { value: 'bottom-right', label: t('tool.ffmpeg.options.bottom_right') },
          { value: 'center', label: t('tool.ffmpeg.options.center') },
        ] },
        { id: 'opacity', label: t('tool.ffmpeg.inputs.opacity'), type: 'range', min: 0, max: 100, step: 1 },
      ]
    },
    extract_audio: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'format', label: t('tool.ffmpeg.inputs.output_format'), type: 'select', options: [
          { value: 'mp3', label: 'MP3 (.mp3)' },
          { value: 'wav', label: 'WAV (.wav)' },
          { value: 'aac', label: 'AAC (.aac)' },
          { value: 'flac', label: 'FLAC (.flac)' },
        ], required: true },
      ]
    },
    mix_audio: {
      inputs: [
        { id: 'input1', label: t('tool.ffmpeg.inputs.first_audio_file'), type: 'file', required: true },
        { id: 'input2', label: t('tool.ffmpeg.inputs.second_audio_file'), type: 'file', required: true },
        { id: 'volume1', label: t('tool.ffmpeg.inputs.first_volume'), type: 'range', min: 0, max: 100, step: 1 },
        { id: 'volume2', label: t('tool.ffmpeg.inputs.second_volume'), type: 'range', min: 0, max: 100, step: 1 },
      ]
    },
    adjust_volume: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'volume', label: t('tool.ffmpeg.inputs.volume'), type: 'range', min: 0, max: 200, step: 1 },
      ]
    },
    brightness_contrast: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'brightness', label: t('tool.ffmpeg.inputs.brightness'), type: 'range', min: -100, max: 100, step: 1 },
        { id: 'contrast', label: t('tool.ffmpeg.inputs.contrast'), type: 'range', min: -100, max: 100, step: 1 },
      ]
    },
    denoise: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'strength', label: t('tool.ffmpeg.inputs.strength'), type: 'select', options: [
          { value: 'weak', label: t('tool.ffmpeg.options.weak') },
          { value: 'medium', label: t('tool.ffmpeg.options.medium') },
          { value: 'strong', label: t('tool.ffmpeg.options.strong') },
        ] },
      ]
    },
    deinterlace: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'mode', label: t('tool.ffmpeg.inputs.mode'), type: 'select', options: [
          { value: 'send_frame', label: t('tool.ffmpeg.options.send_frame') },
          { value: 'interpolate', label: t('tool.ffmpeg.options.interpolate') },
        ] },
      ]
    },
    hls_segment: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'segment_time', label: t('tool.ffmpeg.inputs.segment_duration'), type: 'number', placeholder: '10' },
        { id: 'format', label: t('tool.ffmpeg.inputs.playlist_format'), type: 'select', options: [
          { value: 'm3u8', label: 'M3U8' },
        ] },
      ]
    },
    dash_segment: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'segment_time', label: t('tool.ffmpeg.inputs.segment_duration'), type: 'number', placeholder: '10' },
      ]
    },
    concat_videos: {
      inputs: [
        { id: 'input1', label: t('tool.ffmpeg.inputs.first_video_file'), type: 'file', required: true },
        { id: 'input2', label: t('tool.ffmpeg.inputs.second_video_file'), type: 'file', required: true },
        { id: 'transition', label: t('tool.ffmpeg.inputs.transition'), type: 'select', options: [
          { value: 'none', label: t('tool.ffmpeg.options.no_transition') },
          { value: 'crossfade', label: t('tool.ffmpeg.options.crossfade') },
        ] },
      ]
    },
    video_speed: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'speed', label: t('tool.ffmpeg.inputs.speed'), type: 'range', min: 10, max: 500, step: 10 },
        { id: 'audio_handling', label: t('tool.ffmpeg.inputs.audio_handling'), type: 'select', options: [
          { value: 'keep', label: t('tool.ffmpeg.options.keep_audio') },
          { value: 'pitch', label: t('tool.ffmpeg.options.change_pitch') },
          { value: 'silent', label: t('tool.ffmpeg.options.remove_audio') },
        ] },
      ]
    },
    video_loop: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'loop_count', label: t('tool.ffmpeg.inputs.loop_count'), type: 'number', placeholder: '5' },
      ]
    },
    video_stabilize: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'smoothing', label: t('tool.ffmpeg.inputs.smoothing'), type: 'range', min: 1, max: 100, step: 1 },
      ]
    },
    video_reverse: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'reverse_audio', label: t('tool.ffmpeg.inputs.reverse_audio'), type: 'checkbox' },
      ]
    },
    fade_in_out: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'fade_in_duration', label: t('tool.ffmpeg.inputs.fade_in_duration'), type: 'number', placeholder: '2' },
        { id: 'fade_out_duration', label: t('tool.ffmpeg.inputs.fade_out_duration'), type: 'number', placeholder: '2' },
      ]
    },
    image_overlay: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'overlay_image', label: t('tool.ffmpeg.inputs.overlay_image'), type: 'file', required: true },
        { id: 'x', label: t('tool.ffmpeg.inputs.x_position'), type: 'number', placeholder: '0' },
        { id: 'y', label: t('tool.ffmpeg.inputs.y_position'), type: 'number', placeholder: '0' },
        { id: 'enable_time', label: t('tool.ffmpeg.inputs.enable_time'), type: 'text', placeholder: 'between(t,10,20)' },
      ]
    },
    picture_in_picture: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'pip_video', label: t('tool.ffmpeg.inputs.pip_video'), type: 'file', required: true },
        { id: 'position', label: t('tool.ffmpeg.inputs.position'), type: 'select', options: [
          { value: 'top-left', label: t('tool.ffmpeg.options.top_left') },
          { value: 'top-right', label: t('tool.ffmpeg.options.top_right') },
          { value: 'bottom-left', label: t('tool.ffmpeg.options.bottom_left') },
          { value: 'bottom-right', label: t('tool.ffmpeg.options.bottom_right') },
        ] },
        { id: 'size', label: t('tool.ffmpeg.inputs.size'), type: 'select', options: [
          { value: 'small', label: t('tool.ffmpeg.options.small') },
          { value: 'medium', label: t('tool.ffmpeg.options.medium') },
          { value: 'large', label: t('tool.ffmpeg.options.large') },
        ] },
      ]
    },
    ken_burns_effect: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'zoom_direction', label: t('tool.ffmpeg.inputs.zoom_direction'), type: 'select', options: [
          { value: 'in', label: t('tool.ffmpeg.options.zoom_in') },
          { value: 'out', label: t('tool.ffmpeg.options.zoom_out') },
          { value: 'in-out', label: t('tool.ffmpeg.options.zoom_in_out') },
        ] },
        { id: 'zoom_speed', label: t('tool.ffmpeg.inputs.zoom_speed'), type: 'range', min: 1, max: 10, step: 1 },
      ]
    },
    add_subtitle: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'subtitle_file', label: t('tool.ffmpeg.inputs.subtitle_file'), type: 'file', required: true },
        { id: 'subtitle_type', label: t('tool.ffmpeg.inputs.subtitle_type'), type: 'select', options: [
          { value: 'srt', label: 'SRT' },
          { value: 'ass', label: 'ASS' },
          { value: 'vtt', label: 'WebVTT' },
        ] },
      ]
    },
    add_text: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'text', label: t('tool.ffmpeg.inputs.text'), type: 'text', placeholder: t('tool.ffmpeg.placeholders.enter_text') },
        { id: 'font_size', label: t('tool.ffmpeg.inputs.font_size'), type: 'number', placeholder: '24' },
        { id: 'font_color', label: t('tool.ffmpeg.inputs.font_color'), type: 'text', placeholder: 'white' },
        { id: 'position', label: t('tool.ffmpeg.inputs.position'), type: 'select', options: [
          { value: 'top', label: t('tool.ffmpeg.options.top') },
          { value: 'middle', label: t('tool.ffmpeg.options.middle') },
          { value: 'bottom', label: t('tool.ffmpeg.options.bottom') },
        ] },
      ]
    },
    draw_box: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'x', label: t('tool.ffmpeg.inputs.x_position'), type: 'number', placeholder: '100' },
        { id: 'y', label: t('tool.ffmpeg.inputs.y_position'), type: 'number', placeholder: '100' },
        { id: 'width', label: t('tool.ffmpeg.inputs.box_width'), type: 'number', placeholder: '200' },
        { id: 'height', label: t('tool.ffmpeg.inputs.box_height'), type: 'number', placeholder: '100' },
        { id: 'color', label: t('tool.ffmpeg.inputs.color'), type: 'text', placeholder: 'red' },
        { id: 'thickness', label: t('tool.ffmpeg.inputs.thickness'), type: 'number', placeholder: '5' },
      ]
    },
    generate_video_from_image: {
      inputs: [
        { id: 'input_image', label: t('tool.ffmpeg.inputs.input_image'), type: 'file', required: true },
        { id: 'duration', label: t('tool.ffmpeg.inputs.duration'), type: 'number', placeholder: '5' },
        { id: 'fps', label: t('tool.ffmpeg.inputs.fps'), type: 'number', placeholder: '30' },
        { id: 'resolution', label: t('tool.ffmpeg.inputs.resolution'), type: 'select', options: [
          { value: '720p', label: '1280x720 (720p)' },
          { value: '1080p', label: '1920x1080 (1080p)' },
          { value: '4k', label: '3840x2160 (4K)' },
        ] },
      ]
    },
    // FFprobe functions
    show_format: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'output_format', label: 'Output Format', type: 'select', options: [
          { value: 'default', label: 'Default' },
          { value: 'json', label: 'JSON' },
          { value: 'xml', label: 'XML' },
          { value: 'csv', label: 'CSV' },
        ]},
      ]
    },
    show_streams: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'stream_type', label: 'Stream Type', type: 'select', options: [
          { value: 'all', label: 'All Streams' },
          { value: 'video', label: 'Video Only' },
          { value: 'audio', label: 'Audio Only' },
          { value: 'subtitle', label: 'Subtitle Only' },
        ]},
        { id: 'output_format', label: 'Output Format', type: 'select', options: [
          { value: 'default', label: 'Default' },
          { value: 'json', label: 'JSON' },
          { value: 'xml', label: 'XML' },
          { value: 'csv', label: 'CSV' },
        ]},
      ]
    },
    show_duration: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'precision', label: 'Precision', type: 'select', options: [
          { value: 'seconds', label: 'Seconds' },
          { value: 'milliseconds', label: 'Milliseconds' },
          { value: 'timecode', label: 'Timecode' },
        ]},
      ]
    },
    show_resolution: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'stream_index', label: 'Stream Index', type: 'number', placeholder: '0 (leave empty for first video stream)' },
      ]
    },
    show_bitrate: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'bitrate_type', label: 'Bitrate Type', type: 'select', options: [
          { value: 'overall', label: 'Overall' },
          { value: 'video', label: 'Video Only' },
          { value: 'audio', label: 'Audio Only' },
        ]},
      ]
    },
    show_fps: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'stream_index', label: 'Stream Index', type: 'number', placeholder: '0 (leave empty for first video stream)' },
      ]
    },
    show_codec: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'stream_type', label: 'Stream Type', type: 'select', options: [
          { value: 'all', label: 'All Streams' },
          { value: 'video', label: 'Video Only' },
          { value: 'audio', label: 'Audio Only' },
          { value: 'subtitle', label: 'Subtitle Only' },
        ]},
      ]
    },
    show_metadata: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'metadata_type', label: 'Metadata Type', type: 'select', options: [
          { value: 'all', label: 'All Metadata' },
          { value: 'format', label: 'Format Metadata' },
          { value: 'streams', label: 'Stream Metadata' },
        ]},
      ]
    },
    show_chapters: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'output_format', label: 'Output Format', type: 'select', options: [
          { value: 'default', label: 'Default' },
          { value: 'json', label: 'JSON' },
        ]},
      ]
    },
    show_frame_count: {
      inputs: [
        { id: 'input', label: t('tool.ffmpeg.inputs.input_file'), type: 'file', required: true },
        { id: 'stream_index', label: 'Stream Index', type: 'number', placeholder: '0 (leave empty for first video stream)' },
      ]
    },
  };

  // Scroll to bottom of logs when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Toggle folder expansion in file tree
  const toggleExpand = async (path: string) => {
    const newSet = new Set(expandedPaths);
    if (newSet.has(path)) {
      newSet.delete(path);
    } else {
      newSet.add(path);
      // Load subdirectory when expanding
      if (rootNode) {
        const findNode = (node: FileNode): FileNode | null => {
          if (node.path === path) return node;
          for (const child of node.children) {
            const found = findNode(child);
            if (found) return found;
          }
          return null;
        };
        
        const node = findNode(rootNode);
        if (node && node.isDir) {
          await loadSubdirectory(node);
        }
      }
    }
    setExpandedPaths(newSet);
  };

  // Handle file selection from tree
  const handleFileSelectFromTree = (node: FileNode) => {
      if (node.isDir) {
        toggleExpand(node.path);
        return;
      }
 
      // Check if file is already selected
      const isSelected = selectedFiles.some(f => f.file.name === node.name);
      
      if (isSelected) {
        // Remove from selected files if already selected (toggle off)
        setSelectedFiles(prev => prev.filter(f => f.file.name !== node.name));
      } else {
        // Add to selected files if not already there
        // Create a dummy File object for the virtual file
        const dummyFile = new File([], node.name);
        setSelectedFiles(prev => [...prev, { file: dummyFile, path: node.path }]);
        // 更新最后上传的文件
        setLastUploadedFile(node.name);
      }
   };
    
    // Download selected files as a ZIP archive
    const downloadSelectedFiles = async () => {
      if (selectedFiles.length === 0) return;
      
      setIsDownloading(true);
      try {
        const zip = new JSZip();
        
        for (const selectedFile of selectedFiles) {
          try {
            // For files that exist in the FFmpeg filesystem
            if (ffmpegRef.current) {
              try {
                const data = await ffmpegRef.current.readFile(selectedFile.path);
                zip.file(selectedFile.file.name, data);
              } catch (error) {
                // If file doesn't exist in FFmpeg filesystem, try to get it from the browser
                console.warn(`Could not read file from FFmpeg: ${selectedFile.path}`, error);
                // For files that were just added but not yet written to FFmpeg filesystem
                if (selectedFile.file instanceof File) {
                  const arrayBuffer = await selectedFile.file.arrayBuffer();
                  zip.file(selectedFile.file.name, arrayBuffer);
                }
              }
            } else {
              // If FFmpeg is not loaded yet, try to get file from browser
              if (selectedFile.file instanceof File) {
                const arrayBuffer = await selectedFile.file.arrayBuffer();
                zip.file(selectedFile.file.name, arrayBuffer);
              }
            }
          } catch (error) {
            setLogs(prev => [...prev, `Error adding file to ZIP: ${selectedFile.file.name}`, `Error: ${(error as Error).message}`]);
          }
        }
        
        const zipContent = await zip.generateAsync({ type: 'blob' });
        
        const url = URL.createObjectURL(zipContent);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selected_files_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setLogs(prev => [...prev, t('tool.ffmpeg.selected_files_downloaded', { count: selectedFiles.length })]);
      } catch (error) {
        setLogs(prev => [...prev, `Error creating ZIP: ${(error as Error).message}`]);
      } finally {
        setIsDownloading(false);
      }
    };

  // Remove selected file
  const removeSelectedFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  // Upload new files
  const uploadFiles = async (files: File[], targetPath: string = '.') => {
    if (!ffmpegRef.current) return;

    setIsDownloading(true);
    try {
      for (const file of files) {
        const targetFilePath = targetPath === '.' ? file.name : `${targetPath}/${file.name}`;
        setLogs(prev => [...prev, t('tool.ffmpeg.writing_file', { fileName: targetFilePath })]);
        await ffmpegRef.current.writeFile(targetFilePath, await fetchFile(file));
      }
      
      // For root uploads, simply reload the entire file system
      if (targetPath === '.') {
        await loadFileSystem();
      } else {
        // For subdirectory uploads, use refreshFileSystem to maintain expanded state
        await refreshFileSystem(targetPath);
      }
      // Update last uploaded file with the first uploaded file name
      if (files.length > 0) {
        setLastUploadedFile(files[0].name);
      }
      setLogs(prev => [...prev, t('tool.ffmpeg.upload_completed')]);
    } catch (error) {
      setLogs(prev => [...prev, `Error uploading files: ${error.message}`]);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      uploadFiles(Array.from(e.dataTransfer.files) as File[], '.');
    }
  };


  // Add files to the file tree
  const addFiles = (files: File[]) => {
    const newSelectedFiles = files.map(file => ({ file, path: file.name }));
    setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    
    // Build tree structure
    const root: FileNode = { name: 'Root', path: '', isDir: true, children: [] };
    const nodeMap = new Map<string, FileNode>();
    nodeMap.set('', root);
 
    const allFiles = [...selectedFiles.map(sf => sf.file), ...files];
    allFiles.forEach(file => {
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
      let currentPath = '';
      let parent = root;
 
      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
 
        if (!nodeMap.has(currentPath)) {
          const newNode: FileNode = {
            name: part,
            path: currentPath,
            isDir: !isLast,
            file: isLast ? file : undefined,
            children: [],
            parent: parent
          };
          nodeMap.set(currentPath, newNode);
          parent.children.push(newNode);
        }
        parent = nodeMap.get(currentPath)!;
      });
    });
 
    // Sort: folders first, then files
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
    setExpandedPaths(new Set([''])); // Expand root by default
    
    // 更新最后上传的文件为第一个文件
    if (allFiles.length > 0) {
      setLastUploadedFile(allFiles[0].name);
    }
  };

  // Remove a file from the tree
  const removeFile = (filePath: string) => {
    const fileName = filePath.split('/').pop();
    const fileToRemove = selectedFiles.find(f => f.file.name === fileName);
    if (fileToRemove) {
      const newFiles = selectedFiles.filter(f => f !== fileToRemove);
      setSelectedFiles(newFiles);
      addFiles([]); // Rebuild tree with remaining files
    }
  };

  // Render file tree node
  const FileTreeNode: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
    if (!node) return null;

    const [isHovered, setIsHovered] = useState(false);
    const isExpanded = expandedPaths.has(node.path);
    const isRoot = !node.parent && node.name === 'Root';
    const isSelected = selectedFiles.some(f => f.file.name === node.name);

    // Don't render root container itself, just children
    if (isRoot) {
      return (
        <>
          {node.children.map(child => (
            <FileTreeNode key={child.path} node={child} depth={0} />
          ))}
        </>
      );
    }

    return (
      <div className="select-none">
        <div
          className={`
            flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors text-sm whitespace-nowrap rounded-md
            ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}
            ${dragOverNode?.path === node.path ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
          `}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => handleFileSelectFromTree(node)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDragOver={(e) => {
            e.preventDefault();
            if (!dragOverNode || dragOverNode.path !== node.path) {
              setDragOverNode(node);
            }
          }}
          onDragLeave={(e) => {
            // 检查是否真的离开了这个元素
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
              if (dragOverNode?.path === node.path) {
                setDragOverNode(null);
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && dragOverNode) {
              let targetPath = '.';
              if (dragOverNode.isDir) {
                // 拖到文件夹上，放在该文件夹下
                targetPath = dragOverNode.path;
              } else {
                // 拖到文件上，放在该文件对应的目录下
                const parentPath = dragOverNode.path.lastIndexOf('/') > 0 ?
                  dragOverNode.path.substring(0, dragOverNode.path.lastIndexOf('/')) : '.';
                targetPath = parentPath;
              }
              uploadFiles(Array.from(e.dataTransfer.files) as File[], targetPath);
              setDragOverNode(null);
            }
          }}
        >
          {node.isDir ? (
            <div className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10" onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }}>
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
          ) : (
            <span className="w-5" /> // Spacer for alignment
          )}

          {node.isDir ? <Folder className="w-4 h-4 text-yellow-500" /> : <FileIcon className="w-4 h-4 text-gray-400" />}

          <span className="truncate flex-1 text-left">{node.name}</span>

          {node.isDir && isHovered && (
            <div className="flex items-center gap-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={async (e) => {
                  e.stopPropagation();
                  // Download folder as archive
                  if (ffmpegRef.current) {
                    try {
                      // Get all files in the folder and subfolders
                      const getAllFiles = async (dirPath: string): Promise<{path: string, name: string}[]> => {
                        const items: { name: string; isDir: boolean }[] = await ffmpegRef.current.listDir(dirPath);
                        let files: {path: string, name: string}[] = [];
                        
                        for (const item of items) {
                          if (item.name === '.' || item.name === '..') continue;
                          
                          const fullPath = dirPath === '.' ? item.name : `${dirPath}/${item.name}`;
                          if (item.isDir) {
                            // Recursively get files from subdirectory
                            const subFiles = await getAllFiles(fullPath);
                            files = files.concat(subFiles);
                          } else {
                            // Add file to the list
                            files.push({ path: fullPath, name: item.name });
                          }
                        }
                        
                        return files;
                      };
                      
                      // Get all files in the folder
                      const allFiles = await getAllFiles(node.path);
                      
                      if (allFiles.length === 0) {
                        setLogs(prev => [...prev, `Folder ${node.name} is empty`]);
                        return;
                      }
                      
                      // Create a new JSZip instance
                      const zip = new JSZip();
                      
                      // Add each file to the zip with its relative path
                      for (const file of allFiles) {
                        try {
                          const fileData = await ffmpegRef.current.readFile(file.path);
                          
                          // Calculate the relative path for the file in the zip
                          const relativePath = file.path.startsWith(node.path + '/') ?
                            file.path.substring(node.path.length + 1) :
                            file.path;
                          
                          // Add file data to zip with the relative path
                          zip.file(relativePath, fileData);
                        } catch (fileError) {
                          setLogs(prev => [...prev, `Error reading file ${file.path}: ${(fileError as Error).message}`]);
                        }
                      }
                      
                      // Generate the zip file
                      const zipContent = await zip.generateAsync({ type: 'blob' });
                      
                      // Create a download link for the zip file
                      const url = URL.createObjectURL(zipContent);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${node.name}.zip`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      setLogs(prev => [...prev, `Downloaded ${node.name}.zip containing ${allFiles.length} files`]);
                    } catch (error) {
                      setLogs(prev => [...prev, `Error downloading folder: ${(error as Error).message}`]);
                    }
                  }
                }}
                title={t('tool.ffmpeg.download_folder')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                disabled={isFfmpegLoading}
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Rename folder
                  const newName = prompt(t('tool.ffmpeg.rename_folder_prompt'), node.name);
                  if (newName) {
                    const validation = validateFileName(newName);
                    if (!validation.isValid) {
                      alert(validation.errorMessage);
                      return;
                    }
                    
                    if (ffmpegRef.current) {
                      // Determine the parent directory
                      const parentPath = node.path.lastIndexOf('/') > 0 ?
                        node.path.substring(0, node.path.lastIndexOf('/')) : '.';
                      
                      // Full paths for old and new
                      const oldPath = node.path;
                      const newPath = parentPath === '.' ? newName : `${parentPath}/${newName}`;
                      
                      ffmpegRef.current.rename(oldPath, newPath)
                        .then(async () => {
                          // Refresh the file system to reflect the change
                          await refreshFileSystem(parentPath);
                          setLogs(prev => [...prev, `Renamed folder: ${node.name} -> ${newName}`]);
                        })
                        .catch((error: any) => {
                          setLogs(prev => [...prev, `Error renaming folder: ${error.message}`]);
                        });
                    }
                  }
                }}
                title={t('tool.ffmpeg.rename_folder')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Upload files to the current folder directly
                  const handleFolderUpload = () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.files) {
                        uploadFiles(Array.from(target.files), node.path);
                      }
                      // Clean up
                      input.remove();
                    };
                    input.click();
                  };
                  
                  handleFolderUpload();
                }}
                title={t('tool.ffmpeg.upload_files')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Upload className="w-3 h-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Create new folder
                  const folderName = prompt(t('tool.ffmpeg.enter_folder_name'));
                  if (folderName) {
                    // Create folder in virtual file system
                    if (ffmpegRef.current) {
                      const newFolderPath = node.path === '.' ? folderName : `${node.path}/${folderName}`;
                      ffmpegRef.current.createDir(newFolderPath)
                        .then(async () => {
                          // Refresh the current folder to show the new folder
                          await loadSubdirectory(node);
                          setLogs(prev => [...prev, `Created folder: ${newFolderPath}`]);
                        })
                        .catch((error: any) => {
                          setLogs(prev => [...prev, `Error creating folder: ${error.message}`]);
                        });
                    }
                  }
                }}
                title={t('tool.ffmpeg.create_folder')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  // Delete folder
                  if (ffmpegRef.current) {
                    ffmpegRef.current.deleteDir(node.path)
                      .then(async () => {
                        // Refresh the parent folder
                        if (node.parent) {
                          await loadSubdirectory(node.parent);
                        } else {
                          await refreshFileSystem();
                        }
                        setLogs(prev => [...prev, `Deleted folder: ${node.name}`]);
                      })
                      .catch((error: any) => {
                        setLogs(prev => [...prev, `Error deleting folder: ${error.message}`]);
                      });
                  }
                }}
                title={t('tool.ffmpeg.delete_folder')}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <FolderMinus className="w-3 h-3" />
              </Button>
            </div>
          )}

          {!node.isDir && isHovered && (
            <div className="flex items-center gap-1">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  // Preview file in browser
                  if (ffmpegRef.current) {
                    try {
                      const data = await ffmpegRef.current.readFile(node.path);
                      const blob = new Blob([data], { type: getMimeType(node.name) });
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    } catch (error) {
                      setLogs(prev => [...prev, `Error previewing file: ${error.message}`]);
                    }
                  }
                }}
                className="text-gray-400 hover:text-blue-500 p-1 rounded-full hover:bg-blue-500/10"
                title={t('tool.ffmpeg.preview_file')}
              >
                <Eye className="w-3 h-3" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  // Download file
                  if (ffmpegRef.current) {
                    try {
                      const data = await ffmpegRef.current.readFile(node.path);
                      
                      let buffer: ArrayBuffer;
                      if (typeof SharedArrayBuffer !== 'undefined' && data.buffer instanceof SharedArrayBuffer) {
                        buffer = new Uint8Array(data).slice().buffer;
                      } else {
                        buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
                      }
                      
                      const blob = new Blob([buffer], { type: getMimeType(node.name) });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = node.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      setLogs(prev => [...prev, `Error downloading file: ${error.message}`]);
                    }
                  }
                }}
                className="text-gray-400 hover:text-green-500 p-1 rounded-full hover:bg-green-500/10"
                title={t('tool.ffmpeg.download_file')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Rename file
                  const newName = prompt(t('tool.ffmpeg.rename_file_prompt'), node.name);
                  if (newName) {
                    const validation = validateFileName(newName);
                    if (!validation.isValid) {
                      alert(validation.errorMessage);
                      return;
                    }
                    
                    if (ffmpegRef.current) {
                      // Determine the parent directory
                      const parentPath = node.path.lastIndexOf('/') > 0 ?
                        node.path.substring(0, node.path.lastIndexOf('/')) : '.';
                      
                      // Full paths for old and new
                      const oldPath = node.path;
                      const newPath = parentPath === '.' ? newName : `${parentPath}/${newName}`;
                      
                      ffmpegRef.current.rename(oldPath, newPath)
                        .then(async () => {
                          // Refresh the file system to reflect the change
                          await refreshFileSystem(parentPath);
                          setLogs(prev => [...prev, `Renamed file: ${node.name} -> ${newName}`]);
                        })
                        .catch((error: any) => {
                          setLogs(prev => [...prev, `Error renaming file: ${error.message}`]);
                        });
                    }
                  }
                }}
                className="text-gray-400 hover:text-yellow-500 p-1 rounded-full hover:bg-yellow-500/10"
                title={t('tool.ffmpeg.rename_file')}
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeSelectedFile(node.name); }}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {node.isDir && isExpanded && (
          <div>
            {node.children.map(child => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Load FFmpeg
  const initializeFFmpegCore = async () => {
    if (!ffmpegRef.current) {
      try {
        setIsFfmpegLoading(true);
        const useMultithreading = ffmpegVersion === 'multi';
        ffmpegRef.current = await loadFFmpeg(useMultithreading);
        
        ffmpegRef.current.on('log', ({ message }: { message: string }) => {
          setLogs(prev => [...prev, message]);
        });
        
        // Listen to progress events
        ffmpegRef.current.on('progress', ({ progress, time }: { progress: number; time: number }) => {
          const percentage = Math.round(progress * 100);
          setExecutionProgress(percentage);
          setLogs(prev => [...prev, `Progress: ${percentage}% (transcoded time: ${time / 1000000} s)`]);
        });
      } catch (error) {
        setIsFfmpegLoading(false);
        console.error('Failed to load FFmpeg:', error);
        throw error;
      } finally {
        setIsFfmpegLoading(false);
      }
    }
  };

  // Execute FFmpeg command
  const executeCommand = async () => {
    if (!command.trim()) {
      setLogs(['Error: Command is empty']);
      return;
    }

    setIsRunning(true);
    setExecutionProgress(0);
    setLogs([]);
    setOutputFiles([]);
    setShowLogs(true);

    try {
      // Wait for FFmpeg to be ready if it's loading
      if (isFfmpegLoading) {
        setLogs(['Waiting for FFmpeg to load...']);
        return;
      }
      await initializeFFmpegCore();
      
      // Write input files to MEMFS
      const writtenFiles: string[] = [];
      for (const fileObj of selectedFiles) {
        const fileName = fileObj.file.name;
        setLogs(prev => [...prev, t('tool.ffmpeg.writing_file', { fileName })]);
        await ffmpegRef.current.writeFile(fileName, await fetchFile(fileObj.file));
        writtenFiles.push(fileName);
      }

      // Parse command
      // 更健壮的命令行参数解析，正确处理引号
      const args = parseCommandLine(command, commandType);
      
      setLogs(prev => [...prev, `${t('tool.ffmpeg.execute')} ${commandType} ${command}`]);
      
      // Run FFmpeg or FFprobe command based on commandType
      if (commandType === 'ffprobe') {
        await ffmpegRef.current.ffprobe(args);
      } else {
        await ffmpegRef.current.exec(args);
      }
      
      // List output files
      const files: { name: string; isDir: boolean }[] = await ffmpegRef.current.listDir('.');
      const outputFilesData: {name: string, data: Uint8Array}[] = [];
      
      for (const file of files) {
        // Skip input files and directories
        if (file.isDir || writtenFiles.includes(file.name)) continue;
        
        try {
          setLogs(prev => [...prev, t('tool.ffmpeg.reading_output', { fileName: file.name })]);
          const data = await ffmpegRef.current.readFile(file.name);
          outputFilesData.push({ name: file.name, data });
        } catch (readErr) {
          setLogs(prev => [...prev, `Warning: Could not read file ${file.name}: ${readErr.message}`]);
        }
      }
      
      setOutputFiles(outputFilesData);
      setLogs(prev => [...prev, t('tool.ffmpeg.execution_completed')]);
    } catch (err: any) {
      setLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // 更健壮的命令行参数解析函数
  const parseCommandLine = (command: string, commandType: 'ffmpeg' | 'ffprobe' = 'ffmpeg'): string[] => {
    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;
    let quoteChar = '';
    
    // 移除开头的ffmpeg或ffprobe关键字（如果存在）
    let cleanCommand = command.trim();
    if (cleanCommand.toLowerCase().startsWith('ffmpeg')) {
      cleanCommand = cleanCommand.substring(6).trim();
    } else if (cleanCommand.toLowerCase().startsWith('ffprobe')) {
      cleanCommand = cleanCommand.substring(7).trim();
    }
    
    for (let i = 0; i < cleanCommand.length; i++) {
      const char = cleanCommand[i];
      
      if (!inQuotes && (char === '"' || char === "'")) {
        inQuotes = true;
        quoteChar = char;
        continue;
      }
      
      if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        continue;
      }
      
      if (!inQuotes && /\s/.test(char)) {
        if (currentArg) {
          args.push(currentArg);
          currentArg = '';
        }
        continue;
      }
      
      currentArg += char;
    }
    
    if (currentArg) {
      args.push(currentArg);
    }
    
    return args;
  };

  // Download output file
  const downloadFile = (fileName: string, data: Uint8Array) => {
    let buffer: ArrayBuffer;
    
    // 检查是否存在 SharedArrayBuffer 并且正确处理数据
    if (typeof SharedArrayBuffer !== 'undefined' && data.buffer instanceof SharedArrayBuffer) {
      // 将 SharedArrayBuffer 转换为普通 ArrayBuffer
      buffer = new Uint8Array(data).slice().buffer;
    } else {
      // 直接使用数据的 buffer 或创建新的副本
      buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    }
    
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 更新功能配置
  const updateFunctionConfig = (functionId: string, field: string, value: any) => {
    setFunctionConfig(prev => ({
      ...prev,
      [functionId]: {
        ...prev[functionId],
        [field]: value
      }
    }));
  };

  // 生成FFmpeg命令
  const generateCommand = (functionId: string) => {
    const config = functionConfig[functionId] || {};
    let cmd = '';
    
    // 获取真实文件名，如果没有则使用默认值
    const getInputFileName = (inputKey: string, defaultName: string = 'input') => {
      const fileName = config[inputKey];
      if (!fileName) {
        // 如果是 input 类型且有最后上传的文件，则使用最后上传的文件
        if (defaultName === 'input' && lastUploadedFile !== 'input.mp4') {
          return lastUploadedFile;
        }
        return `${defaultName}.mp4`; // 默认值
      }
      return fileName;
    };
    
    const getInputNameWithoutExtension = (inputKey: string, defaultName: string = 'input') => {
      const fileName = getInputFileName(inputKey, defaultName);
      return fileName.split('.').slice(0, -1).join('.') || defaultName;
    };
    
    const getOutputFileName = (defaultName: string = 'output') => {
      return `${defaultName}.mp4`;
    };
    
    switch (functionId) {
      case 'convert_video':
        const inputVideo = getInputFileName('input');
        const outputFormat = config.format || 'mp4';
        cmd = `-i "${inputVideo}" -c:v ${config.codec || 'libx264'} `;
        if (config.quality === 'low') cmd += '-crf 28 ';
        else if (config.quality === 'medium') cmd += '-crf 23 ';
        else if (config.quality === 'high') cmd += '-crf 18 ';
        if (config.preset) cmd += `-preset ${config.preset} `;
        cmd += `output.${outputFormat}`;
        break;
        
      case 'convert_audio':
        const inputAudio = getInputFileName('input');
        cmd = `-i "${inputAudio}" `;
        if (config.codec && config.codec !== 'copy') cmd += `-c:a ${config.codec} `;
        if (config.bitrate) cmd += `-b:a ${config.bitrate} `;
        cmd += `output.${config.format || 'mp3'}`;
        break;
        
      case 'convert_container':
        const inputContainer = getInputFileName('input');
        cmd = `-i "${inputContainer}" -c copy output.${config.format || 'mp4'}`;
        break;
        
      case 'resize':
        const inputResize = getInputFileName('input');
        if (config.width && config.height) {
          cmd = `-i "${inputResize}" -vf scale=${config.width}:${config.height} output.mp4`;
        } else if (config.width) {
          cmd = `-i "${inputResize}" -vf scale=${config.width}:-1 output.mp4`;
        } else if (config.height) {
          cmd = `-i "${inputResize}" -vf scale=-1:${config.height} output.mp4`;
        }
        break;
        
      case 'trim':
        const inputTrim = getInputFileName('input');
        cmd = '';
        if (config.start_time) cmd += `-ss ${config.start_time} `;
        cmd += `-i "${inputTrim}" `;
        if (config.end_time) cmd += `-to ${config.end_time} `;
        cmd += '-c copy output.mp4';
        break;
        
      case 'crop':
        const inputCrop = getInputFileName('input');
        if (config.width && config.height) {
          const x = config.x || 0;
          const y = config.y || 0;
          cmd = `-i "${inputCrop}" -vf crop=${config.width}:${config.height}:${x}:${y} output.mp4`;
        }
        break;
        
      case 'rotate':
        const inputRotate = getInputFileName('input');
        const angles: Record<string, string> = {
          '90': 'transpose=1',
          '-90': 'transpose=2',
          '180': 'transpose=1,transpose=1'
        };
        const transposeFilter = angles[config.angle] || 'transpose=1';
        cmd = `-i "${inputRotate}" -vf "${transposeFilter}" output.mp4`;
        break;
        
      case 'watermark':
        const inputWatermark = getInputFileName('input');
        const watermarkFile = getInputFileName('watermark', 'watermark');
        if (config.watermark && config.position) {
          let overlay = '';
          switch (config.position) {
            case 'top-left': overlay = '0:0'; break;
            case 'top-right': overlay = 'main_w-overlay_w:0'; break;
            case 'bottom-left': overlay = '0:main_h-overlay_h'; break;
            case 'bottom-right': overlay = 'main_w-overlay_w:main_h-overlay_h'; break;
            case 'center': overlay = '(main_w-overlay_w)/2:(main_h-overlay_h)/2'; break;
          }
          cmd = `-i "${inputWatermark}" -i "${watermarkFile}" -filter_complex "overlay=${overlay}" output.mp4`;
        }
        break;
        
      case 'extract_audio':
        const inputExtract = getInputFileName('input');
        cmd = `-i "${inputExtract}" -vn -c:a copy output.${config.format || 'mp3'}`;
        break;
        
      case 'mix_audio':
        const input1Mix = getInputFileName('input1', 'input1');
        const input2Mix = getInputFileName('input2', 'input2');
        cmd = `-i "${input1Mix}" -i "${input2Mix}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first" output.mp3`;
        break;
        
      case 'adjust_volume':
        const inputVolume = getInputFileName('input');
        const volume = (config.volume || 100) / 100;
        cmd = `-i "${inputVolume}" -af "volume=${volume}" output.mp3`;
        break;
        
      case 'brightness_contrast':
        const inputBC = getInputFileName('input');
        const brightness = (config.brightness || 0) / 100;
        const contrast = (config.contrast || 0) / 100;
        cmd = `-i "${inputBC}" -vf "eq=brightness=${brightness}:contrast=${contrast}" output.mp4`;
        break;
        
      case 'denoise':
        const inputDenoise = getInputFileName('input');
        const denoiseFilters: Record<string, string> = {
          'weak': 'nlmeans',
          'medium': 'nlmeans=s=5',
          'strong': 'nlmeans=s=10'
        };
        const denoiseValue = denoiseFilters[config.strength] || 'nlmeans';
        cmd = `-i "${inputDenoise}" -vf "${denoiseValue}" output.mp4`;
        break;
        
      case 'deinterlace':
        const inputDeint = getInputFileName('input');
        const mode = config.mode || 'send_frame';
        cmd = `-i "${inputDeint}" -vf "yadif=mode=${mode}" output.mp4`;
        break;
        
      case 'hls_segment':
        const inputHLS = getInputFileName('input');
        const segmentTime = config.segment_time || 10;
        cmd = `-i "${inputHLS}" -f hls -hls_time ${segmentTime} output.m3u8`;
        break;
        
      case 'dash_segment':
        const inputDash = getInputFileName('input');
        const dashSegmentTime = config.segment_time || 10;
        cmd = `-i "${inputDash}" -f dash -seg_duration ${dashSegmentTime} output.mpd`;
        break;
        
      case 'concat_videos':
        const input1Concat = getInputFileName('input1', 'input1');
        const input2Concat = getInputFileName('input2', 'input2');
        cmd = `-i "${input1Concat}" -i "${input2Concat}" `;
        if (config.transition === 'crossfade') {
          cmd += `-filter_complex "[0:v][1:v]xfade=duration=1:offset=4[v];[0:a][1:a]acrossfade=duration=1[a]" -map "[v]" -map "[a]" output.mp4`;
        } else {
          cmd += `-filter_complex "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]" -map "[outv]" -map "[outa]" output.mp4`;
        }
        break;
        
      case 'video_speed':
        const inputSpeed = getInputFileName('input');
        const speed = (config.speed || 100) / 100;
        cmd = `-i "${inputSpeed}" `;
        if (config.audio_handling === 'pitch') {
          cmd += `-filter_complex "[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]" -map "[v]" -map "[a]" output.mp4`;
        } else if (config.audio_handling === 'silent') {
          cmd += `-vf "setpts=${1/speed}*PTS" -an output.mp4`;
        } else {
          cmd += `-vf "setpts=${1/speed}*PTS" output.mp4`;
        }
        break;
        
      case 'video_loop':
        const inputLoop = getInputFileName('input');
        const loopCount = config.loop_count || 1;
        cmd = `-stream_loop ${loopCount} -i "${inputLoop}" -c copy output.mp4`;
        break;
        
      case 'video_stabilize':
        const inputStab = getInputFileName('input');
        cmd = `-i "${inputStab}" -vf "vidstabdetect=shakiness=10:accuracy=15:result=transform_vectors.trf" -f null - && `;
        cmd += `ffmpeg -i "${inputStab}" -vf "vidstabtransform=input=transform_vectors.trf:zoom=0:smoothing=${config.smoothing || 10}" output.mp4`;
        break;
        
      case 'video_reverse':
        const inputReverse = getInputFileName('input');
        cmd = `-i "${inputReverse}" -vf reverse`;
        if (config.reverse_audio) {
          cmd += ' -af areverse';
        }
        cmd += ' output.mp4';
        break;
        
      case 'fade_in_out':
        const inputFade = getInputFileName('input');
        const fadeInDuration = config.fade_in_duration || 0;
        const fadeOutDuration = config.fade_out_duration || 0;
        cmd = `-i "${inputFade}" `;
        if (fadeInDuration > 0 && fadeOutDuration > 0) {
          cmd += `-vf "fade=in:0:${fadeInDuration * 30},fade=out:$(($(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputFade}")*30-${fadeOutDuration * 30})):${fadeOutDuration * 30}" output.mp4`;
        } else if (fadeInDuration > 0) {
          cmd += `-vf "fade=in:0:${fadeInDuration * 30}" output.mp4`;
        } else if (fadeOutDuration > 0) {
          cmd += `-vf "fade=out:$(($(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputFade}")*30-${fadeOutDuration * 30})):${fadeOutDuration * 30}" output.mp4`;
        }
        break;
        
      case 'image_overlay':
        const inputOverlay = getInputFileName('input');
        const overlayImage = getInputFileName('overlay_image', 'overlay');
        if (config.overlay_image) {
          const enableTime = config.enable_time ? `:enable='${config.enable_time}'` : '';
          cmd = `-i "${inputOverlay}" -i "${overlayImage}" `;
          cmd += `-filter_complex "overlay=${config.x || 0}:${config.y || 0}${enableTime}" output.mp4`;
        }
        break;
        
      case 'picture_in_picture':
        const inputPIP = getInputFileName('input');
        const pipVideo = getInputFileName('pip_video', 'pip');
        if (config.pip_video) {
          let positionCoords = '';
          const sizeScale = config.size === 'small' ? 0.25 : config.size === 'large' ? 0.5 : 0.33;
          
          switch (config.position) {
            case 'top-left': positionCoords = `0:0,scale=iw*${sizeScale}:ih*${sizeScale}`; break;
            case 'top-right': positionCoords = `main_w-overlay_w:0,scale=iw*${sizeScale}:ih*${sizeScale}`; break;
            case 'bottom-left': positionCoords = `0:main_h-overlay_h,scale=iw*${sizeScale}:ih*${sizeScale}`; break;
            case 'bottom-right': positionCoords = `main_w-overlay_w:main_h-overlay_h,scale=iw*${sizeScale}:ih*${sizeScale}`; break;
          }
          
          cmd = `-i "${inputPIP}" -i "${pipVideo}" `;
          cmd += `-filter_complex "[1:v]${positionCoords}[pip];[0:v][pip]overlay=output.mp4`;
        }
        break;
        
      case 'ken_burns_effect':
        const inputKen = getInputFileName('input');
        const zoomDirection = config.zoom_direction || 'in';
        const zoomSpeed = config.zoom_speed || 5;
        let zoomFilter = '';
        
        switch (zoomDirection) {
          case 'in': zoomFilter = `zoompan=z='min(zoom+0.0015*${zoomSpeed},1.5)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=250`; break;
          case 'out': zoomFilter = `zoompan=z='max(zoom-0.0015*${zoomSpeed},1)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=250`; break;
          case 'in-out': zoomFilter = `zoompan=z='if(lte(zoom,1.0),zoom+0.0015*${zoomSpeed},if(gte(zoom,1.5),zoom-0.0015*${zoomSpeed},zoom+0.0015*${zoomSpeed}))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=250`; break;
        }
        
        cmd = `-i "${inputKen}" -vf "${zoomFilter},fade=out:st=5:d=1" output.mp4`;
        break;
        
      case 'add_subtitle':
        const inputSub = getInputFileName('input');
        const subtitleFile = getInputFileName('subtitle_file', 'subtitle');
        if (config.subtitle_file) {
          cmd = `-i "${inputSub}" -vf "subtitles=${subtitleFile}" output.mp4`;
        }
        break;
        
      case 'add_text':
        const inputText = getInputFileName('input');
        if (config.text) {
          let textPosition = '';
          switch (config.position) {
            case 'top': textPosition = '100'; break;
            case 'middle': textPosition = '(h-text_h)/2'; break;
            case 'bottom': textPosition = 'h-th-100'; break;
            default: textPosition = 'h-th-100';
          }
          
          const fontSize = config.font_size || 24;
          const fontColor = config.font_color || 'white';
          
          cmd = `-i "${inputText}" `;
          cmd += `-vf "drawtext=text='${config.text}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${textPosition}" output.mp4`;
        }
        break;
        
      case 'draw_box':
        const inputBox = getInputFileName('input');
        cmd = `-i "${inputBox}" `;
        cmd += `-vf "drawbox=x=${config.x || 0}:y=${config.y || 0}:w=${config.width || 100}:h=${config.height || 100}:color=${config.color || 'red'}@${(config.opacity || 100) / 100}:t=${config.thickness || 3}" output.mp4`;
        break;
        
      case 'generate_video_from_image':
        const inputImage = getInputFileName('input_image', 'input');
        const duration = config.duration || 5;
        const fps = config.fps || 30;
        let resolution = '';
        
        switch (config.resolution) {
          case '720p': resolution = '1280x720'; break;
          case '1080p': resolution = '1920x1080'; break;
          case '4k': resolution = '3840x2160'; break;
          default: resolution = '1280x720';
        }
        
        cmd = `-loop 1 -i "${inputImage}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -vf scale=${resolution} output.mp4`;
        break;
        
      // FFprobe commands
      case 'show_format':
        const inputFormat = getInputFileName('input');
        cmd = `-show_format "${inputFormat}"`;
        if (config.output_format && config.output_format !== 'default') {
          cmd = `-of ${config.output_format} -show_format "${inputFormat}"`;
        }
        break;
        
      case 'show_streams':
        const inputStreams = getInputFileName('input');
        cmd = `-show_streams "${inputStreams}"`;
        if (config.stream_type && config.stream_type !== 'all') {
          cmd = `-select_streams ${config.stream_type} -show_streams "${inputStreams}"`;
        }
        if (config.output_format && config.output_format !== 'default') {
          cmd = config.stream_type && config.stream_type !== 'all' 
            ? `-select_streams ${config.stream_type} -of ${config.output_format} -show_streams "${inputStreams}"`
            : `-of ${config.output_format} -show_streams "${inputStreams}"`;
        }
        break;
        
      case 'show_duration':
        const inputDuration = getInputFileName('input');
        if (config.precision === 'milliseconds') {
          cmd = `-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputDuration}"`;
        } else if (config.precision === 'timecode') {
          cmd = `-v error -show_entries format=time_base -of default=noprint_wrappers=1:nokey=1 "${inputDuration}"`;
        } else {
          cmd = `-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputDuration}"`;
        }
        break;
        
      case 'show_resolution':
        const inputResolution = getInputFileName('input');
        if (config.stream_index !== undefined && config.stream_index !== '') {
          cmd = `-v error -select_streams v:${config.stream_index} -show_entries stream=width,height -of default=noprint_wrappers=1 "${inputResolution}"`;
        } else {
          cmd = `-v error -select_streams v -show_entries stream=width,height -of default=noprint_wrappers=1 "${inputResolution}"`;
        }
        break;
        
      case 'show_bitrate':
        const inputBitrate = getInputFileName('input');
        if (config.bitrate_type === 'video') {
          cmd = `-v error -select_streams v -show_entries stream=bit_rate -of default=noprint_wrappers=1:nokey=1 "${inputBitrate}"`;
        } else if (config.bitrate_type === 'audio') {
          cmd = `-v error -select_streams a -show_entries stream=bit_rate -of default=noprint_wrappers=1:nokey=1 "${inputBitrate}"`;
        } else {
          cmd = `-v error -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "${inputBitrate}"`;
        }
        break;
        
      case 'show_fps':
        const inputFps = getInputFileName('input');
        if (config.stream_index !== undefined && config.stream_index !== '') {
          cmd = `-v error -select_streams v:${config.stream_index} -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${inputFps}"`;
        } else {
          cmd = `-v error -select_streams v -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "${inputFps}"`;
        }
        break;
        
      case 'show_codec':
        const inputCodec = getInputFileName('input');
        if (config.stream_type && config.stream_type !== 'all') {
          cmd = `-v error -select_streams ${config.stream_type} -show_entries stream=codec_name,codec_long_name -of default=noprint_wrappers=1 "${inputCodec}"`;
        } else {
          cmd = `-v error -show_entries stream=codec_name,codec_long_name -of default=noprint_wrappers=1 "${inputCodec}"`;
        }
        break;
        
      case 'show_metadata':
        const inputMetadata = getInputFileName('input');
        if (config.metadata_type === 'format') {
          cmd = `-show_format -show_entries format_tags "${inputMetadata}"`;
        } else if (config.metadata_type === 'streams') {
          cmd = `-show_streams -show_entries stream_tags "${inputMetadata}"`;
        } else {
          cmd = `-show_format -show_streams "${inputMetadata}"`;
        }
        break;
        
      case 'show_chapters':
        const inputChapters = getInputFileName('input');
        if (config.output_format === 'json') {
          cmd = `-of json -show_chapters "${inputChapters}"`;
        } else {
          cmd = `-show_chapters "${inputChapters}"`;
        }
        break;
        
      case 'show_frame_count':
        const inputFrameCount = getInputFileName('input');
        if (config.stream_index !== undefined && config.stream_index !== '') {
          cmd = `-v error -select_streams v:${config.stream_index} -count_frames -show_entries stream=nb_frames -of default=noprint_wrappers=1:nokey=1 "${inputFrameCount}"`;
        } else {
          cmd = `-v error -select_streams v -count_frames -show_entries stream=nb_frames -of default=noprint_wrappers=1:nokey=1 "${inputFrameCount}"`;
        }
        break;
        
      default:
        cmd = '';
    }
    
    return cmd.trim();
  };

  // 获取文件扩展名
  const getFileExtension = (fileName: string) => {
    if (!fileName) return 'mp4';
    return fileName.split('.').pop()?.toLowerCase() || 'mp4';
  };

  // 根据文件扩展名获取MIME类型
  const getMimeType = (fileName: string) => {
    const ext = getFileExtension(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      // 视频
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      'm4v': 'video/x-m4v',
      '3gp': 'video/3gpp',
      '3g2': 'video/3gpp2',
      'm2ts': 'video/mp2t',
      'mts': 'video/mp2t',
      'ts': 'video/mp2t',
      'f4v': 'video/mp4',
      'mjpeg': 'video/x-mjpeg',
      'mjpg': 'video/x-mjpeg',
      'mpg': 'video/mpeg',
      'mpeg': 'video/mpeg',
      'vob': 'video/x-ms-vob',
      
      // 音频
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'wma': 'audio/x-ms-wma',
      'opus': 'audio/opus',
      'ogg': 'audio/ogg',
      'aiff': 'audio/aiff',
      'aif': 'audio/aiff',
      'au': 'audio/basic',
      'snd': 'audio/basic',
      'mid': 'audio/midi',
      'midi': 'audio/midi',
      'mp2': 'audio/mpeg',
      'mpa': 'audio/mpeg',
      'mpega': 'audio/mpeg',
      'mpga': 'audio/mpeg',
      'oga': 'audio/ogg',
      'spx': 'audio/ogg',
      'weba': 'audio/webm',
      
      // 图像
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'gif': 'image/gif',
      'heic': 'image/heic',
      'heif': 'image/heif',
      
      // 文档
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'xml': 'application/xml',
      'json': 'application/json',
      'csv': 'text/csv',
      'rtf': 'application/rtf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  };

  // 验证文件名合法性
  const validateFileName = (fileName: string): { isValid: boolean; errorMessage?: string } => {
    if (!fileName || fileName.trim() === '') {
      return { isValid: false, errorMessage: t('tool.ffmpeg.errors.filename_required') };
    }

    // 检查是否包含非法字符
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      return { isValid: false, errorMessage: t('tool.ffmpeg.errors.invalid_characters') };
    }

    // 检查是否以空格或点结尾
    if (fileName.endsWith(' ') || fileName.endsWith('.')) {
      return { isValid: false, errorMessage: t('tool.ffmpeg.errors.cannot_end_with_space_or_dot') };
    }

    // 检查长度
    if (fileName.length > 255) {
      return { isValid: false, errorMessage: t('tool.ffmpeg.errors.filename_too_long') };
    }

    // 检查是否为Windows保留名称
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    if (reservedNames.test(nameWithoutExt)) {
      return { isValid: false, errorMessage: t('tool.ffmpeg.errors.reserved_name') };
    }

    return { isValid: true };
  };

  // 应用生成的命令到命令输入框
  const applyCommand = (functionId: string) => {
    const cmd = generateCommand(functionId);
    if (cmd) {
      setCommand(cmd);
      // 自动滚动到命令输入框
      setTimeout(() => {
        const commandElement = document.getElementById('ffmpeg-command-input');
        if (commandElement) {
          commandElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
        {/* Command Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              {t('tool.ffmpeg.command')}
            </label>
            <div className="flex items-center gap-2">
              <SegmentedControl
                options={[
                  { value: 'ffmpeg', label: 'FFmpeg', disabled: isFfmpegLoading || isRunning },
                  { value: 'ffprobe', label: 'FFprobe', disabled: isFfmpegLoading || isRunning }
                ]}
                value={commandType}
                onChange={(value) => setCommandType(value as 'ffmpeg' | 'ffprobe')}
                size="sm"
                fitWidth={true}
              />
              <SegmentedControl
                options={[
                  { value: 'single', label: t('tool.ffmpeg.single_thread'), disabled: isFfmpegLoading || isRunning },
                  { value: 'multi', label: t('tool.ffmpeg.multi_thread'), disabled: isFfmpegLoading || isRunning }
                ]}
                value={ffmpegVersion}
                onChange={setFfmpegVersion}
                size="sm"
                fitWidth={true}
              />
            </div>
          </div>
          <div className="relative">
            <div className="flex">
              <div className={`px-3 py-3 font-mono text-sm rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 ${commandType === 'ffmpeg' ? 'text-blue-500' : 'text-green-500'} min-w-[80px] text-center flex items-start justify-center pt-3`}>
                {commandType}
              </div>
              <textarea
                id="ffmpeg-command-input"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={commandType === 'ffmpeg' 
                  ? '-i input.mp4 -vf scale=1280:720 output.mp4' 
                  : '-v quiet -print_format json -show_format -show_streams input.mp4'
                }
                className="w-full p-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-none"
                disabled={isRunning || isFfmpegLoading}
              />
            </div>
            {isFfmpegLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* File System and Common Functions Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* File System Tree - Left (1/3) */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{t('tool.ffmpeg.file_system')}</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refreshFileSystem()}
                  disabled={isRunning || isFfmpegLoading}
                  title={t('tool.ffmpeg.refresh')}
                >
                  <RefreshCw className={`w-4 h-4 ${isRunning || isFfmpegLoading ? 'animate-spin' : ''}`} />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      uploadFiles(Array.from(e.target.files), '.');
                    }
                  }}
                  className="hidden"
                  multiple
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRunning || isFfmpegLoading}
                  title={t('tool.ffmpeg.upload_files')}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                {selectedFiles.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadSelectedFiles}
                    disabled={isRunning || isDownloading || isFfmpegLoading}
                    title={t('tool.ffmpeg.download_selected', { count: selectedFiles.length })}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <Card
              className="p-0 overflow-hidden h-full relative"
              onDragOver={(e) => {
                e.preventDefault();
                // 清除 dragOverNode 状态，表示拖拽到空白区域
                if (dragOverNode) {
                  setDragOverNode(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  uploadFiles(Array.from(e.dataTransfer.files) as File[], '.');
                }
              }}
            >
              <div className="text-center p-0 border-gray-200 dark:border-gray-700">
                {isFfmpegLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {t('tool.ffmpeg.loading_ffmpeg')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('tool.ffmpeg.loading_description')}
                    </p>
                  </div>
                ) : ffmpegRef.current && rootNode ? (
                  <div className="max-h-[500px] overflow-y-auto">
                    <FileTreeNode node={rootNode} depth={0} />
                  </div>
                ) : ffmpegRef.current && !rootNode ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <FileIcon className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="font-medium mb-1">{t('tool.ffmpeg.file_system_empty')}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('tool.ffmpeg.upload_to_start')}
                    </p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      {t('tool.ffmpeg.select_files')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                    <p className="font-medium text-red-600 dark:text-red-400 mb-1">
                      {t('tool.ffmpeg.load_failed')}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t('tool.ffmpeg.load_failed_description')}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Retry loading
                        setIsFfmpegLoading(true);
                        const initFFmpeg = async () => {
                          try {
                            const useMultithreading = ffmpegVersion === 'multi';
                            ffmpegRef.current = await loadFFmpeg(useMultithreading);
                            
                            ffmpegRef.current.on('log', ({ message }: { message: string }) => {
                              setLogs(prev => [...prev, message]);
                            });
                            
                            ffmpegRef.current.on('progress', ({ progress, time }: { progress: number; time: number }) => {
                              const percentage = Math.round(progress * 100);
                              setExecutionProgress(percentage);
                              setLogs(prev => [...prev, `Progress: ${percentage}% (transcoded time: ${time / 1000000} s)`]);
                            });

                            await loadFileSystem();
                            setLogs(prev => [...prev, 'FFmpeg loaded successfully']);
                          } catch (error) {
                            console.error('Failed to load FFmpeg:', error);
                            setLogs(prev => [...prev, `Error loading FFmpeg: ${(error as Error).message}`]);
                          } finally {
                            setIsFfmpegLoading(false);
                          }
                        };
                        initFFmpeg();
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('tool.ffmpeg.retry')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Common Functions Tabs - Right (2/3) */}
          <div className="lg:col-span-2">
            <h3 className="font-medium mb-3">{t('tool.ffmpeg.common_functions')}</h3>
            <Card className="p-0 overflow-hidden h-full">
              {/* TAB导航栏 - 只在FFmpeg模式下显示 */}
              {commandType === 'ffmpeg' && (
                <div className="border-b bg-gray-50 dark:bg-gray-800">
                  <nav className="flex overflow-x-auto">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeCategory === category.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </nav>
                </div>
              )}
              
              {/* TAB内容区 */}
              <div className="p-4 overflow-y-auto max-h-[500px]">
                {(commandType === 'ffprobe' || activeCategory === 'quick_commands') && (
                  <>
                    {isFfmpegLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('tool.ffmpeg.loading_ffmpeg')}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(commandType === 'ffprobe' ? ffprobe_functions : ffmpeg_functions)[activeCategory]?.filter((func: any) =>
                          !func.tool || func.tool === commandType
                        ).map((func: any) => {
                          const IconComponent = func.icon;
                          return (
                            <div
                              key={func.id}
                              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                              onClick={() => {
                                // 显示详细配置或直接应用命令
                                applyCommand(func.id);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <IconComponent className={`w-5 h-5 ${commandType === 'ffprobe' ? 'text-green-500' : 'text-blue-500'}`} />
                                <h4 className="font-medium text-sm">{func.name}</h4>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                {t('tool.ffmpeg.click_to_apply')}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                
                {/* 功能配置表单 - 不在quick_commands TAB中显示 */}
                {activeCategory !== 'quick_commands' && (
                  <div className="mt-4">
                    <h3 className="font-medium mb-3">
                      {((commandType === 'ffprobe' ? ffprobe_functions : ffmpeg_functions)[activeCategory] || []).length > 0
                        ? t('tool.ffmpeg.function_settings')
                        : t('tool.ffmpeg.no_functions')}
                    </h3>
                    
                    {isFfmpegLoading ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('tool.ffmpeg.loading_ffmpeg')}
                        </p>
                      </div>
                    ) : (
                      ((commandType === 'ffprobe' ? ffprobe_functions : ffmpeg_functions)[activeCategory] || []).filter((func: any) =>
                        !func.tool || func.tool === commandType
                      ).map((func: any) => (
                        <div key={func.id} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm">{func.name}</h4>
                            <Button
                              size="sm"
                              onClick={() => applyCommand(func.id)}
                              disabled={isFfmpegLoading}
                            >
                              {t('tool.ffmpeg.apply')}
                            </Button>
                          </div>
                          
                          {functionDetails[func.id] && functionDetails[func.id].inputs && (
                            <div className="space-y-3">
                              {functionDetails[func.id].inputs.map((input: any) => (
                                <div key={input.id}>
                                  <label className="block text-xs font-medium mb-1">
                                    {input.label}
                                    {input.required && <span className="text-red-500">*</span>}
                                  </label>
                                  
                                  {input.type === 'select' ? (
                                    <select
                                      className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                      value={functionConfig[func.id]?.[input.id] || ''}
                                      onChange={(e) => updateFunctionConfig(func.id, input.id, e.target.value)}
                                      disabled={isFfmpegLoading}
                                    >
                                      <option value="">{t('tool.ffmpeg.select_option')}</option>
                                      {input.options.map((option: any) => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : input.type === 'range' ? (
                                    <div className="space-y-1">
                                      <input
                                        type="range"
                                        min={input.min}
                                        max={input.max}
                                        step={input.step}
                                        className="w-full"
                                        value={functionConfig[func.id]?.[input.id] || input.min}
                                        onChange={(e) => updateFunctionConfig(func.id, input.id, parseInt(e.target.value))}
                                        disabled={isFfmpegLoading}
                                      />
                                      <div className="text-xs text-gray-500 text-center">
                                        {functionConfig[func.id]?.[input.id] || input.min} {input.unit || ''}
                                      </div>
                                    </div>
                                  ) : input.type === 'file' ? (
                                    <div className="space-y-2">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          className="w-full p-2 border rounded text-sm pr-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                          placeholder={input.placeholder || t('tool.ffmpeg.file_placeholder')}
                                          value={functionConfig[func.id]?.[input.id] || ''}
                                          onChange={(e) => updateFunctionConfig(func.id, input.id, e.target.value)}
                                          disabled={isFfmpegLoading}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                          <FileIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                      </div>
                                      {selectedFiles.length > 0 && (
                                        <div className="relative">
                                          <select
                                            className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                            onChange={(e) => {
                                              if (e.target.value) {
                                                updateFunctionConfig(func.id, input.id, e.target.value);
                                              }
                                            }}
                                            value=""
                                            disabled={isFfmpegLoading}
                                          >
                                            <option value="">{t('tool.ffmpeg.select_uploaded_file')}</option>
                                            {selectedFiles.map((file) => (
                                              <option key={file.file.name} value={file.path}>
                                                {file.file.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <input
                                      type={input.type}
                                      className="w-full p-2 border rounded text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                                      placeholder={input.placeholder}
                                      value={functionConfig[func.id]?.[input.id] || ''}
                                      onChange={(e) => updateFunctionConfig(func.id, input.id, e.target.value)}
                                      disabled={isFfmpegLoading}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="mb-6"> 
        </div>

        {/* Execute Button */}
        <Button
          onClick={executeCommand}
          disabled={isRunning || !command.trim() || isFfmpegLoading}
          className="w-full py-6 mb-6"
        >
          {isFfmpegLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('tool.ffmpeg.loading_ffmpeg')}
            </>
          ) : isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isDownloading ? (
                t('tool.ffmpeg.downloading')
              ) : (
                `${t('tool.ffmpeg.executing')} ${executionProgress > 0 ? `(${executionProgress}%)` : ''}`
              )}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t('tool.ffmpeg.execute')}
            </>
          )}
        </Button>


        {/* Logs */}
        <div>
          <div 
            className="flex items-center justify-between cursor-pointer mb-2"
            onClick={() => setShowLogs(!showLogs)}
          >
            <h3 className="font-medium flex items-center gap-2">
              <TerminalIcon className="w-4 h-4" />
              {t('tool.ffmpeg.execution_logs')}
            </h3>
            {showLogs ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
          
          {showLogs && (
            <div ref={logContainerRef} className="p-3 max-h-60 overflow-y-auto font-mono text-sm bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              {logs.length > 0 ? (
                <>
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={log.startsWith('Error') ? 'text-red-500' : ''}
                    >
                      {log}
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t('tool.ffmpeg.logs_empty')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Output Files */}
        {outputFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3">{t('tool.ffmpeg.output_files')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {outputFiles.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => {
                      // Create a Blob from the Uint8Array data
                      let buffer: ArrayBuffer;
                      
                      // 检查是否存在 SharedArrayBuffer 并且正确处理数据
                      if (typeof SharedArrayBuffer !== 'undefined' && file.data.buffer instanceof SharedArrayBuffer) {
                        // 将 SharedArrayBuffer 转换为普通 ArrayBuffer
                        buffer = new Uint8Array(file.data).slice().buffer;
                      } else {
                        // 直接使用数据的 buffer 或创建新的副本
                        buffer = file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength) as ArrayBuffer;
                      }
                      
                      const blob = new Blob([buffer], { type: 'application/octet-stream' });
                      // Create a temporary URL and open it in a new tab
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    }}
                  >
                    <FileIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm truncate max-w-[120px]">{file.name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => downloadFile(file.name, file.data)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

    </div>
  );
};

export default FFmpegTool;
