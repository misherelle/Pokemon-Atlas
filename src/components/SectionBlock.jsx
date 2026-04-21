function SectionBlock({ eyebrow, title, body, children }) {
  return (
    <section className="section-block">
      <div className="section-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      {children}
    </section>
  )
}

export default SectionBlock
