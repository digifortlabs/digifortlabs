import { Skeleton } from "./skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 w-full">
      {/* Sidebar Skeleton (hidden on mobile, visible on lg) */}
      <div className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-950 p-4">
        {/* Logo Area */}
        <div className="h-14 flex items-center mb-6">
          <Skeleton className="h-8 w-10 rounded bg-slate-800" />
          <Skeleton className="h-6 w-32 ml-3 bg-slate-800" />
        </div>
        
        {/* Nav Links */}
        <div className="space-y-3 mt-4 flex-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-5 w-5 rounded bg-slate-800" />
              <Skeleton className="h-4 w-3/4 bg-slate-800" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Navbar Skeleton */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
          {/* Mobile menu button skeleton */}
          <Skeleton className="h-8 w-8 lg:hidden bg-slate-200" />
          
          <div className="hidden lg:flex items-center gap-4">
            <Skeleton className="h-5 w-48 bg-slate-200" />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Skeleton className="h-8 w-8 rounded-full bg-slate-200" />
            <Skeleton className="h-8 w-32 rounded-full bg-slate-200" />
          </div>
        </header>

        {/* Page Content Skeleton */}
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {/* Header Row */}
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 bg-slate-200" />
              <Skeleton className="h-4 w-64 bg-slate-200" />
            </div>
            <Skeleton className="h-10 w-32 bg-slate-200 hidden sm:block" />
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-slate-200" />
                  <Skeleton className="h-8 w-8 rounded-full bg-slate-200" />
                </div>
                <Skeleton className="h-8 w-24 bg-slate-200" />
              </div>
            ))}
          </div>
          
          {/* Main Chart / Table Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 h-96 flex flex-col">
              <Skeleton className="h-6 w-48 mb-4 bg-slate-200" />
              <Skeleton className="flex-1 w-full bg-slate-100 rounded-lg" />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 h-96 flex flex-col">
              <Skeleton className="h-6 w-32 mb-4 bg-slate-200" />
              <div className="space-y-4 flex-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full bg-slate-200" />
                      <Skeleton className="h-3 w-2/3 bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
