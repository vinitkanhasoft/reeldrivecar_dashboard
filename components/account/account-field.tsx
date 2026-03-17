import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type AccountFieldProps = {
  id: string
  label: string
  value: string
  placeholder?: string
  type?: string
  onChange: (value: string) => void
}

export function AccountField({
  id,
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: AccountFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium tracking-tight text-foreground/90">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 rounded-xl border-border/70 bg-background/80 px-3 text-sm shadow-xs transition-colors",
          "placeholder:text-muted-foreground/70 focus-visible:border-border focus-visible:ring-ring/20"
        )}
      />
    </div>
  )
}
