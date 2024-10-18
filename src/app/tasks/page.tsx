import Link from "next/link";
import clsx from "clsx";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Teams = {
  id: string;
  title: string;
  tasks: number;
}[];

const teams: Teams = [
  { id: "music", title: "音源班", tasks: 3 },
  { id: "band", title: "バンド班", tasks: 2 },
  { id: "video", title: "映像班", tasks: 4 },
  { id: "management", title: "マネジメント", tasks: 2 },
];

type Task = {
  id: number;
  title: string;
  tags: string[];
  dueDate: number;
};

type Tasks = {
  [key: string]: Task[];
};

const tasks: Tasks = {
  music: [
    {
      id: 1,
      title: "「Remix It」音源確認",
      tags: ["#音源", "#制作"],
      dueDate: 0,
    },
    {
      id: 2,
      title: "「Re: 」音源制作",
      tags: ["#音源", "#制作"],
      dueDate: 8,
    },
    {
      id: 3,
      title: "「ねむねむ猫」音源二次提出",
      tags: ["#音源", "#制作"],
      dueDate: 28,
    },
  ],
  band: [
    {
      id: 4,
      title: "音源に関する事前アンケート",
      tags: ["#アンケート", "#全員向け"],
      dueDate: 2,
    },
    { id: 5, title: "「スタジオ」予約", tags: ["#予約"], dueDate: 8 },
  ],
  video: [
    {
      id: 6,
      title: "「Nothing?」背景映像確認",
      tags: ["#背景", "#チェック"],
      dueDate: 4,
    },
    {
      id: 7,
      title: "「Shut down」前面映像提出#1",
      tags: ["#前面", "#一次提出"],
      dueDate: 4,
    },
    {
      id: 8,
      title: "「Beat it」背景映像構想",
      tags: ["#背景", "#絵コンテ"],
      dueDate: 27,
    },
    {
      id: 9,
      title: "「足立区役所足立レイ」背景映像構想",
      tags: ["#背景", "#絵コンテ"],
      dueDate: 28,
    },
  ],
  management: [
    { id: 10, title: "放送委員会打ち合わせ", tags: ["#渉外"], dueDate: 1 },
    { id: 11, title: "文化祭委員会打ち合わせ", tags: ["#渉外"], dueDate: 1 },
  ],
};

export default function Page() {
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
