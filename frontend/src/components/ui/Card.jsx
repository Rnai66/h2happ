export default function Card({ children, className='' }) {
  return <div className={'rounded-2xl bg-white shadow hover:shadow-xl transition overflow-hidden ' + className}>{children}</div>;
}
