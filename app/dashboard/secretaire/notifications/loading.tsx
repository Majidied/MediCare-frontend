import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card p-6">
            <Skeleton className="h-20" />
          </Card>
          <Card className="glass-card p-6">
            <Skeleton className="h-20" />
          </Card>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card p-6">
              <Skeleton className="h-32" />
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
