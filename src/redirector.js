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

  const user = {
    userAgent: navigator.userAgent,
    cpu: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    resolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }

  const view = {
    urlId,
    utm,
  }

  try {
    const fp = await FingerprintJS.load()
    const fingerprint = await fp.get()

    user.id = fingerprint.visitorId
    view.userId = fingerprint.visitorId
  } catch (error) {
    console.error(error)
  }

  fetch(`/v1/live`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user,
      view,
    }),
  })
})()
