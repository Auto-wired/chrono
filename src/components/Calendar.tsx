'use client';

import React, { useState, useCallback, memo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventChangeArg } from '@fullcalendar/core';
import { X, Trash2, Clock, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EventData {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
}

const CalendarView = memo(({ events, onDateSelect, onEventClick, onEventChange }: any) => {
  return (
    <div className="h-full w-full bg-white rounded-2xl border border-slate-200 overflow-hidden p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        headerToolbar={{
          left: 'prev next today',
          center: 'title',
          right: 'dayGridMonth timeGridWeek timeGridDay',
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        locale="ko"
        unselectAuto={false}
        select={onDateSelect}
        eventClick={onEventClick}
        eventChange={onEventChange}
        height="100%"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        eventClassNames="cursor-pointer hover:brightness-95 rounded-lg border-none px-2 py-1 text-xs font-semibold shadow-sm"
      />
    </div>
  );
});

CalendarView.displayName = 'CalendarView';

import { getEvents, createEvent, updateEvent, deleteEvent } from '@/lib/actions';
import { DEFAULT_EVENT_COLOR, EVENT_COLORS, normalizeStoredColor } from '@/lib/event-colors';

const Calendar = () => {
  const now = new Date();
  const date = `${ now.getFullYear() }-${ `${ now.getMonth() + 1 }`.padStart(2, "0") }-${ `${ now.getDate() }`.padStart(2, "0") }`;
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Partial<EventData> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_EVENT_COLOR);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [allDay, setAllDay] = useState(false);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const sDate = selectInfo.startStr.split('T')[0];
    const sTime = selectInfo.startStr.includes('T') 
      ? selectInfo.startStr.split('T')[1].substring(0, 5) 
      : '09:00';
    const eTime = selectInfo.endStr?.includes('T') 
      ? selectInfo.endStr.split('T')[1].substring(0, 5) 
      : '10:00';

    setSelectedEvent({
      id: Math.random().toString(36).substr(2, 9),
      title: '',
    });
    setTitle("");
    setDescription("");
    setColor(DEFAULT_EVENT_COLOR);
    setStartDate(sDate);
    setEndDate(sDate);
    setStartTime(sTime);
    setEndTime(eTime);
    setAllDay(false);
    setIsEditing(false);
  }, []);

  useEffect(() => {
    handleEventReload();

    window.addEventListener("calendarReload", handleEventReload);

    return () => {
      window.removeEventListener("calendarReload", handleEventReload);
    };
  }, []);

  const handleEventReload = useCallback(async () => {
    setEvents(await getEvents());
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const sPart = clickInfo.event.startStr;
    const ePart = clickInfo.event.endStr || sPart;
    const stored = events.find((ev) => ev.id === clickInfo.event.id);
    const isAllDay = clickInfo.event.allDay ?? stored?.allDay ?? false;

    setTitle(clickInfo.event.title);
    setDescription(stored?.description ?? '');
    setColor(normalizeStoredColor(stored?.backgroundColor));
    setStartDate(sPart.split('T')[0]);
    setEndDate(ePart.split('T')[0]);
    setStartTime(sPart.includes('T') ? sPart.split('T')[1].substring(0, 5) : '09:00');
    setEndTime(ePart.includes('T') ? ePart.split('T')[1].substring(0, 5) : '10:00');
    setAllDay(isAllDay);
    setSelectedEvent({
      id: clickInfo.event.id,
      backgroundColor: stored?.backgroundColor,
      allDay: isAllDay,
      description: stored?.description,
    });
    setIsEditing(true);
  }, [events]);

  const handleEventChange = useCallback(async (changeInfo: EventChangeArg) => {
    const updated = {
      start: changeInfo.event.startStr,
      end: changeInfo.event.endStr || changeInfo.event.startStr,
    };
    
    setEvents(prev => prev.map(ev => 
      ev.id === changeInfo.event.id ? { ...ev, ...updated } : ev
    ));

    try {
      await updateEvent(changeInfo.event.id, updated);
    } catch (error) {
      console.error('Failed to update event:', error);
      // Optional: rollback UI state
    }
  }, []);

  const handleSaveEvent = async () => {
    if (!title || !startDate) return;

    const fullStart = allDay ? startDate : `${startDate}T${startTime}:00`;
    const fullEnd = allDay ? startDate : `${endDate}T${endTime}:00`;
    const eventData = {
      title: title,
      description: description.trim() || undefined,
      start: fullStart,
      end: fullEnd,
      allDay: allDay,
      backgroundColor: color,
    };
    try {
      if (isEditing && selectedEvent?.id) {
        const updatedEvent = await updateEvent(selectedEvent.id, eventData);

        setEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? (updatedEvent as EventData) : ev));
      } else {
        const createdEvent = await createEvent(eventData);

        setEvents(prev => [...prev, createdEvent as EventData]);
      }
      setSelectedEvent(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent?.id) {
      try {
        await deleteEvent(selectedEvent.id);
        setEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
        setSelectedEvent(null);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const dateSetting = () => {
    return (
      <>
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">시작 일시</label>
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none"
            />
            <input 
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">종료 일시</label>
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none"
            />
            <input 
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium outline-none"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="grid grid-cols-[1fr_400px] h-full w-full gap-8 overflow-hidden">
      {/* 달력 영역 - 너비가 고정된 그리드 시스템 내에서 항상 동일한 크기 유지 */}
      <div className="min-w-0 h-full">
        <CalendarView 
          events={events} 
          onDateSelect={handleDateSelect} 
          onEventClick={handleEventClick}
          onEventChange={handleEventChange}
        />
      </div>

      {/* 사이드바 영역 - 미리 확보된 공간 내에서 뿅하고 나타남 (달력 영향 0) */}
      <div className="h-full relative">
        <div className="h-full w-full bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out">
          
          <div className="flex flex-col h-full p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {isEditing ? '일정 수정' : '새 일정 추가'}
                </h2>
                <p className="text-slate-500 text-sm font-medium">내용을 입력해 주세요</p>
              </div>
            </div>
            
            <div className="flex-grow space-y-8 pb-8">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">일정 제목</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-lg font-semibold p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800"
                  placeholder="제목 입력"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">일정 내용</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 text-sm resize-none"
                  placeholder="메모, 장소, 참석자 등"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">일정 색상</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'h-9 w-9 rounded-full border-2 transition-all',
                        color === c.value ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: c.value }}
                      aria-label={`${c.name} 색상`}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setAllDay(prev => !prev)}
                className="flex items-center gap-3 group"
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                  allDay ? "bg-blue-500 border-blue-500" : "border-slate-200"
                )}>
                  {allDay && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm font-bold text-slate-600">하루 종일</span>
              </button>

              { !allDay && dateSetting() }

            </div>

            <div className="mt-auto pt-8 space-y-4 border-t border-slate-100">
              <button 
                onClick={handleSaveEvent}
                disabled={!title}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl hover:bg-slate-800 transition-all font-bold text-base shadow-lg shadow-slate-200"
              >
                {isEditing ? '변경사항 저장' : '일정 추가'}
              </button>
              
              {isEditing && (
                <button 
                  onClick={handleDeleteEvent}
                  className="w-full flex items-center justify-center gap-2 text-red-500 py-4 rounded-2xl hover:bg-red-50 transition-all font-bold text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제하기
                </button>
              )}
            </div>
          </div>
          
        </div>
      </div>

      <style jsx global>{`
        .fc {
          --fc-border-color: #f1f5f9;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #e2e8f0;
          --fc-button-text-color: #475569;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-button-hover-border-color: #cbd5e1;
          --fc-button-active-bg-color: #f1f5f9;
          --fc-today-bg-color: #f8fafc;
        }
        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .fc .fc-button {
          padding: 0.6rem 1rem;
          font-weight: 600;
          border-radius: 12px !important;
          font-size: 0.875rem;
        }
        .fc th {
          padding: 16px 0 !important;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.1em;
          border: none !important;
        }
        .fc-daygrid-day-number {
          font-size: 0.875rem;
          color: #64748b;
          padding: 12px !important;
          font-weight: 500;
        }
        .fc-scrollgrid {
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default Calendar;
