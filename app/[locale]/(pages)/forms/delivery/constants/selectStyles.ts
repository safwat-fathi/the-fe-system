import type { CSSObjectWithLabel, StylesConfig } from "react-select";

export const baseSelectStyles: StylesConfig<object, false> = {
  control: (base: CSSObjectWithLabel) => ({
    ...base,
    minHeight: "32px",
    height: "32px",
    fontSize: "12px",
  }),
  menuPortal: (base: CSSObjectWithLabel) => ({
    ...base,
    zIndex: 9999,
  }),
  option: (base: CSSObjectWithLabel) => ({
    ...base,
    fontSize: "12px",
  }),
  placeholder: (base: CSSObjectWithLabel) => ({
    ...base,
    fontSize: "12px",
  }),
  singleValue: (base: CSSObjectWithLabel) => ({
    ...base,
    fontSize: "12px",
  }),
};

export const tableSelectStyles: StylesConfig<object, false> = {
  ...baseSelectStyles,
  control: (base: CSSObjectWithLabel, state) => ({
    ...base,
    minHeight: "32px",
    height: "32px",
    fontSize: "12px",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    backgroundColor: "transparent",
  }),
};
