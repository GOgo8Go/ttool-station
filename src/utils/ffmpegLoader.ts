import { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * 加载FFmpeg核心的工具函数
 * 按照优先级依次尝试不同来源的FFmpeg核心文件
 * @returns 初始化并加载完成的FFmpeg实例
 */
export const loadFFmpeg = async (): Promise<FFmpeg> => {
  // Define all loading options in order
  const loadOptions = [
    // Local built assets
    {
      coreURL: '/assets/ffmpeg-N6ahAfcc.js',
      wasmURL: '/assets/ffmpeg-core-Cbz6om2n.wasm'
    },
    // Dev paths
    {
      coreURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',
      wasmURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm'
    },
    // CDN options
    {
      coreURL: 'https://unpkg.zhimg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.zhimg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm'
    },
    {
      coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm'
    },
    {
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm'
    },
  ];
  
  // Try each option in order until one succeeds
  let ffmpeg: FFmpeg | null = null;
  let loaded = false;
  
  for (const option of loadOptions) {
    try {
      // Create a new FFmpeg instance for each attempt
      ffmpeg = new FFmpeg();
      await ffmpeg.load(option);
      loaded = true;
      break;
    } catch (err) {
      console.warn(`Failed to load FFmpeg with option:`, option, err);
      // Continue to next option
    }
  }
  
  if (!loaded || !ffmpeg) {
    throw new Error('Failed to load FFmpeg core from all sources');
  }
  
  return ffmpeg;
};