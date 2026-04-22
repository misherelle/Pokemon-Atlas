import { useState } from 'react'

function formatValue(value, currency, unit = '') {
  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const displayValue = Number.isInteger(value) ? value : value.toFixed(1)

  return `${displayValue}${unit}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function LineChart({ data, lines, currency = false, ariaLabel }) {
  const [activePointKey, setActivePointKey] = useState(null)
  const width = 720
  const height = 320
  const padding = 34
  const values = data.flatMap((point) => lines.map((line) => point[line.key]))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  const tooltipWidth = 128
  const tooltipHeight = 50

  const xFor = (index) =>
    padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1)

  const yFor = (value) =>
    height - padding - ((value - min) / range) * (height - padding * 2)

  const chartLines = lines.map((line) => {
    const points = data.map((point, index) => ({
      key: `${line.key}-${point.year}`,
      line,
      year: point.year,
      value: point[line.key],
      x: xFor(index),
      y: yFor(point[line.key]),
    }))
    const path = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    return {
      line,
      path,
      points,
    }
  })

  return (
    <div className="chart-card">
      <svg
        className="line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setActivePointKey(null)}
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

        {chartLines.map(({ line, path, points }) => {
          const activePoint = points.find((point) => point.key === activePointKey)

          return (
            <g key={line.key}>
              <path
                d={path}
                fill="none"
                stroke={line.color}
                strokeWidth="4"
                className="chart-line-path"
              />
              {points.map((point) => (
                <g
                  key={point.key}
                  className={`chart-point${point.key === activePointKey ? ' is-active' : ''}`}
                  role="button"
                  tabIndex="0"
                  aria-label={`${point.year}: ${formatValue(point.value, currency, line.unit)}`}
                  onMouseEnter={() => setActivePointKey(point.key)}
                  onFocus={() => setActivePointKey(point.key)}
                  onBlur={() => setActivePointKey(null)}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="13"
                    className="chart-point-hit"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5.5"
                    fill={line.color}
                    className="chart-point-dot"
                  />
                </g>
              ))}
              {activePoint ? (
                <g
                  className="chart-tooltip"
                  transform={`translate(${
                    clamp(activePoint.x, tooltipWidth / 2 + 4, width - tooltipWidth / 2 - 4) -
                    tooltipWidth / 2
                  } ${Math.max(10, activePoint.y - tooltipHeight - 18)})`}
                >
                  <rect
                    width={tooltipWidth}
                    height={tooltipHeight}
                    rx="14"
                    className="chart-tooltip-bg"
                  />
                  <text x="16" y="20" className="chart-tooltip-year">
                    {activePoint.year}
                  </text>
                  <text x="16" y="38" className="chart-tooltip-value">
                    {formatValue(activePoint.value, currency, line.unit)}
                  </text>
                </g>
              ) : null}
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
