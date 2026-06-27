function buildUpiLink(total, orderId) {
  const settings = getSettings();
  const params = new URLSearchParams({
    pa: settings.upiId,
    pn: settings.upiPayeeName,
    am: total.toFixed(2),
    cu: 'INR',
    tn: `Order-${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

function renderQrCode(canvas, upiLink) {
  return QRCode.toCanvas(canvas, upiLink, {
    width: 220,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  });
}
