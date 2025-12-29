export function Textarea({ className = "", rows = 4, value, defaultValue, ...props }) {
  const baseStyles = 
    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "ring-offset-background placeholder:text-muted-foreground " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50 " +
    "resize-y transition-colors"

  const taProps = { ...props, rows }
  taProps.value = value === undefined ? (defaultValue === undefined ? "" : defaultValue) : value

  return (
    <textarea
      className={`${baseStyles} ${className}`}
      {...taProps}
    />
  )
}
