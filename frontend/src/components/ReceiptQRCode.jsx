import { QRCodeCanvas } from "qrcode.react";

export default function ReceiptQRCode({ value }) {
  if (!value) return null;

  return (
    <div className="receipt-qr">
      <QRCodeCanvas
        value={value}
        size={96}
        bgColor="#ffffff"
        fgColor="#000000"
        level="M"
        includeMargin
      />
      <div className="qr-caption">
        Scan เพื่อตรวจสอบคำสั่งซื้อ
      </div>
    </div>
  );
}
