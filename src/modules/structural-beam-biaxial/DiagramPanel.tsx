import React from 'react';
import { ModuleDiagramProps } from '../types';

const DiagramPanel: React.FC<ModuleDiagramProps> = () => (
  <div
    className="relative shadow-inner overflow-hidden flex flex-col"
    style={{
      width: '33.333%',
      borderRight: '1px solid #d1d5db',
      backgroundImage: 'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      backgroundColor: '#f8fafc',
    }}
  >
    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded shadow text-sm font-semibold text-gray-800 z-10 border border-gray-200">
      结构梁双向受力示意图
    </div>
    <div className="flex-1 w-full flex items-center justify-center text-sm text-gray-400">
      Konva 绘图暂空
    </div>
  </div>
);

export default DiagramPanel;

