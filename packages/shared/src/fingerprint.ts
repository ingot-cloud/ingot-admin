/**
 * 设备指纹生成器
 *
 * 通过采集浏览器多维度特征并计算 SHA-256 摘要，生成稳定的设备标识。
 * 同一设备+浏览器的指纹在多次访问中保持一致，不同设备的指纹不同。
 *
 * 采集维度：
 * - 基础：User-Agent、语言、平台、CPU核心数、内存、时区
 * - 屏幕：分辨率、色深、像素比
 * - Canvas 2D：不同 GPU/驱动/字体渲染结果不同
 * - WebGL：GPU 厂商和渲染器信息
 * - 音频：AudioContext 处理差异
 *
 * 摘要优先使用 Web Crypto（HTTPS / localhost）；
 * 内网 HTTP IP 等非安全上下文再动态加载 crypto-js（由 vite-config 指向单文件入口）。
 */

interface FingerprintComponent {
  key: string;
  value: string;
}

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

/**
 * 生成设备指纹（SHA-256 hex）
 *
 * @returns 64 字符的十六进制字符串
 *
 * @example
 * ```ts
 * const fp = await generateFingerprint();
 * ```
 */
export async function generateFingerprint(): Promise<string> {
  const components = await collectComponents();
  const raw = components.map((c) => `${c.key}:${c.value}`).join("|");
  return sha256Hex(raw);
}

async function sha256Hex(raw: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const buffer = await subtle.digest("SHA-256", new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  // 非安全上下文（如 http://内网IP）无 subtle，动态回退 crypto-js
  const { default: CryptoJS } = await import("crypto-js");
  return CryptoJS.SHA256(raw).toString(CryptoJS.enc.Hex);
}

async function collectComponents(): Promise<FingerprintComponent[]> {
  const components: FingerprintComponent[] = [];
  const navigatorWithMemory = navigator as NavigatorWithDeviceMemory;

  // ---- 基础环境 ----
  components.push({ key: "ua", value: navigator.userAgent });
  components.push({ key: "lang", value: navigator.language });
  components.push({ key: "langs", value: (navigator.languages || []).join(",") });
  components.push({ key: "cores", value: String(navigator.hardwareConcurrency || 0) });
  components.push({ key: "mem", value: String(navigatorWithMemory.deviceMemory || 0) });
  components.push({ key: "tz", value: Intl.DateTimeFormat().resolvedOptions().timeZone });
  components.push({ key: "tzo", value: String(new Date().getTimezoneOffset()) });
  components.push({ key: "cookie", value: String(navigator.cookieEnabled) });
  components.push({ key: "dnt", value: String(navigator.doNotTrack || "") });

  // ---- 屏幕特征 ----
  components.push({ key: "res", value: `${screen.width}x${screen.height}` });
  components.push({ key: "avail", value: `${screen.availWidth}x${screen.availHeight}` });
  components.push({ key: "depth", value: String(screen.colorDepth) });
  components.push({ key: "dpr", value: String(window.devicePixelRatio || 1) });

  // ---- Canvas 指纹 ----
  components.push({ key: "canvas", value: getCanvasFingerprint() });

  // ---- WebGL 指纹 ----
  components.push({ key: "webgl", value: getWebGLFingerprint() });

  // ---- Audio 指纹 ----
  const audioFp = await getAudioFingerprint();
  components.push({ key: "audio", value: audioFp });

  return components;
}

/**
 * Canvas 2D 指纹
 *
 * 绘制特定图形和文字，不同设备的 GPU、字体渲染引擎、抗锯齿算法
 * 会产生像素级差异，导致 toDataURL() 输出不同。
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, "#ff6b6b");
    gradient.addColorStop(1, "#4ecdc4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 50);

    ctx.fillStyle = "#2d3436";
    ctx.font = "18px Arial, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("Ingot.FP.2024", 2, 2);

    ctx.fillStyle = "rgba(102, 204, 170, 0.7)";
    ctx.beginPath();
    ctx.arc(150, 25, 20, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toDataURL();
  } catch {
    return "";
  }
}

/**
 * WebGL 指纹
 *
 * 获取 GPU 的 VENDOR 和 RENDERER 信息，
 * 这在不同硬件设备上几乎唯一。
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return "";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "";

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    return `${vendor}~${renderer}`;
  } catch {
    return "";
  }
}

/**
 * Audio 指纹
 *
 * 通过 OfflineAudioContext 生成音频采样，
 * 不同音频处理芯片和驱动会产生微小的浮点差异。
 */
function getAudioFingerprint(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const AudioCtx =
        window.OfflineAudioContext ||
        (window as Window & { webkitOfflineAudioContext?: typeof OfflineAudioContext })
          .webkitOfflineAudioContext;
      if (!AudioCtx) {
        resolve("");
        return;
      }

      const context = new AudioCtx(1, 44100, 44100);
      const oscillator = context.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, context.currentTime);
      compressor.knee.setValueAtTime(40, context.currentTime);
      compressor.ratio.setValueAtTime(12, context.currentTime);
      compressor.attack.setValueAtTime(0, context.currentTime);
      compressor.release.setValueAtTime(0.25, context.currentTime);

      oscillator.connect(compressor);
      compressor.connect(context.destination);
      oscillator.start(0);

      context
        .startRendering()
        .then((buffer) => {
          const data = buffer.getChannelData(0);
          let sum = 0;
          for (let i = 4500; i < 5000; i++) {
            sum += Math.abs(data[i]);
          }
          resolve(sum.toFixed(6));
        })
        .catch(() => resolve(""));

      setTimeout(() => resolve(""), 1000);
    } catch {
      resolve("");
    }
  });
}
