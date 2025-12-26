export default function H2HSkeleton({ height = "1.25rem", width = "100%", rounded = "8px" }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius: rounded,
      }}
    />
  );
}
