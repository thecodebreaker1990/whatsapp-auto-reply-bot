let latestQr = null;

export function setQr(qr) {
  latestQr = qr;
}

export function clearQr() {
  latestQr = null;
}

export function getQr() {
  return latestQr;
}
