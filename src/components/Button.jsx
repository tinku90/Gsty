export default function Button({ children, onClick, loading }) {
  return (
    <button className="app-button" onClick={onClick} disabled={loading}>
      {loading ? "Processing..." : children}
    </button>
  );
}