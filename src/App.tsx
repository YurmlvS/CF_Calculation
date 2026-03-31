import React, { useState, useEffect, useMemo } from 'react';
import { CalcParams, CalcTarget } from './types';
import { buildPhiTable } from './utils/phiUtils';
import { calculate } from './utils/calculate';
import Navbar from './components/Navbar';
import DiagramPanel from './components/DiagramPanel';
import ParamsPanel from './components/ParamsPanel';
import ResultPanel from './components/ResultPanel';

// 全局 Window 声明，避免 TypeScript 报错
declare global {
  interface Window {
    html2pdf: any;
    Konva: any;
  }
}

export default function App() {
  // --- 状态定义 ---
  const [currentModule, setCurrentModule] = useState('y_brace');
  const [calcTarget, setCalcTarget] = useState<CalcTarget>('weak');
  const [isKonvaLoaded, setIsKonvaLoaded] = useState(false);
  const [params, setParams] = useState<CalcParams>({
    n: '', m: '', mu: '', R: '', I: '', A: '', f: '',
  });

  // --- 构建 φ 查表字典（仅初始化一次） ---
  const phiTable = useMemo(() => buildPhiTable(), []);

  // --- 动态加载 Konva.js（CDN） ---
  useEffect(() => {
    if (!window.Konva) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/konva@9.3.6/konva.min.js';
      script.onload = () => setIsKonvaLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsKonvaLoaded(true);
    }
  }, []);

  // --- 切换计算目标时清除 I 和 A ---
  useEffect(() => {
    setParams((prev) => ({ ...prev, I: '', A: '' }));
  }, [calcTarget]);

  // --- 核心计算 ---
  const calcResult = useMemo(
    () => calculate(params, calcTarget, phiTable),
    [params, calcTarget, phiTable],
  );

  // --- 处理输入变化 ---
  const handleInputChange =
    (key: keyof CalcParams) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setParams((prev) => ({ ...prev, [key]: val === '' ? '' : Number(val) }));
    };

  return (
    <div
      className="bg-gray-100 text-gray-800 font-sans min-h-screen flex flex-col overflow-hidden"
    >
      {/* 顶部导航栏 */}
      <Navbar />

      {/* ========================================================
          主体三列布局（从左到右）：
            列 1 — Konva 绘图区  width: 33.33%（1/3，最左）
            列 2 — 参数输入区  width: 20%（约 1/5，居中）
            列 3 — 结果报告区  flex-1（占剩余全部宽度，最右）
          ======================================================== */}
      <main className="flex flex-1 overflow-hidden relative">

        {/* ── 列 1：Konva 绘图区（最左，固定 1/3 宽度） ── */}
        <DiagramPanel params={params} isKonvaLoaded={isKonvaLoaded} />

        {/* ── 列 2：参数输入区（居中，固定约 1/5 宽度） ── */}
        <div
          className="bg-gray-50 flex flex-col relative overflow-y-auto"
          style={{ width: '20%', minWidth: '200px', scrollbarWidth: 'none',
                   borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}
        >
          <div className="p-5 flex flex-col gap-5 w-full">
            <ParamsPanel
              currentModule={currentModule}
              onModuleChange={setCurrentModule}
              params={params}
              onParamChange={handleInputChange}
              calcTarget={calcTarget}
              onCalcTargetChange={setCalcTarget}
            />
          </div>
        </div>

        {/* ── 列 3：结果报告区（最右，自动占满剩余空间） ── */}
        <div
          className="flex-1 bg-white flex flex-col relative overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="p-8 flex flex-col gap-6 w-full">
            <ResultPanel
              params={params}
              calcResult={calcResult}
              calcTarget={calcTarget}
            />
          </div>
        </div>

      </main>
    </div>
  );
}
