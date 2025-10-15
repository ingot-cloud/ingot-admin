const svgHead =
  '<?xml version="1.0" encoding="utf-8"?>\n ' +
  '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">\n';

const MIME = { jpg: "image/jpeg", png: "image/png" };
type MIME_KEY = "jpg" | "png";

export function saveSvg(value: string, content: string) {
  const htmlContent = [svgHead + content];
  const bl = new Blob(htmlContent, { type: "image/svg+xml" });
  const a = document.createElement("a");
  const filename = "QRcode_" + value + ".svg";

  a.href = URL.createObjectURL(bl);
  a.download = filename;
  a.hidden = true;
  a.click();
}

export function saveImg(
  value: string,
  content: string,
  width: string,
  height: string,
  type: MIME_KEY,
) {
  if (!MIME[type]) throw "Error image type";

  // Finish creating downloadable data
  const filename = "QRcode_" + value + "." + type;

  const canvas = document.createElement("canvas");

  // Image will be scaled to the requested size.
  // var size = data.requestedSize;
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);

  const ctx = canvas.getContext("2d");
  const img = document.createElement("img");
  img.setAttribute(
    "src",
    "data:image/svg+xml;base64," + btoa(decodeURIComponent(encodeURIComponent(content))),
  );

  return new Promise((resolve) => {
    img.onload = () => {
      ctx!.fillStyle = "white";
      if (type === "jpg") ctx!.fillRect(0, 0, Number(width), Number(height));
      ctx!.drawImage(img, 0, 0, Number(width), Number(height));
      // `download` attr is not well supported
      // Will result in a download popup for chrome and the
      // image opening in a new tab for others.

      const a = document.createElement("a");
      const data = canvas.toDataURL(MIME[type], 0.8);
      a.setAttribute("href", data);
      a.setAttribute("target", "download");
      a.setAttribute("download", filename);
      a.click();

      resolve(data);
    };
  });
}
