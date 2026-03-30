"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  status: string;
  count: number;
}

interface LeadStatusChartProps {
  data: ChartData[];
}

const COLORS = ["var(--brand-primary)", "#0891b2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function LeadStatusChart({ data }: LeadStatusChartProps) {
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-gray-900 tracking-tight">
          Lead Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="status" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                interval={0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <Tooltip 
                cursor={{ fill: "#f8fafc" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-3 text-[12px]">
                        <p className="font-bold text-gray-900 mb-1">{payload[0].payload.status}</p>
                        <p className="text-[var(--brand-primary)] font-semibold">{payload[0].value} Leads</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[6, 6, 0, 0]}
                barSize={40}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
