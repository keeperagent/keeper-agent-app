export const formatPathName = (pathname: string) => {
  if (pathname.indexOf("?") !== -1) {
    return pathname.slice(0, pathname.indexOf("?"));
  } else {
    return pathname;
  }
};
