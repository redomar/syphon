import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColumnMappingFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function ColumnMappingField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: ColumnMappingFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
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
