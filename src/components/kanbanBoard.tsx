import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const Kanban = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [undoStack, setUndoStack] = useState<Column[][]>([]);
  const [redoStack, setRedoStack] = useState<Column[][]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem("kanbanColumns");
    if (savedColumns) setColumns(JSON.parse(savedColumns));
  }, []);

  // Save to localStorage whenever columns change
  useEffect(() => {
    localStorage.setItem("kanbanColumns", JSON.stringify(columns));
  }, [columns]);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    columnId: string,
    taskId: string
  ) => {
    e.dataTransfer.setData("task", JSON.stringify({ columnId, taskId }));
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetColumnId: string
  ) => {
    const { columnId: sourceColumnId, taskId } = JSON.parse(
      e.dataTransfer.getData("task")
    );

    if (sourceColumnId === targetColumnId) return;

    const updatedColumns = [...columns];
    const sourceColumn = updatedColumns.find(
      (col) => col.id === sourceColumnId
    );
    const targetColumn = updatedColumns.find(
      (col) => col.id === targetColumnId
    );

    if (sourceColumn && targetColumn) {
      const taskIndex = sourceColumn.tasks.findIndex(
        (task) => task.id === taskId
      );
      const [task] = sourceColumn.tasks.splice(taskIndex, 1);
      targetColumn.tasks.push(task);

      pushToUndoStack();
      setColumns(updatedColumns);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const pushToUndoStack = () => {
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(columns))]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack.pop();
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(columns))]);
    if (previousState) setColumns(previousState);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack.pop();
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(columns))]);
    if (nextState) setColumns(nextState);
  };

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      title: "New Column",
      tasks: [],
    };
    pushToUndoStack();
    setColumns((prev) => [...prev, newColumn]);
  };

  const deleteColumn = (columnId: string) => {
    pushToUndoStack();
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
  };

  const addTask = (columnId: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: "New Task",
    };
    pushToUndoStack();
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    );
  };

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    pushToUndoStack();
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    );
  };

  const updateTaskTitle = (
    columnId: string,
    taskId: string,
    newTitle: string
  ) => {
    pushToUndoStack();
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((task) =>
                task.id === taskId ? { ...task, title: newTitle } : task
              ),
            }
          : col
      )
    );
  };

  const filteredColumns = columns.map((col) => ({
    ...col,
    tasks: col.tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 shadow-md w-1/4"
        />
        <div className="flex gap-4">
          <button
            onClick={undo}
            className="bg-yellow-400 text-white px-4 py-2 rounded shadow-md hover:bg-yellow-500"
          >
            Undo
          </button>
          <button
            onClick={redo}
            className="bg-green-400 text-white px-4 py-2 rounded shadow-md hover:bg-green-500"
          >
            Redo
          </button>
          <button
            onClick={addColumn}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow-md hover:bg-blue-600"
          >
            Add Column
          </button>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto">
        {filteredColumns.map((col) => (
          <div
            key={col.id}
            className="bg-white shadow-lg rounded-lg p-4 w-80 flex-shrink-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                value={col.title}
                onChange={(e) => updateColumnTitle(col.id, e.target.value)}
                className="font-bold text-lg border-b-2 focus:outline-none w-full"
              />
              <button
                onClick={() => deleteColumn(col.id)}
                className="text-red-500 hover:text-red-700"
              >
                ✖
              </button>
            </div>
            <div className="space-y-4">
              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-100 shadow rounded-lg p-3 cursor-move hover:bg-gray-200"
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id, task.id)}
                >
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) =>
                      updateTaskTitle(col.id, task.id, e.target.value)
                    }
                    className="bg-transparent w-full focus:outline-none"
                  />
                </div>
              ))}
              <button
                onClick={() => addTask(col.id)}
                className="text-blue-500 hover:text-blue-700"
              >
                ➕ Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kanban;
