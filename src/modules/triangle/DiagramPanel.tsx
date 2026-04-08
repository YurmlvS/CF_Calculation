import React, { useEffect, useRef } from 'react';
import { ModuleDiagramProps } from '../types';

/**
 * 直角三角形模块 —— Konva 绘图面板
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
      const drawA = params.a === '' ? 300 : Number(params.a);
      const drawB = params.b === '' ? 400 : Number(params.b);
      const W = stageRef.current.width();
      const H = stageRef.current.height();
      const padding = 120;
      const availW = W - padding * 2;
      const availH = H - padding * 2;

      // b 是水平边，a 是垂直边
      const scale = Math.min(availW / drawB, availH / drawA);
      const scaledA = drawA * scale;
      const scaledB = drawB * scale;

      // 直角在左下角 => 三个顶点
      // C (直角) = 左下, B = 右下 (水平), A = 左上 (垂直)
      const cx = W / 2 - scaledB / 2;   // 左下角 x
      const cy = H / 2 + scaledA / 2;   // 左下角 y
      // 右下角
      const bx = cx + scaledB;
      const by = cy;
      // 左上角
      const ax = cx;
      const ay = cy - scaledA;

      const group = shapeGroupRef.current;

      if (group.getChildren().length === 0) {
        // 三角形填充
        const triangleFill = new window.Konva.Line({
          id: 'triangleFill',
          points: [cx, cy, bx, by, ax, ay],
          closed: true,
          fill: 'rgba(59, 130, 246, 0.08)',
          stroke: '#4b5563',
          strokeWidth: 3,
          lineJoin: 'round',
        });

        // 直角标记 (小正方形)
        const markSize = Math.min(scaledA, scaledB) * 0.12;
        const rightAngleMark = new window.Konva.Line({
          id: 'rightAngleMark',
          points: [cx + markSize, cy, cx + markSize, cy - markSize, cx, cy - markSize],
          stroke: '#3b82f6',
          strokeWidth: 2,
          lineJoin: 'miter',
        });

        // 尺寸标注线 a (垂直边 - 左侧)
        const dimLineA = new window.Konva.Line({ id: 'dimLineA', points: [cx - 30, cy, cx - 30, ay], stroke: '#9ca3af', strokeWidth: 2 });
        const tickA1 = new window.Konva.Line({ id: 'tickA1', points: [cx - 35, cy, cx - 25, cy], stroke: '#9ca3af', strokeWidth: 2 });
        const tickA2 = new window.Konva.Line({ id: 'tickA2', points: [cx - 35, ay, cx - 25, ay], stroke: '#9ca3af', strokeWidth: 2 });

        // 尺寸标注线 b (水平边 - 底部)
        const dimLineB = new window.Konva.Line({ id: 'dimLineB', points: [cx, cy + 30, bx, cy + 30], stroke: '#9ca3af', strokeWidth: 2 });
        const tickB1 = new window.Konva.Line({ id: 'tickB1', points: [cx, cy + 25, cx, cy + 35], stroke: '#9ca3af', strokeWidth: 2 });
        const tickB2 = new window.Konva.Line({ id: 'tickB2', points: [bx, cy + 25, bx, cy + 35], stroke: '#9ca3af', strokeWidth: 2 });

        // 标签
        const labelA = new window.Konva.Text({ id: 'labelA', text: 'a', fontSize: 18, fill: '#374151', fontStyle: 'bold' });
        const labelB = new window.Konva.Text({ id: 'labelB', text: 'b', fontSize: 18, fill: '#374151', fontStyle: 'bold' });
        const labelC = new window.Konva.Text({ id: 'labelC', text: 'c', fontSize: 18, fill: '#1d4ed8', fontStyle: 'bold' });

        // 顶点标签
        const labelVertA = new window.Konva.Text({ id: 'labelVertA', text: 'A', fontSize: 16, fill: '#6b7280', fontStyle: 'bold' });
        const labelVertB = new window.Konva.Text({ id: 'labelVertB', text: 'B', fontSize: 16, fill: '#6b7280', fontStyle: 'bold' });
        const labelVertC = new window.Konva.Text({ id: 'labelVertC', text: 'C', fontSize: 16, fill: '#3b82f6', fontStyle: 'bold' });

        group.add(triangleFill, rightAngleMark, dimLineA, tickA1, tickA2, dimLineB, tickB1, tickB2, labelA, labelB, labelC, labelVertA, labelVertB, labelVertC);
      }

      const ease = window.Konva.Easings.EaseInOut;
      const markSize = Math.min(scaledA, scaledB) * 0.12;

      // 动画更新位置
      new window.Konva.Tween({ node: group.findOne('#triangleFill'), duration: 0.4, points: [cx, cy, bx, by, ax, ay], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#rightAngleMark'), duration: 0.4, points: [cx + markSize, cy, cx + markSize, cy - markSize, cx, cy - markSize], easing: ease }).play();

      new window.Konva.Tween({ node: group.findOne('#dimLineA'), duration: 0.4, points: [cx - 30, cy, cx - 30, ay], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickA1'), duration: 0.4, points: [cx - 35, cy, cx - 25, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickA2'), duration: 0.4, points: [cx - 35, ay, cx - 25, ay], easing: ease }).play();

      new window.Konva.Tween({ node: group.findOne('#dimLineB'), duration: 0.4, points: [cx, cy + 30, bx, cy + 30], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickB1'), duration: 0.4, points: [cx, cy + 25, cx, cy + 35], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickB2'), duration: 0.4, points: [bx, cy + 25, bx, cy + 35], easing: ease }).play();

      // 标签位置
      new window.Konva.Tween({ node: group.findOne('#labelA'), duration: 0.4, x: cx - 55, y: cy - scaledA / 2 - 5 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelB'), duration: 0.4, x: cx + scaledB / 2 - 5, y: cy + 45 }).play();
      // c 标签在斜边中点偏右上
      new window.Konva.Tween({ node: group.findOne('#labelC'), duration: 0.4, x: (cx + bx) / 2 + 10, y: (ay + cy) / 2 - 20 }).play();

      // 顶点标签
      new window.Konva.Tween({ node: group.findOne('#labelVertA'), duration: 0.4, x: ax - 25, y: ay - 25 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelVertB'), duration: 0.4, x: bx + 10, y: by - 5 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelVertC'), duration: 0.4, x: cx - 25, y: cy + 5 }).play();
    };

    drawFnRef.current = drawOrUpdateGraphics;
    drawOrUpdateGraphics();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [params.a, params.b, isKonvaLoaded]);

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
        直角三角形示意图 (Right Triangle Diagram)
      </div>
      <div ref={konvaContainerRef} className="flex-1 w-full cursor-crosshair" style={{ minHeight: 0 }} />
    </div>
  );
};

export default DiagramPanel;
