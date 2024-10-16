import FingerprintJS from '@fingerprintjs/fingerprintjs';

; (async function () {
  const urlId = window.location.pathname.split('/').pop()
  const params = new URLSearchParams(window.location.search);
  const utm = {};

  for (const [key, value] of params.entries()) {
    if (key.startsWith('utm_')) {
      utm[key.replace('utm_', '')] = value;
    }
  }

  const data = {
    view: { utm, urlId },
    fingerprint: {
      userAgent: navigator.userAgent,
      cpu: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      resolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  }

  try {
    const fp = await FingerprintJS.load()
    data.fingerprint.fp = await fp.get()
    data.fingerprint.id = data.fingerprint.fp.visitorId
    data.view.fingerprintId = data.fingerprint.fp.visitorId
  } catch (error) {
    data.error = error
  }

  fetch(`/v1/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
})()
