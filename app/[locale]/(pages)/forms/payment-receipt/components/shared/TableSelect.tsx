import ReactSelect, { Props as SelectProps, GroupBase } from "react-select";
import { useId } from "react";

interface TableSelectProps<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> extends SelectProps<Option, IsMulti, Group> {
  error?: string;
  className?: string;
}

const TableSelect = <
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  error,
  className,
  instanceId,
  styles,
  components,
  ...props
}: TableSelectProps<Option, IsMulti, Group>) => {
  const generatedId = useId();
  const selectInstanceId = instanceId || generatedId;

  return (
    <div className={className}>
      <ReactSelect
        {...props}
        instanceId={selectInstanceId}
        isSearchable
        className="text-xs"
        classNamePrefix="react-select"
        components={{ IndicatorSeparator: () => null, ...components }}
        menuPortalTarget={typeof window !== "undefined" ? document.body : null}
        menuPosition="fixed"
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "32px",
            height: "32px",
            fontSize: "12px",
            border: "none",
            borderRadius: "0",
            boxShadow: "none",
            backgroundColor: "transparent",
            cursor: props.isDisabled ? "not-allowed" : "pointer",
            ...((styles?.control as any) || {}),
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          option: (base) => ({
            ...base,
            fontSize: "12px",
            ...((styles?.option as any) || {}),
          }),
          placeholder: (base) => ({
            ...base,
            fontSize: "12px",
            ...((styles?.placeholder as any) || {}),
          }),
          singleValue: (base) => ({
            ...base,
            fontSize: "12px",
            ...((styles?.singleValue as any) || {}),
          }),
          ...styles,
        }}
        onKeyDown={(e) => {
          const target = e.target as HTMLElement | null;

          if (!target) return;

          const isInListbox = target.closest('[role="listbox"]');

          if (isInListbox) {
            return;
          }

          const selectButton = target.closest('[role="combobox"]');

          if (selectButton) {
            const isExpanded =
              selectButton.getAttribute("aria-expanded") === "true";

            // If expanded, allow normal interaction unless Escape
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

export default TableSelect;
