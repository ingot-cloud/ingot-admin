export { encodeData, rendererLine, rendererRound } from "beautify-qrcode";
export type { Options, LineOptions, RoundOptions } from "beautify-qrcode";

export enum CorrectLevel {
  P7 = 1,
  P15 = 0,
  P25 = 3,
  P30 = 2,
}

export enum LineOptionsType {
  LeftRight = 0,
  UpDown = 1,
  VerticalHorizontal = 2,
  Loopback = 3,
  LeftUpRightDown = 4,
  RightUpLeftDown = 5,
  Cross = 6,
}

export enum OptionsPosType {
  Rectangle = 0,
  Circular = 1,
  Planet = 2,
  RoundedRectangle = 3,
}

export enum RoundOptionsType {
  Rectangle = 0,
  Circular = 1,
  Random = 2,
}

export enum QrcodeType {
  Line = 0,
  Round = 1,
}

export interface CustomOptions {
  text: string;
  type: QrcodeType;
  correctLevel: CorrectLevel;
  lineOptionsType: LineOptionsType;
  roundOptionsType: RoundOptionsType;
  size: number; // 码点大小
  opacity: number; // 透明度
  posType: OptionsPosType; // 码眼样式
  otherColor: string; // 码点颜色
  posColor: string; // 码眼颜色
}
