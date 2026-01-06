export default function Card({ children, className = '' }) {
  return <div className={'h2h-card ' + className}>{children}</div>;
}
