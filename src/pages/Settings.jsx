import Card from "../components/Card";

export default function Settings() {
  return (
    <div>
      <h2>Settings</h2>

      <Card>
        <h3>Profile Information</h3>

        <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
          <input placeholder="First Name" style={inputStyle} />
          <input placeholder="Last Name" style={inputStyle} />
        </div>

        <input placeholder="Email" style={{ ...inputStyle, marginTop: 10 }} />
        <input placeholder="Phone" style={{ ...inputStyle, marginTop: 10 }} />

        <button style={btnStyle}>Save Changes</button>
      </Card>
    </div>
  );
}

const inputStyle = {
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  width: "100%",
};

const btnStyle = {
  marginTop: "15px",
  padding: "10px 15px",
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
};