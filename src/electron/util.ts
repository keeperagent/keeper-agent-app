import url from "url";

const safeDecode = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export const parseWindowsPath = (rawPath: string): string => {
  let filePath = safeDecode(rawPath);

  // Normalize escaped backslashes and forward slashes
  filePath = filePath.replace(/\\\\/g, "\\").replace(/\//g, "\\");

  // Handle drive letter formats: c/Users -> C:\Users, C: -> C:\
  filePath = filePath
    .replace(/^([a-zA-Z])\\/, (_, d) => `${d.toUpperCase()}:\\`)
    .replace(/^([A-Za-z]):\\?/, "$1:\\")
    .replace(/^\\+([A-Za-z]:)/, "$1");

  return filePath;
};

export const parseUnixPath = (rawPath: string): string => {
  const decoded = safeDecode(rawPath);
  const absolutePath = decoded.startsWith("/") ? decoded : `/${decoded}`;
  return url.fileURLToPath(`file://${absolutePath}`);
};
