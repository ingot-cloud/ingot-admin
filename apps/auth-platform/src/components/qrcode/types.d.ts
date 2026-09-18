declare module "beautify-qrcode" {
  declare enum CorrectLevel {
    P7 = 1,
    P15 = 0,
    P25 = 3,
    P30 = 2,
  }

  declare enum LineOptionsType {
    LeftRight = 0,
    UpDown = 1,
    VerticalHorizontal = 2,
    Loopback = 3,
    LeftUpRightDown = 4,
    RightUpLeftDown = 5,
    Cross = 6,
  }

  declare enum OptionsPosType {
    Rectangle = 0,
    Circular = 1,
    Planet = 2,
    RoundedRectangle = 3,
  }

  declare enum RoundOptionsType {
    Rectangle = 0,
    Circular = 1,
    Random = 2,
  }

  /**
   * @param {String} text 二维码内容
   * @param {Number} width  生成svg的宽度 默认100%
   * @param {Number} height 生成svg的高度 默认100%
   * @param {Number} correctLevel 容错率 1=>7% 0 =>15% 3=>25% 2=>30%
   * @param {Boolean} isSpace 生成内容是否预留空隙 默认true
   */
  declare interface Options {
    text?: string;
    width?: string;
    height?: string;
    correctLevel?: CorrectLevel;
    isSpace?: boolean;
  }

  /**
   * A_a1
   * @param {String} type 连线方向 0=>左右 1=>上下 2=>纵横 3=>回环 4=>左上—右下 5=>右上—左下 6=>交叉"
   * @param {String} size 连线粗细
   * @param {String} opacity 连线不透明度
   * @param {String} posType 定位点样式  0=>矩形 1=>圆形 2=>行星 3=>圆角矩形
   * @param {String} otherColor 连线颜色
   * @param {String} posColor 定位点颜色
   */
  declare interface LineOptions {
    type?: LineOptionsType;
    size?: number;
    opacity?: number;
    posType?: OptionsPosType;
    otherColor?: string;
    posColor?: string;
  }

  /**
   * A2
   * @param {Number} type  信息点样式 0=>矩形 1=>圆形,2=>随机
   * @param {Number} size 信息点缩放
   * @param {String} opacity  信息点不透明度
   * @param {String} posType 定位点样式 0=>矩形 1=>圆形 2=>行星
   * @param {String} otherColor 信息点颜色
   * @param {String} posColor 定位点点颜色
   */
  declare interface RoundOptions {
    type?: RoundOptionsType;
    size?: number;
    opacity?: number;
    posType?: OptionsPosType;
    otherColor?: string;
    posColor?: string;
  }

  /**
   * 编码数据
   * @param Options
   */
  declare function encodeData(p: Options): Options;

  /**
   * 绘制A_a1
   */
  declare function rendererLine(p: Options, line?: LineOptions): string;

  /**
   * 绘制A2
   */
  declare function rendererRound(p: Options, round?: RoundOptions): string;
}
