import { dashboardFieldStyle } from "./DashboardFieldStyles.js";

export default function DashboardInput(props) {
  const { style, ...rest } = props;

  return <input {...rest} style={{ ...dashboardFieldStyle, ...style }} />;
}
