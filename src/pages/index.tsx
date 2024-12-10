import KanbanBoard from "@/components/kanbanBoard";
import React from "react";

const index = () => {
  return (
    <div className="px-10 py-10">
      <h1 className="text-2xl font-bold">Kanban Board</h1>
      <KanbanBoard />
    </div>
  );
};

export default index;
