import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Monitor, Play, Pause, RotateCcw, Fullscreen, Palette, Grid3X3, Eye, EyeOff } from 'lucide-react';

const ScreenTest: React.FC = () => {
  const { t } = useTranslation();
  const [currentTest, setCurrentTest] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [testSpeed, setTestSpeed] = useState(1500); // milliseconds
  const [showInfo, setShowInfo] = useState(true); // 控制是否显示中间文字
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Common test patterns for screen testing
  const testPatterns = [
    { name: t('tool.screen-test.black'), color: '#000000', description: t('tool.screen-test.check_bright_spots') },
    { name: t('tool.screen-test.white'), color: '#FFFFFF', description: t('tool.screen-test.check_dark_spots') },
    { name: t('tool.screen-test.red'), color: '#FF0000', description: t('tool.screen-test.check_green_channel') },
    { name: t('tool.screen-test.green'), color: '#00FF00', description: t('tool.screen-test.check_red_blue_channels') },
    { name: t('tool.screen-test.blue'), color: '#0000FF', description: t('tool.screen-test.check_red_green_channels') },
    { name: t('tool.screen-test.cyan'), color: '#00FFFF', description: t('tool.screen-test.check_red_channel') },
    { name: t('tool.screen-test.magenta'), color: '#FF00FF', description: t('tool.screen-test.check_green_channel') },
    { name: t('tool.screen-test.yellow'), color: '#FFFF00', description: t('tool.screen-test.check_blue_channel') },
    { name: t('tool.screen-test.gray'), color: '#808080', description: t('tool.screen-test.check_brightness_uniformity') },
  ];

  // Gray scale patterns for each color
  const grayScalePatterns = [
    { name: t('tool.screen-test.red_grayscale'), gradient: 'linear-gradient(to right, #000000, #FF0000, #FFFFFF)' },
    { name: t('tool.screen-test.green_grayscale'), gradient: 'linear-gradient(to right, #000000, #00FF00, #FFFFFF)' },
    { name: t('tool.screen-test.blue_grayscale'), gradient: 'linear-gradient(to right, #000000, #0000FF, #FFFFFF)' },
    { name: t('tool.screen-test.cyan_grayscale'), gradient: 'linear-gradient(to right, #000000, #00FFFF, #FFFFFF)' },
    { name: t('tool.screen-test.magenta_grayscale'), gradient: 'linear-gradient(to right, #000000, #FF00FF, #FFFFFF)' },
    { name: t('tool.screen-test.yellow_grayscale'), gradient: 'linear-gradient(to right, #000000, #FFFF00, #FFFFFF)' },
    { name: t('tool.screen-test.bw_grayscale'), gradient: 'linear-gradient(to right, #000000, #808080, #FFFFFF)' },
  ];

  // Gradient patterns for smoothness testing
  const gradientPatterns = [
    { name: t('tool.screen-test.red_green_gradient'), gradient: 'linear-gradient(to right, #FF0000, #00FF00)' },
    { name: t('tool.screen-test.blue_yellow_gradient'), gradient: 'linear-gradient(to right, #0000FF, #FFFF00)' },
    { name: t('tool.screen-test.gray_gradient'), gradient: 'linear-gradient(to right, #000000, #FFFFFF)' },
    { name: t('tool.screen-test.rainbow_gradient'), gradient: 'linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)' },
  ];

  // Checkerboard patterns for sharpness testing
  const checkerboardPatterns = [
    { name: t('tool.screen-test.grid_1px'), size: 1 },
    { name: t('tool.screen-test.grid_4px'), size: 4 },
    { name: t('tool.screen-test.grid_8px'), size: 8 },
  ];

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startAutoTest = () => {
    if (currentTest === null) {
      setCurrentTest(0);
    }
    setIsPlaying(true);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setCurrentTest(prev => {
        if (prev === null) return 0;
        return (prev + 1) % (testPatterns.length + grayScalePatterns.length);
      });
    }, testSpeed);
  };

  const pauseAutoTest = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTest = () => {
    pauseAutoTest();
    setCurrentTest(null);
  };

  const nextTest = () => {
    const totalTests = testPatterns.length + grayScalePatterns.length + gradientPatterns.length + checkerboardPatterns.length;
    if (currentTest === null) {
      setCurrentTest(0);
    } else {
      setCurrentTest((currentTest + 1) % totalTests);
    }
  };

  const prevTest = () => {
    const totalTests = testPatterns.length + grayScalePatterns.length + gradientPatterns.length + checkerboardPatterns.length;
    if (currentTest === null) {
      setCurrentTest(totalTests - 1);
    } else {
      setCurrentTest((currentTest - 1 + totalTests) % totalTests);
    }
  };

  const enterFullscreen = () => {
    if (fullscreenRef.current) {
      if (fullscreenRef.current.requestFullscreen) {
        fullscreenRef.current.requestFullscreen();
      } else if ((fullscreenRef.current as any).mozRequestFullScreen) {
        (fullscreenRef.current as any).mozRequestFullScreen();
      } else if ((fullscreenRef.current as any).webkitRequestFullscreen) {
        (fullscreenRef.current as any).webkitRequestFullscreen();
      } else if ((fullscreenRef.current as any).msRequestFullscreen) {
        (fullscreenRef.current as any).msRequestFullscreen();
      }
    }
  };

  const renderCheckerboard = (size: number) => {
    return {
      backgroundImage: `
        linear-gradient(45deg, #000000 25%, #ffffff 25%), 
        linear-gradient(-45deg, #000000 25%, #ffffff 25%),
        linear-gradient(45deg, #ffffff 75%, #000000 75%),
        linear-gradient(-45deg, #ffffff 75%, #000000 75%)
      `,
      backgroundSize: `${size * 2}px ${size * 2}px`,
      backgroundPosition: `0 0, 0 ${size}px, ${size}px -${size}px, -${size}px 0px`
    };
  };

  // 获取当前测试项
  const getCurrentTestItem = () => {
    if (currentTest === null) return null;
    
    if (currentTest < testPatterns.length) {
      return {
        type: 'solid',
        data: testPatterns[currentTest],
        index: currentTest,
        total: testPatterns.length
      };
    } else if (currentTest < testPatterns.length + grayScalePatterns.length) {
      const index = currentTest - testPatterns.length;
      return {
        type: 'grayscale',
        data: grayScalePatterns[index],
        index: currentTest,
        total: testPatterns.length + grayScalePatterns.length
      };
    } else if (currentTest < testPatterns.length + grayScalePatterns.length + gradientPatterns.length) {
      const index = currentTest - testPatterns.length - grayScalePatterns.length;
      return {
        type: 'gradient',
        data: gradientPatterns[index],
        index: currentTest,
        total: testPatterns.length + grayScalePatterns.length + gradientPatterns.length
      };
    } else {
      const index = currentTest - testPatterns.length - grayScalePatterns.length - gradientPatterns.length;
      return {
        type: 'checkerboard',
        data: checkerboardPatterns[index],
        index: currentTest,
        total: testPatterns.length + grayScalePatterns.length + gradientPatterns.length + checkerboardPatterns.length
      };
    }
  };

  const currentTestItem = getCurrentTestItem();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Main Test Display */}
          <div 
            ref={fullscreenRef}
            className="relative bg-black w-full aspect-video flex items-center justify-center"
          >
            {currentTestItem ? (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor: currentTestItem.type === 'solid' ? (currentTestItem.data as any).color : undefined,
                  backgroundImage: currentTestItem.type !== 'solid' ? 
                    (currentTestItem.type === 'grayscale' || currentTestItem.type === 'gradient' ? 
                      (currentTestItem.data as any).gradient : 
                      undefined) : 
                    undefined,
                  ...((currentTestItem.type === 'checkerboard') ? renderCheckerboard((currentTestItem.data as any).size) : {})
                }}
              >
                {showInfo && (
                  <div className="text-white text-center bg-black/50 p-4 rounded-lg backdrop-blur-sm">
                    <h2 className="text-2xl font-bold">
                      {currentTestItem.type === 'solid' ? (currentTestItem.data as any).name :
                       currentTestItem.type === 'grayscale' ? (currentTestItem.data as any).name :
                       currentTestItem.type === 'gradient' ? (currentTestItem.data as any).name :
                       (currentTestItem.data as any).name}
                    </h2>
                    <p className="mt-2">
                      {currentTestItem.type === 'solid' ? (currentTestItem.data as any).description : ''}
                    </p>
                    <p className="mt-4 text-sm opacity-75">
                      {t('tool.screen-test.test')} {currentTestItem.index + 1} / {testPatterns.length + grayScalePatterns.length + gradientPatterns.length + checkerboardPatterns.length}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Monitor className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t('tool.screen-test.click_start')}</p>
                <p className="text-sm mt-2">{t('tool.screen-test.help_text')}</p>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                {currentTest === null ? (
                  <Button onClick={() => setCurrentTest(0)} className="gap-2">
                    <Play className="w-4 h-4" />
                    {t('tool.screen-test.start_test')}
                  </Button>
                ) : (
                  <>
                    {isPlaying ? (
                      <Button onClick={pauseAutoTest} variant="secondary" className="gap-2">
                        <Pause className="w-4 h-4" />
                        {t('tool.screen-test.pause')}
                      </Button>
                    ) : (
                      <Button onClick={startAutoTest} className="gap-2">
                        <Play className="w-4 h-4" />
                        {t('tool.screen-test.auto_play')}
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => setShowInfo(!showInfo)} 
                      variant="secondary" 
                      className="gap-2"
                    >
                      {showInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showInfo ? t('tool.screen-test.hide_info') : t('tool.screen-test.show_info')}
                    </Button>
                    
                    <Button onClick={resetTest} variant="secondary" className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      {t('tool.screen-test.reset_test')}
                    </Button>
                    
                    <Button onClick={enterFullscreen} variant="secondary" className="gap-2">
                      <Fullscreen className="w-4 h-4" />
                      {t('tool.screen-test.fullscreen')}
                    </Button>
                  </>
                )}
              </div>
              
              {currentTest !== null && (
                <div className="flex gap-2">
                  <Button onClick={prevTest} variant="outline" size="sm">
                    {t('tool.screen-test.previous')}
                  </Button>
                  <Button onClick={nextTest} variant="outline" size="sm">
                    {t('tool.screen-test.next')}
                  </Button>
                </div>
              )}
              
              {isPlaying && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">{t('tool.screen-test.speed')}:</label>
                  <select 
                    value={testSpeed} 
                    onChange={(e) => setTestSpeed(Number(e.target.value))}
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg p-2"
                  >
                    <option value={500}>{t('tool.screen-test.fast')} (0.5s)</option>
                    <option value={1000}>{t('tool.screen-test.medium')} (1s)</option>
                    <option value={1500}>{t('tool.screen-test.slow')} (1.5s)</option>
                    <option value={2000}>{t('tool.screen-test.very_slow')} (2s)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Test Patterns Section */}
            <div className="mt-6 space-y-6">
              {/* Solid Colors */}
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-primary-500" />
                  {t('tool.screen-test.pure_colors')}
                </h3>
                <div className="grid grid-cols-9 gap-2">
                  {testPatterns.map((pattern, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTest(index)}
                      className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium ${
                        currentTest === index 
                          ? 'border-primary-500 ring-2 ring-primary-500/30' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: pattern.color }}
                      title={`${pattern.name}: ${pattern.description}`}
                    >
                      <span className={pattern.color === '#000000' || pattern.color === '#0000FF' ? 'text-white' : 'text-black'}>
                        {pattern.name.substring(0, 1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gray Scale */}
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                  <Palette className="w-5 h-5 text-primary-500" />
                  {t('tool.screen-test.grayscale')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                  {grayScalePatterns.map((pattern, index) => (
                    <div key={index} className="space-y-1">
                      <div 
                        className="h-10 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: pattern.gradient }}
                        onClick={() => setCurrentTest(testPatterns.length + index)}
                      ></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">{pattern.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradients */}
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                  <Grid3X3 className="w-5 h-5 text-primary-500" />
                  {t('tool.screen-test.gradients')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {gradientPatterns.map((pattern, index) => (
                    <div key={index} className="space-y-1">
                      <div 
                        className="h-10 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ background: pattern.gradient }}
                        onClick={() => setCurrentTest(testPatterns.length + grayScalePatterns.length + index)}
                      ></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">{pattern.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sharpness */}
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                  <Grid3X3 className="w-5 h-5 text-primary-500" />
                  {t('tool.screen-test.sharpness')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {checkerboardPatterns.map((pattern, index) => (
                    <div key={index} className="space-y-1">
                      <div 
                        className="h-16 rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                        style={renderCheckerboard(pattern.size)}
                        onClick={() => setCurrentTest(testPatterns.length + grayScalePatterns.length + gradientPatterns.length + index)}
                      ></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 text-center">{pattern.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Test Information Panel */}
        <div className="space-y-6">
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-primary-500" />
              {t('tool.screen-test.guide')}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
                <span>{t('tool.screen-test.guide_item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
                <span>{t('tool.screen-test.guide_item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
                <span>{t('tool.screen-test.guide_item3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
                <span>{t('tool.screen-test.guide_item4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
                <span>{t('tool.screen-test.guide_item5')}</span>
              </li>
            </ul>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-3">{t('tool.screen-test.how_to_use')}</h3>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">{t('tool.screen-test.basic_steps')}:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li>{t('tool.screen-test.checklist_item1')}</li>
                  <li>{t('tool.screen-test.checklist_item2')}</li>
                  <li>{t('tool.screen-test.checklist_item3')}</li>
                  <li>{t('tool.screen-test.checklist_item4')}</li>
                  <li>{t('tool.screen-test.checklist_item5')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('tool.screen-test.common_issues')}:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  <li><strong>{t('tool.screen-test.dead_pixels')}:</strong> {t('tool.screen-test.dead_pixel_desc')}</li>
                  <li><strong>{t('tool.screen-test.stuck_pixels')}:</strong> {t('tool.screen-test.stuck_pixel_desc')}</li>
                  <li><strong>{t('tool.screen-test.color_uniformity')}:</strong> {t('tool.screen-test.color_uniformity_desc')}</li>
                  <li><strong>{t('tool.screen-test.brightness_uniformity')}:</strong> {t('tool.screen-test.brightness_uniformity_desc')}</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ScreenTest;