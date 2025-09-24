import { newEnumExt } from "@/models/common";

export { encodeData, rendererLine, rendererRound } from "beautify-qrcode";
export type { Options, LineOptions, RoundOptions } from "beautify-qrcode";

export enum CorrectLevel {
  P7 = 1,
  P15 = 0,
  P25 = 3,
  P30 = 2,
}
export const useCorrectLevelEnum = () => {
  const { getOptions } = useEnum<any>([
    newEnumExt(CorrectLevel.P7, "7%"),
    newEnumExt(CorrectLevel.P15, "15%"),
    newEnumExt(CorrectLevel.P25, "25%"),
    newEnumExt(CorrectLevel.P30, "30%"),
  ]);
  return {
    getOptions,
  };
};

export enum LineOptionsType {
  LeftRight = 0,
  UpDown = 1,
  VerticalHorizontal = 2,
  Loopback = 3,
  LeftUpRightDown = 4,
  RightUpLeftDown = 5,
  Cross = 6,
}
export const useLineOptionsTypeEnum = () => {
  const { getOptions } = useEnum<any>([
    newEnumExt(LineOptionsType.LeftRight, "左右"),
    newEnumExt(LineOptionsType.UpDown, "上下"),
    newEnumExt(LineOptionsType.VerticalHorizontal, "纵横"),
    newEnumExt(LineOptionsType.Loopback, "回环"),
    newEnumExt(LineOptionsType.LeftUpRightDown, "左上-右下"),
    newEnumExt(LineOptionsType.RightUpLeftDown, "右上-左下"),
    newEnumExt(LineOptionsType.Cross, "交叉"),
  ]);
  return {
    getOptions,
  };
};

export enum OptionsPosType {
  Rectangle = 0,
  Circular = 1,
  Planet = 2,
  RoundedRectangle = 3,
}
export const useOptionsPosTypeEnum = () => {
  const { getOptions } = useEnum<any>([
    newEnumExt(OptionsPosType.Rectangle, "矩形"),
    newEnumExt(OptionsPosType.Circular, "圆形"),
    newEnumExt(OptionsPosType.Planet, "行星"),
    newEnumExt(OptionsPosType.RoundedRectangle, "圆角矩形"),
  ]);
  return {
    getOptions,
  };
};

export enum RoundOptionsType {
  Rectangle = 0,
  Circular = 1,
  Random = 2,
}
export const useRoundOptionsTypeEnum = () => {
  const { getOptions } = useEnum<any>([
    newEnumExt(RoundOptionsType.Rectangle, "矩形"),
    newEnumExt(RoundOptionsType.Circular, "圆形"),
    newEnumExt(RoundOptionsType.Random, "随机"),
  ]);
  return {
    getOptions,
  };
};

export enum QrcodeType {
  Line = 0,
  Round = 1,
}
export const useQrcodeTypeEnum = () => {
  const { getOptions } = useEnum<any>([
    newEnumExt(QrcodeType.Line, "A - a1"),
    newEnumExt(QrcodeType.Round, "A2"),
  ]);
  return {
    getOptions,
  };
};

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
