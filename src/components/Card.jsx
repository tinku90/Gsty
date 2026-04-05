export default function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}