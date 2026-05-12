/** @type {import('reshaped').ReshapedConfig} */
const config = {
  themes: {
    rosie: {
      color: {
        // Backgrounds
        backgroundPrimary: { hex: "#ffffff", hexDark: "#121d31" },
        backgroundSecondary: { hex: "#f4f5f8", hexDark: "#0b1220" },
        backgroundTertiary: { hex: "#eceef3", hexDark: "#111a2d" },

        // Foregrounds / text
        foregroundNeutral: { hex: "#1b1b22", hexDark: "#eef2fb" },
        foregroundMuted: { hex: "#555763", hexDark: "#c0cada" },
        foregroundDisabled: { hex: "#8e909b", hexDark: "#8994ab" },

        // Borders
        borderNeutral: { hex: "#dde1ea", hexDark: "#22324c" },

        // Primary accent (rose — used sparingly)
        backgroundPrimaryAlpha: { hex: "#f9edf0", hexDark: "#271d2c" },
        foregroundPrimary: { hex: "#8f5462", hexDark: "#f4c7d2" },
        borderPrimary: { hex: "#efd3da", hexDark: "#4b3345" },

        // Positive / success (green)
        backgroundPositive: { hex: "#e6f3ec", hexDark: "#11251d" },
        foregroundPositive: { hex: "#3d7a56", hexDark: "#70c38f" },
        borderPositive: { hex: "#b3d9c5", hexDark: "#1e4030" },

        // Warning / caution (amber)
        backgroundCaution: { hex: "#fdf0e0", hexDark: "#2c1f11" },
        foregroundCaution: { hex: "#a06820", hexDark: "#e4a45b" },
        borderCaution: { hex: "#f0d4a0", hexDark: "#4a3020" },

        // Critical / danger (red)
        backgroundCritical: { hex: "#fce8e8", hexDark: "#2b1319" },
        foregroundCritical: { hex: "#b03030", hexDark: "#ef7f8d" },
        borderCritical: { hex: "#f0b8b8", hexDark: "#4a2030" },

        // Informational (blue)
        backgroundInformative: { hex: "#e4eef8", hexDark: "#13233f" },
        foregroundInformative: { hex: "#2d64a0", hexDark: "#7eabff" },
        borderInformative: { hex: "#b0cce8", hexDark: "#1e3560" },
      },
    },
  },
};

module.exports = config;
