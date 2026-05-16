import QRCode from 'qrcode';

async function test() {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL("EVENT-1-ORDER-5-1715340000000", {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    console.log("QR Code OK");
  } catch (e) {
    console.error("QR Code Error:", e);
  }
}
test();
