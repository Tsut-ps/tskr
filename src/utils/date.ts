import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

/** サーバーがUST使用時も日本時間の日付を取得 */
const jstNowDate = new Date().toLocaleDateString("ja-JP", {
  timeZone: "Asia/Tokyo",
});
const nowDate = new Date(jstNowDate);

/** 開始日が未来のタスクかを判定 */
export const isFutureTask = (startDate: string) => {
  const jstStartDate = new Date(startDate).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const start = new Date(jstStartDate);
  return start.getTime() > nowDate.getTime();
};

/** 期限切れのタスクかを判定 */
export const isExpiredTask = (dueDate: string) => {
  const jstDueDate = new Date(dueDate).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const due = new Date(jstDueDate);
  return due.getTime() < nowDate.getTime();
};

/** 完了したタスクかを判定 */
export const isCompletedTask = (status: string) => status === "closed";

/** 期限切れまでの日数を計算 */
export const calcDaysLeft = (dueDate: string) => {
  // サーバーがUST使用時も日本時間の日付で計算
  const jstDueDate = new Date(dueDate).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  const due = new Date(jstDueDate);
  const diffTime = due.getTime() - nowDate.getTime(); // 差分時間(ミリ秒)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/** 期限切れまでの日数に応じて文字色を変更 */
export const getDateColor = (dueDate: string, status?: string) => {
  const daysLeft = calcDaysLeft(dueDate);
  if (status === "closed") return "text-green-600";
  if (daysLeft <= 0) return "text-red-500";
  if (daysLeft <= 7) return "text-yellow-500";
  return "";
};

/** タスクの作成日時と更新日時をフォーマット */
export const formatTaskDate = (createdAt: string, updatedAt: string) => {
  const createdDate = parseISO(createdAt);
  const updatedDate = parseISO(updatedAt);

  // 同じ場合は更新がないと判定
  const isSameDate = createdDate.getTime() === updatedDate.getTime();

  const createdTime = format(createdDate, "PPP(E) HH:mm", {
    locale: ja,
  });

  const updatedTime = format(updatedDate, "PPP(E) HH:mm", {
    locale: ja,
  });

  return { createdTime, updatedTime, isSameDate };
};
