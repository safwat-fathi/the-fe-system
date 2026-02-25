interface InputTableProps {
  isEditing: boolean;
  value: number | string;
  onChange: (value: string | number) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type: "number" | "text";
}

const InputTable = ({
  isEditing,
  value,
  onChange,
  onKeyDown,
  type,
}: InputTableProps) => {
  return (
    <input
      className="w-full h-full text-xs border-0 rounded-none text-center focus:outline-none focus:ring-0"
      disabled={!isEditing}
      min="0"
      readOnly={!isEditing}
      style={{
        MozAppearance: "textfield",
        WebkitAppearance: "none",
        appearance: "none",
      }}
      type={type}
      value={value}
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

export default InputTable;
