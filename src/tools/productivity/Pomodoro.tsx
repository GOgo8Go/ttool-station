import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const Pomodoro: React.FC = () => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? WORK_TIME : BREAK_TIME);
  }, [mode]);

  const handleModeChange = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? WORK_TIME : BREAK_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((mode === 'work' ? WORK_TIME : BREAK_TIME) - timeLeft) / (mode === 'work' ? WORK_TIME : BREAK_TIME) * 100;

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto space-y-8">
      <SegmentedControl
        value={mode}
        onChange={handleModeChange}
        options={[
          { value: 'work', label: <><Briefcase size={16} /> {t('tool.pomodoro.work')}</> },
          { value: 'break', label: <><Coffee size={16} /> {t('tool.pomodoro.break')}</> },
        ]}
      />

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Circular Progress Background */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200 dark:text-gray-800"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className={`transition-all duration-1000 ${mode === 'work' ? 'text-primary-500' : 'text-green-500'}`}
          />
        </svg>
        <div className="text-6xl font-mono font-bold tracking-tighter text-gray-900 dark:text-white z-10">
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={toggleTimer} size="lg" className="w-32">
          {isActive ? <><Pause className="mr-2 w-5 h-5" /> {t('tool.pomodoro.pause')}</> : <><Play className="mr-2 w-5 h-5" /> {t('tool.pomodoro.start')}</>}
        </Button>
        <Button onClick={resetTimer} variant="secondary" size="lg">
          <RotateCcw className="w-5 h-5" /> {t('tool.pomodoro.reset')}
        </Button>
      </div>
    </div>
  );
};

export default Pomodoro;