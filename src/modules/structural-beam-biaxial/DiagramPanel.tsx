import React, { useEffect, useRef } from 'react';
import { ModuleDiagramProps, ParamValue } from '../types';
import { paramFields } from './params';

type ModelPoint = { x: number; y: number };

const DIM_STROKE = '#22c55e';
const DIM_LABEL_FILL = '#dc2626';
const SHAPE_STROKE = '#111827';
const DASH_STROKE = '#6b7280';

const BASE_POINTS: Record<string, ModelPoint> = {
  P1: { x: 0, y: 0 },
  P2: { x: -1.732, y: 1 },
  P3: { x: 1.732, y: 1 },
  P4: { x: 0, y: 8 },
  P5: { x: -1.732, y: 8 },
  P6: { x: 1.732, y: 5 },
  P7: { x: -17.321, y: 17 },
  P8: { x: -17.321, y: 18 },
  P9: { x: -1.732, y: 9 },
  P10: { x: 0, y: 28 },
  P11: { x: 17.321, y: 18 },
  P12: { x: 17.321, y: 10 },
  P13: { x: 15.588, y: 9 },
  P14: { x: 13.856, y: 10 },
  P15: { x: 15.588, y: 13 },
  P16: { x: 13.856, y: 12 },
  P17: { x: 15.588, y: 19 },
};

const SOLID_LINES = [
  ['P1', 'P2'],
  ['P1', 'P3'],
  ['P1', 'P4'],
  ['P2', 'P5'],
  ['P3', 'P6'],
  ['P5', 'P7'],
  ['P7', 'P8'],
  ['P4', 'P8'],
  ['P8', 'P10'],
  ['P10', 'P11'],
  ['P11', 'P12'],
  ['P12', 'P13'],
  ['P13', 'P14'],
  ['P13', 'P15'],
  ['P14', 'P16'],
  ['P4', 'P11'],
  ['P15', 'P6'],
] as const;

const DASHED_LINE = ['P9', 'P17'] as const;
const L_AFFECTED_POINTS = ['P10', 'P17', 'P11', 'P12', 'P13', 'P14', 'P15', 'P16'];
const H_AFFECTED_POINTS = ['P6', 'P15', 'P16'];

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

const distance = (a: ModelPoint, b: ModelPoint) => Math.hypot(b.x - a.x, b.y - a.y);
const midpoint = (a: ModelPoint, b: ModelPoint): ModelPoint => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const direction = (degrees: number): ModelPoint => {
  const radians = (degrees * Math.PI) / 180;
  return { x: Math.cos(radians), y: Math.sin(radians) };
};
const movePoint = (point: ModelPoint, vector: ModelPoint, amount: number): ModelPoint => ({
  x: point.x + vector.x * amount,
  y: point.y + vector.y * amount,
});

const DEFAULT_H = getPlaceholderNumber('h', 500);
const DEFAULT_B = getPlaceholderNumber('b', 250);
const DEFAULT_L = getPlaceholderNumber('l', 10);
const MAX_H_VISUAL_VALUE = 700;
const BASE_B_OFFSET_LENGTH = distance(BASE_POINTS.P4, BASE_POINTS.P9);
const BASE_H_LENGTH = distance(midpoint(BASE_POINTS.P4, BASE_POINTS.P11), midpoint(BASE_POINTS.P15, BASE_POINTS.P6));
const BASE_L_LENGTH = distance(BASE_POINTS.P11, BASE_POINTS.P17);

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
      const hVisualValue = Math.min(drawH, MAX_H_VISUAL_VALUE);
      const defaultHVisualValue = Math.min(DEFAULT_H, MAX_H_VISUAL_VALUE);
      const points: Record<string, ModelPoint> = Object.fromEntries(
        Object.entries(BASE_POINTS).map(([key, value]) => [key, { ...value }]),
      );

      const lShift = ((drawL - DEFAULT_L) / DEFAULT_L) * BASE_L_LENGTH;
      const hShift = ((hVisualValue - defaultHVisualValue) / DEFAULT_H) * BASE_H_LENGTH;
      const lVector = direction(30);
      const hVector = direction(-90);
      const bVector = direction(150);

      L_AFFECTED_POINTS.forEach((key) => {
        points[key] = movePoint(points[key], lVector, lShift);
      });
      H_AFFECTED_POINTS.forEach((key) => {
        points[key] = movePoint(points[key], hVector, hShift);
      });
      const bOffsetLength = (drawB / DEFAULT_B) * BASE_B_OFFSET_LENGTH;
      points.P9 = movePoint(points.P4, bVector, bOffsetLength);
      points.P17 = movePoint(points.P11, bVector, bOffsetLength);

      const hStart = midpoint(points.P4, points.P11);
      const hEnd = midpoint(points.P15, points.P6);
      const lStart = midpoint(points.P1, points.P3);
      const lEnd = midpoint(points.P12, points.P13);
      const screenPoint = (point: ModelPoint): [number, number] => [point.x, -point.y];
      const linePoints = (a: ModelPoint, b: ModelPoint) => [...screenPoint(a), ...screenPoint(b)];

      const getAnchoredDimension = (
        a: ModelPoint,
        b: ModelPoint,
        label: string,
        value: number,
        tickAngle: number,
        tickLength = 2.75,
        labelOffsetX = 0,
        labelOffsetY = 0,
        labelRotation?: number,
      ) => {
        const [x1, y1] = screenPoint(a);
        const [x2, y2] = screenPoint(b);
        const tickVector = direction(tickAngle);
        const tickX = tickVector.x * tickLength;
        const tickY = -tickVector.y * tickLength;
        const dimX1 = x1 + tickX;
        const dimY1 = y1 + tickY;
        const dimX2 = x2 + tickX;
        const dimY2 = y2 + tickY;
        const dx = dimX2 - dimX1;
        const dy = dimY2 - dimY1;

        return {
          line: [dimX1, dimY1, dimX2, dimY2],
          tick1: [x1, y1, dimX1, dimY1],
          tick2: [x2, y2, dimX2, dimY2],
          label: {
            text: `${label}=${value}`,
            x: (dimX1 + dimX2) / 2 + labelOffsetX,
            y: (dimY1 + dimY2) / 2 + labelOffsetY,
            rotation: labelRotation ?? (Math.atan2(dy, dx) * 180) / Math.PI,
          },
        };
      };

      const dimensions = [
        getAnchoredDimension(lStart, lEnd, 'l', drawL, -30, 3.2, .05, 1, -30),
        getAnchoredDimension(hStart, hEnd, 'h', drawH, 0, 3, 1.3, -1.5, 90),
        getAnchoredDimension(points.P11, points.P17, 'b', drawB, 30, 3.2, 0, -2, 30),
      ];

      const drawablePointPairs: Array<[number, number]> = [
        ...SOLID_LINES.flatMap(([from, to]) => [screenPoint(points[from]), screenPoint(points[to])]),
        screenPoint(points[DASHED_LINE[0]]),
        screenPoint(points[DASHED_LINE[1]]),
        ...dimensions.flatMap((dimension) => {
          const pairs: Array<[number, number]> = [];
          [dimension.line, dimension.tick1, dimension.tick2].forEach((line) => {
            for (let i = 0; i < line.length; i += 2) pairs.push([line[i], line[i + 1]]);
          });
          pairs.push([dimension.label.x, dimension.label.y]);
          return pairs;
        }),
      ];
      const minX = Math.min(...drawablePointPairs.map(([x]) => x));
      const maxX = Math.max(...drawablePointPairs.map(([x]) => x));
      const minY = Math.min(...drawablePointPairs.map(([, y]) => y));
      const maxY = Math.max(...drawablePointPairs.map(([, y]) => y));
      const W = stageRef.current.width();
      const H = stageRef.current.height();
      const padding = 66;
      const fitScale = Math.min((W - padding * 2) / (maxX - minX), (H - padding * 2) / (maxY - minY));
      const scale = clamp(fitScale, 7, 22);
      const offsetX = W / 2 - ((minX + maxX) / 2) * scale;
      const offsetY = H / 2 - ((minY + maxY) / 2) * scale + 10;
      const group = shapeGroupRef.current;

      group.destroyChildren();
      group.position({ x: offsetX, y: offsetY });
      group.scale({ x: scale, y: scale });

      SOLID_LINES.forEach(([from, to], index) => {
        group.add(new window.Konva.Line({
          id: `solidLine${index}`,
          points: linePoints(points[from], points[to]),
          stroke: SHAPE_STROKE,
          strokeWidth: 2 / scale,
          lineCap: 'round',
          lineJoin: 'round',
        }));
      });

      group.add(new window.Konva.Line({
        id: 'dashedLineL18',
        points: linePoints(points[DASHED_LINE[0]], points[DASHED_LINE[1]]),
        stroke: DASH_STROKE,
        strokeWidth: 1.8 / scale,
        dash: [0.8, 0.6],
        lineCap: 'round',
      }));

      dimensions.forEach((dimension, index) => {
        [dimension.line, dimension.tick1, dimension.tick2].forEach((line, lineIndex) => {
          group.add(new window.Konva.Line({
            id: `dimLine${index}-${lineIndex}`,
            points: line,
            stroke: DIM_STROKE,
            strokeWidth: 2 / scale,
            lineCap: 'round',
          }));
        });
        group.add(new window.Konva.Text({
          id: `dimLabel${index}`,
          x: dimension.label.x,
          y: dimension.label.y,
          text: dimension.label.text,
          fontSize: 14 / scale,
          fontFamily: 'sans-serif',
          fill: DIM_LABEL_FILL,
          fontStyle: 'bold',
          rotation: dimension.label.rotation,
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
