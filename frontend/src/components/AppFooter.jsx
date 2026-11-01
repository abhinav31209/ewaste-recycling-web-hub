import BrandMark from "./BrandMark";

export default function AppFooter() {
    return (
        <footer
            style={{
                height: "68px",
                marginTop: "auto",
                background: "#ffffff",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 48px",
                fontSize: "12px",
                color: "#6b7280",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BrandMark size={24} />
                <span>eWaste Hub</span>
            </div>

            <div>© 2026 eWaste Hub. Building a circular economy for electronics.</div>

            <div style={{ display: "flex", gap: "18px" }}>
                <span>Privacy</span>
                <span>Terms</span>
                <span>Contact</span>
            </div>
        </footer>
    );
}
