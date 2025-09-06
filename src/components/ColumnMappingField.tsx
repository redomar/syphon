import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ColumnMappingFieldProps {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function ColumnMappingField({
  id,
  label,
  placeholder,
  required,
  value,
  onChange,
}: ColumnMappingFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
