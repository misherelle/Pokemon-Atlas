function VisualSlot({
  label,
  hint = 'Drop image here',
  compact = false,
  src,
  alt,
}) {
  return (
    <div className={`visual-slot ${compact ? 'is-compact' : ''}${src ? ' has-image' : ''}`}>
      {src ? (
        <img
          className="visual-slot-image"
          src={src}
          alt={alt ?? label}
          loading="lazy"
        />
      ) : (
        <>
          <span>{label}</span>
          <strong>{hint}</strong>
        </>
      )}
    </div>
  )
}

export default VisualSlot
