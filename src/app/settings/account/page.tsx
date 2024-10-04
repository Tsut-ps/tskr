import { Separator } from "@/components/ui/separator";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">アカウント</h3>
        <p className="text-sm text-muted-foreground">
          アカウントの設定を変更します。
        </p>
      </div>
      <Separator />
    </div>
  );
}
