"use client";

import ReactSelect, { Props as ReactSelectProps } from "react-select";
import React, { useId } from "react";

interface FormSelectProps extends ReactSelectProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const FormSelect = React.forwardRef<any, FormSelectProps>(
  ({ label, error, containerClassName, ...props }, ref) => {
    const id = useId();
    const instanceId = useId();

    return (
      <div className={`flex flex-col gap-0.5 ${containerClassName || ""}`}>
        {label && (
          <label
            htmlFor={props.inputId || id}
            className="text-xs font-medium text-slate-700 mb-0.5"
          >
            {label}
          </label>
        )}
        <ReactSelect
          {...props}
          ref={ref}
          className={`text-xs ${props.className || ""}`}
          classNamePrefix="react-select"
          components={{
            IndicatorSeparator: () => null,
            ...props.components,
          }}
          inputId={props.inputId || id}
          instanceId={props.instanceId || instanceId}
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "32px",
              height: "32px",
              fontSize: "12px",
              borderColor: error ? "rgb(239 68 68)" : (base as any).borderColor,
              "&:hover": {
                borderColor: error
                  ? "rgb(239 68 68)"
                  : (base as any)["&:hover"]?.borderColor,
              },
              boxShadow: state.isFocused
                ? error
                  ? "0 0 0 1px rgb(239 68 68)"
                  : (base as any).boxShadow
                : (base as any).boxShadow,
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
            ...props.styles,
          }}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  },
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
