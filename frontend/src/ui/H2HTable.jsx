export default function H2HTable({ columns = [], data = [], renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="th">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0
            ? data.map((item, i) => renderRow(item, i))
            : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="td text-center text-[var(--fg-muted)] italic py-4"
                >
                  No data found.
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
