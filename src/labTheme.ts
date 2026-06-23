// Shared theme for all lab components — keeps colours consistent with the App shell.
export function getLabTheme(isDarkMode: boolean) {
  return isDarkMode ? {
    // Surfaces
    pageBg:       '#0d1117',
    cardBg:       '#161b22',
    panelBg:      '#1c2128',
    insetBg:      '#010409',
    // Borders
    border:       '1px solid #30363d',
    borderColor:  '#30363d',
    borderSubtle: '#21262d',
    // Text
    textPrimary:  '#e6edf3',
    textSecondary:'#8b949e',
    textMuted:    '#6e7681',
    // Accent / brand blue
    accent:       '#4493f8',
    accentSubtle: 'rgba(68,147,248,0.12)',
    // Semantic
    success:      '#3fb950',
    successSubtle:'rgba(63,185,80,0.12)',
    warning:      '#d29922',
    warningSubtle:'rgba(210,153,34,0.12)',
    danger:       '#f85149',
    dangerSubtle: 'rgba(248,81,73,0.12)',
    // Terminal
    termBg:       '#010409',
    termText:     '#3fb950',
    termMuted:    '#484f58',
    termBorder:   '#21262d',
  } : {
    pageBg:       '#f6f8fa',
    cardBg:       '#ffffff',
    panelBg:      '#f6f8fa',
    insetBg:      '#f6f8fa',
    border:       '1px solid #d0d7de',
    borderColor:  '#d0d7de',
    borderSubtle: '#e6eaef',
    textPrimary:  '#1f2328',
    textSecondary:'#636c76',
    textMuted:    '#8c959f',
    accent:       '#0969da',
    accentSubtle: 'rgba(9,105,218,0.08)',
    success:      '#1a7f37',
    successSubtle:'rgba(26,127,55,0.1)',
    warning:      '#9a6700',
    warningSubtle:'rgba(154,103,0,0.1)',
    danger:       '#cf222e',
    dangerSubtle: 'rgba(207,34,46,0.08)',
    termBg:       '#24292f',
    termText:     '#3fb950',
    termMuted:    '#6e7781',
    termBorder:   '#444c56',
  };
}

export type LabTheme = ReturnType<typeof getLabTheme>;
