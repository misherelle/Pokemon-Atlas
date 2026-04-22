function VisualSlot({
  label,
  hint = 'Drop image here',
  compact = false,
  src,
  alt,
  onZoom,
}) {
  return (
    <div className={`visual-slot ${compact ? 'is-compact' : ''}${src ? ' has-image' : ''}`}>
      {src ? (
        <>
          <img
            className="visual-slot-image"
            src={src}
            alt={alt ?? label}
            loading="lazy"
          />
          {onZoom ? (
            <button
              type="button"
              className="visual-slot-zoom"
              aria-label={`Open larger image of ${label}`}
              onClick={onZoom}
            >
              <span aria-hidden="true" />
            </button>
          ) : null}
        </>
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
