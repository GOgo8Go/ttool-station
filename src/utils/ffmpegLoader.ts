import { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * 加载FFmpeg核心的工具函数
 * 按照优先级依次尝试不同来源的FFmpeg核心文件
 * @param useMultithreading 是否使用多线程版本，默认为false
 * @returns 初始化并加载完成的FFmpeg实例
 */
export const loadFFmpeg = async (useMultithreading: boolean = false): Promise<FFmpeg> => {
  // Define all loading options in order
  const loadOptions = useMultithreading ? [
    // Local built assets - MT version
    {
      coreURL: '/assets/ffmpeg-mt-D2RlxlLs.js',
      wasmURL: '/assets/ffmpeg-core-mt-BxZwzDMM.wasm',
      workerURL: '/assets/ffmpeg-core-mt.worker-D2RlxlLs.js'
    },
    // Dev paths - MT version
    {
      coreURL: '/node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.js',
      wasmURL: '/node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.wasm',
      workerURL: '/node_modules/@ffmpeg/core-mt/dist/esm/ffmpeg-core.worker.js'
    },
    // CDN options - MT version
    {
      coreURL: 'https://unpkg.zhimg.com/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.zhimg.com/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.wasm',
      workerURL: 'https://unpkg.zhimg.com/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.worker.js'
    },
    {
      coreURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.wasm',
      workerURL: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.worker.js'
    },
    {
      coreURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.js',
      wasmURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.wasm',
      workerURL: 'https://unpkg.com/@ffmpeg/core-mt@0.12.10/dist/esm/ffmpeg-core.worker.js'
    },
  ] : [
    // Local built assets - ST version
    {
      coreURL: '/assets/ffmpeg-N6ahAfcc.js',
      wasmURL: '/assets/ffmpeg-core-Cbz6om2n.wasm'
    },
    // Dev paths - ST version
    {
      coreURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js',
      wasmURL: '/node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm'
    },
    // CDN options - ST version
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