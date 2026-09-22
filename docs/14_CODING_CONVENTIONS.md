# FloodWay — Coding Conventions

## Language & Framework

- **TypeScript** for all frontend code (strict mode via `tsconfig.app.json`)
- **React 19** with functional components only (no class components)
- **Python 3** for backend (FastAPI + type hints)

## File Naming

| Type | Convention | Example |
|---|---|---|
| Pages | PascalCase + "Page" suffix | `HomePage.tsx`, `ShelterPage.tsx` |
| Components | PascalCase | `IoTWidget.tsx`, `BottomNav.tsx` |
| Hooks | camelCase + "use" prefix | `useBluetooth.ts`, `useCamera.ts` |
| Services | camelCase + "Service" suffix | `floodService.ts`, `reportsService.ts` |
| Utils | camelCase | `pathfinding.ts`, `aiVerification.ts` |
| Types | camelCase | `app.ts`, `report.ts`, `flood.ts` |
| CSS | Same name as component | `ReportPage.css`, `ReportForm.css` |

## Component Patterns

### State Management
```typescript
// Global state: React Context + useCallback
export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>({...});
    const doSomething = useCallback(() => { ... }, [deps]);
    return <AppContext.Provider value={{...state, doSomething}}>{children}</AppContext.Provider>;
}

// Consumer hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
}
```

### Optimistic Updates
```typescript
// 1. Update local state immediately
setState(prev => ({ ...prev, items: [newItem, ...prev.items] }));
// 2. Persist to Firestore (fire-and-forget)
saveToFirestore(newItem).catch(console.error);
```

### Export Pattern
- Pages: Named exports (`export function HomePage()`)
- Hooks: Named exports (`export function useBluetooth()`)
- Types: Named exports with `as const` for enums
- No default exports except `App.tsx`

## Styling

### Primary: Tailwind CSS v4
```typescript
// Use Tailwind classes directly
<div className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-3xl" />
```

### Class Merging
```typescript
import { cn } from '@/lib/utils';
<div className={cn("base-classes", isActive && "active-classes")} />
```

### Component Variants (shadcn/ui)
```typescript
import { cva } from 'class-variance-authority';
const buttonVariants = cva("base", { variants: { ... } });
```

### Inline Styles
Used in 3D simulation and complex animations where Tailwind is insufficient:
```typescript
<div style={{ background: cfg.riskBg, borderColor: cfg.riskBorder }} />
```

### Separate CSS Files
Used for complex report components: `ReportForm.css`, `ModeratorPanel.css`, etc.

## Path Aliases

```typescript
// @/ maps to ./src/
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
```

## Type Definitions

### Enums as const objects (not TypeScript enums)
```typescript
export const ReportCategory = {
    RISING_WATER: 'RISING_WATER',
    BLOCKED_ROAD: 'BLOCKED_ROAD',
} as const;
export type ReportCategory = (typeof ReportCategory)[keyof typeof ReportCategory];
```

### Interface naming
- No `I` prefix: `FloodReport`, not `IFloodReport`
- Props: Inline or `{ children: ReactNode }`
- State: Suffix with `State`: `AppState`, `CameraState`

## Firebase Patterns

### Document reads
```typescript
const snap = await getDocs(collection(db, COLLECTION));
const reports = snap.docs.map(d => docToReport(d.id, d.data()));
```

### Idempotent writes (seed data)
```typescript
await setDoc(doc(db, COLLECTION, fixedId), data, { merge: false });
```

### User-submitted writes
```typescript
const ref = await addDoc(collection(db, COLLECTION), report);
```

## Console Logging

Use emoji prefixes for log categories:
```typescript
console.log('📌 [Store] Adding flood report:', {...});
console.log('🗑️ [Moderator] Hiding report:', reportId);
console.log('🚨 [IoT] Danger detected...');
console.log('🔍 [AI Verification] Golden Record:', {...});
```

## Comments

- Use `// Comment` for inline explanations
- Use `/** JSDoc */` for public functions in services/utils
- Use ASCII box art for module headers (see `SimulationPage.tsx`)
- Section dividers: `// ─── Section Name ──────────────`

## Error Handling

- Services: try/catch with console.warn, return fallback data
- UI: Show error state or silently degrade
- Firebase: Always have offline fallback (seed data)
- OSRM: Fallback to bezier curve route
- Gemini: Fallback to `mockAnalysis()`
