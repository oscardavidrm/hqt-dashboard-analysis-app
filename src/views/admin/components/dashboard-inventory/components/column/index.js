import React, {Component} from 'react';
import {Droppable} from 'react-beautiful-dnd';
import {Tooltip} from 'antd';
import Task from '../task';
import {ColumnContainer, ColumnTitle, TaskList} from './elements';

class Column extends Component {
  state = {};
  render() {
    const {column, tasks} = this.props;
    return (
      <ColumnContainer>
        <Tooltip title={column.description}>
          <ColumnTitle>{column.title}</ColumnTitle>
        </Tooltip>
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <TaskList
              {...provided.droppableProps}
              ref={provided.innerRef}
              isDraggingOver={snapshot.isDraggingOver}
            >
              {tasks.map((task, index) => (
                <Task key={task.id} task={task} index={index} />
              ))}
              {provided.placeholder}
            </TaskList>
          )}
        </Droppable>
      </ColumnContainer>
    );
  }
}

export default Column;
