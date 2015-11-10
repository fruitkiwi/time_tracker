import React from 'react'
import {render} from 'react-dom'

function isNumber(x) {
  return isFinite(x) && !isNaN(parseFloat(x))
}

function formatTime(ms) {
  var seconds = Math.floor(ms / 1000)
  var minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  var hours = Math.floor(minutes / 60)
  minutes = minutes % 60
  return formatTimeValues(hours) + ':' + formatTimeValues(minutes) + ':' + formatTimeValues(seconds)
}

function formatTimeValues(value) {
  return value < 10 ? '0' + value : value
}

function fromHoursRate(bid) {
  return bid / 36e5
}

var TaskTable = React.createClass({
  genId: function() {
    return 'id' + (this.count++)
  },
  findTaskIndex: function(id) {
    return this.state.tasks.findIndex(function(element) {
      return element.id === id
    })
  },
  handleAdd: function(task = {taskName: '', taskBid: 0}) {
    var tasks = this.state.tasks
    task.id = this.genId()
    task.taskTotal = {time: 0, price: 0}
    tasks.push(task)
    this.setState({tasks: tasks})
  },
  handleDelete: function(task) {
    var id = task.id
    var index = this.findTaskIndex(id)
    if (index === -1) {
      console.log('attempt to delete non-existent task')
      return
    }
    var tasks = this.state.tasks
    tasks.splice(index, 1)
    this.setState({tasks: tasks})
  },
  handleChange: function(task) {
    var id = task.id
    var index = this.findTaskIndex(id)
    if (index === -1) {
      console.log('attempt to change non-existent task')
      return
    }
    var tasks = this.state.tasks
    var oldtask = tasks[index]
    var newtask = Object.assign({}, oldtask, task)
    if (typeof task.taskBid === 'number')
      newtask.taskTotal.price = (newtask.taskTotal.time * fromHoursRate(task.taskBid)).toFixed(2)
    else if (typeof task.taskTrack === 'number') {
      newtask.taskTotal.time += task.taskTrack - (oldtask.taskTrack || 0)
      newtask.taskTotal.price = (newtask.taskTotal.time * fromHoursRate(newtask.taskBid)).toFixed(2)
    }
    tasks.splice(index, 1, newtask)
    this.setState({tasks: tasks})
  },
  getInitialState: function() {
    return {tasks: []}
  },
  componentWillMount: function() {
    var tasks = localStorage.getItem(this.props.storage)
    if (tasks) {
      try {
        tasks = JSON.parse(tasks)
      }
      catch(e) {
        console.log(e)
      }
      this.count = +tasks[tasks.length - 1].id.substr(2) + 1
      this.setState({tasks: tasks})
    }
    else
      this.count = 0
  },
  componentDidUpdate: function() {
    if (this.state.tasks.length != 0)
      localStorage.setItem(this.props.storage, JSON.stringify(this.state.tasks))
    else
      localStorage.removeItem(this.props.storage)
  },
  render: function() {
    return (
      <div className='task-table'>
        <TaskAdd onadd={this.handleAdd} />
        <TaskList tasks={this.state.tasks} ondelete={this.handleDelete} onchange={this.handleChange}/>
      </div>
    )
  }
})

var TaskAdd = React.createClass({
  handleClick: function(e) {
    var target = e.target
    if (target === this.refs.newtask) {
      let name = this.refs.taskname.value.trim()
      let bid = this.refs.taskbid.value.trim()
      if (!name || !isNumber(bid)) {
        console.log('wrong name/bid args input in task add')
        return
      }
      this.props.onadd({taskName: name, taskBid: +bid})
      this.refs.taskname.value = ''
      this.refs.taskbid.value = ''
    }
    else if (target === this.refs.emptytask)
      this.props.onadd()
  },
  render: function() {
    return (
      <div className="task-table__add">
        <div className="task-table__add__column task-table__add__column--first">
          <label htmlFor="taskname">Task name</label>
          <input type="text" id="taskname" placeholder="Task name" maxLength="300" className="text-input" ref="taskname"/>
        </div>
        <div className="task-table__add__column task-table__add__column--second">
          <label htmlFor="taskbid">Task bid</label>
          <input type="text" id="taskbid" placeholder="Task bid" maxLength="15" className="text-input" ref="taskbid"/>
        </div>
        <div className="task-table__add__column task-table__add__column--third">
          <input type="button" value="Create task" className="button" onClick={this.handleClick}  ref="newtask"/>
        </div>
        <div className="task-table__add__column task-table__add__column--forth">
          OR
        </div>
        <div className="task-table__add__column task-table__add__column--fifth">
          <span className="action-link" onClick={this.handleClick} ref="emptytask">Add empty task</span>
        </div>
      </div>
    )
  }
})

var TaskList = React.createClass({
  render: function() {
    return (
      <div>
      {this.props.tasks.map(function(task) {
          return <Task data={task} ondelete={this.props.ondelete} onchange={this.props.onchange} key={task.id} />
      }, this)}
      </div>
    )
  }
}) 

/* 0 - stay; 1 - play; 2 - edit */
var Task = React.createClass({
  handleDelete: function() {
    this.props.ondelete(this.props.data)
  },
  handleChange: function(e) {
    var mode = this.state.mode
    switch(mode) {
      case 0:
        mode = 2
        break
      case 1:
        return
      case 2:
        mode = 0
        let name = this.refs.nameinput.value.trim()
        let bid = this.refs.bidinput.value.trim()
        if (name !== '' && isNumber(bid)) {
          this.props.onchange({
            id: this.props.data.id,
            taskName: name,
            taskBid: +bid
          })
        }
        else
          console.log('wrong name/bid args input in task edit')
        break
    }
    e.target.classList.toggle('task-table__task__edit--confirm')
    this.setState({mode: mode})
  },
  handleAction: function(e) {
    var mode = this.state.mode
    switch(mode) {
      case 0:
        let state = {
          mode: 1,
          ticked: this.state.ticked
        }
        state.started = Date.now() - (state.ticked > 0 ? state.ticked : 0)
        this.interval = setInterval(this.tick, 1000)
        this.setState(state)
        break
      case 1:
        clearInterval(this.interval)
        this.props.onchange({
          id: this.props.data.id,
          taskTrack: this.state.ticked
        })
        this.setState({
          mode: 0,
          started: null
        })
        break
      case 2:
        return
    }
  },
  tick: function() {
    this.setState({ticked: Date.now() - this.state.started})
  },
  getInitialState: function() {
    var state = {
      mode: 0,
      started: null
    }
    if (typeof this.props.data.taskTrack !== 'undefined')
      state.ticked = this.props.data.taskTrack
    else
      state.ticked = 0
    return state
  },
  componentWillUnmount: function() {
    clearInterval(this.interval)
  },
  render: function() {
    var mode = this.state.mode
    return (
      <div className="task-table__task">
        <div className="task-table__task__remove" onClick={this.handleDelete}/>
        <div className="task-table__task__column task-table__task__column--first">
          {mode === 2 ? <input type="text" defaultValue={this.props.data.taskName} className="text-input" ref="nameinput"/> : <span className="span-emul">{this.props.data.taskName}</span>}
        </div>
        <div className="task-table__task__column task-table__task__column--second">
          <div className={"task-table__task__timer " + (this.state.mode === 1 ? "task-table__task__timer--pause" : "task-table__task__timer--play")} onClick={this.handleAction}>
            {formatTime(this.state.ticked ? this.state.ticked : 0)}
          </div>
        </div>
        <div className="task-table__task__column task-table__task__column--third">
          {mode === 2 ? <input type="text" defaultValue={this.props.data.taskBid} className="text-input" ref="bidinput"/> : <span className="span-emul">{this.props.data.taskBid}</span>}
        </div>
        <div className="task-table__task__column task-table__task__column--forth">
          <div className="task-table__task__total-time">
            {formatTime(this.props.data.taskTotal.time)}
          </div>
          <div className="task-table__task__total-price">
            {this.props.data.taskTotal.price}
          </div>
        </div>
        <div className="task-table__task__edit" onClick={this.handleChange}/>
      </div>
    )
  }
})

render(
  <TaskTable storage="tasktable"/>,
  document.getElementById('wrapper')
)