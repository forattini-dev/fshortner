const Reset = "\x1b[0m";
const FgBrightRed = "\x1b[91m";
const FgBrightCyan = "\x1b[96m";
const FgBrightYellow = "\x1b[93m";
const FgBrightMagenta = "\x1b[95m";

function rightNow() {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${day}/${month} ${hours}h${minutes}"${seconds}'`;
}

function toStringer(arrOfStuff = []) {
  return [].concat(arrOfStuff)
    .filter(msg => msg)
    .map(msg => JSON.stringify(msg, null, 2))
    .join(' ')
}

export function ltrace(...msgs) {
  console.debug(` ${FgBrightMagenta}🔍 TRC ${rightNow()} ${Reset}${toStringer(msgs)}`);
}

export function linfo(...msgs) {
  console.info(` ${FgBrightCyan}💡 INF ${rightNow()} ${Reset}${toStringer(msgs)}`);
}

export function lwarn(...msgs) {
  console.warn(` ${FgBrightYellow}⚠️  WRN ${rightNow()} ${Reset}${toStringer(msgs)}`);
}

export function lerror(...msgs) {
  console.error(` ${FgBrightRed}❌ ERR ${rightNow()} ${Reset}${toStringer(msgs)}`);
}

export const logger = {
  trace: ltrace,
  info: linfo,
  warn: lwarn,
  error: lerror,
}

export default logger;
