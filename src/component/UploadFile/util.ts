const formatFileSize = (sizeInByte: number) => {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(sizeInByte) / Math.log(k));
  return `${parseFloat((sizeInByte / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export { formatFileSize };
