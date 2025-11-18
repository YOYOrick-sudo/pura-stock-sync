import { FohTasks } from '@/components/foh/FohTasks';
import { SidebarLayout } from '@/components/SidebarLayout';

export default function FohModule() {
  return (
    <SidebarLayout>
      <FohTasks />
    </SidebarLayout>
  );
}
