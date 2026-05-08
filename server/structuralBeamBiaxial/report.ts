import type {
  FlexuralAxisResult,
  StructuralBeamBiaxialResult,
} from '../../src/modules/structural-beam-biaxial/calculate';
import type { StructuralBeamBiaxialCalcTarget } from './schema';
import type { StructuralBeamBiaxialParams } from './validation';

type ReportSection = {
  title: string;
  items: Array<{
    label: string;
    value: string | number | boolean | null;
    ok?: boolean;
  }>;
};

function round(value: number, digits = 3): number | string {
  if (!Number.isFinite(value)) return '-';
  return Number(value.toFixed(digits));
}

function axisSection(axis: FlexuralAxisResult, label: string): ReportSection {
  return {
    title: `${label} flexural check`,
    items: [
      { label: 'moment(kN.m)', value: round(axis.moment) },
      { label: 'h0(mm)', value: round(axis.h0, 0) },
      { label: 'alphaS', value: round(axis.alphaS) },
      { label: 'xi', value: round(axis.xi), ok: axis.compressionZoneOk && axis.xi < axis.xiB },
      { label: 'requiredArea(mm2)', value: round(axis.requiredArea, 0) },
      { label: 'providedArea(mm2)', value: round(axis.providedArea, 0), ok: axis.areaOk },
      { label: 'rho', value: round(axis.rho, 5), ok: axis.rhoOk },
      { label: 'arrangementWidth(mm)', value: axis.arrangementWidth === null ? null : round(axis.arrangementWidth, 0), ok: axis.fits ?? undefined },
      { label: 'isSafe', value: axis.isSafe, ok: axis.isSafe },
    ],
  };
}

export function buildStructuralBeamBiaxialReport(
  calcTarget: StructuralBeamBiaxialCalcTarget,
  params: StructuralBeamBiaxialParams,
  result: StructuralBeamBiaxialResult,
) {
  const sections: ReportSection[] = [
    {
      title: 'Input summary',
      items: [
        { label: 'concreteGrade', value: params.concreteGrade },
        { label: 'steelGrade', value: params.steelGrade },
        { label: 'section(mm)', value: `${params.b} x ${params.h}` },
        { label: 'span(m)', value: params.l },
        { label: 'loadPositionA(m)', value: params.a },
        { label: 'loadPositionB(m)', value: params.horizontalB },
        { label: 'q(kN/m)', value: params.q },
        { label: 'F(kN)', value: params.F },
      ],
    },
    {
      title: 'Worst section',
      items: [
        { label: 'section', value: result.worst.worstSection },
        { label: 'effectiveSpan(m)', value: round(result.worst.effectiveSpanM) },
        { label: 'horizontalA(m)', value: round(result.worst.horizontalA) },
        { label: 'horizontalB(m)', value: round(result.worst.horizontalB) },
        { label: 'horizontalSupportMoment(kN.m)', value: round(result.worst.horizontalSupportMoment) },
        { label: 'horizontalLoadPointMoment(kN.m)', value: round(result.worst.horizontalMidMoment) },
        { label: 'Mx(kN.m)', value: round(result.worst.Mx) },
        { label: 'My(kN.m)', value: round(result.worst.My) },
        { label: 'V(kN)', value: round(result.worst.V) },
      ],
    },
    axisSection(result.flexural.x, 'X axis'),
    axisSection(result.flexural.y, 'Y axis'),
    {
      title: 'Shear check',
      items: [
        { label: 'limitCapacity(kN)', value: round(result.shear.limitCapacity), ok: result.shear.limitOk },
        { label: 'concreteCapacity(kN)', value: round(result.shear.concreteCapacity), ok: result.shear.concreteOk },
        { label: 'shear(kN)', value: round(result.shear.shear) },
        { label: 'isSafe', value: result.shear.isSafe, ok: result.shear.isSafe },
      ],
    },
  ];

  return {
    calcTarget,
    conclusion: result.isSafe ? 'PASS' : 'FAIL',
    sections,
  };
}
