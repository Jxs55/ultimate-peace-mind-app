"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Brain,
  Sparkles,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  LayoutGrid,
  Kanban,
  ArrowLeft,
  FileText,
  LinkIcon,
  Calendar,
} from "lucide-react"

interface Subtask {
  id: string
  text: string
  completed: boolean
}

interface TaskInfo {
  id: string
  title: string
  content: string
  type: "note" | "link" | "document"
  url?: string
}

interface Task {
  id: string
  text: string
  category: string
  priority: "high" | "medium" | "low"
  status: "todo" | "in-progress" | "done"
  createdAt: Date
  dueDate?: Date
  notes?: string
  description?: string
  subtasks?: Subtask[]
  information?: TaskInfo[]
}

export default function HomePage() {
  const [brainDump, setBrainDump] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentView, setCurrentView] = useState<"brain-dump" | "task-list" | "kanban" | "task-detail">("brain-dump")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const viewTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setCurrentView("task-detail")
  }

  const handleBrainDump = async () => {
    if (!brainDump.trim()) return

    setIsProcessing(true)

    try {
      const response = await fetch("/api/classify-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: brainDump }),
      })

      if (!response.ok) {
        throw new Error("Failed to classify tasks")
      }

      // Handle streaming response from Grok AI
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk
        }
      }

      // Parse the AI response and create tasks
      try {
        // Extract JSON from the response (AI might include extra text)
        const jsonMatch = fullResponse.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const aiTasks = JSON.parse(jsonMatch[0])

          const newTasks: Task[] = aiTasks.map((aiTask: any, index: number) => ({
            id: (Date.now() + index).toString(),
            text: aiTask.title || aiTask.text || "Tarea sin título",
            category: aiTask.category || "General",
            priority: aiTask.priority === "alta" ? "high" : aiTask.priority === "baja" ? "low" : "medium",
            status: "todo" as const,
            createdAt: new Date(),
            notes: aiTask.notes || `Esfuerzo estimado: ${aiTask.effort || "No especificado"}`,
            description: aiTask.notes || "",
            subtasks: [],
            information: [],
          }))

          setTasks((prev) => [...prev, ...newTasks])
          setBrainDump("")
          setCurrentView("task-list")
        } else {
          // Fallback if JSON parsing fails
          throw new Error("Could not parse AI response")
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError)
        // Fallback to creating a single task with the original text
        const fallbackTask: Task = {
          id: Date.now().toString(),
          text: brainDump,
          category: "General",
          priority: "medium",
          status: "todo",
          createdAt: new Date(),
          notes: "Procesado manualmente - la IA no pudo clasificar automáticamente",
          description: "",
          subtasks: [],
          information: [],
        }
        setTasks((prev) => [...prev, fallbackTask])
        setBrainDump("")
        setCurrentView("task-list")
      }
    } catch (error) {
      console.error("Error processing brain dump:", error)
      // Fallback to manual processing
      const fallbackTask: Task = {
        id: Date.now().toString(),
        text: brainDump,
        category: "General",
        priority: "medium",
        status: "todo",
        createdAt: new Date(),
        notes: "Error en procesamiento IA - creado manualmente",
        description: "",
        subtasks: [],
        information: [],
      }
      setTasks((prev) => [...prev, fallbackTask])
      setBrainDump("")
      setCurrentView("task-list")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text: taskData.text || "",
      category: taskData.category || "General",
      priority: taskData.priority || "medium",
      status: "todo",
      createdAt: new Date(),
      notes: taskData.notes || "",
      description: taskData.description || "",
      subtasks: [],
      information: [],
    }
    setTasks((prev) => [...prev, newTask])
    setIsDialogOpen(false)
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)))
    setEditingTask(null)
    setIsDialogOpen(false)
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null)
      setCurrentView("task-list")
    }
  }

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const statusOrder: Task["status"][] = ["todo", "in-progress", "done"]
          const currentIndex = statusOrder.indexOf(task.status)
          const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
          const updatedTask = { ...task, status: nextStatus }
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask)
          }
          return updatedTask
        }
        return task
      }),
    )
  }

  const addSubtask = (taskId: string, subtaskText: string) => {
    const newSubtask: Subtask = {
      id: Date.now().toString(),
      text: subtaskText,
      completed: false,
    }

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            subtasks: [...(task.subtasks || []), newSubtask],
          }
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask)
          }
          return updatedTask
        }
        return task
      }),
    )
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            subtasks: task.subtasks?.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
            ),
          }
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask)
          }
          return updatedTask
        }
        return task
      }),
    )
  }

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            subtasks: task.subtasks?.filter((subtask) => subtask.id !== subtaskId),
          }
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask)
          }
          return updatedTask
        }
        return task
      }),
    )
  }

  const addInformation = (taskId: string, info: Omit<TaskInfo, "id">) => {
    const newInfo: TaskInfo = {
      id: Date.now().toString(),
      ...info,
    }

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            information: [...(task.information || []), newInfo],
          }
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask)
          }
          return updatedTask
        }
        return task
      }),
    )
  }

  const deleteInformation = (taskId: string, infoId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedTask = {
            ...task,
            information: task.information?.filter((info) => info.id !== infoId),
          }
          if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(updatedTask)
          }
          return updatedTask
        }
        return task
      }),
    )
  }

  const getTasksByCategory = () => {
    const categories = Array.from(new Set(tasks.map((task) => task.category)))
    return categories.map((category) => ({
      category,
      tasks: tasks.filter((task) => task.category === category),
    }))
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Universidad: "bg-primary text-primary-foreground",
      "Aprender a Manejar": "bg-secondary text-secondary-foreground",
      Cocinar: "bg-accent text-accent-foreground",
      Programación: "bg-chart-2 text-white",
    }
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-accent text-accent-foreground"
      case "low":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case "in-progress":
        return <Circle className="w-4 h-4 text-blue-600 fill-current" />
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("text/plain")
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const getTasksByStatus = () => {
    const statuses: Task["status"][] = ["todo", "in-progress", "done"]
    return statuses.map((status) => ({
      status,
      tasks: tasks
        .filter((task) => task.status === status)
        .sort((a, b) => {
          // Sort by priority: high -> medium -> low
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }),
    }))
  }

  const getStatusTitle = (status: Task["status"]) => {
    switch (status) {
      case "todo":
        return "Por Hacer"
      case "in-progress":
        return "En Progreso"
      case "done":
        return "Completadas"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">MindFlow</h1>
                <p className="text-sm text-muted-foreground">Organiza tu mente, alcanza tus metas</p>
              </div>
            </div>
            {currentView !== "task-detail" ? (
              <div className="flex items-center gap-2">
                <Button
                  variant={currentView === "brain-dump" ? "default" : "outline"}
                  onClick={() => setCurrentView("brain-dump")}
                  size="sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Brain Dump
                </Button>
                <Button
                  variant={currentView === "task-list" ? "default" : "outline"}
                  onClick={() => setCurrentView("task-list")}
                  size="sm"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Tareas ({tasks.length})
                </Button>
                <Button
                  variant={currentView === "kanban" ? "default" : "outline"}
                  onClick={() => setCurrentView("kanban")}
                  size="sm"
                >
                  <Kanban className="w-4 h-4 mr-2" />
                  Kanban ({tasks.length})
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setCurrentView("task-list")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Tareas
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {currentView === "brain-dump" ? (
          <>
            {/* Brain Dump Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Volcado Mental
                </CardTitle>
                <CardDescription>
                  Escribe todo lo que tienes en mente. La IA lo organizará automáticamente en tareas estructuradas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Ejemplo: Necesito inscribirme en la universidad, buscar los documentos, estudiar para el examen de admisión, conseguir el dinero para la matrícula. También quiero aprender a manejar y practicar cocina básica..."
                  value={brainDump}
                  onChange={(e) => setBrainDump(e.target.value)}
                  className="min-h-32 resize-none bg-input border-border focus:ring-ring"
                />
                <Button
                  onClick={handleBrainDump}
                  disabled={!brainDump.trim() || isProcessing}
                  className="w-full sm:w-auto"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Organizar con IA
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Empty State */}
            {tasks.length === 0 && !isProcessing && (
              <Card className="text-center py-12">
                <CardContent>
                  <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">¡Comienza tu volcado mental!</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Escribe todas las ideas, tareas y proyectos que tienes en mente. La IA los organizará
                    automáticamente en categorías y prioridades.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : currentView === "task-detail" && selectedTask ? (
          <>
            <TaskDetailView
              task={selectedTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleStatus={toggleTaskStatus}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onDeleteSubtask={deleteSubtask}
              onAddInformation={addInformation}
              onDeleteInformation={deleteInformation}
              getCategoryColor={getCategoryColor}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          </>
        ) : currentView === "kanban" ? (
          <>
            {/* Kanban Board View */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Vista Kanban</h2>
                <p className="text-muted-foreground">Arrastra las tareas entre columnas para cambiar su estado</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTask(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </DialogTrigger>
                <TaskDialog
                  task={editingTask}
                  onSave={editingTask ? (updates) => handleUpdateTask(editingTask.id, updates) : handleCreateTask}
                />
              </Dialog>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getTasksByStatus().map(({ status, tasks: statusTasks }) => (
                <div
                  key={status}
                  className={`rounded-lg border-2 border-dashed p-4 min-h-96 ${getStatusColor(status)}`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg text-foreground">{getStatusTitle(status)}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {statusTasks.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move group"
                        onClick={() => viewTaskDetail(task)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p
                            className={`text-sm font-medium flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : "text-card-foreground"}`}
                          >
                            {task.text}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTask(task)
                                setIsDialogOpen(true)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTask(task.id)
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(task.category)} variant="outline">
                              {task.category}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(task.priority)}>
                              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                            </Badge>
                          </div>
                        </div>

                        {task.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{task.notes}</p>}
                      </div>
                    ))}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Arrastra tareas aquí</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {tasks.length === 0 && (
              <Card className="text-center py-12 mt-8">
                <CardContent>
                  <Kanban className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No hay tareas para mostrar</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Crea tareas manualmente o usa el volcado mental para generar tareas automáticamente.
                  </p>
                  <Button onClick={() => setCurrentView("brain-dump")} variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ir al Brain Dump
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Task Management Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Gestión de Tareas</h2>
                <p className="text-muted-foreground">Organiza y gestiona todas tus tareas</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTask(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </DialogTrigger>
                <TaskDialog
                  task={editingTask}
                  onSave={editingTask ? (updates) => handleUpdateTask(editingTask.id, updates) : handleCreateTask}
                />
              </Dialog>
            </div>

            {/* Tasks by Category */}
            {getTasksByCategory().map(({ category, tasks: categoryTasks }) => (
              <Card key={category} className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Badge className={getCategoryColor(category)}>{category}</Badge>
                      <span className="text-sm text-muted-foreground">({categoryTasks.length})</span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                        onClick={() => viewTaskDetail(task)}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleTaskStatus(task.id)
                            }}
                            className="mt-0.5 hover:scale-110 transition-transform"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <div className="flex-1 space-y-2">
                            <p
                              className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : "text-card-foreground"}`}
                            >
                              {task.text}
                            </p>
                            {task.notes && <p className="text-xs text-muted-foreground">{task.notes}</p>}
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                                {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(task.status)}>
                                {task.status === "todo"
                                  ? "Por hacer"
                                  : task.status === "in-progress"
                                    ? "En progreso"
                                    : "Completada"}
                              </Badge>
                              {task.subtasks && task.subtasks.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length} subtareas
                                </Badge>
                              )}
                              {task.information && task.information.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {task.information.length} recursos
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingTask(task)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTask(task.id)
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {tasks.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <LayoutGrid className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No hay tareas aún</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    Comienza creando una nueva tarea o usa el volcado mental para generar tareas automáticamente.
                  </p>
                  <Button onClick={() => setCurrentView("brain-dump")} variant="outline">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ir al Brain Dump
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function TaskDetailView({
  task,
  onUpdateTask,
  onDeleteTask,
  onToggleStatus,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddInformation,
  onDeleteInformation,
  getCategoryColor,
  getPriorityColor,
  getStatusColor,
}: {
  task: Task
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
  onDeleteTask: (taskId: string) => void
  onToggleStatus: (taskId: string) => void
  onAddSubtask: (taskId: string, text: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onAddInformation: (taskId: string, info: Omit<TaskInfo, "id">) => void
  onDeleteInformation: (taskId: string, infoId: string) => void
  getCategoryColor: (category: string) => string
  getPriorityColor: (priority: string) => string
  getStatusColor: (status: Task["status"]) => string
}) {
  const [newSubtask, setNewSubtask] = useState("")
  const [newInfo, setNewInfo] = useState<{ title: string; content: string; type: "note" | "link" | "document"; url: string }>({ title: "", content: "", type: "note", url: "" })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    text: task.text,
    description: task.description || "",
    category: task.category,
    priority: task.priority,
    notes: task.notes || "",
  })

  const handleSaveEdit = () => {
    onUpdateTask(task.id, editForm)
    setIsEditing(false)
  }

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(task.id, newSubtask.trim())
      setNewSubtask("")
    }
  }

  const handleAddInformation = () => {
    if (newInfo.title.trim() && newInfo.content.trim()) {
      onAddInformation(task.id, {
        title: newInfo.title.trim(),
        content: newInfo.content.trim(),
        type: newInfo.type,
        url: newInfo.type === "link" ? newInfo.url : undefined,
      })
      setNewInfo({ title: "", content: "", type: "note", url: "" })
    }
  }

  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editForm.text}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, text: e.target.value }))}
                    className="text-lg font-semibold"
                  />
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción detallada de la tarea..."
                    className="min-h-20"
                  />
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Categoría</Label>
                      <Input
                        value={editForm.category}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Prioridad</Label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(value: "high" | "medium" | "low") =>
                          setEditForm((prev) => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas adicionales..."
                      className="min-h-16"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>Guardar</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-2xl mb-2">{task.text}</CardTitle>
                  {task.description && <CardDescription className="text-base mb-4">{task.description}</CardDescription>}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getCategoryColor(task.category)}>{task.category}</Badge>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status === "todo"
                        ? "Por hacer"
                        : task.status === "in-progress"
                          ? "En progreso"
                          : "Completada"}
                    </Badge>
                  </div>
                  {task.notes && <p className="text-sm text-muted-foreground mb-4">{task.notes}</p>}
                </>
              )}
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => onToggleStatus(task.id)}>
                  Cambiar Estado
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDeleteTask(task.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      {totalSubtasks > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtareas completadas</span>
                <span>
                  {completedSubtasks} de {totalSubtasks}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subtasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subtareas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Agregar nueva subtarea..."
              onKeyPress={(e) => e.key === "Enter" && handleAddSubtask()}
            />
            <Button onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {task.subtasks?.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <button
                  onClick={() => onToggleSubtask(task.id, subtask.id)}
                  className="hover:scale-110 transition-transform"
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <span className={`flex-1 ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                  {subtask.text}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteSubtask(task.id, subtask.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(!task.subtasks || task.subtasks.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No hay subtareas aún</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Information & Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información y Recursos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex gap-2">
              <Input
                value={newInfo.title}
                onChange={(e) => setNewInfo((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Título del recurso..."
              />
              <Select
                value={newInfo.type}
                onValueChange={(value: "note" | "link" | "document") =>
                  setNewInfo((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Nota</SelectItem>
                  <SelectItem value="link">Enlace</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newInfo.type === "link" && (
              <Input
                value={newInfo.url}
                onChange={(e) => setNewInfo((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="URL del enlace..."
              />
            )}
            <Textarea
              value={newInfo.content}
              onChange={(e) => setNewInfo((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Contenido o descripción..."
              className="min-h-20"
            />
            <Button onClick={handleAddInformation} disabled={!newInfo.title.trim() || !newInfo.content.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Recurso
            </Button>
          </div>

          <div className="space-y-3">
            {task.information?.map((info) => (
              <div key={info.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {info.type === "link" ? (
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                    ) : info.type === "document" ? (
                      <FileText className="w-4 h-4 text-green-600" />
                    ) : (
                      <Calendar className="w-4 h-4 text-purple-600" />
                    )}
                    <h4 className="font-medium">{info.title}</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteInformation(task.id, info.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{info.content}</p>
                {info.url && (
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {info.url}
                  </a>
                )}
              </div>
            ))}
            {(!task.information || task.information.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No hay recursos guardados aún</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TaskDialog({
  task,
  onSave,
}: {
  task: Task | null
  onSave: (taskData: Partial<Task>) => void
}) {
  const [formData, setFormData] = useState({
    text: task?.text || "",
    category: task?.category || "",
    priority: task?.priority || ("medium" as const),
    notes: task?.notes || "",
    description: task?.description || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.text.trim()) return
    onSave(formData)
    setFormData({ text: "", category: "", priority: "medium", notes: "", description: "" })
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
        <DialogDescription>
          {task ? "Modifica los detalles de la tarea" : "Crea una nueva tarea para tu lista"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">Título</Label>
          <Input
            id="text"
            value={formData.text}
            onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Título de la tarea..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descripción detallada..."
            className="min-h-20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Universidad, Cocinar, Programación..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioridad</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: "high" | "medium" | "low") => setFormData((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notas (opcional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Información adicional, enlaces, recordatorios..."
            className="min-h-20"
          />
        </div>
        <DialogFooter>
          <Button type="submit" className="w-full">
            {task ? "Actualizar" : "Crear"} Tarea
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
