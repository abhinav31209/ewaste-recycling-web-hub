import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader.jsx";
import AppFooter from "../../components/AppFooter.jsx";
import DashboardInput from "../../components/DashboardInput.jsx";
import DashboardSelect from "../../components/DashboardSelect.jsx";
import { submitOwnerDevice } from "../../services/api.js";
import { DEVICE_TYPE_OPTIONS, getDeviceTypeStyle } from "../../services/deviceInsights.js";

const pageStyle = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: "#f3f4f6",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export default function SubmitDevicePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deviceName: "",
    brand: "",
    condition: "",
    deviceType: "PHONE",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const deviceTypeOptions = DEVICE_TYPE_OPTIONS.map((type) => {
    const typeStyle = getDeviceTypeStyle(type);
    return {
      value: type,
      label: typeStyle.label,
    };
  });

  const selectedDeviceTypeOption =
    deviceTypeOptions.find((option) => option.value === formData.deviceType) ??
    deviceTypeOptions[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!formData.deviceName.trim()) {
      setError("Device name is required.");
      return;
    }

    try {
      setLoading(true);
      const data = await submitOwnerDevice({
        deviceName: formData.deviceName,
        brand: formData.brand,
        condition: formData.condition,
        deviceType: formData.deviceType,
      });

      setMessage("Device submitted successfully.");

      setTimeout(() => {
        navigate(`/devices/${data.id}/result`, {
          state: {
            submittedDevice: data,
          },
        });
      }, 700);
    } catch (err) {
      setError(err.message || "Submit device failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <AppHeader />

      <main style={{ padding: "36px 16px 60px" }}>
        <div className="page-shell">
          <section className="page-hero hero-green">
            <p style={{ margin: "0 0 8px 0", fontSize: "13px", opacity: 0.9 }}>
              Owner Workspace
            </p>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "34px", lineHeight: 1.1 }}>
              Submit a device
            </h1>
            <p style={{ margin: 0, maxWidth: "640px", lineHeight: 1.7, opacity: 0.95 }}>
              Add your device details, send it to staff review, and receive the next route for
              resale, recycling, or secure data retrieval.
            </p>
          </section>

          <section
            className="metric-grid"
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            {[
              {
                label: "Submit details",
                value: "Device information",
                icon: "🧾",
                color: "#2563eb",
                note: "Tell us the device name, brand, type, and condition.",
              },
              {
                label: "Staff review",
                value: "Classification step",
                icon: "🤝",
                color: "#7c3aed",
                note: "Staff check the submitted information and classify the device.",
              },
              {
                label: "Next route",
                value: "Workflow outcome",
                icon: "♻️",
                color: "#0f766e",
                note: "Your device moves to resale, recycle, rare, or data retrieval workflows.",
              },
            ].map((item) => (
              <div key={item.label} className="metric-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "999px",
                      background: `${item.color}14`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
                <div className="metric-label">{item.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: item.color, marginTop: "8px" }}>
                  {item.value}
                </div>
                <p style={{ margin: "10px 0 0 0", color: "#64748b", lineHeight: 1.6, fontSize: "13px" }}>
                  {item.note}
                </p>
              </div>
            ))}
          </section>

          <section className="split-layout" style={{ gridTemplateColumns: "1.45fr 0.85fr", alignItems: "start" }}>
            <div
              className="surface-card submission-workflow-card"
              style={{
                padding: "24px",
              }}
            >
              <div style={{ display: "grid", gap: "8px", marginBottom: "22px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#059669" }}>
                  Submission Workflow
                </div>
                <h2 style={{ margin: 0, fontSize: "28px" }}>Device submission</h2>
                <p style={{ margin: 0, color: "#6b7280", lineHeight: 1.7 }}>
                  Fill in the device details below and submit everything to staff review.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gap: "16px" }}>
                  <section className="submission-step">
                    <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Step 1
                      </div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Basic device information</div>
                    </div>

                    <div style={{ display: "grid", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                          Device Name *
                        </label>
                        <DashboardInput
                          name="deviceName"
                          value={formData.deviceName}
                          onChange={handleChange}
                          placeholder="e.g. iPhone 15 Pro, Dell XPS 13"
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                          Brand
                        </label>
                        <DashboardInput
                          name="brand"
                          value={formData.brand}
                          onChange={handleChange}
                          placeholder="e.g. Apple, Samsung, Dell"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="submission-step">
                    <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Step 2
                      </div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Type and condition</div>
                    </div>

                    <div style={{ display: "grid", gap: "16px" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                          Device Type *
                        </label>
                        <DashboardSelect
                          inputId="device-type-select"
                          name="deviceType"
                          options={deviceTypeOptions}
                          value={selectedDeviceTypeOption}
                          onChange={(selectedOption) => {
                            if (!selectedOption) return;
                            setFormData((prev) => ({
                              ...prev,
                              deviceType: selectedOption.value,
                            }));
                          }}
                          isSearchable={false}
                          classNamePrefix="device-type-select"
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: 700 }}>
                          Condition
                        </label>
                        <DashboardInput
                          name="condition"
                          value={formData.condition}
                          onChange={handleChange}
                          placeholder="e.g. used, working, broken"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="submission-step">
                    <div style={{ display: "grid", gap: "4px", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#64748b" }}>
                        Step 3
                      </div>
                      <div style={{ fontWeight: 800, color: "#0f172a" }}>Submit for review</div>
                      <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                        Once the details are accurate, send the device to staff review for classification.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        width: "100%",
                        minHeight: "48px",
                        border: "none",
                        background: "#10b981",
                        color: "#fff",
                        padding: "14px 16px",
                        borderRadius: "10px",
                        fontWeight: 800,
                        cursor: "pointer",
                        fontSize: "14px",
                        opacity: loading ? 0.7 : 1,
                        boxShadow: "0 14px 28px rgba(16,185,129,0.18)",
                      }}
                    >
                      {loading ? "Submitting..." : "Submit device for review"}
                    </button>
                  </section>
                </div>
              </form>

              {message && (
                <div
                  style={{
                    marginTop: "16px",
                    color: "#059669",
                    fontWeight: 700,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "12px",
                    padding: "12px 14px",
                  }}
                >
                  {message}
                </div>
              )}
              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    color: "#dc2626",
                    fontWeight: 700,
                    background: "#fff",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "12px 14px",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            <div className="stack">
              <div className="surface-card" style={{ padding: "20px" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>Submission checklist</h2>
                <div style={{ display: "grid", gap: "10px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                  <div>• Use a clear device name and brand.</div>
                  <div>• Describe condition plainly, including damage or missing parts.</div>
                  <div>• Submit once the details are accurate.</div>
                </div>
              </div>

              <div className="surface-card" style={{ padding: "20px", background: "#fcfdfd" }}>
                <h2 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>What happens next</h2>
                <div style={{ display: "grid", gap: "12px", color: "#475569", fontSize: "14px", lineHeight: 1.6 }}>
                  <div>1. Staff reviews and classifies your device.</div>
                  <div>2. Current and rare devices may unlock partner guidance.</div>
                  <div>3. Recycle devices can move into free data wipe preparation and paid data retrieval.</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
