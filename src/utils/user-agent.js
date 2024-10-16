export function getOS(userAgent) {
  let os = "unknown";

  if (userAgent.indexOf("Win") !== -1) os = "windows";
  else if (userAgent.indexOf("Mac") !== -1) os = "mac";
  else if (userAgent.indexOf("X11") !== -1) os = "unix";
  else if (userAgent.indexOf("Linux") !== -1) os = "linux";
  else if (/Android/.test(userAgent)) os = "android";
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = "ios";

  return os;
}

export function getBrowser(userAgent) {
  let browser = "unknown";

  if (userAgent.indexOf("Firefox") !== -1) browser = "firefox";
  else if (userAgent.indexOf("Opera") !== -1 || userAgent.indexOf("OPR") !== -1) browser = "opera";
  else if (userAgent.indexOf("Chrome") !== -1) browser = "chrome";
  else if (userAgent.indexOf("Safari") !== -1) browser = "safari";
  else if (userAgent.indexOf("MSIE") !== -1 || !!document.documentMode) browser = "internet-explorer";
  else if (userAgent.indexOf("Edg") !== -1) browser = "microsoft-edge";

  return browser;
}
