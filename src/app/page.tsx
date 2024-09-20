import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle,
  SquarePen,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-8 max-w-screen-xl">
      <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <Card x-chunk="dashboard-01-chunk-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未完了</CardTitle>
            <SquarePen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">なるはやで</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">進行中</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">もくもく</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">期限切れ</CardTitle>
            <TriangleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
            <p className="text-xs text-muted-foreground">再調整しよう!</p>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              完了したタスク
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">32</div>
            <p className="text-xs text-muted-foreground">やったー!</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-2">
        <Card x-chunk="dashboard-01-chunk-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">
                残り日数が短いタスク
              </CardTitle>
              <CardDescription>一週間以内 X 件</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                確認
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  ｢Remix it｣音源確認
                </p>
                <p className="text-sm text-muted-foreground">#音源 #確認</p>
              </div>
              <div className="ml-auto text-red-600">期限切れ!</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  音源に関する事前アンケート
                </p>
                <p className="text-sm text-muted-foreground">
                  #アンケート #全員向け
                </p>
              </div>
              <div className="ml-auto">残り2日</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  ｢Nothing?｣背景映像確認
                </p>
                <p className="text-sm text-muted-foreground">#背景 #チェック</p>
              </div>
              <div className="ml-auto">残り4日</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  ｢Shut down!｣前面映像提出#1
                </p>
                <p className="text-sm text-muted-foreground">#前面 #一次提出</p>
              </div>
              <div className="ml-auto">残り4日</div>
            </div>
          </CardContent>
        </Card>
        <Card x-chunk="dashboard-01-chunk-5">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-medium">
                関係あるタスク
              </CardTitle>
              <CardDescription>｢XX｣ での絞り込み結果</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="#">
                絞り込み
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  ｢Shut down!｣背景映像構想
                </p>
                <p className="text-sm text-muted-foreground">#映像 #背景</p>
              </div>
              <div className="ml-auto">残り4日</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  放送委員会 打ち合わせ
                </p>
                <p className="text-sm text-muted-foreground">#渉外</p>
              </div>
              <div className="ml-auto">残り8日</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  ｢Nothing?｣背景映像確認
                </p>
                <p className="text-sm text-muted-foreground">#音源 #確認</p>
              </div>
              <div className="ml-auto">残り21日</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}