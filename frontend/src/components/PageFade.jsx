export default function PageFade({ children }) {
  // แค่ใส่คลาส .page-fade ที่เราประกาศใน index.css
  return <div className="page-fade">{children}</div>;
}
