interface TableInputProps {
  isEditing: boolean;
  value: number | string;
  onChange: (value: string | number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type: "number" | "text";
  ref: React.Ref<HTMLInputElement>;
  title?: string;
  placeholder?: string;
  step?: string;
  className?: string;
}

const TableInput = ({
  isEditing,
  value,
  onChange,
  onKeyDown,
  type,
  ref,
  title,
  placeholder,
  step,
  className = "",
}: TableInputProps) => {
  return (
    <input
      className={`w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0 ${className}`}
      disabled={!isEditing}
      min="0"
      readOnly={!isEditing}
      style={{
        MozAppearance: "textfield",
        WebkitAppearance: "none",
        appearance: "none",
      }}
      title={title}
      placeholder={placeholder}
      step={step}
      type={type}
      value={value}
      ref={ref}
      onChange={(e) => {
        if (type === "number") {
          onChange(e.target.value ? parseFloat(e.target.value) : 0);
        } else {
          onChange(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        onKeyDown(e);
      }}
    />
  );
};

export default TableInput;
