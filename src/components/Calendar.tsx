'use client';

import React, { useState, useCallback, memo } from 'react';
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
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        locale="ko"
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

const Calendar = () => {
  const [events, setEvents] = useState<EventData[]>([
    { 
      id: '1', 
      title: '프로젝트 미팅', 
      start: `${new Date().toISOString().split('T')[0]}T10:00:00`, 
      end: `${new Date().toISOString().split('T')[0]}T11:30:00`,
      allDay: false, 
      backgroundColor: '#3b82f6' 
    }
  ]);
  
  const [selectedEvent, setSelectedEvent] = useState<Partial<EventData> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const sDate = selectInfo.startStr.split('T')[0];
    const eDate = selectInfo.endStr ? selectInfo.endStr.split('T')[0] : sDate;
    
    const sTime = selectInfo.startStr.includes('T') 
      ? selectInfo.startStr.split('T')[1].substring(0, 5) 
      : '09:00';
    const eTime = selectInfo.endStr?.includes('T') 
      ? selectInfo.endStr.split('T')[1].substring(0, 5) 
      : '10:00';

    setSelectedEvent({
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      allDay: selectInfo.allDay,
    });
    setStartDate(sDate);
    setEndDate(eDate);
    setStartTime(sTime);
    setEndTime(eTime);
    setIsEditing(false);
  }, []);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const sPart = clickInfo.event.startStr;
    const ePart = clickInfo.event.endStr || sPart;
    
    setStartDate(sPart.split('T')[0]);
    setEndDate(ePart.split('T')[0]);
    setStartTime(sPart.includes('T') ? sPart.split('T')[1].substring(0, 5) : '09:00');
    setEndTime(ePart.includes('T') ? ePart.split('T')[1].substring(0, 5) : '10:00');

    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      allDay: clickInfo.event.allDay,
    });
    setIsEditing(true);
  }, []);

  const handleEventChange = useCallback((changeInfo: EventChangeArg) => {
    setEvents(prev => prev.map(ev => 
      ev.id === changeInfo.event.id ? {
        ...ev,
        start: changeInfo.event.startStr,
        end: changeInfo.event.endStr || changeInfo.event.startStr,
        allDay: changeInfo.event.allDay
      } : ev
    ));
  }, []);

  const handleSaveEvent = () => {
    if (!selectedEvent?.title || !startDate) return;

    const fullStart = selectedEvent.allDay ? startDate : `${startDate}T${startTime}:00`;
    const fullEnd = selectedEvent.allDay ? (endDate || startDate) : `${endDate || startDate}T${endTime}:00`;

    const newEvent: EventData = {
      id: selectedEvent.id || Math.random().toString(36).substr(2, 9),
      title: selectedEvent.title,
      start: fullStart,
      end: fullEnd,
      allDay: selectedEvent.allDay || false,
      backgroundColor: isEditing ? (selectedEvent.backgroundColor || '#3b82f6') : '#3b82f6',
    };

    if (isEditing) {
      setEvents(prev => prev.map(ev => ev.id === newEvent.id ? newEvent : ev));
    } else {
      setEvents(prev => [...prev, newEvent]);
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent?.id) {
      setEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
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
          {selectedEvent ? (
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
                    value={selectedEvent?.title || ''}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full text-lg font-semibold p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800"
                    placeholder="제목 입력"
                    autoFocus
                  />
                </div>

                { !selectedEvent?.allDay && dateSetting() }

                <button 
                  onClick={() => setSelectedEvent(prev => prev ? { ...prev, allDay: !prev.allDay } : null)}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    selectedEvent?.allDay ? "bg-blue-500 border-blue-500" : "border-slate-200"
                  )}>
                    {selectedEvent?.allDay && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-sm font-bold text-slate-600">하루 종일</span>
                </button>
              </div>

              <div className="mt-auto pt-8 space-y-4 border-t border-slate-100">
                <button 
                  onClick={handleSaveEvent}
                  disabled={!selectedEvent?.title}
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
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                <Clock className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 font-bold">일정을 선택해 주세요</p>
                <p className="text-slate-400 text-sm mt-1">달력의 빈 칸을 누르거나<br/>기존 일정을 클릭해 보세요</p>
              </div>
            </div>
          )}
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
