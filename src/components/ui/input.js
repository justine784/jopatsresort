export function Input({ className = "", type = "text", value, defaultValue, ...props }) {
  const baseStyles = 
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm " +
    "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium " +
    "placeholder:text-muted-foreground " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50 " +
    "transition-colors"

  // Avoid passing a `value` prop of `undefined` to prevent uncontrolled -> controlled warnings.
  // For file inputs, do not set value at all.
  const inputProps = { ...props }
  if (type !== "file") {
    inputProps.value = value === undefined ? (defaultValue === undefined ? "" : defaultValue) : value
  }

  return (
    <input
      type={type}
      className={`${baseStyles} ${className}`}
      {...inputProps}
    />
  )
}
