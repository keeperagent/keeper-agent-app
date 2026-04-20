import { useMemo } from "react";
import type { TodoItem } from "../util";
import { TodoItemStatus } from "../util";
import { Wrapper } from "./style";

const STATUS_ORDER: Record<TodoItemStatus, number> = {
  [TodoItemStatus.COMPLETED]: 0,
  [TodoItemStatus.IN_PROGRESS]: 1,
  [TodoItemStatus.PENDING]: 2,
  [TodoItemStatus.ERROR]: 3,
};

type TodoListProps = {
  todos: TodoItem[];
};

const TodoList = ({ todos }: TodoListProps) => {
  const sortedTodos = useMemo(
    () =>
      [...todos].sort(
        (todoA, todoB) =>
          (STATUS_ORDER[todoA.status] ?? 99) -
          (STATUS_ORDER[todoB.status] ?? 99),
      ),
    [todos],
  );

  const allComplete = todos.every(
    (todo) => todo.status === TodoItemStatus.COMPLETED,
  );

  return (
    <Wrapper allComplete={allComplete}>
      {sortedTodos.map((todo, index) => (
        <div key={index} className={`todo-item todo-item--${todo.status}`}>
          <span className="todo-status">
            {todo.status === TodoItemStatus.COMPLETED && (
              <span className="todo-check">✓</span>
            )}
            {todo.status === TodoItemStatus.IN_PROGRESS && (
              <span className="spinner-sm" />
            )}
            {todo.status === TodoItemStatus.PENDING && (
              <span className="todo-pending">○</span>
            )}
            {todo.status === TodoItemStatus.ERROR && (
              <span className="todo-error">✗</span>
            )}
          </span>

          <span className="todo-content">{todo.content}</span>
        </div>
      ))}
    </Wrapper>
  );
};

export default TodoList;
