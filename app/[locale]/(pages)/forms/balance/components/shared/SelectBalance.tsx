import ReactSelect, { type CSSObjectWithLabel } from "react-select";

interface SelectBalanceProps {
  instanceId: string;
  isDisabled: boolean;
  options: any[];
  placeholder: string;
  value: any;
  onChange: (selectedOption: any) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  styles?: any;
}

const SelectBalance = ({
  instanceId,
  isDisabled,
  options,
  placeholder,
  value,
  onChange,
  onKeyDown,
  styles,
}: SelectBalanceProps) => {
  return (
    <ReactSelect
      isSearchable
      className="text-xs"
      classNamePrefix="react-select"
      components={{ IndicatorSeparator: () => null }}
      instanceId={instanceId}
      isDisabled={isDisabled}
      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
      menuPosition="fixed"
      options={options}
      placeholder={placeholder}
      styles={{
        control: (base: CSSObjectWithLabel) => ({
          ...base,
          minHeight: "32px",
          height: "32px",
          fontSize: "12px",
          border: "none",
          borderRadius: "0",
          boxShadow: "none",
          cursor: isDisabled ? "not-allowed" : "pointer",
          backgroundColor: isDisabled ? "#fffbeb" : "transparent",
          ...(styles?.control ? styles.control(base) : {}),
        }),
        menuPortal: (base: CSSObjectWithLabel) => ({
          ...base,
          zIndex: 9999,
          ...(styles?.menuPortal ? styles.menuPortal(base) : {}),
        }),
        option: (base: CSSObjectWithLabel) => ({
          ...base,
          fontSize: "12px",
          ...(styles?.option ? styles.option(base) : {}),
        }),
        placeholder: (base: CSSObjectWithLabel) => ({
          ...base,
          fontSize: "12px",
          ...(styles?.placeholder ? styles.placeholder(base) : {}),
        }),
        singleValue: (base: CSSObjectWithLabel) => ({
          ...base,
          fontSize: "12px",
          ...(styles?.singleValue ? styles.singleValue(base) : {}),
        }),
      }}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  );
};

export default SelectBalance;
