import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function DashboardOverview() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight">Welcome to EaseIT CRM</h1>
      <p className="text-muted-foreground">This is your unified dashboard. Future modules will be built here.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold italic text-primary/50 shrink-0 select-none">Ready 🚀</div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="min-h-[400px] border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
          <div className="bg-primary/5 text-primary p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          </div>
          <p className="font-semibold text-foreground">Clean Slate Initialized</p>
          <p className="text-sm max-w-xs text-center mt-1">
            Build your feature-specific modules here for a more modular experience.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
