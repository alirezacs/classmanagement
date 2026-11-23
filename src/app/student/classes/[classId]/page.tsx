import { ClassWorkspace } from "@/components/class-workspace";
export default async function Page({ params }: { params: Promise<{ classId: string }> }) { const { classId } = await params; return <ClassWorkspace classId={classId} student />; }
