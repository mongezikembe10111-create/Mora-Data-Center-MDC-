import { notFound } from "next/navigation";
import ParticipationDetail from "@/components/participation-detail";
import { civicNotices } from "@/lib/civic-data";

export function generateStaticParams() {
  return civicNotices.map((notice) => ({ id: notice.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = civicNotices.find((item) => item.id === id);
  return {
    title: notice?.title || "Participation notice unavailable",
    description: notice?.description,
  };
}

export default async function ParticipationNoticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = civicNotices.find((item) => item.id === id);
  if (!notice) notFound();
  return (
    <ParticipationDetail
      notice={notice}
      initialNow={new Date().toISOString()}
    />
  );
}
