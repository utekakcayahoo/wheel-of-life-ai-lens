
import { useState, useEffect } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WheelData } from "@/types/userTypes";
import { wheelDataToChartFormat, formatCategoryClass, getCategoryColor } from "@/utils/wheelOfLifeUtils";
import { generateWheelAnalysis } from "@/utils/apiUtils";

interface WheelOfLifeChartProps {
  wheelData: WheelData | null;
  username: string;
  date: Date;
}

const WheelOfLifeChart = ({ wheelData, username, date }: WheelOfLifeChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (wheelData) {
      setChartData(wheelDataToChartFormat(wheelData));
      
      setLoading(true);
      generateWheelAnalysis(wheelData, username)
        .then((result) => {
          setAnalysis(result);
        })
        .catch((error) => {
          console.error("Error generating analysis:", error);
          setAnalysis("Unable to generate analysis. Please try again later.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setChartData([]);
      setAnalysis("No data available for this date");
    }
  }, [wheelData, username]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          {username}'s Wheel of Life
          <div className="text-sm font-normal text-muted-foreground mt-1">
            {formatDate(date)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/2 h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                cx="50%"
                cy="50%"
                outerRadius="80%"
                data={chartData}
              >
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "var(--foreground)" }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
        <div className="w-full md:w-1/2">
          <h3 className="text-lg font-medium mb-2">Analysis</h3>
          {loading ? (
            <>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </>
          ) : (
            <div className="space-y-2 text-sm">
              {analysis ? (
                <p className="whitespace-pre-line">{analysis}</p>
              ) : (
                <p className="text-muted-foreground">
                  Analysis not available. Please try again later.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WheelOfLifeChart;
