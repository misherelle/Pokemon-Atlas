function PageHero({ eyebrow, title, body, highlights = [], stats = [] }) {
  const hasHighlights = highlights.length > 0

  return (
    <section className={`page-hero${hasHighlights ? '' : ' compact-hero'}`}>
      <div className="page-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-body">{body}</p>
      </div>

      {hasHighlights ? (
        <div className="page-hero-panel" aria-label={`${title} highlights`}>
          {highlights.map((item) => (
            <article
              key={`${item.label}-${item.value}`}
              className={`page-hero-note${item.tone ? ` tone-${item.tone}` : ''}`}
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.note ? <p>{item.note}</p> : null}
            </article>
          ))}
        </div>
      ) : null}

      {stats.length > 0 ? (
        <div className="hero-metrics">
          {stats.map((stat) => (
            <article key={stat.label} className="metric-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default PageHero
