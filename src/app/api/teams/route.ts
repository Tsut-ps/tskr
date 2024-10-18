import { NextResponse } from "next/server";

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

export async function GET() {
  return NextResponse.json(
    {
      teams,
    },
    { status: 200 }
  );
}
