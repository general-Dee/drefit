import Skeleton from "./Skeleton"

// Page-shaped skeletons. Each mirrors the real layout's boxes and sizes so
// content swaps in without layout shift. Server-safe (no hooks).

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`page-shell ${className}`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  )
}

export function HeaderSkeleton({ eyebrow = true, action = false }: { eyebrow?: boolean; action?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-2">
        {eyebrow && <Skeleton className="h-4 w-24 rounded-md" />}
        <Skeleton className="h-[34px] w-56 rounded-lg md:h-[42px]" />
      </div>
      {action && <Skeleton className="h-11 w-40" />}
    </div>
  )
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>
          <Skeleton className="mt-3 h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <Shell className="space-y-6">
      <HeaderSkeleton action />
      <div className="surface flex items-center gap-5 p-5 sm:p-6">
        <Skeleton className="h-[88px] w-[88px] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>
      <StatGridSkeleton />
      <div className="surface space-y-4 p-4 sm:p-5">
        <Skeleton className="h-6 w-40 rounded-md" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-[76px]" />)}
        </div>
      </div>
    </Shell>
  )
}

export function WorkoutCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface flex h-[164px] flex-col justify-between p-5">
          <div className="space-y-2">
            <div className="flex justify-between gap-3"><Skeleton className="h-5 w-3/5 rounded-md" /><Skeleton className="h-6 w-20 rounded-full" /></div>
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function WorkoutsSkeleton() {
  return (
    <Shell className="space-y-6">
      <HeaderSkeleton />
      <Skeleton className="h-11 w-full" />
      <WorkoutCardsSkeleton />
    </Shell>
  )
}

export function WorkoutDetailSkeleton() {
  return (
    <Shell className="max-w-2xl">
      <Skeleton className="mb-5 h-5 w-16 rounded-md" />
      <Skeleton className="h-[34px] w-3/4 rounded-lg md:h-[42px]" />
      <div className="mt-3 flex gap-2">
        {[64, 64, 80, 56].map((w, i) => <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />)}
      </div>
      <div className="surface mt-6 space-y-3 p-4">
        <Skeleton className="h-3 w-40 rounded-md" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="mt-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[76px]" />)}
      </div>
    </Shell>
  )
}

export function ProgressSkeleton() {
  return (
    <Shell className="space-y-6">
      <HeaderSkeleton />
      <StatGridSkeleton />
      <div className="surface p-4 sm:p-5">
        <div className="mb-4 flex justify-between"><Skeleton className="h-6 w-24 rounded-md" /><Skeleton className="h-4 w-40 rounded-md" /></div>
        <Skeleton className="h-72 w-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <Skeleton className="h-[68px]" /><Skeleton className="h-[68px]" />
      </div>
    </Shell>
  )
}

export function DietSkeleton() {
  return (
    <Shell className="space-y-6">
      <HeaderSkeleton />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-[92px] shrink-0" />)}
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[112px]" />)}
      </div>
    </Shell>
  )
}

export function ReferralsSkeleton() {
  return (
    <Shell className="max-w-2xl space-y-6">
      <HeaderSkeleton />
      <div className="surface space-y-4 p-5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-11 w-full" />
        <div className="flex gap-2"><Skeleton className="h-11 w-32" /><Skeleton className="h-11 w-40" /></div>
      </div>
      <StatGridSkeleton count={2} />
    </Shell>
  )
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5"><Skeleton className="h-4 w-28 rounded-md" /><Skeleton className="h-3 w-16 rounded-md" /></div>
          </div>
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function CommunitySkeleton() {
  return (
    <Shell className="max-w-2xl space-y-6">
      <HeaderSkeleton />
      <Skeleton className="h-[148px] w-full" />
      <FeedSkeleton />
    </Shell>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[["w-2/3", "justify-start"], ["w-1/2", "justify-end"], ["w-3/5", "justify-start"]].map(([w, j], i) => (
        <div key={i} className={`flex ${j}`}><Skeleton className={`h-14 ${w} rounded-2xl`} /></div>
      ))}
    </div>
  )
}

export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-[68px]" />)}
    </div>
  )
}

export function AdminSkeleton() {
  return (
    <Shell className="space-y-6">
      <HeaderSkeleton />
      <StatGridSkeleton count={3} />
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[76px]" />)}
      </div>
    </Shell>
  )
}

export function AdminListSkeleton() {
  return (
    <Shell className="max-w-4xl space-y-6">
      <Skeleton className="h-5 w-28 rounded-md" />
      <HeaderSkeleton eyebrow={false} action />
      <ListRowsSkeleton />
    </Shell>
  )
}

export function FormSkeleton() {
  return (
    <Shell className="max-w-2xl space-y-6">
      <Skeleton className="h-5 w-28 rounded-md" />
      <HeaderSkeleton eyebrow={false} />
      <div className="surface space-y-4 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5"><Skeleton className="h-3 w-24 rounded-md" /><Skeleton className="h-11 w-full" /></div>
        ))}
      </div>
    </Shell>
  )
}

export function SettingsSkeleton() {
  return (
    <Shell className="max-w-2xl space-y-6">
      <HeaderSkeleton />
      {[132, 76, 220, 120].map((h, i) => <Skeleton key={i} className="w-full" style={{ height: h }} />)}
    </Shell>
  )
}

export function CoachingSkeleton() {
  return (
    <Shell className="max-w-3xl space-y-6">
      <HeaderSkeleton action />
      <div className="surface h-[420px] overflow-hidden"><ChatSkeleton /></div>
      <Skeleton className="h-12 w-full" />
    </Shell>
  )
}
