export function StatCard({ label, value, detail }) {
  return (
    <section className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </section>
  )
}
