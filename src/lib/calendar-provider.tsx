"use client";

import { createContext, type ReactNode, useCallback, useReducer } from "react";
import type { EventWithDetails } from "@/lib/types/events";

export interface CalendarState {
  currentWeekEnd: Date;
  currentWeekStart: Date;
  error: string | null;
  events: EventWithDetails[];
  filters: {
    types?: string[];
    members?: string[];
    tags?: string[];
  };
  loading: boolean;
}

export type CalendarAction =
  | { type: "SET_WEEK"; payload: { start: Date; end: Date } }
  | { type: "NEXT_WEEK" }
  | { type: "PREV_WEEK" }
  | { type: "TODAY" }
  | { type: "SET_EVENTS"; payload: EventWithDetails[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FILTERS"; payload: CalendarState["filters"] }
  | { type: "RESET" };

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

const initialState: CalendarState = {
  currentWeekStart: getWeekStart(new Date()),
  currentWeekEnd: getWeekEnd(new Date()),
  events: [],
  loading: false,
  error: null,
  filters: {},
};

function calendarReducer(
  state: CalendarState,
  action: CalendarAction
): CalendarState {
  switch (action.type) {
    case "SET_WEEK": {
      return {
        ...state,
        currentWeekStart: action.payload.start,
        currentWeekEnd: action.payload.end,
      };
    }
    case "NEXT_WEEK": {
      const nextStart = new Date(state.currentWeekStart);
      nextStart.setDate(nextStart.getDate() + 7);
      return {
        ...state,
        currentWeekStart: nextStart,
        currentWeekEnd: getWeekEnd(nextStart),
      };
    }
    case "PREV_WEEK": {
      const prevStart = new Date(state.currentWeekStart);
      prevStart.setDate(prevStart.getDate() - 7);
      return {
        ...state,
        currentWeekStart: prevStart,
        currentWeekEnd: getWeekEnd(prevStart),
      };
    }
    case "TODAY": {
      const today = new Date();
      return {
        ...state,
        currentWeekStart: getWeekStart(today),
        currentWeekEnd: getWeekEnd(today),
      };
    }
    case "SET_EVENTS": {
      return {
        ...state,
        events: action.payload,
        error: null,
      };
    }
    case "SET_LOADING": {
      return {
        ...state,
        loading: action.payload,
      };
    }
    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload,
      };
    }
    case "SET_FILTERS": {
      return {
        ...state,
        filters: action.payload,
      };
    }
    case "RESET": {
      return initialState;
    }
    default:
      return state;
  }
}

export const CalendarContext = createContext<
  | {
      state: CalendarState;
      dispatch: React.Dispatch<CalendarAction>;
      goToWeek: (date: Date) => void;
      goToNextWeek: () => void;
      goToPrevWeek: () => void;
      goToToday: () => void;
      setEvents: (events: EventWithDetails[]) => void;
      setLoading: (loading: boolean) => void;
      setError: (error: string | null) => void;
      setFilters: (filters: CalendarState["filters"]) => void;
    }
  | undefined
>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const goToWeek = useCallback((date: Date) => {
    const start = getWeekStart(date);
    const end = getWeekEnd(date);
    dispatch({ type: "SET_WEEK", payload: { start, end } });
  }, []);

  const goToNextWeek = useCallback(() => {
    dispatch({ type: "NEXT_WEEK" });
  }, []);

  const goToPrevWeek = useCallback(() => {
    dispatch({ type: "PREV_WEEK" });
  }, []);

  const goToToday = useCallback(() => {
    dispatch({ type: "TODAY" });
  }, []);

  const setEvents = useCallback((events: EventWithDetails[]) => {
    dispatch({ type: "SET_EVENTS", payload: events });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setFilters = useCallback((filters: CalendarState["filters"]) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const value = {
    state,
    dispatch,
    goToWeek,
    goToNextWeek,
    goToPrevWeek,
    goToToday,
    setEvents,
    setLoading,
    setError,
    setFilters,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
