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
      // k clamp: 0.1~0.9, default 0.5; maps brace intersection point along the brace
      const rawK = params.k === '' ? 0.5 : Number(params.k);
      const kVal = Math.min(0.9, Math.max(0.1, rawK));
      // Round to nearest 0.1
      const kSnap = Math.round(kVal * 10) / 10;

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

      // brace goes from (cx, cy+scaledN) to (cx+scaledM, cy)
      // testline second point = k position along brace
      // brace start = bottom-left (cx, cy+scaledN), end = top-right (cx+scaledM, cy)
      const braceX2 = cx + kSnap * scaledM;
      const braceY2 = cy + scaledN - kSnap * scaledN;
      const dimStroke = '#9ca3af';
      const dimStrokeWidth = 2;
      const diagonalDimOffset = 30;
      const diagonalTickHalfLength = 7;

      const getDiagonalDimension = (x1: number, y1: number, x2: number, y2: number) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.hypot(dx, dy) || 1;
        const normalX = -dy / length;
        const normalY = dx / length;
        const offsetX = diagonalDimOffset;
        const offsetY = diagonalDimOffset;
        const dimX1 = x1 + offsetX;
        const dimY1 = y1 + offsetY;
        const dimX2 = x2 + offsetX;
        const dimY2 = y2 + offsetY;
        const tickX = normalX * diagonalTickHalfLength;
        const tickY = normalY * diagonalTickHalfLength;

        return {
          line: [dimX1, dimY1, dimX2, dimY2],
          tick1: [dimX1 - tickX, dimY1 - tickY, dimX1 + tickX, dimY1 + tickY],
          tick2: [dimX2 - tickX, dimY2 - tickY, dimX2 + tickX, dimY2 + tickY],
          label: {
            x: (dimX1 + dimX2) / 2 + 8,
            y: (dimY1 + dimY2) / 2 + 8,
            rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
          },
        };
      };

      const dimL0 = getDiagonalDimension(cx +15, cy + scaledN - 5 , cx +15 + scaledM, cy -5 );
      const dimL1 = getDiagonalDimension(cx - 10, cy - 15 + scaledN, braceX2 - 10 , braceY2 - 15);

      if (group.getChildren().length === 0) {
        
        const wall = new window.Konva.Line({ id: 'wall', points: [cx, cy - 0, cx, cy + scaledN + 40], stroke: '#4b5563', strokeWidth: 3, lineCap: 'square' });
        const testline = new window.Konva.Line({ id: 'testline', points: [cx , cy, braceX2, braceY2], stroke: '#DC2915', strokeWidth: 3, lineCap: 'square' });
        const slab = new window.Konva.Line({ id: 'slab', points: [cx - 0, cy, cx + scaledM + 40, cy], stroke: '#4b5563', strokeWidth: 3, lineCap: 'square' });
        const brace = new window.Konva.Line({ id: 'brace', points: [cx, cy + scaledN, cx + scaledM, cy], stroke: '#DC2915', strokeWidth: 3, opacity: 1, lineCap: 'round' });

        const dimLineN = new window.Konva.Line({ id: 'dimLineN', points: [cx - 30, cy, cx - 30, cy + scaledN], stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickN1 = new window.Konva.Line({ id: 'tickN1', points: [cx - 35, cy, cx - 25, cy], stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickN2 = new window.Konva.Line({ id: 'tickN2', points: [cx - 35, cy + scaledN, cx - 25, cy + scaledN], stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const dimLineM = new window.Konva.Line({ id: 'dimLineM', points: [cx, cy - 30, cx + scaledM, cy - 30], stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickM1 = new window.Konva.Line({ id: 'tickM1', points: [cx, cy - 35, cx, cy - 25], stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickM2 = new window.Konva.Line({ id: 'tickM2', points: [cx + scaledM, cy - 35, cx + scaledM, cy - 25], stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const dimLineL0 = new window.Konva.Line({ id: 'dimLineL0', points: dimL0.line, stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickL01 = new window.Konva.Line({ id: 'tickL01', points: dimL0.tick1, stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickL02 = new window.Konva.Line({ id: 'tickL02', points: dimL0.tick2, stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const dimLineL1 = new window.Konva.Line({ id: 'dimLineL1', points: dimL1.line, stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickL11 = new window.Konva.Line({ id: 'tickL11', points: dimL1.tick1, stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const tickL12 = new window.Konva.Line({ id: 'tickL12', points: dimL1.tick2, stroke: dimStroke, strokeWidth: dimStrokeWidth });
        const labelN = new window.Konva.Text({ id: 'labelN', text: `n=${drawN}`,x: cx - 55, y: cy + scaledN / 2 - 10,fontSize: 18, fill: '#374151', fontStyle: 'bold',rotation: -90 });
        const labelM = new window.Konva.Text({ id: 'labelM', text: `m=${drawM}`,x: cx + scaledM / 2 - 10, y: cy - 55, fontSize: 18, fill: '#374151', fontStyle: 'bold' });
        const labelL0 = new window.Konva.Text({ id: 'labelL0', text: 'L₀', x: dimL0.label.x, y: dimL0.label.y, fontSize: 16, fill: '#374151', fontStyle: 'bold', rotation: dimL0.label.rotation });
        const labelL1 = new window.Konva.Text({ id: 'labelL1', text: 'L₁', x: dimL1.label.x, y: dimL1.label.y, fontSize: 16, fill: '#374151', fontStyle: 'bold', rotation: dimL1.label.rotation });
        // k label at intersection point
        const labelK = new window.Konva.Text({ id: 'labelK', text: `k=${kSnap}`,x: braceX2 + 8, y: braceY2 + 4, fontSize: 14, fill: '#1d4ed8', fontStyle: 'bold' });
        
        group.add(wall, testline, slab, brace, dimLineN, tickN1, tickN2, dimLineM, tickM1, tickM2, dimLineL0, tickL01, tickL02, dimLineL1, tickL11, tickL12, labelN, labelM, labelL0, labelL1, labelK);
      }

      const ease = window.Konva.Easings.EaseInOut;
      new window.Konva.Tween({ node: group.findOne('#testline'), duration: 0.4, points: [cx , cy, braceX2, braceY2], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#wall'), duration: 0.4, points: [cx, cy - 0, cx, cy + scaledN + 40], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#slab'), duration: 0.4, points: [cx - 0, cy, cx + scaledM + 40, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#brace'), duration: 0.4, points: [cx, cy + scaledN, cx + scaledM, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#dimLineN'), duration: 0.4, points: [cx - 30, cy, cx - 30, cy + scaledN], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickN1'), duration: 0.4, points: [cx - 35, cy, cx - 25, cy], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickN2'), duration: 0.4, points: [cx - 35, cy + scaledN, cx - 25, cy + scaledN], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#dimLineM'), duration: 0.4, points: [cx, cy - 30, cx + scaledM, cy - 30], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickM1'), duration: 0.4, points: [cx, cy - 35, cx, cy - 25], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickM2'), duration: 0.4, points: [cx + scaledM, cy - 35, cx + scaledM, cy - 25], easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#dimLineL0'), duration: 0.4, points: dimL0.line, easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickL01'), duration: 0.4, points: dimL0.tick1, easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickL02'), duration: 0.4, points: dimL0.tick2, easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#dimLineL1'), duration: 0.4, points: dimL1.line, easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickL11'), duration: 0.4, points: dimL1.tick1, easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#tickL12'), duration: 0.4, points: dimL1.tick2, easing: ease }).play();
      new window.Konva.Tween({ node: group.findOne('#labelN'), duration: 0.4, x: cx - 55, y: cy + scaledN / 2 - 10 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelM'), duration: 0.4, x: cx + scaledM / 2 - 10, y: cy - 55 }).play();
      new window.Konva.Tween({ node: group.findOne('#labelL0'), duration: 0.4, x: dimL0.label.x, y: dimL0.label.y, rotation: dimL0.label.rotation }).play();
      new window.Konva.Tween({ node: group.findOne('#labelL1'), duration: 0.4, x: dimL1.label.x, y: dimL1.label.y, rotation: dimL1.label.rotation }).play();
      new window.Konva.Tween({ node: group.findOne('#labelK'), duration: 0.4, x: braceX2 + 8, y: braceY2 + 4 }).play();
      const labelNNode = group.findOne('#labelN');
      if (labelNNode) labelNNode.text(`n=${drawN}`);
      const labelMNode = group.findOne('#labelM');
      if (labelMNode) labelMNode.text(`m=${drawM}`);
      // Update text content for k label
      const labelKNode = group.findOne('#labelK');
      if (labelKNode) labelKNode.text(`k=${kSnap}`);
    };

    drawFnRef.current = drawOrUpdateGraphics;
    drawOrUpdateGraphics();

    return () => {
      observerRef.current?.disconnect();
    };
  }, [params.n, params.m, params.k, isKonvaLoaded]);

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
