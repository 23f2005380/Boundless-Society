"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  Trash2Icon,
  SaveIcon,
  Loader2Icon,
  GripVerticalIcon,
  XIcon,
} from "lucide-react";
import * as yup from "yup";
import { toast } from "sonner";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const tripSchema = yup.object().shape({
  name: yup.string().required("Trip name is required").trim(),
  description: yup.string().trim(),
  coordinators: yup
    .array()
    .of(yup.string().trim())
    .test(
      "at-least-one",
      "At least one coordinator is required",
      (value) => value && value.some((c) => c && c.trim() !== "")
    ),
  totalSeats: yup
    .number()
    .typeError("Total seats must be a number")
    .required("Total seats is required")
    .positive("Total seats must be greater than 0")
    .integer("Total seats must be a whole number"),
  femaleReservedSeats: yup
    .number()
    .typeError("Female reserved seats must be a number")
    .required("Female reserved seats is required")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number"),
  releasedSeats: yup
    .number()
    .typeError("Released seats must be a number")
    .required("Released seats is required")
    .min(0, "Cannot be negative")
    .integer("Must be a whole number"),
  releasedSeatsType: yup
    .string()
    .oneOf(["female_only", "all"], "Invalid type")
    .required(),
  formFields: yup
    .array()
    .min(1, "At least one form field is required")
    .test("valid-fields", "Each form field must have a name", (value) =>
      value.every((f) => f.name && f.name.trim() !== "")
    )
    .test(
      "radio-select-options",
      "Radio and Select fields must have at least one option",
      (value) =>
        value.every((f) => {
          if (f.type === "radio" || f.type === "select") {
            return (
              f.options &&
              f.options.length > 0 &&
              f.options.some((opt) => opt && opt.trim() !== "")
            );
          }
          return true;
        })
    ),
});

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

function SortableFieldRow({ field, onUpdate, onDelete, hasError }) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showOptions = field.type === "radio" || field.type === "select";
  const options = field.options || [];

  const addOption = () => {
    onUpdate(field.id, { options: [...options, ""] });
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onUpdate(field.id, { options: newOptions });
  };

  const removeOption = (index) => {
    if (options.length > 1) {
      onUpdate(field.id, { options: options.filter((_, i) => i !== index) });
    }
  };

  const handleTypeChange = (newType) => {
    const updates = { type: newType };
    if (newType === "radio" || newType === "select") {
      if (!field.options || field.options.length === 0) {
        updates.options = [""];
      }
    } else {
      updates.options = undefined;
    }
    onUpdate(field.id, updates);
  };

  const hasOptionsError =
    hasError &&
    showOptions &&
    (!options.length || !options.some((opt) => opt && opt.trim() !== ""));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card p-3 ${
        isDragging ? "z-10 opacity-80 shadow-lg" : ""
      } ${hasError ? "border-destructive" : ""}`}
    >
      <div className="flex items-center gap-3">
        <DragHandle id={field.id} />

        <div className="flex-1">
          <Input
            placeholder="Field name"
            value={field.name}
            onChange={(e) => onUpdate(field.id, { name: e.target.value })}
            className={`h-9 ${
              hasError && !field.name ? "border-destructive" : ""
            }`}
          />
        </div>

        <div className="w-40">
          <Select value={field.type} onValueChange={handleTypeChange}>
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

      {showOptions && (
        <div className="ml-11 mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Options</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addOption}
              className="h-7 gap-1 text-xs"
            >
              <PlusIcon className="size-3" />
              Add Option
            </Button>
          </div>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={`h-8 text-sm ${
                    hasOptionsError && !option ? "border-destructive" : ""
                  }`}
                />
                {options.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {hasOptionsError && (
            <p className="text-xs text-destructive">
              At least one option is required
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AddTripPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    coordinators: [""],
    totalSeats: "",
    femaleReservedSeats: "",
    releasedSeats: "",
    releasedSeatsType: "all",
    femaleJoined: 0,
    totalJoined: 0,
  });

  const [formFields, setFormFields] = React.useState([
    { id: generateId(), name: "", type: "short_text", sortOrder: 0 },
  ]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const sortableId = React.useId();
  const fieldIds = React.useMemo(
    () => formFields.map((f) => f.id),
    [formFields]
  );

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const addCoordinator = () => {
    setFormData((prev) => ({
      ...prev,
      coordinators: [...prev.coordinators, ""],
    }));
  };

  const updateCoordinator = (index, value) => {
    setFormData((prev) => {
      const newCoordinators = [...prev.coordinators];
      newCoordinators[index] = value;
      return { ...prev, coordinators: newCoordinators };
    });
    if (errors.coordinators) {
      setErrors((prev) => ({ ...prev, coordinators: undefined }));
    }
  };

  const removeCoordinator = (index) => {
    if (formData.coordinators.length > 1) {
      setFormData((prev) => ({
        ...prev,
        coordinators: prev.coordinators.filter((_, i) => i !== index),
      }));
    }
  };

  const addFormField = () => {
    const newField = {
      id: generateId(),
      name: "",
      type: "short_text",
      sortOrder: formFields.length,
    };
    setFormFields([...formFields, newField]);
    if (errors.formFields) {
      setErrors((prev) => ({ ...prev, formFields: undefined }));
    }
  };

  const updateFormField = (id, updates) => {
    setFormFields(
      formFields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
    if (errors.formFields) {
      setErrors((prev) => ({ ...prev, formFields: undefined }));
    }
  };

  const deleteFormField = (id) => {
    if (formFields.length > 1) {
      setFormFields(
        formFields
          .filter((field) => field.id !== id)
          .map((field, index) => ({ ...field, sortOrder: index }))
      );
    } else {
      toast.error("At least one form field is required");
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setFormFields((currentFields) => {
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

  const handleSaveTrip = async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      const dataToValidate = {
        ...formData,
        formFields,
      };

      await tripSchema.validate(dataToValidate, { abortEarly: false });

      const response = await fetch("/api/trip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToValidate),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setErrors(data.details);
          toast.error("Validation failed", {
            description: "Please fix the errors and try again",
          });
        } else {
          throw new Error(data.error || "Failed to save trip");
        }
        return;
      }

      toast.success("Trip created successfully!", {
        description: `Trip ID: ${data.tripId}`,
      });

      router.push("/admin/trip");
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const validationErrors = {};
        error.inner.forEach((err) => {
          if (err.path) {
            validationErrors[err.path] = err.message;
          }
        });
        setErrors(validationErrors);
        toast.error("Please fix the validation errors", {
          description: "Some required fields are missing or invalid",
        });
      } else {
        toast.error("Failed to save trip", {
          description: error.message || "Please try again",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">Add New Trip</h1>
        <Button onClick={handleSaveTrip} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <SaveIcon className="mr-2 size-4" />
          )}
          Save Trip
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Basic Trip Data Section */}
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Basic Trip Data</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter trip name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Enter trip description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Coordinators</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addCoordinator}
                  className="h-8 gap-1 text-sm"
                >
                  <PlusIcon className="size-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {formData.coordinators.map((coordinator, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder={`Coordinator ${index + 1}`}
                      value={coordinator}
                      onChange={(e) => updateCoordinator(index, e.target.value)}
                      className={
                        errors.coordinators ? "border-destructive" : ""
                      }
                    />
                    {formData.coordinators.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCoordinator(index)}
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.coordinators && (
                <p className="text-sm text-destructive">
                  {errors.coordinators}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalSeats">Total Seats</Label>
                <Input
                  id="totalSeats"
                  type="number"
                  placeholder="0"
                  value={formData.totalSeats}
                  onChange={(e) => updateField("totalSeats", e.target.value)}
                  className={errors.totalSeats ? "border-destructive" : ""}
                />
                {errors.totalSeats && (
                  <p className="text-sm text-destructive">
                    {errors.totalSeats}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="femaleReservedSeats">
                  Female Reserved Seats
                </Label>
                <Input
                  id="femaleReservedSeats"
                  type="number"
                  placeholder="0"
                  value={formData.femaleReservedSeats}
                  onChange={(e) =>
                    updateField("femaleReservedSeats", e.target.value)
                  }
                  className={
                    errors.femaleReservedSeats ? "border-destructive" : ""
                  }
                />
                {errors.femaleReservedSeats && (
                  <p className="text-sm text-destructive">
                    {errors.femaleReservedSeats}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releasedSeats">Released Seats</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="releasedSeats"
                  type="number"
                  placeholder="0"
                  value={formData.releasedSeats}
                  onChange={(e) => updateField("releasedSeats", e.target.value)}
                  className={`max-w-32 ${
                    errors.releasedSeats ? "border-destructive" : ""
                  }`}
                />
                <div className="flex items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="releasedSeatsType"
                      value="female_only"
                      checked={formData.releasedSeatsType === "female_only"}
                      onChange={(e) =>
                        updateField("releasedSeatsType", e.target.value)
                      }
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm">Female Only</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="releasedSeatsType"
                      value="all"
                      checked={formData.releasedSeatsType === "all"}
                      onChange={(e) =>
                        updateField("releasedSeatsType", e.target.value)
                      }
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm">All</span>
                  </label>
                </div>
              </div>
              {errors.releasedSeats && (
                <p className="text-sm text-destructive">
                  {errors.releasedSeats}
                </p>
              )}
            </div>
          </section>

          {/* Form Fields Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Form Fields</h2>
              <Button onClick={addFormField} size="sm" variant="outline">
                <PlusIcon className="mr-2 size-4" />
                Add Field
              </Button>
            </div>

            {errors.formFields && (
              <p className="text-sm text-destructive">{errors.formFields}</p>
            )}

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
                  {formFields.map((field) => (
                    <SortableFieldRow
                      key={field.id}
                      field={field}
                      onUpdate={updateFormField}
                      onDelete={deleteFormField}
                      hasError={!!errors.formFields}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        </div>
      </div>
    </div>
  );
}
