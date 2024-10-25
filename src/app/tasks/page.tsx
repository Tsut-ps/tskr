import Link from "next/link";
import clsx from "clsx";
import { headers } from "next/headers";

import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Task = {
  id: number;
  title: string;
  tags: string[];
  dueDate: number;
};

type Tasks = {
  [key: string]: Task[];
};

type Teams = {
  id: string;
  title: string;
  tasks: number;
}[];

export default async function Page() {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = headers().get("host");

  async function getTeams() {
    const res = await fetch(`${protocol}://${host}/api/teams`);
    const data = await res.json();
    const teams: Teams = data.teams;
    return teams;
  }
  async function getTasks() {
    const res = await fetch(`${protocol}://${host}/api/tasks`);
    const data = await res.json();
    const tasks: Tasks = data.tasks;
    return tasks;
  }

  const teams = await getTeams();
  const tasks = await getTasks();

  const getDateColor = (dueDate: number) => {
    if (dueDate <= 0) return "text-red-500";
    if (dueDate <= 3) return "text-yellow-500";
    return "";
  };

  return (
    <main className="flex gap-4 p-4 md:gap-6 md:py-8 overflow-x-auto w-full scrollbar-hide">
      {teams.map((team) => (
        <div key={team.id} className="w-96 flex-none">
          <div className="flex flex-row items-center p-3">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">
                {team.title}
              </CardTitle>
              <CardDescription>{team.tasks}件のタスク</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                新規
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-2">
            {tasks[team.id]?.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium leading-none py-1">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div
                      className={clsx("ml-auto", getDateColor(task.dueDate))}
                    >
                      残り{task.dueDate}日
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
