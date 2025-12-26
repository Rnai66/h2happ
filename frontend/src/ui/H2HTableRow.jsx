export default function H2HTableRow({ cells = [] }) {
  return (
    <tr className="hover:bg-[rgba(242,193,78,0.03)] transition-colors">
      {cells.map((cell, i) => (
        <td key={i} className="td">
          {cell}
        </td>
      ))}
    </tr>
  );
}
