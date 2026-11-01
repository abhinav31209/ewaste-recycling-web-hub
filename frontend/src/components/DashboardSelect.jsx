import Select from "react-select";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "48px",
    borderRadius: "14px",
    borderColor: state.isFocused ? "#60a5fa" : state.isHovered ? "#94a3b8" : "#d7deea",
    boxShadow: state.isFocused
      ? "0 0 0 4px rgba(59, 130, 246, 0.12)"
      : "0 10px 22px rgba(15, 23, 42, 0.04)",
    backgroundColor: "#ffffff",
    fontSize: "14px",
    fontWeight: 500,
    color: "#0f172a",
    transition: "border-color 160ms ease, box-shadow 160ms ease",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    opacity: state.isDisabled ? 0.7 : 1,
    "&:hover": {
      borderColor: state.isFocused ? "#60a5fa" : "#94a3b8",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 14px",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#64748b",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#0f172a",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "#2563eb" : "#64748b",
    paddingRight: "14px",
    transition: "color 160ms ease, transform 160ms ease",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : "rotate(0deg)",
    "&:hover": {
      color: "#2563eb",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 18px 48px rgba(15, 23, 42, 0.14)",
    border: "1px solid #e2e8f0",
    marginTop: "8px",
  }),
  menuList: (base) => ({
    ...base,
    padding: "8px",
  }),
  option: (base, state) => ({
    ...base,
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: state.isSelected ? 700 : 500,
    backgroundColor: state.isSelected
      ? "#dbeafe"
      : state.isFocused
        ? "#eff6ff"
        : "#ffffff",
    color: state.isSelected ? "#1d4ed8" : "#0f172a",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),
};

export default function DashboardSelect({
  inputId,
  name,
  options,
  value,
  onChange,
  placeholder,
  isDisabled = false,
  isSearchable = false,
  classNamePrefix = "dashboard-select",
}) {
  return (
    <Select
      inputId={inputId}
      name={name}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isSearchable={isSearchable}
      styles={selectStyles}
      classNamePrefix={classNamePrefix}
    />
  );
}
