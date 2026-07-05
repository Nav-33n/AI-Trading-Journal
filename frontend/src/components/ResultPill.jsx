export function ResultPill({ value }) {
  const className = `result-pill result-${String(value).toLowerCase()}`

  return <span className={className}>{value}</span>
}
