# MediArca Mobile App Design System (Apple HIG)

The MediArca Mobile App adheres strictly to Apple Human Interface Guidelines (HIG) calibrated for Android (Google Play Store) and iOS platforms. It translates the museum-gallery aesthetic of the web platform (`DESIGN.md`) into a tactile, high-density, touch-optimized mobile experience.

---

## 1. Core Philosophy: The Single Action Color Rule

1. **One Interactive Color**: Action Blue (`#0066cc`) is reserved exclusively for interactive elements — primary action buttons, active tab indicators, selected radio chips, and key links. No other color competes for user intent.
2. **True Black UI Frame**: Chrome recedes so patient and clinical health data take center stage.
3. **Alternating Canvas Rhythm**: Clean alternation between Pure White (`#ffffff`) and Parchment Canvas (`#f5f5f7`) creates card separation without heavy drop shadows.
4. **Zero Decorative Gradients**: Surfaces are flat, opaque, or frosted glass (`rgba(255,255,255,0.85)` with blur).
5. **No Ambiguity in Status**: Clinic cabin status, token order, and appointment progression use unambiguous, high-contrast semantic chips.

---

## 2. Color Palette & Tokens

### Primary & Interactive Colors
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `primary` | `#0066cc` | Main brand color, primary CTA buttons, selected states |
| `primary-hover` / `focus` | `#0071e3` | Active/pressed state on primary buttons |
| `primary-light` | `#e6f0fa` | Subtle chip backgrounds, active tab background tint |
| `primary-dark` | `#004c99` | Pressed state on dark canvas |

### Canvas & Surface Colors
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `canvas-pure` | `#ffffff` | Clean background for inputs, modal sheets, and pure white cards |
| `canvas-parchment` | `#f5f5f7` | Default screen background canvas (Apple system gray 6) |
| `surface-pearl` | `#fafafc` | Sub-surface panel background |
| `surface-card` | `#ffffff` | Elevated card container with hairline border |
| `surface-dark-tile` | `#1c1c1e` | Dark mode and contrast badges (e.g. queue token cards) |

### Typography & Ink
| Token Name | Hex Code | Contrast / Usage |
| :--- | :--- | :--- |
| `ink` | `#1d1d1f` | Primary body and headline text (high contrast, 14:1) |
| `ink-muted-80` | `#3a3a3c` | Secondary labels, table headers |
| `ink-muted-48` | `#8e8e93` | Placeholder text, captions, timestamps |
| `ink-white` | `#ffffff` | Text on Action Blue buttons or dark token badges |

### Semantic State Colors
| Semantic State | Hex Code | Soft Background | Usage |
| :--- | :--- | :--- | :--- |
| **In Cabin / Completed / Success** | `#34c759` | `#eafaf1` | Doctor in cabin, token called, consultation finished |
| **Stepped Out / Pending** | `#ff9500` | `#fff8eb` | Doctor stepped out, arrival pending, awaiting verification |
| **Not In Cabin / Cancelled** | `#ff3b30` | `#feeceb` | Doctor absent, pass cancelled, token missed |
| **Hairline Border** | `#e5e5ea` | N/A | 1px clean separators and card borders |

---

## 3. Touch Target & Accessibility Guidelines

- **44x44pt Minimum Touch Target**: Every button, tab icon, toggle, and clickable chip has a hit box of at least 44x44 physical points (`minHeight: 44`, `minWidth: 44`) to eliminate touch fatigue and accidental mis-clicks.
- **Full Pill Action Buttons**: All primary action buttons use full pill rounding (`borderRadius: 9999`) with 16pt vertical padding, 24pt horizontal padding, and bold 16pt text.
- **Tactile Pressed Feedback**: Buttons scale subtly down (`transform: [{ scale: 0.98 }]`) or reduce opacity (`activeOpacity={0.85}`) on press.
- **Safe Area Insets**: Every screen respects top status bar notches and bottom home indicator gestures using `react-native-safe-area-context`.
- **Keyboard Dismissal & Avoiding**: All input screens are wrapped with `KeyboardAvoidingView` (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`) and dismiss on touch.

---

## 4. Typography Hierarchy

| Style Role | Font Size | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Large Title` | 32pt | 700 (Bold) | 38pt | -0.4pt | Screen headers, Live Token numbers |
| `Title 1` | 24pt | 600 (Semibold) | 30pt | -0.3pt | Section titles, Doctor Names |
| `Title 2` | 20pt | 600 (Semibold) | 26pt | -0.2pt | Modal headers, Card group titles |
| `Body Bold` | 16pt | 600 (Semibold) | 22pt | -0.1pt | Button text, Key metrics |
| `Body Regular` | 16pt | 400 (Regular) | 22pt | 0pt | Main description, consultation details |
| `Subheadline` | 14pt | 500 (Medium) | 20pt | 0pt | Doctor specialty, Clinic address |
| `Caption` | 12pt | 400 (Regular) | 16pt | +0.2pt | Timestamps, IST disclaimers, microcopy |

---

## 5. Mobile Navigation Philosophy

The mobile app implements a role-adaptive navigation architecture mirroring MediArca's web design:
1. **Patient Flow**:
   - `Find Doctors` (Discovery carousel, debounced search, cabin badges)
   - `My Passes` (Live Queue Pass, radar countdown, arrival QR scanner)
   - `History` (Past consultations, prescriptions, receipts)
   - `Profile` (Health details, emergency contacts, Google Play compliant account deletion)
2. **Doctor Console**:
   - `Live Queue` (OPD queue state machine, atomic Next Patient caller)
   - `Cabin Toggle` (Sticky status: `IN_CABIN`, `STEPPED_OUT` with return time, `NOT_IN_CABIN`)
   - `Schedule` (Shift hours, weekly practice discs, daily leave toggles)
3. **Receptionist Desk**:
   - `Counter Queue` (Multi-doctor waiting list, arrival check-in)
   - `Approvals` (One-tap UPI/Cash payment confirmation & token generator)
   - `Walk-In` (Instant token creation for offline patients)
