
import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WheelData, WheelHistory, wheelCategories } from "@/types/userTypes";
import { getCategoryColor, getWheelDataForPastDays } from "@/utils/wheelOfLifeUtils";

interface ProgressChartProps {
  wheelHistory: WheelHistory;
}

const ProgressChart = ({ wheelHistory }: ProgressChartProps) => {
  const [days, setDays] = useState<number>(7);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(wheelCategories);

  useEffect(() => {
    const historyData = getWheelDataForPastDays(wheelHistory, days);
    
    // Format data for the chart
    const formattedData = historyData.map((entry) => {
      const dataPoint: { [key: string]: any } = {
        date: format(new Date(entry.date), "MMM dd"),
      };
      
      Object.entries(entry.data).forEach(([category, value]) => {
        dataPoint[category] = value;
      });
      
      return dataPoint;
    });
    
    setChartData(formattedData);
  }, [wheelHistory, days]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Progress Over Time</CardTitle>
        <Select
          value={days.toString()}
          onValueChange={(value) => setDays(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select days" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {wheelCategories.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                selectedCategories.includes(category)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
              style={{
                backgroundColor: selectedCategories.includes(category)
                  ? getCategoryColor(category)
                  : undefined,
                color: selectedCategories.includes(category)
                  ? "white"
                  : undefined,
              }}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 10]} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Legend />
                {wheelCategories.map((category) => (
                  selectedCategories.includes(category) && (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      name={category}
                      stroke={getCategoryColor(category)}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressChart;
