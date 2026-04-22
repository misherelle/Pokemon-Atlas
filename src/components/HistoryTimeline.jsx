import { useMemo, useState } from 'react'

const categoryColors = {
  franchise: '#5631c7',
  tcg: '#e15bff',
  media: '#ff8a5f',
  company: '#35b7dc',
  global: '#ffc44f',
  digital: '#008cff',
  product: '#37ccb1',
  market: '#ff4f8f',
}

const categoryLabels = {
  franchise: 'Game universe',
  tcg: 'TCG launch',
  media: 'Anime and film',
  company: 'Company and retail',
  global: 'Global expansion',
  digital: 'Digital platform',
  product: 'Product release',
  market: 'Market milestone',
}

const monthMap = {
  'Jan.': 0,
  'Feb.': 1,
  'Mar.': 2,
  'Apr.': 3,
  'May': 4,
  'Jun.': 5,
  'Jul.': 6,
  'Aug.': 7,
  'Sep.': 8,
  'Oct.': 9,
  'Nov.': 10,
  'Dec.': 11,
}

function parseEventDate(label) {
  if (/^\d{4}$/.test(label)) {
    return new Date(Number(label), 6, 1)
  }

  const [month, year] = label.split(' ')
  return new Date(Number(year), monthMap[month], 1)
}

function createEventId(event) {
  return `${event.date}-${event.title}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

const timelineRows = [
  { startYear: 1996, endYear: 1998 },
  { startYear: 1998, endYear: 2000 },
  { startYear: 2000, endYear: 2002 },
  { startYear: 2002, endYear: 2004 },
  { startYear: 2004, endYear: 2014, kind: 'gap', label: '~10 year gap' },
  { startYear: 2014, endYear: 2020, kind: 'gap', label: '~6 year gap' },
  { startYear: 2020, endYear: 2022 },
  { startYear: 2022, endYear: 2024 },
  { startYear: 2024, endYear: 2026 },
]

function getDecimalYear(date) {
  return date.getFullYear() + date.getMonth() / 12
}

function getCardWidth(title) {
  if (title.length >= 26) {
    return 206
  }

  if (title.length >= 21) {
    return 184
  }

  return 164
}

function getWrapLength(cardWidth) {
  return Math.max(16, Math.floor((cardWidth - 34) / 8.2))
}

function wrapTitle(title, maxChars = 19, maxLines = 2) {
  const words = title.split(' ')
  const lines = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word

    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  })

  if (current) {
    lines.push(current)
  }

  if (lines.length <= maxLines) {
    return lines
  }

  const trimmed = lines.slice(0, maxLines)
  const lastIndex = trimmed.length - 1
  trimmed[lastIndex] = `${trimmed[lastIndex].replace(/[.,:]$/, '')}…`
  return trimmed
}

function getPreferredCardX(event) {
  return event.preferredCardX ?? event.x
}

function getEventAnchorX(event) {
  return event.dotX ?? event.x
}

function getClampedCardCenter(event, minX, maxX) {
  return clamp(
    getPreferredCardX(event),
    minX + event.cardWidth / 2,
    maxX - event.cardWidth / 2,
  )
}

function spreadLabelCenters(events, minGap, minX, maxX) {
  const sortedByVisualX = [...events].sort(
    (a, b) => a.x - b.x || a.parsedDate - b.parsedDate || a.title.localeCompare(b.title),
  )

  if (sortedByVisualX.length <= 1) {
    return sortedByVisualX.map((event) => ({
      ...event,
      cardCenterX: getClampedCardCenter(event, minX, maxX),
    }))
  }

  const adjusted = sortedByVisualX.map((event) => ({ ...event }))

  adjusted[0].cardCenterX = getClampedCardCenter(adjusted[0], minX, maxX)

  for (let index = 1; index < adjusted.length; index += 1) {
    const previousEvent = adjusted[index - 1]
    const currentEvent = adjusted[index]

    adjusted[index].cardCenterX = Math.max(
      getClampedCardCenter(currentEvent, minX, maxX),
      previousEvent.cardCenterX +
        previousEvent.cardWidth / 2 +
        currentEvent.cardWidth / 2 +
        minGap,
    )
  }

  const overflow =
    adjusted.at(-1).cardCenterX + adjusted.at(-1).cardWidth / 2 - maxX

  if (overflow > 0) {
    adjusted.forEach((event) => {
      event.cardCenterX -= overflow
    })
  }

  for (let index = adjusted.length - 2; index >= 0; index -= 1) {
    const currentEvent = adjusted[index]
    const nextEvent = adjusted[index + 1]

    adjusted[index].cardCenterX = Math.min(
      currentEvent.cardCenterX,
      nextEvent.cardCenterX -
        nextEvent.cardWidth / 2 -
        currentEvent.cardWidth / 2 -
        minGap,
    )
  }

  const underflow = minX - (adjusted[0].cardCenterX - adjusted[0].cardWidth / 2)

  if (underflow > 0) {
    adjusted.forEach((event) => {
      event.cardCenterX += underflow
    })
  }

  return adjusted.map((event) => ({
    ...event,
    cardCenterX: clamp(
      event.cardCenterX,
      minX + event.cardWidth / 2,
      maxX - event.cardWidth / 2,
    ),
  }))
}

function getTimelinePoint(
  date,
  rows,
  leftPad,
  rightPad,
) {
  const rowWidth = rightPad - leftPad
  const decimalYear = getDecimalYear(date)
  const fallbackRow =
    decimalYear < rows[0].startYear
      ? rows[0]
      : rows.at(-1)
  const row =
    rows.find((candidate, index) => {
      const isLast = index === rows.length - 1

      return (
        decimalYear >= candidate.startYear &&
        (decimalYear < candidate.endYear ||
          (isLast && decimalYear <= candidate.endYear))
      )
    }) ?? fallbackRow
  const progress = clamp(
    (decimalYear - row.startYear) / (row.endYear - row.startYear),
    0,
    1,
  )
  const x =
    row.direction === 'forward'
      ? leftPad + progress * rowWidth
      : rightPad - progress * rowWidth

  return {
    rowIndex: row.index,
    lineY: row.lineY,
    x: clamp(x, leftPad + 18, rightPad - 18),
  }
}

function assignDotPositions(events, minDistance, minX, maxX) {
  const sorted = [...events].sort(
    (a, b) => a.x - b.x || a.parsedDate - b.parsedDate,
  )
  const clusters = []

  sorted.forEach((event) => {
    const currentCluster = clusters.at(-1)

    if (
      currentCluster &&
      event.x - currentCluster.at(-1).x < minDistance
    ) {
      currentCluster.push(event)
    } else {
      clusters.push([event])
    }
  })

  return clusters.flatMap((cluster) => {
    const centerX =
      cluster.reduce((total, event) => total + event.x, 0) / cluster.length
    const firstDotX = centerX - ((cluster.length - 1) * minDistance) / 2
    let dotXs = cluster.map((_, index) => firstDotX + index * minDistance)
    const underflow = minX - dotXs[0]

    if (underflow > 0) {
      dotXs = dotXs.map((dotX) => dotX + underflow)
    }

    const overflow = dotXs.at(-1) - maxX

    if (overflow > 0) {
      dotXs = dotXs.map((dotX) => dotX - overflow)
    }

    return cluster.map((event, index) => ({
      ...event,
      dotX: clamp(dotXs[index], minX, maxX),
      dotY: event.lineY,
    }))
  })
}

function assignLabelCards(row, options) {
  const {
    cardHeight,
    curveInset,
    width,
    minLabelGap,
    stemGap,
    labelLaneGap,
  } = options
  const lanePlan = [
    { side: 'below', level: 0, offset: 0 },
    { side: 'above', level: 0, offset: -112 },
    { side: 'below', level: 1, offset: 112 },
    { side: 'above', level: 1, offset: -224 },
    { side: 'below', level: 2, offset: 224 },
    { side: 'above', level: 2, offset: -336 },
    { side: 'below', level: 3, offset: 336 },
    { side: 'above', level: 3, offset: -448 },
  ]
  const lanes = []
  const sorted = [...row.events].sort(
    (a, b) => a.x - b.x || a.parsedDate - b.parsedDate,
  )

  function getLaneOffset(event, lane) {
    const anchorX = getEventAnchorX(event)

    if (anchorX > width - 340) {
      return -Math.abs(lane.offset)
    }

    if (anchorX < 340) {
      return Math.abs(lane.offset)
    }

    return lane.offset
  }

  sorted.forEach((event) => {
    let lane = lanes.find((candidate) => {
      const preferredEvent = {
        ...event,
        preferredCardX:
          getEventAnchorX(event) + getLaneOffset(event, candidate),
      }
      const centerX = getClampedCardCenter(
        preferredEvent,
        curveInset,
        width - curveInset,
      )
      const cardLeft = centerX - event.cardWidth / 2

      return cardLeft - candidate.lastRight >= minLabelGap
    })

    if (!lane) {
      const laneIndex = lanes.length
      const laneConfig =
        lanePlan[laneIndex] ?? {
          side: laneIndex % 2 === 0 ? 'below' : 'above',
          level: Math.floor(laneIndex / 2),
          offset: (laneIndex + 1) * (laneIndex % 2 === 0 ? 76 : -76),
        }

      lane = {
        ...laneConfig,
        key: `${laneConfig.side}-${laneConfig.level}`,
        lastRight: Number.NEGATIVE_INFINITY,
        events: [],
      }
      lanes.push(lane)
    }

    const eventWithLane = {
      ...event,
      preferredCardX: getEventAnchorX(event) + getLaneOffset(event, lane),
      labelSide: lane.side,
      labelLevel: lane.level,
    }
    const centerX = getClampedCardCenter(
      eventWithLane,
      curveInset,
      width - curveInset,
    )

    lane.events.push({
      ...eventWithLane,
    })
    lane.lastRight = centerX + event.cardWidth / 2
  })

  return lanes.flatMap((lane) => {
    const spacedEvents = spreadLabelCenters(
      lane.events,
      minLabelGap,
      curveInset,
      width - curveInset,
    )

    return spacedEvents.map((event) => ({
      ...event,
      cardX: event.cardCenterX - event.cardWidth / 2,
      cardY:
        event.labelSide === 'below'
          ? row.lineY + stemGap + event.labelLevel * labelLaneGap
          : row.lineY - stemGap - cardHeight - event.labelLevel * labelLaneGap,
    }))
  })
}

function stemPath(event, stemY2) {
  const anchorX = getEventAnchorX(event)
  const isBelow = event.labelSide === 'below'
  const direction = isBelow ? 1 : -1
  const railExitY = event.lineY + direction * 26
  const cardApproachY = stemY2 - direction * 16

  if (event.title === 'Anime launches in the U.S.') {
    const sideX = event.cardCenterX - event.cardWidth / 2 - 42
    const entryX = event.cardCenterX - event.cardWidth / 2 + 24
    const midY = (railExitY + cardApproachY) / 2

    return `M ${anchorX} ${event.lineY} C ${anchorX} ${railExitY}, ${sideX} ${railExitY}, ${sideX} ${midY} C ${sideX} ${cardApproachY}, ${entryX} ${cardApproachY}, ${entryX} ${stemY2}`
  }

  return `M ${anchorX} ${event.lineY} C ${anchorX} ${railExitY}, ${anchorX} ${railExitY}, ${anchorX} ${railExitY} C ${anchorX} ${cardApproachY}, ${event.cardCenterX} ${cardApproachY}, ${event.cardCenterX} ${stemY2}`
}

function buildLayout(events) {
  const ordered = [...events]
    .map((event) => ({
      ...event,
      id: createEventId(event),
      parsedDate: parseEventDate(event.date),
      cardWidth: getCardWidth(event.title),
    }))
    .map((event) => ({
      ...event,
      titleLines: wrapTitle(event.title, getWrapLength(event.cardWidth)),
    }))
    .sort((a, b) => a.parsedDate - b.parsedDate)

  const width = 1760
  const curveInset = 62
  const leftPad = 136
  const rightPad = width - leftPad
  const cardHeight = 76
  const stemGap = 66
  const minLabelGap = 58
  const labelLaneGap = 146
  const minDotDistance = 82
  const topPad = 132
  const rowPitch = 520
  const bottomPad = 152
  const yearLabelOffsetX = 38
  const yearLabelOffsetY = 46

  const rows = timelineRows.map((timelineRow, index) => ({
    ...timelineRow,
    index,
    direction: index % 2 === 0 ? 'forward' : 'reverse',
    labelSide: 'below',
    events: [],
    lineY: topPad + index * rowPitch,
  }))

  ordered.forEach((event) => {
    const point = getTimelinePoint(
      event.parsedDate,
      rows,
      leftPad,
      rightPad,
    )

    rows[point.rowIndex].events.push({
      ...event,
      x: point.x,
      lineY: point.lineY,
      rowIndex: point.rowIndex,
    })
  })

  rows.forEach((row) => {
    row.events = assignDotPositions(
      row.events,
      minDotDistance,
      leftPad + 22,
      rightPad - 22,
    )
    row.events = assignLabelCards(row, {
      cardHeight,
      curveInset,
      width,
      minLabelGap,
      stemGap,
      labelLaneGap,
    })
  })

  const positionedEvents = rows.flatMap((row, rowIndex) =>
    row.events.map((event) => {
      return {
        ...event,
        rowIndex,
        lineY: row.lineY,
        popupSide:
          rowIndex === 0
            ? 'bottom'
            : rowIndex === rows.length - 1
              ? 'top'
              : event.labelSide === 'below'
                ? 'top'
                : 'bottom',
      }
    }),
  )

  const eventsById = new Map(
    positionedEvents.map((event) => [event.id, event]),
  )
  const yearMarkers = [
    ...rows.map((row) => {
      const isLeftSide = row.direction === 'forward'

      return {
        key: `${row.index}-start`,
        year: row.startYear,
        tickX: isLeftSide ? leftPad : rightPad,
        x: isLeftSide ? leftPad - yearLabelOffsetX : rightPad + yearLabelOffsetX,
        lineY: row.lineY,
        labelY: row.lineY + yearLabelOffsetY,
        textAnchor: isLeftSide ? 'end' : 'start',
      }
    }),
    {
      key: `${rows.at(-1).index}-final`,
      year: rows.at(-1).endYear,
      tickX: rows.at(-1).direction === 'forward' ? rightPad : leftPad,
      x:
        rows.at(-1).direction === 'forward'
          ? rightPad + yearLabelOffsetX
          : leftPad - yearLabelOffsetX,
      lineY: rows.at(-1).lineY,
      labelY: rows.at(-1).lineY + yearLabelOffsetY,
      textAnchor: rows.at(-1).direction === 'forward' ? 'start' : 'end',
    },
  ]
  const gapMarkers = rows
    .filter((row) => row.kind === 'gap')
    .map((row) => ({
      x: (leftPad + rightPad) / 2,
      lineY: row.lineY,
      label: row.label,
      labelY: row.lineY - 54,
      slashCount: Math.max(1, Math.round((row.endYear - row.startYear) / 2)),
    }))
  const maxCardBottom = positionedEvents.reduce(
    (bottom, event) => Math.max(bottom, event.cardY + cardHeight),
    0,
  )

  return {
    rows,
    orderedEvents: positionedEvents,
    eventsById,
    gapMarkers,
    yearMarkers,
    width,
    height: maxCardBottom + bottomPad,
    leftPad,
    rightPad,
  }
}

function connectorPath(row, nextRow, leftPad, rightPad) {
  const bend = 96

  if (row.direction === 'forward') {
    return `M ${rightPad} ${row.lineY} C ${rightPad + bend} ${row.lineY}, ${rightPad + bend} ${nextRow.lineY}, ${rightPad} ${nextRow.lineY}`
  }

  return `M ${leftPad} ${row.lineY} C ${leftPad - bend} ${row.lineY}, ${leftPad - bend} ${nextRow.lineY}, ${leftPad} ${nextRow.lineY}`
}

function getHorizontalAlign(event, width) {
  if (event.x < 220) {
    return 'start'
  }

  if (event.x > width - 220) {
    return 'end'
  }

  return 'center'
}

function HistoryTimeline({ events }) {
  const layout = useMemo(() => buildLayout(events), [events])
  const legendEntries = Object.entries(categoryLabels)
  const [activeId, setActiveId] = useState(null)
  const [timelineZoom, setTimelineZoom] = useState(1)
  const activeEvent = activeId ? layout.eventsById.get(activeId) ?? null : null
  const popupAlign =
    activeEvent == null
      ? null
      : getHorizontalAlign(activeEvent, layout.width)

  const popupStyle =
    activeEvent == null
      ? undefined
      : {
          left: `${(getEventAnchorX(activeEvent) / layout.width) * 100}%`,
          top: `${(activeEvent.dotY / layout.height) * 100}%`,
        }

  return (
    <div className="timeline-rail">
      <div className="timeline-poster">
        <div className="timeline-poster-head">
          <p>Timeline guide</p>
          <span>Hover cards for details.</span>
        </div>

        <div className="timeline-legend" aria-label="Timeline color legend">
          <div className="timeline-legend-row">
            {legendEntries.slice(0, 4).map(([category, label]) => (
              <div key={category} className="timeline-legend-item">
                <span
                  className="timeline-legend-dot"
                  style={{ backgroundColor: categoryColors[category] }}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="timeline-legend-row">
            {legendEntries.slice(4).map(([category, label]) => (
              <div key={category} className="timeline-legend-item">
                <span
                  className="timeline-legend-dot"
                  style={{ backgroundColor: categoryColors[category] }}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="timeline-legend-row timeline-legend-row-note">
            <div className="timeline-legend-item timeline-legend-note">
              <span className="timeline-legend-gap" aria-hidden="true" />
              <span>1 slash = about 2 years</span>
            </div>
          </div>
        </div>

        <div className="timeline-mobile-controls" aria-label="Timeline zoom controls">
          <button
            type="button"
            aria-label="Zoom timeline out"
            disabled={timelineZoom <= 0.85}
            onClick={() => setTimelineZoom((currentZoom) => Math.max(0.85, currentZoom - 0.15))}
          >
            −
          </button>
          <span aria-hidden="true">{Math.round(timelineZoom * 100)}%</span>
          <button
            type="button"
            aria-label="Zoom timeline in"
            disabled={timelineZoom >= 1.45}
            onClick={() => setTimelineZoom((currentZoom) => Math.min(1.45, currentZoom + 0.15))}
          >
            +
          </button>
        </div>

        <div
          className="timeline-surface"
          onMouseLeave={() => setActiveId(null)}
        >
          <svg
            className="timeline-svg"
            style={{ '--timeline-mobile-zoom': timelineZoom }}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="img"
            aria-label="Scaled Pokémon TCG history timeline with labeled events"
          >
            <defs>
              <linearGradient
                id="timelineStrokeGradient"
                gradientUnits="userSpaceOnUse"
                x1={layout.leftPad}
                y1="0%"
                x2={layout.rightPad}
                y2="0%"
              >
                <stop offset="0%" stopColor="#7a6af8" />
                <stop offset="48%" stopColor="#ff7e9b" />
                <stop offset="100%" stopColor="#58c6ef" />
              </linearGradient>
            </defs>

            {layout.rows.map((row, index) => (
              <g key={`line-${index}`}>
                <line
                  x1={layout.leftPad}
                  y1={row.lineY}
                  x2={layout.rightPad}
                  y2={row.lineY}
                  className="timeline-path-underlay"
                />
                <line
                  x1={layout.leftPad}
                  y1={row.lineY}
                  x2={layout.rightPad}
                  y2={row.lineY}
                  className="timeline-path-line"
                  stroke="url(#timelineStrokeGradient)"
                />
                {index < layout.rows.length - 1 ? (
                  <>
                    <path
                      d={connectorPath(
                        row,
                        layout.rows[index + 1],
                        layout.leftPad,
                        layout.rightPad,
                      )}
                      className="timeline-path-underlay"
                      fill="none"
                    />
                    <path
                      d={connectorPath(
                        row,
                        layout.rows[index + 1],
                        layout.leftPad,
                        layout.rightPad,
                      )}
                      className="timeline-path-line"
                      fill="none"
                      stroke="url(#timelineStrokeGradient)"
                    />
                  </>
                ) : null}
              </g>
            ))}

            {layout.yearMarkers.map((marker) => (
              <g key={`year-${marker.key}`} className="timeline-year-marker">
                <line
                  x1={marker.tickX}
                  y1={marker.lineY - 9}
                  x2={marker.tickX}
                  y2={marker.lineY + 9}
                  className="timeline-year-tick"
                />
                <text
                  x={marker.x}
                  y={marker.labelY}
                  textAnchor={marker.textAnchor}
                  className="timeline-row-year"
                >
                  {marker.year}
                </text>
              </g>
            ))}

            {layout.gapMarkers.map((marker) => (
              <g key={`gap-${marker.label}-${marker.x}`} className="timeline-gap-marker">
                <line
                  x1={marker.x - (marker.slashCount * 18 + 24) / 2}
                  y1={marker.lineY}
                  x2={marker.x + (marker.slashCount * 18 + 24) / 2}
                  y2={marker.lineY}
                  className="timeline-gap-dash"
                />
                {Array.from({ length: marker.slashCount }, (_, index) => {
                  const slashCenterX =
                    marker.x - ((marker.slashCount - 1) * 18) / 2 + index * 18

                  return (
                    <line
                      key={`${marker.label}-slash-${index}`}
                      x1={slashCenterX - 6}
                      y1={marker.lineY + 18}
                      x2={slashCenterX + 6}
                      y2={marker.lineY - 18}
                      className="timeline-gap-slash"
                    />
                  )
                })}
                <rect
                  x={marker.x - 66}
                  y={marker.labelY - 20}
                  width="132"
                  height="30"
                  rx="15"
                  className="timeline-gap-pill"
                />
                <text
                  x={marker.x}
                  y={marker.labelY}
                  textAnchor="middle"
                  className="timeline-gap-text"
                >
                  {marker.label}
                </text>
              </g>
            ))}

            <g className="timeline-stem-layer" aria-hidden="true">
              {layout.orderedEvents.map((event) => {
                const stemY2 =
                  event.labelSide === 'below'
                    ? event.cardY
                    : event.cardY + 76

                return (
                  <path
                    key={`stem-${event.id}`}
                    d={stemPath(event, stemY2)}
                    className="timeline-stem"
                    fill="none"
                  />
                )
              })}
            </g>

            {layout.orderedEvents.map((event) => {
              const isActive = activeEvent?.id === event.id
              const anchorX = getEventAnchorX(event)
              const textX = event.cardCenterX
              const dateY = event.cardY + 22
              const firstLineY = event.cardY + 44

              return (
                <g
                  key={event.id}
                  className={`timeline-event${isActive ? ' is-active' : ''}`}
                  role="button"
                  tabIndex="0"
                  aria-label={`${event.date}: ${event.title}`}
                  onMouseEnter={() => setActiveId(event.id)}
                  onFocus={() => setActiveId(event.id)}
                  onClick={() => setActiveId(event.id)}
                  onKeyDown={(entryEvent) => {
                    if (
                      entryEvent.key === 'Enter' ||
                      entryEvent.key === ' '
                    ) {
                      entryEvent.preventDefault()
                      setActiveId(event.id)
                    }
                  }}
                >
                  <line
                    x1={anchorX}
                    y1={event.lineY}
                    x2={anchorX}
                    y2={event.dotY}
                    className="timeline-dot-pin"
                  />
                  <circle
                    cx={anchorX}
                    cy={event.dotY}
                    r="22"
                    className="timeline-hit-area"
                  />
                  {isActive ? (
                    <circle
                      cx={anchorX}
                      cy={event.dotY}
                      r="18"
                      className="timeline-dot-halo"
                    />
                  ) : null}
                  <circle
                    cx={anchorX}
                    cy={event.dotY}
                    r="12"
                    className="timeline-dot-ring"
                  />
                  <circle
                    cx={anchorX}
                    cy={event.dotY}
                    r={isActive ? '8.5' : '7.5'}
                    className="timeline-node-core"
                    fill={categoryColors[event.category]}
                  />

                  <rect
                    x={event.cardX}
                    y={event.cardY}
                    width={event.cardWidth}
                    height="76"
                    rx="22"
                    className={isActive ? 'timeline-card-box active' : 'timeline-card-box'}
                  />
                  <text
                    x={textX}
                    y={dateY}
                    textAnchor="middle"
                    className="timeline-card-date"
                  >
                    {event.date}
                  </text>
                  {event.titleLines.map((line, lineIndex) => (
                    <text
                      key={`${event.id}-${lineIndex}`}
                      x={textX}
                      y={firstLineY + lineIndex * 20}
                      textAnchor="middle"
                      className="timeline-card-title"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )
            })}
          </svg>

          {activeEvent ? (
            <article
              className={`timeline-popup side-${activeEvent.popupSide} align-${popupAlign}`}
              style={popupStyle}
              aria-live="polite"
            >
              <span
                className="timeline-popup-chip"
                style={{ backgroundColor: categoryColors[activeEvent.category] }}
              />
              <p className="timeline-popup-type">
                {categoryLabels[activeEvent.category]}
              </p>
              <p className="timeline-popup-date">{activeEvent.date}</p>
              <h3>{activeEvent.title}</h3>
              <p className="timeline-popup-copy">{activeEvent.body}</p>
            </article>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default HistoryTimeline
