import AsyncCreatableSelect from "react-select/async-creatable";

interface OptionType {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

interface TableAsyncSelectProps<T extends OptionType> {
  isEditing: boolean;
  loadOptions: (inputValue: string) => Promise<T[]>;
  placeholder: string;
  value: T | null;
  onChange: (value: T | null) => void;
}

const TableAsyncSelect = <T extends OptionType>({
  isEditing,
  loadOptions,
  placeholder,
  value,
  onChange,
}: TableAsyncSelectProps<T>) => {
  return (
    <AsyncCreatableSelect
      isClearable
      isSearchable
      cacheOptions
      defaultOptions
      className="text-xs"
      classNamePrefix="select"
      components={{ IndicatorSeparator: () => null }}
      isDisabled={!isEditing}
      loadOptions={loadOptions}
      menuPosition="fixed"
      placeholder={placeholder}
      styles={{
        control: (base, _state) => ({
          ...base,
          minHeight: "100%",
          height: "100%",
          border: "none",
          borderRadius: 0,
          boxShadow: "none",
          cursor: !isEditing ? "not-allowed" : base.cursor,
          backgroundColor: "transparent",
          "&:hover": {
            border: "none",
            boxShadow: "none",
          },
        }),
        valueContainer: (base) => ({
          ...base,
          padding: "0.125rem 0.25rem",
          height: "100%",
        }),
        input: (base) => ({
          ...base,
          margin: 0,
          padding: 0,
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
      value={value}
      onChange={onChange}
    />
  );
};

export default TableAsyncSelect;
