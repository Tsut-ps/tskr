import { NewProject } from "./new";

export default async function Page() {
  return (
    // flex flex-1 flex-col gap-4 p-4 md:gap-6 md:py-8 max-w-screen-xl
    <main className="flex gap-4 p-4 md:gap-6 md:py-8 overflow-x-auto w-full h-[calc(100svh-4rem)] shadcn-scrollbar">
      <NewProject />
    </main>
  );
}
