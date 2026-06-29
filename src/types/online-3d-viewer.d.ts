// online-3d-viewer ships a .d.ts but no "types" entry in package.json, so TS can't
// resolve it automatically. Declare the small surface we actually use.
declare module 'online-3d-viewer' {
  export class RGBColor {
    constructor(r: number, g: number, b: number);
  }
  export class RGBAColor {
    constructor(r: number, g: number, b: number, a: number);
  }
  export class EdgeSettings {
    constructor(showEdges: boolean, edgeColor: RGBColor, edgeThreshold: number);
  }
  export interface EmbeddedViewerParams {
    backgroundColor?: RGBAColor;
    defaultColor?: RGBColor;
    defaultLineColor?: RGBColor;
    edgeSettings?: EdgeSettings;
    onModelLoaded?: () => void;
    onModelLoadFailed?: () => void;
  }
  export class EmbeddedViewer {
    constructor(parentElement: HTMLElement, parameters: EmbeddedViewerParams);
    LoadModelFromFileList(fileList: File[]): void;
    Resize(): void;
    Destroy(): void;
  }
}
