export interface BeamConcreteMaterial {
  grade: string;
  fc: number;
  ft: number;
}

export interface RebarMaterial {
  grade: string;
  fy: number;
}

export const beamConcreteMaterials: BeamConcreteMaterial[] = [
  { grade: 'C20', fc: 9.6, ft: 1.1 },
  { grade: 'C25', fc: 11.9, ft: 1.27 },
  { grade: 'C30', fc: 14.3, ft: 1.43 },
  { grade: 'C35', fc: 16.7, ft: 1.57 },
  { grade: 'C40', fc: 19.1, ft: 1.71 },
  { grade: 'C45', fc: 21.1, ft: 1.8 },
  { grade: 'C50', fc: 23.1, ft: 1.89 },
  { grade: 'C55', fc: 25.3, ft: 1.96 },
  { grade: 'C60', fc: 27.5, ft: 2.04 },
  { grade: 'C70', fc: 31.8, ft: 2.14 },
  { grade: 'C80', fc: 35.9, ft: 2.22 },
];

export const rebarMaterials: RebarMaterial[] = [
  { grade: 'HPB300', fy: 270 },
  { grade: 'HRB400\\HRBF400\\RRB400', fy: 360 },
  { grade: 'HRB500\\HRBF500', fy: 435 },
];

