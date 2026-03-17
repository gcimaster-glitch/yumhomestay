import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type Slot = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxGuests: number;
  status: "available" | "booked" | "blocked";
  note: string | null;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function HostCalendar() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const MONTH_NAMES = t("calendar.months", { returnObjects: true }) as string[];
  const DAY_NAMES = t("calendar.days", { returnObjects: true }) as string[];

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Add slot form state
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("14:00");
  const [newMaxGuests, setNewMaxGuests] = useState("6");
  const [newNote, setNewNote] = useState("");

  // Bulk add state
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkDays, setBulkDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [bulkStartTime, setBulkStartTime] = useState("10:00");
  const [bulkEndTime, setBulkEndTime] = useState("14:00");
  const [bulkMaxGuests, setBulkMaxGuests] = useState("6");

  // Quick bulk: set next N months
  const setNextNMonths = (n: number) => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const end = new Date();
    end.setMonth(end.getMonth() + n);
    setBulkStartDate(start.toISOString().slice(0, 10));
    setBulkEndDate(end.toISOString().slice(0, 10));
  };

  const fromDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const lastDay = getDaysInMonth(currentYear, currentMonth);
  const toDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: slots, refetch } = trpc.availability.getMySlots.useQuery(
    { fromDate, toDate },
    { enabled: isAuthenticated }
  );

  const utils = trpc.useUtils();

  const addSlot = trpc.availability.addSlot.useMutation({
    onSuccess: () => {
      toast.success(t("hostCalendar.slotAdded"));
      setShowAddDialog(false);
      setNewNote("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const addBulkSlots = trpc.availability.addBulkSlots.useMutation({
    onSuccess: (data) => {
      toast.success(t("hostCalendar.bulkAdded", { count: data.created }));
      setShowBulkDialog(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSlot = trpc.availability.updateSlot.useMutation({
    onSuccess: () => {
      toast.success(t("hostCalendar.slotUpdated"));
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteSlot = trpc.availability.deleteSlot.useMutation({
    onSuccess: () => {
      toast.success(t("hostCalendar.slotDeleted"));
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    if (!slots) return map;
    for (const s of slots) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s as Slot);
    }
    return map;
  }, [slots]);

  const selectedSlots = selectedDate ? (slotsByDate[selectedDate] ?? []) : [];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleAddSlot = () => {
    if (!selectedDate) return;
    addSlot.mutate({
      date: selectedDate,
      startTime: newStartTime,
      endTime: newEndTime,
      maxGuests: parseInt(newMaxGuests),
      note: newNote || undefined,
    });
  };

  const handleBulkAdd = () => {
    if (!bulkStartDate || !bulkEndDate) {
      toast.error(t("hostCalendar.enterDateRange"));
      return;
    }
    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    const slotsToAdd: Array<{ date: string; startTime: string; endTime: string; maxGuests: number }> = [];
    const cur = new Date(start);
    while (cur <= end && slotsToAdd.length < 60) {
      if (bulkDays.includes(cur.getDay())) {
        slotsToAdd.push({
          date: cur.toISOString().slice(0, 10),
          startTime: bulkStartTime,
          endTime: bulkEndTime,
          maxGuests: parseInt(bulkMaxGuests),
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (slotsToAdd.length === 0) {
      toast.error(t("hostCalendar.noDaysMatch"));
      return;
    }
    addBulkSlots.mutate({ slots: slotsToAdd });
  };

  const toggleBulkDay = (day: number) => {
    setBulkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">{t("common.loginRequired")}</p>
              <p className="text-sm text-muted-foreground mb-4">{t("hostCalendar.loginDesc")}</p>
              <Button onClick={() => navigate("/host/register")}>{t("hostCalendar.loginBtn")}</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-8 flex-1">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("hostCalendar.title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t("hostCalendar.subtitle")}</p>
            </div>
            <Button onClick={() => setShowBulkDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              {t("hostCalendar.bulkRegister")}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle className="text-lg">
                      {t("hostCalendar.yearMonth", { year: currentYear, month: MONTH_NAMES[currentMonth] })}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {DAY_NAMES.map((d, i) => (
                      <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}>
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for first week */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = formatDate(currentYear, currentMonth, day);
                      const daySlots = slotsByDate[dateStr] ?? [];
                      const hasAvailable = daySlots.some(s => s.status === "available");
                      const hasBooked = daySlots.some(s => s.status === "booked");
                      const hasBlocked = daySlots.some(s => s.status === "blocked");
                      const isSelected = dateStr === selectedDate;
                      const isToday = dateStr === today.toISOString().slice(0, 10);
                      const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`
                            relative aspect-square rounded-lg p-1 text-sm transition-colors
                            ${isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"}
                            ${isToday && !isSelected ? "ring-2 ring-primary ring-offset-1" : ""}
                            ${dayOfWeek === 0 && !isSelected ? "text-red-500" : ""}
                            ${dayOfWeek === 6 && !isSelected ? "text-blue-500" : ""}
                          `}
                        >
                          <span className="block text-center">{day}</span>
                          {daySlots.length > 0 && (
                            <div className="flex justify-center gap-0.5 mt-0.5">
                              {hasAvailable && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                              {hasBooked && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                              {hasBlocked && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{t("hostCalendar.available")}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{t("hostCalendar.booked")}</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />{t("hostCalendar.blocked")}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected date panel */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedDate
                      ? t("hostCalendar.slotsForDate", { date: selectedDate.replace(/-/g, "/") })
                      : t("hostCalendar.selectDate")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate ? (
                    <>
                      {selectedSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("hostCalendar.noSlots")}
                        </p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {selectedSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center justify-between p-2 rounded-lg border">
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Clock className="w-3 h-3" />
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <Users className="w-3 h-3" />
                                  {t("hostCalendar.maxGuests", { count: slot.maxGuests })}
                                  <Badge
                                    variant={slot.status === "available" ? "default" : slot.status === "booked" ? "secondary" : "outline"}
                                    className="text-xs py-0"
                                  >
                                    {slot.status === "available" ? t("hostCalendar.available") : slot.status === "booked" ? t("hostCalendar.booked") : t("hostCalendar.blocked")}
                                  </Badge>
                                </div>
                                {slot.note && <p className="text-xs text-muted-foreground mt-0.5">{slot.note}</p>}
                              </div>
                              <div className="flex gap-1">
                                {slot.status === "available" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => updateSlot.mutate({ id: slot.id, status: "blocked" })}
                                    title={t("hostCalendar.block")}
                                  >
                                    <span className="text-xs">🚫</span>
                                  </Button>
                                )}
                                {slot.status === "blocked" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => updateSlot.mutate({ id: slot.id, status: "available" })}
                                    title={t("hostCalendar.unblock")}
                                  >
                                    <span className="text-xs">✅</span>
                                  </Button>
                                )}
                                {slot.status !== "booked" && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => deleteSlot.mutate({ id: slot.id })}
                                    title={t("common.delete")}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={() => setShowAddDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("hostCalendar.addSlotForDate")}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t("hostCalendar.selectDatePrompt")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Add Slot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hostCalendar.addSlotTitle", { date: selectedDate?.replace(/-/g, "/") })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("hostCalendar.startTime")}</Label>
                <Input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("hostCalendar.endTime")}</Label>
                <Input type="time" value={newEndTime} onChange={e => setNewEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("hostCalendar.maxGuestsLabel")}</Label>
              <Select value={newMaxGuests} onValueChange={setNewMaxGuests}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <SelectItem key={n} value={String(n)}>{t("hostCalendar.guestCount", { count: n })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("hostCalendar.noteLabel")}</Label>
              <Input
                placeholder={t("hostCalendar.notePlaceholder")}
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleAddSlot} disabled={addSlot.isPending}>
              {addSlot.isPending ? t("common.processing") : t("hostCalendar.addBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("hostCalendar.bulkTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Quick period buttons */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("hostCalendar.quickPeriod")}</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { labelKey: "hostCalendar.untilMonthEnd", months: 0 },
                  { labelKey: "hostCalendar.oneMonth", months: 1 },
                  { labelKey: "hostCalendar.twoMonths", months: 2 },
                  { labelKey: "hostCalendar.threeMonths", months: 3 },
                ].map(({ labelKey, months }) => (
                  <button
                    key={labelKey}
                    type="button"
                    onClick={() => setNextNMonths(months)}
                    className="px-3 py-1 text-xs rounded-full border border-border hover:bg-muted transition-colors"
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("hostCalendar.startDate")}</Label>
                <Input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="space-y-1">
                <Label>{t("hostCalendar.endDate")}</Label>
                <Input type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} min={bulkStartDate || new Date().toISOString().slice(0, 10)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("hostCalendar.targetDays")}</Label>
              <div className="flex gap-2 flex-wrap">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleBulkDay(i)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                      bulkDays.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    } ${i === 0 ? "text-red-500" : ""} ${i === 6 ? "text-blue-500" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>{t("hostCalendar.startTime")}</Label>
                <Input type="time" value={bulkStartTime} onChange={e => setBulkStartTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t("hostCalendar.endTime")}</Label>
                <Input type="time" value={bulkEndTime} onChange={e => setBulkEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>{t("hostCalendar.maxGuestsLabel")}</Label>
              <Select value={bulkMaxGuests} onValueChange={setBulkMaxGuests}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                    <SelectItem key={n} value={String(n)}>{t("hostCalendar.guestCount", { count: n })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleBulkAdd} disabled={addBulkSlots.isPending}>
              {addBulkSlots.isPending ? t("common.processing") : t("hostCalendar.bulkRegisterBtn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
