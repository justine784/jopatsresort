export function Card({children, className = '', ...props}){
  return (
    <div {...props} className={`rounded-lg bg-card border border-border shadow-md ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({children, className = ''}){ return <div className={`px-6 pt-6 ${className}`}>{children}</div> }
export function CardFooter({children, className = ''}){ return <div className={`px-6 pb-6 ${className}`}>{children}</div> }
export function CardContent({children, className = ''}){ return <div className={`px-6 ${className}`}>{children}</div> }
export function CardTitle({children, className = ''}){ return <h3 className={className}>{children}</h3> }
export function CardDescription({children, className = ''}){ return <p className={className}>{children}</p> }
