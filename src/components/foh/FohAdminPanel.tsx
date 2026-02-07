import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Shield, Plus, Check, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PhaseType } from '@/types/foh';
import { getAvailableCategoriesForPhase } from './hooks/useFohPhase';
import { FohTaskItem } from './FohTaskItem';
import { useIsTablet } from '@/hooks/use-mobile';

interface FohAdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activePhase: PhaseType;
  userLocation: string;
  // Password
  passwordDialogOpen: boolean;
  setPasswordDialogOpen: (v: boolean) => void;
  passwordInput: string;
  setPasswordInput: (v: string) => void;
  onPasswordSubmit: () => void;
  // Templates
  templatesLoading: boolean;
  groupedTemplates: Record<string, { name: string; tasks: any[]; isActive: boolean; lastModified: string }> | undefined;
  onMakeActive: (name: string) => void;
  onOpenEditor: (name: string) => void;
  onDeleteTemplate: (name: string) => void;
  onNewTemplate: () => void;
  // Template editor
  templateEditorOpen: boolean;
  setTemplateEditorOpen: (v: boolean) => void;
  editingTemplate: any[];
  setEditingTemplate: (v: any) => void;
  editingTemplateName: string;
  deletedTemplateTaskIds: string[];
  setDeletedTemplateTaskIds: (v: any) => void;
  newTemplateTaskInput: string;
  setNewTemplateTaskInput: (v: string) => void;
  newTemplateTaskCategory: string;
  setNewTemplateTaskCategory: (v: string) => void;
  onAddTemplateTask: () => void;
  onSaveTemplateEdits: () => void;
  onTemplateDragEnd: (event: DragEndEvent) => void;
  // New template dialog
  newTemplateDialogOpen: boolean;
  setNewTemplateDialogOpen: (v: boolean) => void;
  newTemplateName: string;
  setNewTemplateName: (v: string) => void;
  onCreateNewTemplate: () => void;
}

export const FohAdminPanel = memo(function FohAdminPanel(props: FohAdminPanelProps) {
  const isTablet = useIsTablet();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const phaseLabel = props.activePhase === 'open' ? 'Openlijst' : props.activePhase === 'tussen' ? 'Tussenlijst' : 'Sluitlijst';

  // Use Drawer on iPad, Dialog on desktop
  const AdminWrapper = isTablet ? DrawerAdminPanel : DialogAdminPanel;

  return (
    <>
      {/* Password Dialog */}
      <Dialog open={props.passwordDialogOpen} onOpenChange={props.setPasswordDialogOpen}>
        <DialogContent className="bg-card border border-border rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Admin Toegang</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Voer wachtwoord in"
              value={props.passwordInput}
              onChange={(e) => props.setPasswordInput(e.target.value)}
              className="rounded-2xl"
              onKeyDown={(e) => { if (e.key === 'Enter') props.onPasswordSubmit(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { props.setPasswordDialogOpen(false); props.setPasswordInput(''); }} className="rounded-[20px]">
              Annuleren
            </Button>
            <Button onClick={props.onPasswordSubmit} className="rounded-[20px] bg-primary text-primary-foreground">
              Bevestigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Panel - Drawer on tablet, Dialog on desktop */}
      <AdminWrapper isOpen={props.isOpen} onClose={props.onClose}>
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 text-foreground">
            <Shield size={20} className="text-primary" />
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>

          <p className="text-sm text-muted-foreground">
            Beheer templates voor {phaseLabel}.
          </p>

          <Button onClick={props.onNewTemplate} className="rounded-[20px] bg-primary text-primary-foreground">
            <Plus size={16} className="mr-2" />
            Nieuwe Template
          </Button>

          {props.templatesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : props.groupedTemplates && Object.keys(props.groupedTemplates).length > 0 ? (
            <div className="flex flex-col gap-3">
              {Object.values(props.groupedTemplates).map(template => (
                <div key={template.name} className={`p-4 bg-muted rounded-xl ${template.isActive ? 'border-2 border-primary' : 'border border-border'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[15px] font-semibold text-foreground">{template.name}</h4>
                        {template.isActive && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary text-primary-foreground">
                            ACTIEF
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-muted-foreground mt-1">{template.tasks.length} taken</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!template.isActive && (
                      <Button size="sm" onClick={() => props.onMakeActive(template.name)} className="rounded-xl text-[13px] bg-primary text-primary-foreground">
                        <Check size={14} className="mr-1" /> Maak Actief
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => props.onOpenEditor(template.name)} className="rounded-xl text-[13px]">
                      <Pencil size={14} className="mr-1" /> Bewerk
                    </Button>
                    {!template.isActive && (
                      <Button size="sm" variant="outline" onClick={() => {
                        if (confirm(`Weet je zeker dat je template "${template.name}" wilt verwijderen?`)) {
                          props.onDeleteTemplate(template.name);
                        }
                      }} className="rounded-xl text-[13px] border-destructive text-destructive">
                        <Trash2 size={14} className="mr-1" /> Verwijder
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Geen templates gevonden
            </div>
          )}
        </div>
      </AdminWrapper>

      {/* New Template Dialog */}
      <Dialog open={props.newTemplateDialogOpen} onOpenChange={props.setNewTemplateDialogOpen}>
        <DialogContent className="bg-card border border-border rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nieuwe Template Aanmaken</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-[13px] font-medium text-foreground">Template Naam *</label>
            <Input value={props.newTemplateName} onChange={(e) => props.setNewTemplateName(e.target.value)} placeholder="Bijv. Zomer Openlijst" className="mt-1.5 rounded-2xl" />
            <p className="text-[13px] text-muted-foreground mt-2">
              De template wordt aangemaakt op basis van de huidige taken voor {phaseLabel}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { props.setNewTemplateDialogOpen(false); props.setNewTemplateName(''); }} className="rounded-[20px]">
              Annuleren
            </Button>
            <Button onClick={props.onCreateNewTemplate} className="rounded-[20px] bg-primary text-primary-foreground">
              Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Editor Dialog */}
      <Dialog open={props.templateEditorOpen} onOpenChange={props.setTemplateEditorOpen}>
        <DialogContent className="bg-card border border-border rounded-[20px] max-w-[650px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bewerk Template: {props.editingTemplateName}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={props.onTemplateDragEnd}>
              <SortableContext items={props.editingTemplate.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {props.editingTemplate.map(task => (
                  <FohTaskItem
                    key={task.id}
                    task={task as any}
                    isEditMode={true}
                    onTitleChange={(id, title) => props.setEditingTemplate((prev: any[]) => prev.map(t => t.id === id ? { ...t, title } : t))}
                    onDescriptionChange={(id, description) => props.setEditingTemplate((prev: any[]) => prev.map(t => t.id === id ? { ...t, description } : t))}
                    onEstimatedMinutesChange={(id, minutes) => props.setEditingTemplate((prev: any[]) => prev.map(t => t.id === id ? { ...t, estimated_minutes: minutes } : t))}
                    onDelete={(id) => props.setDeletedTemplateTaskIds((prev: string[]) => [...prev, id])}
                    isDeleted={props.deletedTemplateTaskIds.includes(task.id)}
                    showAdminTools={true}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add task */}
            <div className="pt-4 border-t border-border/30 mt-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Nieuwe taak toevoegen
                  </label>
                  <Input
                    value={props.newTemplateTaskInput}
                    onChange={(e) => props.setNewTemplateTaskInput(e.target.value)}
                    placeholder="Taaknaam..."
                    onKeyPress={(e) => { if (e.key === 'Enter') props.onAddTemplateTask(); }}
                    className="rounded-2xl"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Categorie
                  </label>
                  <Select value={props.newTemplateTaskCategory} onValueChange={props.setNewTemplateTaskCategory}>
                    <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getAvailableCategoriesForPhase(props.userLocation, props.activePhase).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={props.onAddTemplateTask} className="rounded-[20px] bg-primary text-primary-foreground min-w-[100px]">
                  <Plus size={16} className="mr-1" /> Toevoegen
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { props.setTemplateEditorOpen(false); props.setEditingTemplate([]); props.setDeletedTemplateTaskIds([]); }} className="rounded-[20px]">
              Annuleren
            </Button>
            <Button onClick={props.onSaveTemplateEdits} className="rounded-[20px] bg-primary text-primary-foreground">
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

// Drawer wrapper for iPad
function DrawerAdminPanel({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Admin Panel</DrawerTitle>
        </DrawerHeader>
        <div className="px-6 pb-6 overflow-y-auto">
          {children}
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose} className="rounded-[20px]">
            Sluiten
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Dialog wrapper for desktop
function DialogAdminPanel({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-card border border-border rounded-[20px] max-w-[650px] max-h-[90vh] overflow-hidden">
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="rounded-[20px]">
            Sluiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
