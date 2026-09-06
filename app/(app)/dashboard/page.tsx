// app/(app)/dashboard/page.tsx
import Link from "next/link"
import { Boxes, ClipboardList, Gauge, AlertTriangle } from "lucide-react"
import {
    StatCard, Panel, LivePill, Table, THead, TH, TBody, TR, TD,
    StatusBadge, Badge, EmptyState, buttonClass,
} from "@/components/ui"
import { getDashboardData, getCharts } from "./queries"
import { ProductionOutputChart } from "@/components/charts/production-output-chart"
import { YieldTrendChart } from "@/components/charts/yield-trend-chart"
import { formatCount, formatDA, formatPct, formatShortDate } from "@/lib/format"
import { Reveal } from "@/components/motion/reveal"
import { CountUp } from "@/components/motion/count-up"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
    const d = await getDashboardData()
    const charts = await getCharts()

    return (
        <div className="space-y-6">
            <Reveal className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Open Work Orders" icon={ClipboardList}
                    value={<CountUp value={Number(d.openWo.n)} />}
                    delta={`+${d.newWoWeek.n}`} deltaTone="up" note="new this week" />
                <StatCard label="Inventory on Hand" value={formatDA(d.onHand.total)} icon={Boxes}
                    note="total units in stock" />
                <StatCard label="Production Yield" icon={Gauge}
                    value={<CountUp value={d.yieldPct} decimals={1} suffix="%" />}
                    note="completed work orders" />
                <StatCard label="Late Orders" icon={AlertTriangle}
                    value={<CountUp value={Number(d.lateWo.n)} />}
                    delta={d.lateWo.n > 0 ? String(d.lateWo.n) : undefined} deltaTone="down" note="past due date" />
            </Reveal>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Production Output" subtitle="Planned vs actual units this week" action={<LivePill />}>
                    <ProductionOutputChart data={charts.output} />
                </Panel>
                <Panel title="Yield Trend" subtitle="Quality performance over 7 days">
                    <YieldTrendChart data={charts.yieldSeries} />
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Active Work Orders" subtitle="Planned & released"
                    action={<Link href="/work-orders" className={buttonClass({ variant: "ghost", size: "sm" })}>View all</Link>}>
                    {d.activeWorkOrders.length === 0 ? (
                        <EmptyState icon={ClipboardList} title="Nothing on the floor" description="Released work orders show up here." />
                    ) : (
                        <Table>
                            <THead><TH>WO / Item</TH><TH className="text-right">Qty</TH><TH>Status</TH></THead>
                            <TBody>
                                {d.activeWorkOrders.map((w) => (
                                    <TR key={w.id}>
                                        <TD>
                                            <Link href={`/work-orders/${w.id}`} className="text-ink hover:text-gold">{w.productName}</Link>
                                            <span className="block text-xs text-ink-faint">{w.productSku}</span>
                                        </TD>
                                        <TD align="right">{w.quantityPlanned}</TD>
                                        <TD><StatusBadge status={w.status} /></TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    )}
                </Panel>

                <Panel title="Recent Inventory" subtitle="Latest lots received"
                    action={<Link href="/lots" className={buttonClass({ variant: "ghost", size: "sm" })}>View all</Link>}>
                    {d.recentInventory.length === 0 ? (
                        <EmptyState icon={Boxes} title="No lots yet" description="Receive a purchase order to create stock." />
                    ) : (
                        <Table>
                            <THead><TH>Item / Lot</TH><TH>Type</TH><TH className="text-right">Qty</TH><TH>Date</TH></THead>
                            <TBody>
                                {d.recentInventory.map((l) => (
                                    <TR key={l.id}>
                                        <TD>{l.itemName}<span className="block text-xs text-ink-faint">{l.lotNumber}</span></TD>
                                        <TD><Badge tone="green">Receipt</Badge></TD>
                                        <TD align="right">{l.qty}</TD>
                                        <TD className="text-ink-muted">{formatShortDate(l.createdAt)}</TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    )}
                </Panel>
            </div>
        </div>
    )
}