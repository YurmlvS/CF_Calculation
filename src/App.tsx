import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { modules, getModuleById, defaultModuleId } from './modules';
import Navbar from './components/Navbar';
import ParamsPanel from './components/ParamsPanel';

// 全局 Window 声明
declare global {
  interface Window {
    html2pdf: any;
    Konva: any;
  }
}

export default function App() {
  // --- 当前模块 ID ---
  const [currentModuleId, setCurrentModuleId] = useState(defaultModuleId);

  // --- 解析当前活跃模块 ---
  const activeModule = useMemo(
    () => getModuleById(currentModuleId) ?? modules[0],
    [currentModuleId],
  );

  // --- 参数状态 ---
  const [params, setParams] = useState<Record<string, number | ''>>(() => ({
    ...activeModule.defaultParams,
  }));

  // --- 计算目标 ---
  const [calcTarget, setCalcTarget] = useState(activeModule.defaultCalcTarget);

  // --- Konva 加载状态 ---
  const [isKonvaLoaded, setIsKonvaLoaded] = useState(false);

  // --- 动态加载 Konva.js ---
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

  // --- 切换模块时重置参数和计算目标 ---
  const handleModuleChange = useCallback((moduleId: string) => {
    const mod = getModuleById(moduleId);
    if (!mod) return;
    setCurrentModuleId(moduleId);
    setParams({ ...mod.defaultParams });
    setCalcTarget(mod.defaultCalcTarget);
  }, []);

  // --- 核心计算 ---
  const calcResult = useMemo(
    () => activeModule.calculate(params, calcTarget),
    [params, calcTarget, activeModule],
  );

  // --- 处理输入变化 ---
  const handleInputChange = useCallback(
    (key: string) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setParams((prev) => ({ ...prev, [key]: val === '' ? '' : Number(val) }));
      },
    [],
  );

  // --- 获取模块提供的面板组件 ---
  const ModuleDiagram = activeModule.DiagramPanel;
  const ModuleResult = activeModule.ResultPanel;

  return (
    <div
      className="bg-gray-100 text-gray-800 font-sans h-full flex flex-col overflow-hidden"
    >
      {/* 顶部导航栏 */}
      <Navbar />

      {/* 主体三列布局 */}
      <main className="flex flex-1 overflow-hidden relative">

        {/* ── 列 1：Konva 绘图区（由模块提供） ── */}
        <ModuleDiagram params={params} isKonvaLoaded={isKonvaLoaded} />

        {/* ── 列 2：参数输入区 ── */}
        <div
          className="bg-gray-50 flex flex-col relative overflow-y-auto"
          style={{
            width: '23%', minWidth: '200px',
            borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb'
          }}
        >
          <div className="p-5 flex flex-col gap-5 w-full">
            <ParamsPanel
              currentModuleId={currentModuleId}
              onModuleChange={handleModuleChange}
              activeModule={activeModule}
              params={params}
              onParamChange={handleInputChange}
              calcTarget={calcTarget}
              onCalcTargetChange={setCalcTarget}
            />
          </div>
        </div>

        {/* ── 列 3：结果报告区（由模块提供） ── */}
        <div
          className="flex-1 bg-white flex flex-col relative overflow-y-auto"
        >
          <div className="p-8 flex flex-col gap-6 w-full">
            {/* 标题行 + 导出按钮 */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                结果报告 (Result Report)
              </h2>
              <div className="flex gap-2">
                <div 
                  className="relative"
                  onMouseEnter={(e) => {
                    const dropdown = e.currentTarget.querySelector('.latex-dropdown');
                    if (dropdown instanceof HTMLElement) {
                      dropdown.style.opacity = '1';
                      dropdown.style.visibility = 'visible';
                      dropdown.style.transform = 'translateY(0)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const dropdown = e.currentTarget.querySelector('.latex-dropdown');
                    if (dropdown instanceof HTMLElement) {
                      dropdown.style.opacity = '0';
                      dropdown.style.visibility = 'hidden';
                      dropdown.style.transform = 'translateY(-5px)';
                    }
                  }}
                >
                  <button
                    id="btn-export-word"
                    onClick={() => activeModule.exportToWord(calcResult, params, calcTarget)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      backgroundColor: '#2563eb', color: '#fff',
                      padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                      fontSize: '0.8125rem', fontWeight: 500,
                      cursor: 'pointer', border: 'none',
                      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  >
                    导出 Word
                  </button>
                  <div 
                    className="latex-dropdown absolute left-0 mt-1 w-full z-10"
                    style={{
                      opacity: 0,
                      visibility: 'hidden',
                      transform: 'translateY(-5px)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <button
                      onClick={() => {
                        if (activeModule.exportToLaTeX) {
                          activeModule.exportToLaTeX(calcResult, params, calcTarget);
                        } else {
                          alert("当前模块不支持导出LaTeX版功能");
                        }
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#ffffff',
                        color: '#2563eb',
                        padding: '0.4rem 0',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: '1px solid #bfdbfe',
                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      导出LaTeX版
                    </button>
                  </div>
                </div>
                <button
                  id="btn-export-pdf"
                  onClick={() => void activeModule.exportToPDF(calcResult)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    backgroundColor: '#1e293b', color: '#fff',
                    padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
                    fontSize: '0.8125rem', fontWeight: 500,
                    cursor: 'pointer', border: 'none',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                >
                  导出 PDF
                </button>
              </div>
            </div>

            <ModuleResult
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
