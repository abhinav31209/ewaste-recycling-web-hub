import { dashboardTextareaStyle } from "./DashboardFieldStyles.js";

export default function DashboardTextarea(props) {
  const { style, ...rest } = props;

  return <textarea {...rest} style={{ ...dashboardTextareaStyle, ...style }} />;
}
