function SectionBlock({ eyebrow, title, body, children, className = '', media = null }) {
  return (
    <section className={`section-block${className ? ` ${className}` : ''}`}>
      <div className={`section-intro${media ? ' has-media' : ''}`}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        {media}
      </div>
      {children}
    </section>
  )
}

export default SectionBlock
