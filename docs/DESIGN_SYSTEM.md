# Syphon v1.0.0 Design System

## Core Principles
- **Shadcn Simplicity**: Clean, accessible components
- **Data-First**: Financial information is primary
- **Visual Hierarchy**: Clear distinction between labels, values, and helper text
- **Semantic Colors**: Colors convey meaning

---

## Typography

### Labels (Section Headers)
```tsx
<p className="text-xs text-neutral-400 tracking-wider uppercase">
  Current Balance
</p>
```
- **Size**: text-xs
- **Color**: text-neutral-400
- **Style**: uppercase + tracking-wider
- **Use**: Card headers, stat labels, section titles

### Values (Primary Data)
```tsx
<p className="text-2xl font-bold font-mono text-white">
  £2,450
</p>
```
- **Size**: text-2xl (can scale: text-xl, text-3xl)
- **Font**: font-mono (for numbers), regular for text
- **Weight**: font-bold
- **Color**: Semantic (white/orange/red based on context)
- **Use**: Financial amounts, primary statistics

### Helper Text (Context)
```tsx
<p className="text-xs text-neutral-500">
  Until payday
</p>
```
- **Size**: text-xs
- **Color**: text-neutral-500
- **Use**: Additional context, units, explanations

---

## Color Semantics

### Financial Data Colors
```tsx
// Positive / Income / Savings
className="text-white"           // Default positive
className="text-green-500"       // Explicit gain (optional)

// Expense / Warning / Attention
className="text-orange-500"      // Expenses, projections

// Negative / Debt / Danger
className="text-red-500"         // Negative balance, overdue

// Neutral / Labels
className="text-neutral-400"     // Labels
className="text-neutral-500"     // Helper text
```

### Dynamic Color Logic
```tsx
// Balance display
<p className={`text-2xl font-bold font-mono ${
  balance >= 0 ? "text-white" : "text-red-500"
}`}>
  £{balance.toLocaleString()}
</p>
```

---

## Card Patterns

### Stat Card (Standard)
```tsx
<Card className="bg-neutral-900 border-neutral-700">
  <CardContent>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-neutral-400 tracking-wider">
          CURRENT BALANCE
        </p>
        <p className="text-2xl font-bold font-mono text-white">
          £2,450
        </p>
        <p className="text-xs text-neutral-500">
          Available to spend
        </p>
      </div>
      <PoundSterling className="w-8 h-8 text-white" />
    </div>
  </CardContent>
</Card>
```

### Wide Card (Hero/Greeting)
```tsx
<Card className="bg-neutral-900 border-neutral-700 md:col-span-2 lg:col-span-4">
  <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div className="space-y-1">
      <p className="text-xs text-neutral-400 tracking-wider">WELCOME</p>
      <p className="text-2xl font-semibold">
        Hi, {name} — Here is your snapshot.
      </p>
    </div>
    <div className="text-xs text-neutral-500 max-w-sm md:text-right">
      Contextual information or call to action
    </div>
  </CardContent>
</Card>
```

### Data Card (with visualization)
```tsx
<Card className="bg-neutral-900 border-neutral-700">
  <CardHeader>
    <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
      INCOME VS EXPENSES
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 text-sm">
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-neutral-400">Monthly Income</span>
        <span className="text-white font-mono">£2,500</span>
      </div>
      <div className="w-full bg-neutral-800 h-3">
        <div className="bg-white h-3" style={{ width: "100%" }} />
      </div>
    </div>
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-neutral-400">Monthly Expenses</span>
        <span className="text-orange-500 font-mono">£1,800</span>
      </div>
      <div className="w-full bg-neutral-800 h-3">
        <div className="bg-orange-500 h-3" style={{ width: "72%" }} />
      </div>
    </div>
  </CardContent>
</Card>
```

---

## Progress Bars

### Standard Progress Bar
```tsx
<div className="w-full bg-neutral-800 h-3">
  <div
    className="bg-white h-3"
    style={{ width: `${percentage}%` }}
  />
</div>
```

### Colored Progress Bar
```tsx
// Use semantic colors
className="bg-white"       // Savings/Goals
className="bg-orange-500"  // Expenses
className="bg-red-500"     // Debt/Overdue
```

---

## Icons

### Icon Sizing & Positioning
```tsx
// Stat card icon (right side)
<Icon className="w-8 h-8 text-white" />

// List item icon
<Icon className="w-4 h-4 text-neutral-400" />

// Navigation icon
<Icon className="w-5 h-5" />
```

### Icon Colors (Semantic)
- **White**: Neutral/positive stats
- **Orange**: Expenses, warnings
- **Red**: Negative, debt
- **Neutral-400**: Inactive states

---

## Spacing & Layout

### Card Padding
```tsx
<CardContent>           // Default padding from shadcn
<CardContent className="py-8">  // Extra vertical for hero cards
<CardContent className="">       // Minimal/custom padding
```

### Grid Layouts
```tsx
// Dashboard stat grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Two-column split
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// Three-column secondary
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

---

## Loading States

### Skeleton Pattern
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-neutral-700 w-1/4 mb-2"></div>
  <div className="h-8 bg-neutral-700 w-1/2"></div>
</div>
```

---

## Best Practices

### DO ✅
- Use monospace font for all financial numbers
- Use uppercase + tracking for labels
- Color-code financial data semantically
- Include helper text for context
- Pair icons with statistics
- Use consistent card patterns

### DON'T ❌
- Mix rounded and straight borders
- Use orange for positive values
- Use inconsistent text sizes for same data type
- Forget loading states
- Clutter with unnecessary decorations

---

## Example Component

### Transaction Card
```tsx
<Card className="bg-neutral-900 border-neutral-700">
  <CardContent className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-neutral-800 flex items-center justify-center">
        <ShoppingBag className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">Groceries</p>
        <p className="text-xs text-neutral-500">
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg font-mono font-bold text-orange-500">
        -£45.20
      </p>
      <p className="text-xs text-neutral-500">Food & Drink</p>
    </div>
  </CardContent>
</Card>
```
