export interface BeadColor {
  id: string;
  name: string;
  hex: string;
  mard?: string; // MARD色号
  coco?: string; // COCO色号
  manman?: string; // 漫漫色号
  panpan?: string; // 盼盼色号
  mxw?: string; // 咪小窝色号
}

export type BeadGrid = (string | null)[][];

export type ColorSystem = 'mard' | 'coco' | 'manman' | 'panpan' | 'mxw';

export type ProcessMode = 'cartoon' | 'photo' | 'pixel' | 'sketch';
