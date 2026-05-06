export interface BraceMaterialSpec {
  spec: string;
  A: number;
  I: number;
  IPrime: number;
}

export const braceMaterialSpecs: BraceMaterialSpec[] = [
  { spec: 'φ48X2.4', A: 3.44, I: 8.96, IPrime: 8.96 },
  { spec: 'φ48X2.5', A: 3.57, I: 9.28, IPrime: 9.28 },
  { spec: 'φ48X2.6', A: 3.71, I: 9.59, IPrime: 9.59 },
  { spec: 'φ48X2.7', A: 3.84, I: 9.89, IPrime: 9.89 },
  { spec: 'φ48X2.8', A: 3.98, I: 10.19, IPrime: 10.19 },
  { spec: 'φ48X2.9', A: 4.11, I: 10.49, IPrime: 10.49 },
  { spec: 'φ48X3', A: 4.24, I: 10.78, IPrime: 10.78 },
  { spec: 'φ48X3.2', A: 4.5, I: 11.36, IPrime: 11.36 },
  { spec: 'φ48X3.25', A: 4.57, I: 11.5, IPrime: 11.5 },
  { spec: '5号槽钢', A: 6.928, I: 26, IPrime: 8.3 },
  { spec: '6.3号槽钢', A: 8.446, I: 50.8, IPrime: 11.9 },
  { spec: '6.5号槽钢', A: 8.292, I: 55.2, IPrime: 12 },
  { spec: '8号槽钢', A: 10.24, I: 101, IPrime: 16.6 },
  { spec: '10号槽钢', A: 12.74, I: 198, IPrime: 25.6 },
  { spec: '12号槽钢', A: 15.36, I: 346, IPrime: 37.4 },
  { spec: '12.6号槽钢', A: 15.69, I: 391, IPrime: 38 },
  { spec: '14a号槽钢', A: 18.51, I: 564, IPrime: 53.2 },
  { spec: '14b号槽钢', A: 21.31, I: 609, IPrime: 51.1 },
  { spec: '16a号槽钢', A: 21.95, I: 866, IPrime: 73.3 },
  { spec: '16b号槽钢', A: 25.15, I: 935, IPrime: 83.4 },
  { spec: '18a号槽钢', A: 25.69, I: 1270, IPrime: 98.6 },
  { spec: '18b号槽钢', A: 29.29, I: 1370, IPrime: 111 },
  { spec: '20a号槽钢', A: 28.83, I: 1780, IPrime: 128 },
  { spec: '20b号槽钢', A: 32.83, I: 1910, IPrime: 144 },
  { spec: '22a号槽钢', A: 31.83, I: 2390, IPrime: 158 },
  { spec: '22b号槽钢', A: 36.23, I: 2570, IPrime: 176 },
  { spec: '10号工字钢', A: 14.3, I: 245, IPrime: 33 },
  { spec: '12号工字钢', A: 17.8, I: 436, IPrime: 46.9 },
  { spec: '12.6号工字钢', A: 18.1, I: 488, IPrime: 46.9 },
  { spec: '14号工字钢', A: 21.5, I: 712, IPrime: 64.4 },
  { spec: '16号工字钢', A: 26.11, I: 1130, IPrime: 93.1 },
  { spec: '18号工字钢', A: 30.74, I: 1660, IPrime: 122 },
  { spec: '20a号工字钢', A: 35.55, I: 2370, IPrime: 158 },
  { spec: '20b号工字钢', A: 39.55, I: 2500, IPrime: 169 },
  { spec: '22a号工字钢', A: 42.1, I: 3400, IPrime: 225 },
  { spec: '22b号工字钢', A: 46.5, I: 3570, IPrime: 239 },
  { spec: '24a号工字钢', A: 47.71, I: 4570, IPrime: 280 },
  { spec: '24b号工字钢', A: 52.51, I: 4800, IPrime: 297 },
];
