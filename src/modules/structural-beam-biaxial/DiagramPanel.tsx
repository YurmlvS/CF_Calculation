import React, { useEffect, useRef } from 'react';
import { ModuleDiagramProps, ParamValue } from '../types';
import { paramFields } from './params';

const DIM_STROKE = '#22c55e';
const SHAPE_STROKE = '#111827';

const getPlaceholderNumber = (key: string, fallback: number) => {
  const field = paramFields.find((item) => item.key === key);
  const match = field?.placeholder.match(/[\d.]+/);
  return match ? Number(match[0]) : fallback;
};

const getDrawValue = (value: ParamValue, placeholder: number) => {
  const numeric = value === '' ? placeholder : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : placeholder;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_H = getPlaceholderNumber('h', 500);
const DEFAULT_B = getPlaceholderNumber('b', 250);
const DEFAULT_L = getPlaceholderNumber('l', 10);

const DiagramPanel: React.FC<ModuleDiagramProps> = ({ params, isKonvaLoaded }) => {
  const konvaContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const shapeGroupRef = useRef<any>(null);
  const drawFnRef = useRef<(() => void) | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!konvaContainerRef.current || !window.Konva || !isKonvaLoaded) return;
    const container = konvaContainerRef.current;

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
    drawFnRef.current?.();

    return () => {
      observerRef.current?.disconnect();
      stageRef.current?.destroy();
      observerRef.current = null;
      stageRef.current = null;
      layerRef.current = null;
      shapeGroupRef.current = null;
    };
  }, [isKonvaLoaded]);

  useEffect(() => {
    const drawOrUpdateGraphics = () => {
      if (!stageRef.current || !shapeGroupRef.current || !window.Konva) return;

      const drawH = getDrawValue(params.h, DEFAULT_H);
      const drawB = getDrawValue(params.b, DEFAULT_B);
      const drawL = getDrawValue(params.l, DEFAULT_L);

      const bScale = clamp(Math.sqrt(drawB / DEFAULT_B), 0.55, 1.9);
      const hScale = clamp(Math.sqrt(drawH / DEFAULT_H), 0.55, 1.9);
      const lScale = clamp(Math.sqrt(drawL / DEFAULT_L), 0.55, 1.9);

      const beamLength = 262 * lScale;
      const beamWidth = 38 * bScale;
      const beamHeight = 109 * hScale;
      const depthX = 96 * lScale;
      const depthY = 109 * lScale;
      const lip = Math.max(6, beamWidth * 0.16);

      const x = {
        left: 0,
        backLeft: depthX,
        innerLeft: beamLength - beamWidth,
        innerRib: beamLength - beamWidth * 0.63,
        frontRight: beamLength,
        rightRib: beamLength + beamWidth * 0.37,
        sideLeft: beamLength + depthX * 0.46,
        sideMid: beamLength + depthX * 0.6,
        sideRight: beamLength + depthX * 0.86,
        backRight: beamLength + depthX,
      };
      const y = {
        backTop: 0,
        backLip: 6 * hScale,
        sideMid: beamHeight * 0.62,
        frontTop: depthY,
        frontLip: depthY + lip,
        sideLower: depthY + lip + beamHeight * 0.15,
        ribLower: depthY + lip + beamHeight * 0.27,
        bottomInner: depthY + lip + beamHeight * 0.86,
        bottom: depthY + lip + beamHeight,
      };

      const polygons = [
        [x.innerLeft, y.frontLip, x.sideMid, y.backLip, x.sideMid, y.frontLip, x.sideLeft, y.sideLower, x.sideLeft, y.sideMid, x.innerRib, y.ribLower, x.innerRib, y.bottomInner, x.innerLeft, y.bottom],
        [x.sideLeft, y.sideLower, x.sideLeft, y.sideMid, x.sideRight, y.sideMid, x.sideRight, y.sideLower],
        [x.innerRib, y.ribLower, x.sideLeft, y.sideMid, x.sideRight, y.sideMid, x.rightRib, y.ribLower],
        [x.frontRight, y.frontTop, x.backRight, y.backTop, x.backRight, y.frontLip, x.sideRight, y.sideLower, x.sideRight, y.sideMid, x.rightRib, y.ribLower, x.rightRib, y.bottomInner, x.frontRight, y.bottom],
        [x.left, y.frontTop, x.frontRight, y.frontTop, x.frontRight, y.bottom, x.innerLeft, y.bottom, x.innerLeft, y.frontLip, x.left, y.frontLip],
        [x.left, y.frontTop, x.backLeft, y.backTop, x.backRight, y.backTop, x.frontRight, y.frontTop],
      ];

      const dimLines = [
        [x.innerLeft, y.bottom, x.innerLeft, y.bottom + 30],
        [x.frontRight, y.bottom, x.frontRight, y.bottom + 30],
        [x.innerLeft - 5, y.bottom + 25, x.frontRight + 5, y.bottom + 25],
        [x.backRight, y.backTop, x.backRight + 26, y.backTop],
        [x.sideRight, y.sideMid, x.backRight + 26, y.sideMid],
        [x.backRight + 21, y.backTop - 5, x.backRight + 21, y.sideMid + 5],
        [x.frontRight, y.bottom, x.frontRight + 19, y.bottom + 19],
        [x.backRight, y.frontLip, x.backRight + 19, y.frontLip + 19],
        [x.frontRight + 13, y.bottom + 14, x.backRight + 13, y.frontLip + 14],
      ];

      const labelData = [
        { id: 'labelB', text: `b=${drawB}`, x: (x.innerLeft + x.frontRight) / 2 - 18, y: y.bottom + 34, rotation: 0 },
        { id: 'labelH', text: `h=${drawH}`, x: x.backRight + 33, y: (y.backTop + y.sideMid) / 2 - 9, rotation: 0 },
        {
          id: 'labelL',
          text: `l=${drawL}`,
          x: (x.frontRight + x.backRight) / 2 + 30,
          y: (y.bottom + y.frontLip) / 2 + 16,
          rotation: (Math.atan2(y.frontLip - y.bottom, x.backRight - x.frontRight) * 180) / Math.PI,
        },
      ];

      const allPoints = [...polygons, ...dimLines].flatMap((points) => {
        const pairs: Array<[number, number]> = [];
        for (let i = 0; i < points.length; i += 2) pairs.push([points[i], points[i + 1]]);
        return pairs;
      });
      const minX = Math.min(...allPoints.map(([px]) => px));
      const maxX = Math.max(...allPoints.map(([px]) => px));
      const minY = Math.min(...allPoints.map(([, py]) => py));
      const maxY = Math.max(...allPoints.map(([, py]) => py));
      const W = stageRef.current.width();
      const H = stageRef.current.height();
      const padding = 56;
      const fitScale = Math.min((W - padding * 2) / (maxX - minX), (H - padding * 2) / (maxY - minY));
      const scale = clamp(fitScale, 0.35, 1.65);
      const offsetX = W / 2 - ((minX + maxX) / 2) * scale;
      const offsetY = H / 2 - ((minY + maxY) / 2) * scale + 16;

      const group = shapeGroupRef.current;
      group.destroyChildren();
      group.position({ x: offsetX, y: offsetY });
      group.scale({ x: scale, y: scale });

      polygons.forEach((points, index) => {
        group.add(new window.Konva.Line({
          id: `beamPolygon${index}`,
          points,
          fill: '#ffffff',
          stroke: SHAPE_STROKE,
          strokeWidth: 2,
          closed: true,
          lineJoin: 'round',
        }));
      });

      dimLines.forEach((points, index) => {
        group.add(new window.Konva.Line({
          id: `dimLine${index}`,
          points,
          stroke: DIM_STROKE,
          strokeWidth: 2,
          lineCap: 'round',
        }));
      });

      labelData.forEach((item) => {
        group.add(new window.Konva.Text({
          id: item.id,
          x: item.x,
          y: item.y,
          text: item.text,
          fontSize: 14,
          fontFamily: 'sans-serif',
          fill: '#111827',
          fontStyle: 'bold',
          rotation: item.rotation,
        }));
      });

      layerRef.current.batchDraw();
    };

    drawFnRef.current = drawOrUpdateGraphics;
    drawOrUpdateGraphics();
  }, [params.b, params.h, params.l, isKonvaLoaded]);

  return (
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
      <div ref={konvaContainerRef} className="flex-1 w-full cursor-crosshair" style={{ minHeight: 0 }} />
    </div>
  );
};

export default DiagramPanel;
