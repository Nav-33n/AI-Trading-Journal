export function formatNumber(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${formatNumber(value)}%`
}

export function formatRatio(value) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `1:${formatNumber(value)}`
}

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
