import { ClassWorkspace } from "@/components/class-workspace";
export default async function AdminClassSectionPage({ params }: { params: Promise<{ classId: string; section: string }> }) { const { classId, section } = await params; return <ClassWorkspace classId={classId} section={section} admin />; }
