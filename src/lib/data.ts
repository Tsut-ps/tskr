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

export const tasks: Tasks = {
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

export const teams: Teams = [
  { id: "music", title: "音源班", tasks: 3 },
  { id: "band", title: "バンド班", tasks: 2 },
  { id: "video", title: "映像班", tasks: 4 },
  { id: "management", title: "マネジメント", tasks: 2 },
];
