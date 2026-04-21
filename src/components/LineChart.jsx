function formatValue(value, currency) {
  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return `${Math.round(value)}`
}

function LineChart({ data, lines, currency = false, ariaLabel }) {
  const width = 720
  const height = 320
  const padding = 34
  const values = data.flatMap((point) => lines.map((line) => point[line.key]))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)

  const xFor = (index) =>
    padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1)

  const yFor = (value) =>
    height - padding - ((value - min) / range) * (height - padding * 2)

  return (
    <div className="chart-card">
      <svg
        className="line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
      >
        {[0, 1, 2, 3].map((tick) => {
          const value = min + (range * tick) / 3
          const y = yFor(value)

          return (
            <g key={tick}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="chart-grid"
              />
              <text x="2" y={y + 4} className="chart-label">
                {formatValue(value, currency)}
              </text>
            </g>
          )
        })}

        {data.map((point, index) => (
          <text
            key={point.year}
            x={xFor(index)}
            y={height - 8}
            textAnchor="middle"
            className="chart-label"
          >
            {point.year}
          </text>
        ))}

        {lines.map((line) => {
          const path = data
            .map((point, index) => {
              const prefix = index === 0 ? 'M' : 'L'
              return `${prefix} ${xFor(index)} ${yFor(point[line.key])}`
            })
            .join(' ')

          return (
            <g key={line.key}>
              <path d={path} fill="none" stroke={line.color} strokeWidth="4" />
              {data.map((point, index) => (
                <circle
                  key={`${line.key}-${point.year}`}
                  cx={xFor(index)}
                  cy={yFor(point[line.key])}
                  r="5"
                  fill={line.color}
                />
              ))}
            </g>
          )
        })}
      </svg>

      <div className="chart-legend">
        {lines.map((line) => (
          <div key={line.key} className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: line.color }}
            />
            <span>{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LineChart
