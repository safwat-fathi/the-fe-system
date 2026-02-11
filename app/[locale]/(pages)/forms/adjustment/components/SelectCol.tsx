import type {
  GroupBase,
  OptionsOrGroups,
  SingleValue,
  ActionMeta,
} from "react-select";

import AsyncCreatableSelect from "react-select/async-creatable";
import React from "react";

// Constraint: OptionType must have a label property
interface OptionTypeWithLabel {
  label: string;
}

interface SelectColProps<OptionType extends OptionTypeWithLabel> {
  loadOptions?: (
    inputValue: string,
    callback: (
      options: OptionsOrGroups<OptionType, GroupBase<OptionType>>,
    ) => void,
  ) => Promise<OptionsOrGroups<OptionType, GroupBase<OptionType>>> | void;
  options?: OptionsOrGroups<OptionType, GroupBase<OptionType>>;
  placeholder?: string;
  formatCreateLabel?: (inputValue: string) => React.ReactNode;
  // onChange matching react-select signature
  onChange?: (
    newValue: SingleValue<OptionType>,
    actionMeta: ActionMeta<OptionType>,
  ) => void;
  defaultOptions?: boolean | OptionsOrGroups<OptionType, GroupBase<OptionType>>;
  value?: OptionType | null;
  isEditing: boolean;
}

function SelectCol<OptionType extends OptionTypeWithLabel>({
  loadOptions,
  options,
  placeholder,
  formatCreateLabel,
  onChange,
  defaultOptions = true,
  value,
  isEditing,
}: SelectColProps<OptionType>) {
  const internalLoadOptions = (
    inputValue: string,
    callback: (
      options: OptionsOrGroups<OptionType, GroupBase<OptionType>>,
    ) => void,
  ) => {
    if (loadOptions) {
      return loadOptions(inputValue, callback);
    }
    // Safe filtering logic
    if (options && Array.isArray(options)) {
      const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase()),
      );

      callback(filteredOptions);

      return Promise.resolve(filteredOptions);
    }

    return Promise.resolve([]);
  };

  return (
    <AsyncCreatableSelect<OptionType, false, GroupBase<OptionType>>
      isClearable
      isSearchable
      cacheOptions
      isDisabled={!isEditing}
      className="text-xs"
      classNamePrefix="select"
      components={{ IndicatorSeparator: () => null }}
      defaultOptions={options || defaultOptions}
      formatCreateLabel={formatCreateLabel}
      loadOptions={internalLoadOptions}
      menuPosition="fixed"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
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
    />
  );
}

export default SelectCol;
