import "../style/calendar.css";

import { useState, useRef } from "react";

import type { CalendarEvent } from "../type/calendar";
import type { Task } from "../type/task";

import {
  getCalendarEvents,
} from "../services/calendarStorage";

import {
  getTasks,
} from "../services/taskStorage";


const getDateString = (date: Date) => {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;

};


const getStartOfWeek = (
  date: Date
) => {

  const result =
    new Date(date);

  result.setDate(
    result.getDate() -
    result.getDay()
  );

  return result;

};


const getWeekDays = (
  date: Date
) => {

  const start =
    getStartOfWeek(date);

  return Array.from(
    { length: 7 },
    (_, index) => {

      const day =
        new Date(start);

      day.setDate(
        start.getDate() +
        index
      );

      return day;

    }
  );

};


export default function Calendar() {

  const [expandedDate, setExpandedDate] =
    useState<string | null>(null);

  const [viewMode, setViewMode] =
    useState<"month" | "week">("week");

  const [currentDate, setCurrentDate] =
    useState(
      new Date()
    );

    const [resizingEventId, setResizingEventId] =
  useState<string | null>(null);

const resizeStartY =
  useRef<number>(0);

const resizeStartDuration =
  useRef<number>(60);


  const tasks =
    getTasks();

  const calendarEvents =
    getCalendarEvents();


  /*
  ========================================
  Find task / day / step for calendar event
  ========================================
  */

  const getStepForEvent = (
    event: CalendarEvent
  ) => {

    const task =
      tasks.find(
        (task) =>
          task.id === event.taskId
      );

    if (!task) {
      return null;
    }


    const day =
      task.timeline.find(
        (day) =>
          day.id === event.dayId
      );

    if (!day) {
      return null;
    }


    const step =
      day.steps.find(
        (step) =>
          step.id === event.stepId
      );

    if (!step) {
      return null;
    }


    return {
      task,
      day,
      step,
    };

  };


  /*
  ========================================
  Weekly calendar events
  ========================================
  */

  const getEventsForDate = (
    date: string
  ) => {

    return calendarEvents

      .filter(
        (event) =>
          event.date === date
      )

      .map(
        (event) => {

          const result =
            getStepForEvent(event);

          if (!result) {
            return null;
          }

          return {
            event,
            ...result,
          };

        }
      )

      .filter(
        (
          item
        ): item is NonNullable<typeof item> =>
          item !== null
      )

      .sort(
        (a, b) =>
          a.event.time.localeCompare(
            b.event.time
          )
      );

  };

const startResize = (
  e: React.PointerEvent,
  event: CalendarEvent
) => {

  e.stopPropagation();

  resizeStartY.current =
    e.clientY;

  resizeStartDuration.current =
    event.duration ?? 60;

  setResizingEventId(
    event.id
  );

  const handlePointerMove =
    (moveEvent: PointerEvent) => {

      const pixelsPerMinute = 1;

      const deltaY =
        moveEvent.clientY -
        resizeStartY.current;

      const deltaMinutes =
        Math.round(
          deltaY /
          pixelsPerMinute /
          15
        ) * 15;

      const newDuration =
        Math.max(
          15,
          resizeStartDuration.current +
          deltaMinutes
        );

      const updatedEvent = {
        ...event,
        duration: newDuration,
      };

      // Update localStorage
      const allEvents =
        getCalendarEvents();

      const updatedEvents =
        allEvents.map(
          (item) =>
            item.id === event.id
              ? updatedEvent
              : item
        );

      localStorage.setItem(
        "protocol-tracker-calendar-events",
        JSON.stringify(
          updatedEvents
        )
      );

      // Force calendar refresh
      setResizingEventId(
        event.id
      );

    };


  const handlePointerUp =
    () => {

      setResizingEventId(
        null
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

    };


  window.addEventListener(
    "pointermove",
    handlePointerMove
  );

  window.addEventListener(
    "pointerup",
    handlePointerUp
  );

};

const getEventLayout = (
  events: ReturnType<typeof getEventsForDate>
) => {

  const layouts = events
    .map((event) => {

      const [
        hour,
        minute,
      ] =
        event.event.time
          .split(":")
          .map(Number);

      const start =
        hour * 60 + minute;

      const duration =
        event.event.duration ?? 60;

      const end =
        start + duration;

      return {
        ...event,
        start,
        end,
        column: 0,
        totalColumns: 1,
      };

    })
    .sort(
      (a, b) =>
        a.start - b.start
    );


  const groups: typeof layouts[] = [];


  // Group events that overlap
  layouts.forEach((event) => {

    let group =
      groups.find(
        (existingGroup) =>
          existingGroup.some(
            (existing) =>
              event.start < existing.end &&
              event.end > existing.start
          )
      );


    if (!group) {

      group = [];

      groups.push(group);

    }


    group.push(event);

  });


  // Assign each event to a column
  groups.forEach((group) => {

    const columns: typeof layouts[] = [];


    group
      .sort(
        (a, b) =>
          a.start - b.start
      )
      .forEach((event) => {

        let columnIndex = 0;


        while (
          columns[columnIndex]?.some(
            (existing) =>
              event.start < existing.end &&
              event.end > existing.start
          )
        ) {

          columnIndex++;

        }


        if (!columns[columnIndex]) {

          columns[columnIndex] = [];

        }


        columns[columnIndex].push(event);

        event.column =
          columnIndex;

      });


    const totalColumns =
      columns.length;


    group.forEach((event) => {

      event.totalColumns =
        totalColumns;

    });

  });


  return layouts;

};

  /*
  ========================================
  Date information
  ========================================
  */

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  const firstDay =
    new Date(
      year,
      month,
      1
    );


  const lastDay =
    new Date(
      year,
      month + 1,
      0
    );


  const daysInMonth =
    lastDay.getDate();


  const startingDay =
    firstDay.getDay();


  const today =
    getDateString(
      new Date()
    );


  /*
  ========================================
  Navigation
  ========================================
  */

  const goToToday = () => {

    setCurrentDate(
      new Date()
    );

  };


  const previousMonth = () => {

    setCurrentDate(
      new Date(
        year,
        month - 1,
        1
      )
    );

  };


  const nextMonth = () => {

    setCurrentDate(
      new Date(
        year,
        month + 1,
        1
      )
    );

  };


  const previousWeek = () => {

    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() - 7
      )
    );

  };


  const nextWeek = () => {

    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate() + 7
      )
    );

  };


  /*
  ========================================
  Monthly task lookup
  ========================================
  */

  const getTasksForDate = (
  date: string
) => {

  return tasks.flatMap(
    (task) => {

      return task.timeline

        .filter(
          (day) => {

            const [
              year,
              month,
              dayOfMonth
            ] =
              task.startDate
                .split("-")
                .map(Number);

            const taskDate =
              new Date(
                year,
                month - 1,
                dayOfMonth
              );

            taskDate.setDate(
              taskDate.getDate() +
              day.offset
            );

            return (
              getDateString(
                taskDate
              ) === date
            );

          }
        )

        .map(
          (day) => ({
            task,
            day,
          })
        );

    }
  );

};


  /*
  ========================================
  Build monthly calendar
  ========================================
  */

  const calendarDays: (
    Date | null
  )[] = [];


  for (
    let i = 0;
    i < startingDay;
    i++
  ) {

    calendarDays.push(
      null
    );

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    calendarDays.push(
      new Date(
        year,
        month,
        day
      )
    );

  }


  return (

    <div className="calendar-page">


      {/* =========================
          Calendar title
      ========================= */}

      <div className="calendar-title">

        <h1>
          Calendar
        </h1>


        <button
          type="button"
          onClick={goToToday}
        >
          Today
        </button>

      </div>


      {/* =========================
          Calendar controls
      ========================= */}

      <div className="calendar-controls">


        <button
          type="button"
          onClick={
            viewMode === "month"
              ? previousMonth
              : previousWeek
          }
        >
          ←
        </button>


        <button
          type="button"
          onClick={
            viewMode === "month"
              ? nextMonth
              : nextWeek
          }
        >
          →
        </button>


        <button
          type="button"
          className={
            viewMode === "week"
              ? "active"
              : ""
          }
          onClick={() =>
            setViewMode("week")
          }
        >
          Week
        </button>


        <button
          type="button"
          className={
            viewMode === "month"
              ? "active"
              : ""
          }
          onClick={() =>
            setViewMode("month")
          }
        >
          Month
        </button>


      </div>


      {/* =========================
          MONTH VIEW
      ========================= */}

      {
        viewMode === "month" ? (

          <div className="calendar-grid month-view">


            {
              [
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (day) => (

                  <div
                    key={day}
                    className="calendar-weekday"
                  >
                    {day}
                  </div>

                )
              )
            }


            {
              calendarDays.map(
                (date, index) => {


                  if (!date) {

                    return (

                      <div
                        key={
                          `empty-${index}`
                        }
                        className="calendar-day empty"
                      />

                    );

                  }


                  const dateString =
                    getDateString(
                      date
                    );


                  const dayTasks =
                    getTasksForDate(
                      dateString
                    );


                  const isExpanded =
                    expandedDate ===
                    dateString;


                  return (

                    <div
                      key={dateString}

className={[
  "calendar-day",
  dateString === today
    ? "today"
    : "",
  isExpanded
    ? "expanded"
    : "",
].filter(Boolean).join(" ")}

                      onClick={() => {

                        if (
                          dayTasks.length > 3
                        ) {

                          setExpandedDate(
                            isExpanded
                              ? null
                              : dateString
                          );

                        }

                      }}

                    >


                      <div
                        className="calendar-date"
                      >
                        {date.getDate()}
                      </div>


                      {
                        (
                          isExpanded
                            ? dayTasks
                            : dayTasks.slice(
                                0,
                                3
                              )
                        ).map(
                          ({
                            task,
                            day,
                          }) => {


                            const hasIncomplete =
                              day.steps.some(
                                (step) =>
                                  !step.completed
                              );


                            const isOverdue =
                              dateString < today &&
                              hasIncomplete;


                            return (

                              <div
                                key={
                                  `${task.id}-${day.id}`
                                }

                                className={
                                  isOverdue
                                    ? "calendar-task overdue"
                                    : "calendar-task"
                                }
                              >

                                <div
                                  className="calendar-task-title"
                                >
                                  {task.title}
                                </div>

                              </div>

                            );

                          }
                        )
                      }


                    </div>

                  );

                }
              )
            }


          </div>


) : (

  /* =========================
     WEEK VIEW
  ========================= */

  <div className="week-calendar">

    {/* =========================
        Time column
    ========================= */}

    <div className="week-time-column">

      <div className="week-header-spacer" />

      {
        Array.from(
          { length: 24 },
          (_, hour) => (

            <div
              key={hour}
              className="week-time-label"
            >

              {
                new Date(
                  2000,
                  0,
                  1,
                  hour
                ).toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  }
                )
              }

            </div>

          )
        )
      }

    </div>


    {/* =========================
        Seven day columns
    ========================= */}

    {
      getWeekDays(
        currentDate
      ).map(
        (date) => {

          const dateString =
            getDateString(
              date
            );

const dayEvents =
  getEventsForDate(
    dateString
  );

const eventLayouts =
  getEventLayout(
    dayEvents
  );

          return (

            <div
              key={dateString}
              className={
                dateString === today
                  ? "week-day today"
                  : "week-day"
              }
            >

              {/* Day header */}

              <div className="week-day-header">

                {
                  date.toLocaleDateString(
                    "default",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }
                  )
                }

              </div>


              {/* Time grid */}

              <div className="week-day-body">

                {
                  Array.from(
                    { length: 24 },
                    (_, hour) => (

                      <div
                        key={hour}
                        className="week-hour-row"
                      />

                    )
                  )
                }


                {/* Calendar events */}

{
  eventLayouts.map(
    ({
      event,
      task,
      step,
      start,
      column,
      totalColumns,
    }) => {

      const top =
        start;

      const height =
        Math.max(
          event.duration,
          15
        );

      const width =
        100 / totalColumns;

      const left =
        column * width;

      return (

<div
  key={event.id}
  className={
    resizingEventId === event.id
      ? "week-event resizing"
      : "week-event"
  }

  style={{
    top: `${start}px`,
    height: `${height}px`,
    left: `calc(${left}% + 4px)`,
    width: `calc(${width}% - 8px)`,
  }}
>

          <div className="week-event-time">
            {event.time}
          </div>

          <div className="week-event-title">
            {step.title}
          </div>

          <div className="week-event-task">
            {task.title}
          </div>

<div
  className="week-event-resize"
  onPointerDown={(e) =>
    startResize(
      e,
      event
    )
  }
/>

        </div>

      );

    }
  )
}

              </div>

            </div>

          );

        }
      )
    }

  </div>

)

}

</div>


);

}