import "../style/calendar.css";

import { useState, useRef, useEffect } from "react";

import type { CalendarEvent } from "../type/calendar";

import {
  getCalendarEvents,
  updateCalendarEvent,
} from "../services/calendarStorage";

import {
  getTasks,
} from "../services/taskStorage";
import { getProjects, updateProject } from "../services/projectStorage";

const PROJECT_COLORS = [
  { name: "Blue", color: "#bfdbfe" },
  { name: "Green", color: "#bbf7d0" },
  { name: "Yellow", color: "#fde68a" },
  { name: "Red", color: "#fecaca" },
  { name: "Purple", color: "#ddd6fe" },
  { name: "Pink", color: "#fbcfe8" },
  { name: "Cyan", color: "#a5f3fc" },
];

const formatClockTime = (minutes: number) =>
  new Date(2000, 0, 1, 0, minutes).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

const formatTimeRange = (time: string, duration: number) => {
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;
  return `${formatClockTime(start)}–${formatClockTime(start + duration)}`;
};


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

  const weekCalendarRef = useRef<HTMLDivElement | null>(null);

  const [expandedDate, setExpandedDate] =
    useState<string | null>(null);

  const [viewMode, setViewMode] =
    useState<"month" | "week" | "day">(() =>
      window.matchMedia("(max-width: 620px)").matches ? "day" : "week"
    );

  const [selectedEventId, setSelectedEventId] =
    useState<string | null>(null);

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

const [, forceCalendarRefresh] = useState(0);
const [projectColorMenu, setProjectColorMenu] = useState<{
  projectId: string;
  x: number;
  y: number;
} | null>(null);

useEffect(() => {
  if (viewMode !== "month" && weekCalendarRef.current) {
    const calendar = weekCalendarRef.current;
    calendar.scrollTop = 8 * 60;
    const timeColumn = calendar.querySelector<HTMLElement>(".week-time-column");
    if (timeColumn) timeColumn.style.transform = `translateX(${calendar.scrollLeft}px)`;
  }
}, [viewMode]);

const projects = getProjects();

const getProjectColor = (projectId: string) => {
  const project = projects.find((item) => item.id === projectId);
  if (project?.color) return project.color;
  const hash = [...projectId].reduce((value, character) => value + character.charCodeAt(0), 0);
  const projectIndex = projects.findIndex((item) => item.id === projectId);
  return PROJECT_COLORS[(projectIndex >= 0 ? projectIndex : hash) % PROJECT_COLORS.length].color;
};

const openProjectColorMenu = (e: React.MouseEvent, projectId: string) => {
  e.preventDefault();
  e.stopPropagation();
  setProjectColorMenu({
    projectId,
    x: Math.min(e.clientX, window.innerWidth - 230),
    y: Math.min(e.clientY, window.innerHeight - 100),
  });
};

const changeProjectColor = (color: string) => {
  if (!projectColorMenu) return;
  const project = projects.find((item) => item.id === projectColorMenu.projectId);
  if (!project) return;
  updateProject({ ...project, color });
  setProjectColorMenu(null);
  forceCalendarRefresh((value) => value + 1);
};

const startMove = (
  e: React.PointerEvent,
  event: CalendarEvent
) => {
  if ((e.target as HTMLElement).closest(".week-event-resize")) return;
  if (e.button !== 0) return;
  setSelectedEventId(event.id);
  e.preventDefault();
  e.stopPropagation();

  const grabOffsetY = e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top;

  const handlePointerMove = (moveEvent: PointerEvent) => {
    const underPointer = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
    const dayBody = underPointer?.closest<HTMLElement>(".week-day-body");
    const destinationDay = dayBody?.closest<HTMLElement>(".week-day");
    const date = destinationDay?.dataset.date;
    if (!dayBody || !date) return;

    const laneHeight = 44;
    const localY = moveEvent.clientY - dayBody.getBoundingClientRect().top + dayBody.scrollTop;
    if (localY < laneHeight) {
      updateCalendarEvent({ ...event, date, time: null });
    } else {
      const latestEvent = getCalendarEvents().find((item) => item.id === event.id) ?? event;
      const minute = Math.max(0, Math.min(1440 - (latestEvent.duration ?? 60),
        Math.round((localY - laneHeight - grabOffsetY) / 15) * 15));
      const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
      updateCalendarEvent({ ...event, date, time });
    }
    forceCalendarRefresh((value) => value + 1);
  };

  const handlePointerUp = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  };

  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
};


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
          event.date === date && event.time !== null
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

      .filter(
        (item) => item.event.time !== null
      )

      .sort(
        (a, b) =>
          (a.event.time ?? "").localeCompare(
            b.event.time ?? ""
          )
      );

  };

const startResize = (
  e: React.PointerEvent,
  event: CalendarEvent
) => {

  e.stopPropagation();
  setSelectedEventId(event.id);

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

      const [startHour, startMinute] = (event.time ?? "00:00").split(":").map(Number);
      const maxDuration = Math.max(15, 1440 - (startHour * 60 + startMinute));
      const newDuration = Math.min(
        maxDuration,
        Math.max(15, resizeStartDuration.current + deltaMinutes)
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
        event.event.time!
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
        columnSpan: 1,
      };

    })
    .sort(
      (a, b) =>
        a.start - b.start
    );


  const groups: typeof layouts[] = [];
  let currentGroup: typeof layouts = [];
  let groupEnd = -Infinity;

  // Split into connected overlap groups. Touching endpoints do not overlap.
  layouts.forEach((event) => {
    if (currentGroup.length && event.start >= groupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
      groupEnd = -Infinity;
    }

    currentGroup.push(event);
    groupEnd = Math.max(groupEnd, event.end);
  });

  if (currentGroup.length) groups.push(currentGroup);


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

      // Let an event use adjacent lanes when none of their events collide
      // with it for the full duration.
      let span = 1;
      for (let columnIndex = event.column + 1; columnIndex < totalColumns; columnIndex++) {
        const hasConflict = columns[columnIndex]?.some(
          (existing) => event.start < existing.end && event.end > existing.start
        );
        if (hasConflict) break;
        span++;
      }
      event.columnSpan = span;

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

  const previousDay = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
  };

  const nextDay = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
  };

  const visibleWeekDays = viewMode === "day" ? [currentDate] : getWeekDays(currentDate);


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
              : viewMode === "day" ? previousDay : previousWeek
          }
        >
          ←
        </button>


        <button
          type="button"
          onClick={
            viewMode === "month"
              ? nextMonth
              : viewMode === "day" ? nextDay : nextWeek
          }
        >
          →
        </button>


        <button
          type="button"
          className={viewMode === "day" ? "active calendar-day-toggle" : "calendar-day-toggle"}
          onClick={() => setViewMode("day")}
        >
          Day
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
                                style={{ backgroundColor: getProjectColor(task.projectId) }}
                                onContextMenu={(e) => openProjectColorMenu(e, task.projectId)}
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

  <div
    className={`week-calendar${viewMode === "day" ? " day-calendar" : ""}`}
    ref={weekCalendarRef}
    onPointerDown={() => setSelectedEventId(null)}
    onScroll={(e) => {
      const timeColumn = e.currentTarget.querySelector<HTMLElement>(".week-time-column");
      if (timeColumn) timeColumn.style.transform = `translateX(${e.currentTarget.scrollLeft}px)`;
    }}
  >

    {/* =========================
        Time column
    ========================= */}

    <div className="week-time-column">

      <div className="week-header-spacer">Date</div>

      <div className="week-unscheduled-label">UnSch.</div>

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
      visibleWeekDays.map(
        (date) => {

          const dateString =
            getDateString(
              date
            );

const dayEvents =
  getEventsForDate(
    dateString
  );

const unscheduledEvents = calendarEvents
  .filter((event) => event.date === dateString && event.time === null)
  .map((event) => {
    const result = getStepForEvent(event);
    return result ? { event, ...result } : null;
  })
  .filter((item): item is NonNullable<typeof item> => item !== null);

const eventLayouts =
  getEventLayout(
    dayEvents
  );

          return (

            <div
              key={dateString}
              data-date={dateString}
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

                <div className="week-unscheduled-lane">
                  {unscheduledEvents.map(({ event, task, step }) => (
                    <div
                      key={event.id}
                      className="week-unscheduled-event"
                      onPointerDown={(e) => startMove(e, event)}
                      onContextMenu={(e) => openProjectColorMenu(e, task.projectId)}
                      style={{ backgroundColor: getProjectColor(task.projectId) }}
                      title={`${step.title} · ${task.title}`}
                    >
                      {step.title}
                    </div>
                  ))}
                </div>

                <div className="week-time-grid">

                {
                  Array.from(
                    { length: 96 },
                    (_, quarterHour) => (

                      <div
                        key={quarterHour}
                        className="week-hour-row"
                      />

                    )
                  )
                }

                </div>


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
      end,
    }) => {

      const height =
        Math.max(
          event.duration,
          15
        );

      const exactTimePeers = eventLayouts
        .filter((candidate) => candidate.start === start && candidate.end === end)
        .sort((a, b) => a.column - b.column);
      const exactTimePeerIndex = exactTimePeers.findIndex(
        (candidate) => candidate.event.id === event.id
      );
      const sharesExactTime = exactTimePeers.length > 1;
      const layerOffset = 22;
      const width = sharesExactTime
        ? 100 / exactTimePeers.length
        : Math.max(100 - (totalColumns - 1) * layerOffset, 58);
      const left = sharesExactTime
        ? exactTimePeerIndex * width
        : column * layerOffset;

      return (

<div
  key={event.id}
  className={[
    "week-event",
    resizingEventId === event.id ? "resizing" : "",
    selectedEventId === event.id ? "selected" : "",
  ].filter(Boolean).join(" ")}

  onPointerDown={(e) => startMove(e, event)}
  onContextMenu={(e) => openProjectColorMenu(e, task.projectId)}

  style={{
    top: `${start + 44}px`,
    height: `${height}px`,
    left: `calc(${left}% + 4px)`,
    width: `calc(${width}% - 8px)`,
    zIndex: selectedEventId === event.id
      ? 50
      : sharesExactTime ? 3 + exactTimePeerIndex : 2 + column,
    backgroundColor: getProjectColor(task.projectId),
  }}
>

          <div className="week-event-time">
            {formatTimeRange(event.time ?? "00:00", event.duration ?? 60)}
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

      {projectColorMenu && (
        <div
          className="project-color-backdrop"
          onPointerDown={() => setProjectColorMenu(null)}
        >
          <div
            className="project-color-menu"
            style={{ left: projectColorMenu.x, top: projectColorMenu.y }}
            onPointerDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <strong>
              {projects.find((item) => item.id === projectColorMenu.projectId)?.name ?? "Project"}
            </strong>
            <span className="project-color-prompt">Choose a project color</span>
            <div className="project-color-swatches">
              {PROJECT_COLORS.map(({ name, color }) => (
                <button
                  key={name}
                  type="button"
                  className={getProjectColor(projectColorMenu.projectId) === color ? "selected" : ""}
                  style={{ backgroundColor: color }}
                  aria-label={`${name} project color`}
                  title={name}
                  onClick={() => changeProjectColor(color)}
                />
              ))}
            </div>
            <button type="button" onClick={() => setProjectColorMenu(null)}>
              Done
            </button>
          </div>
        </div>
      )}

</div>


);

}
