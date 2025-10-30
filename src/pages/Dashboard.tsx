import React, { useEffect, useState } from "react";
import {
  Grid,
  Paper,
  Text,
  Group,
  Title,
  Box,
  RingProgress,
  Divider,
  Loader,
  Center,
} from "@mantine/core";
import {
  IconBriefcase,
  IconUsers,
  IconFileText,
  IconUserCircle,
} from "@tabler/icons-react";
import { LineChart } from "@mantine/charts";
import dayjs from "dayjs";

import { getJobs, getCandidates, getAllAssessments } from "../api";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobs: 0,
    candidates: 0,
    assessments: 0,
    recruiters: 5,
  });
  const [jobsTrend, setJobsTrend] = useState<{ date: string; Jobs: number }[]>(
    []
  );

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, candidatesRes, assessmentsRes] = await Promise.all([
          getJobs({
            page: 1,
            pageSize: 1000,
            search: "",
            status: "all",
            tags: [],
          }),
          getCandidates({ stage: "all" }),
          getAllAssessments(),
        ]);

        // ---- Stats ----
        setStats({
          jobs: jobsRes.totalCount,
          candidates: candidatesRes.length,
          assessments: assessmentsRes.length,
          recruiters: 5,
        });

        // ---- Jobs trend (grouped by month) ----
        const counts: Record<string, number> = {};
        jobsRes.jobs.forEach((job) => {
          const month = dayjs(job.date).format("MMM YYYY");
          counts[month] = (counts[month] || 0) + 1;
        });

        const trendData = Object.entries(counts)
          .map(([date, count]) => ({ date, Jobs: count }))
          .sort(
            (a, b) =>
              dayjs(a.date, "MMM YYYY").unix() -
              dayjs(b.date, "MMM YYYY").unix()
          );

        setJobsTrend(trendData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      title: "Active Jobs",
      value: stats.jobs,
      icon: (
        <IconBriefcase
          size={28}
          stroke={1.6}
          color="var(--mantine-color-blue-4)"
        />
      ),
      color: "blue",
    },
    {
      title: "Candidates",
      value: stats.candidates,
      icon: (
        <IconUsers
          size={28}
          stroke={1.6}
          color="var(--mantine-color-green-4)"
        />
      ),
      color: "green",
    },
    {
      title: "Assessments",
      value: stats.assessments,
      icon: (
        <IconFileText
          size={28}
          stroke={1.6}
          color="var(--mantine-color-yellow-4)"
        />
      ),
      color: "yellow",
    },
    {
      title: "Recruiters",
      value: stats.recruiters,
      icon: (
        <IconUserCircle
          size={28}
          stroke={1.6}
          color="var(--mantine-color-pink-4)"
        />
      ),
      color: "pink",
    },
  ];

  return (
    <Box bg="dark.7" style={{ minHeight: "100vh", padding: "2rem" }}>
      <Title order={2} mb="lg" c="gray.0">
        Dashboard Overview
      </Title>

      {loading ? (
        <Center mt="xl">
          <Loader color="blue" size="lg" />
        </Center>
      ) : (
        <>
          {/* Stat Cards */}
          <Grid gutter="lg">
            {statCards.map((stat, i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
                <Paper
                  shadow="md"
                  radius="md"
                  p="lg"
                  bg="dark.8"
                  style={{
                    border: "1px solid var(--mantine-color-dark-5)",
                    transition: "transform 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-4px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <Group justify="space-between" mb="md">
                    {stat.icon}
                    <RingProgress
                      size={60}
                      roundCaps
                      thickness={6}
                      sections={[{ value: 75, color: stat.color }]}
                    />
                  </Group>

                  <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                    {stat.title}
                  </Text>

                  <Text fw={700} size="xl" c="gray.0">
                    {stat.value}
                  </Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>

          {/* Activity Overview */}
          <Divider my="xl" color="dark.5" />

          <Paper
            p="xl"
            radius="md"
            shadow="lg"
            bg="dark.8"
            style={{ border: "1px solid var(--mantine-color-dark-5)" }}
          >
            <Title order={4} c="gray.0" mb="sm">
              Activity Overview
            </Title>

            {jobsTrend.length === 0 ? (
              <Text c="dimmed">No recent job activity found.</Text>
            ) : (
              <LineChart
                h={300}
                data={jobsTrend}
                dataKey="date"
                series={[{ name: "Jobs", color: "blue.5" }]}
                curveType="natural"
                withLegend
                withTooltip
                gridAxis="xy"
              />
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
