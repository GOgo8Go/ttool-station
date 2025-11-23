import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  component: React.ComponentType;
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  tools: ToolMetadata[];
}

export type ThemeMode = 'light' | 'dark';