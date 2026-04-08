import React, { useEffect, useRef } from 'react';
import { ModuleDiagramProps } from '../types';

/**
 * Y撑模块 —— Konva 绘图面板（Y撑支护示意图）
 */
const DiagramPanel: React.FC<ModuleDiagramProps> = ({ params, isKonvaLoaded }) => {
  const konvaContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const shapeGroupRef = useRef<any>(null);
  const drawFnRef = useRef<(() => void) | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!konvaContainerRef.current || !window.Konva) return;
    const container = konvaContainerRef.current;

    if (!stageRef.current) {
      stageRef.current = new window.Konva.Stage({
        container,
        width: container.offsetWidth,
        height: container.offsetHeight,
      });
      layerRef.current = new window.Konva.Layer();
      shapeGroupRef.current = new window.Konva.Group();
      layerRef.current.add(shapeGroupRef.current);
      stageRef.current.add(layerRef.current);

      observerRef.current = new ResizeObserver(() => {
        if (stageRef.current && container) {
          stageRef.current.width(container.offsetWidth);
          stageRef.current.height(container.offsetHeight);
          drawFnRef.current?.();
        }
      });
      observerRef.current.observe(container);
    }

    const drawOrUpdateGraphics = () => {
      const drawN = params.n === '' ? 4800 : Number(params.n);
      const drawM = params.m === '' ? 2144 : Number(params.m);
      const W = stageRef.current.width();
      const H = stageRef.current.height();
      const padding = 140;
      const availW = W - padding * 2;
      const availH = H - padding * 2;
      const scale = Math.min(availW / drawM, availH / drawN);
      const scaledN = drawN * scale;
      const scaledM = drawM * scale;
      const cx = W / 2 - scaledM / 2;
      const cy = H / 2 - scaledN / 2;
      const group = shapeGroupRef.current;

      if (group.getChildren().length === 0) {
        const wall = new window.Konva.Line({ id: 'wall', points: [cx, cy - 80, cx, cy + scaledN - 80], stroke: '#4b5563', strokeWidth: 3, lineCap: 'square' });
        const testline = new window.Konva.Line({ id: 'testline', points: [cx + 40, cy, cx + scaledM / 2 - 40, cy + scaledN / 2], stroke: '#4b5563', strokeWidth: 3, lineCap: 'square' });
        const slab = new window.Konva.Line({ id: 'slab', points: [cx - 40, cy, cx + scaledM + 40, cy], stroke: '#4b5563', strokeWidth: 3, lineCap: 'square' });
        const brace = new window.Konva.Line({ id: 'brace', points: [cx, cy + scaledN, cx + scaledM, cy], stroke: '#4b5563', strokeWidth: 3, opacity: 0.8, lineCap: 'round' });

        const dimLineN = new window.Konva.Line({ id: 'dimLineN', points: [cx - 30, cy, cx - 30, cy + scaledN], stroke: '#9ca3af', strokeWidth: 2 });
        const tickN1 = new window.Konva.Line({ id: 'tickN1', points: [cx - 35, cy, cx - 25, cy], stroke: '#9ca3af', strokeWidth: 2 });
        const tickN2 = new window.Konva.Line({ id: 'tickN2', points: [cx - 35, cy + scaledN, cx - 25, cy + scaledN], stroke: '#9ca3af', strokeWidth: 2 });
        const dimLineM = new window.Konva.Line({ id: 'dimLineM', points: [cx, cy - 30, cx + scaledM, cy - 30], stroke: '#9ca3af', strokeWidth: 2 });
        const tickM1 = new window.Konva.Line({ id: 'tickM1', points: [cx, cy - 35, cx, cy - 25], stroke: '#9ca3af', strokeWidth: 2 });
        const tickM2 = new window.Konva.Line({ id: 'tickM2', points: [cx + scaledM, cy - 35, cx + scaledM, cy - 25], stroke: '#9ca3af', strokeWidth: 2 });
        const labelN = new window.Konva.Text({ id: 'labelN', text: 'n', fontSize: 18, fill: '#374151', fontStyle: 'bold' });
        const labelM = new window.Konva.Text({ id: 'labelM', text: 'm', fontSize: 18, fill: '#374151', fontStyle: 'bold' });
        const labelBrace = new window.Konva.Text({ id: 'labelBrace', text: '中点', fontSize: 18, fill: '#1d4ed8', fontStyle: 'bold' });
        group.add(wall, testline, slab, brace, dimLineN, tickN1, tickN2, dimLineM, tickM1, tickM2, labelN, labelM, labelBrace);
      }

      const ease = window.Konva.Easings.EaseInOut;
      new window.Konva.Tween({ node: group.findOne('#testline'), duration: 0.4, points: [cx + 40, cy, cx + scaledM / 2, cy + scaledN / 2], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#wall'), duration: 0.4, points: [cx, cy - 0, cx, cy + scaledN + 40], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#slab'), duration: 0.4, points: [cx - 0, cy, cx + scaledM + 40, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#brace'), duration: 0.4, points: [cx, cy + scaledN, cx + scaledM, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#dimLineN'), duration: 0.4, points: [cx - 30, cy, cx - 30, cy + scaledN], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickN1'), duration: 0.4, points: [cx - 35, cy, cx - 25, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickN2'), duration: 0.4, points: [cx - 35, cy + scaledN, cx - 25, cy + scaledN], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#dimLineM'), duration: 0.4, points: [cx, cy - 30, cx + scaledM, cy - 30], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickM1'), duration: 0.4, points: [cx, cy - 35, cx, cy - 25], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickM2'), duration: 0.4, points: [cx + scaledM, cy - 35, cx + scaledM, cy - 25], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#labelN'), duration: 0.4, x: cx - 55, y: cy + scaledN / 2 - 10 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelM'), duration: 0.4, x: cx + scaledM / 2 - 10, y: cy - 55 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelBrace'), duration: 0.4, x: cx + scaledM / 2 + 10, y: cy + scaledN / 2 + 10 }).play();
    };

    drawFnRef.current = drawOrUpdateGraphics;
    drawOrUpdateGraphics();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [params.n, params.m, isKonvaLoaded]);

  return (
    <div
      className="relative shadow-inner overflow-hidden flex flex-col"
      style={{
        width: '33.333%',
        borderRight: '1px solid #d1d5db',
        backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        backgroundColor: '#f8fafc',
      }}
    >
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded shadow text-st font-semibold text-gray-800 z-10 border border-gray-200">
        Y撑支护示意图 (Y-Brace Support Diagram)
      </div>
      <div ref={konvaContainerRef} className="flex-1 w-full cursor-crosshair" style={{ minHeight: 0 }} />
    </div>
  );
};

export default DiagramPanel;
