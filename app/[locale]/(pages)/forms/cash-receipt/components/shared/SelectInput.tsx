import Select, { Props as SelectProps, GroupBase } from "react-select";
import { useId } from "react";

interface SelectInputProps<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> extends SelectProps<Option, IsMulti, Group> {
  label?: string;
  error?: string;
  className?: string;
}

const SelectInput = <
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  label,
  error,
  className,
  instanceId,
  styles,
  components,
  ...props
}: SelectInputProps<Option, IsMulti, Group>) => {
  const generatedId = useId();
  const selectInstanceId = instanceId || generatedId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={String(selectInstanceId)}
          className="block text-xs font-medium text-slate-700 mb-0.5"
        >
          {label}
        </label>
      )}
      <Select
        {...props}
        instanceId={selectInstanceId}
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "32px",
            height: "32px",
            fontSize: "12px",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          option: (base) => ({
            ...base,
            fontSize: "12px",
          }),
          placeholder: (base) => ({
            ...base,
            fontSize: "12px",
          }),
          singleValue: (base) => ({
            ...base,
            fontSize: "12px",
          }),
          ...styles,
        }}
        components={{ IndicatorSeparator: () => null, ...components }}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        className="text-xs"
        classNamePrefix="react-select"
        onKeyDown={(e) => {
          const target = e.target as HTMLElement | null;

          if (!target) return;

          const isInListbox = target.closest('[role="listbox"]');

          if (isInListbox) return;

          const selectButton = target.closest('[role="combobox"]');

          if (selectButton) {
            const isExpanded =
              selectButton.getAttribute("aria-expanded") === "true";

            if (isExpanded && e.key !== "Escape") {
              return;
            }
            if (e.key === "Escape") {
              return;
            }
          }

          if (props.onKeyDown) {
            props.onKeyDown(e);
          }
        }}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SelectInput;
