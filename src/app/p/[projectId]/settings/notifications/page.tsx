import { Separator } from "@/components/ui/separator";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">通知</h3>
        <p className="text-sm text-muted-foreground">
          通知の設定を変更します。
        </p>
      </div>
      <Separator />
    </div>
  );
}
