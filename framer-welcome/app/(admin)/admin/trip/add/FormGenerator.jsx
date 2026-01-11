"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELD_TYPES = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "radio", label: "Radio" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "file", label: "File" },
  { value: "email", label: "Email" },
];

function generateId() {
  return crypto.randomUUID();
}

function DragHandle({ id }) {
  const { attributes, listeners } = useSortable({ id });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="size-8 cursor-grab text-muted-foreground hover:bg-transparent active:cursor-grabbing"
    >
      <GripVerticalIcon className="size-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function SortableFieldRow({ field, onUpdate, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
        isDragging ? "z-10 opacity-80 shadow-lg" : ""
      }`}
    >
      <DragHandle id={field.id} />

      <div className="flex-1">
        <Input
          placeholder="Field name"
          value={field.name}
          onChange={(e) => onUpdate(field.id, { name: e.target.value })}
          className="h-9"
        />
      </div>

      <div className="w-40">
        <Select
          value={field.type}
          onValueChange={(value) => onUpdate(field.id, { type: value })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(field.id)}
      >
        <Trash2Icon className="size-4" />
        <span className="sr-only">Delete field</span>
      </Button>
    </div>
  );
}

export function FormGenerator() {
  const [fields, setFields] = React.useState([]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const sortableId = React.useId();

  const fieldIds = React.useMemo(() => fields.map((f) => f.id), [fields]);

  const addField = () => {
    const newField = {
      id: generateId(),
      name: "",
      type: "short_text",
      sortOrder: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, updates) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const deleteField = (id) => {
    setFields(
      fields
        .filter((field) => field.id !== id)
        .map((field, index) => ({ ...field, sortOrder: index }))
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setFields((currentFields) => {
        const oldIndex = fieldIds.indexOf(active.id);
        const newIndex = fieldIds.indexOf(over.id);
        const reorderedFields = arrayMove(currentFields, oldIndex, newIndex);
        return reorderedFields.map((field, index) => ({
          ...field,
          sortOrder: index,
        }));
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-6 py-4">
        <h2 className="text-lg font-semibold">Form Fields</h2>
        <Button onClick={addField} size="sm">
          <PlusIcon className="mr-2 size-4" />
          Add Field
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {fields.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No fields added yet
              </p>
              <Button
                onClick={addField}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                <PlusIcon className="mr-2 size-4" />
                Add your first field
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <SortableContext
              items={fieldIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {fields.map((field) => (
                  <SortableFieldRow
                    key={field.id}
                    field={field}
                    onUpdate={updateField}
                    onDelete={deleteField}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Debug: Show current fields state (remove in production) */}
      {fields.length > 0 && (
        <div className="border-t bg-muted/30 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Fields State (Debug):
          </p>
          <pre className="text-xs text-muted-foreground">
            {JSON.stringify(
              fields.map(({ id, name, type, sortOrder }) => ({
                id: id.slice(0, 8) + "...",
                name,
                type,
                sortOrder,
              })),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
