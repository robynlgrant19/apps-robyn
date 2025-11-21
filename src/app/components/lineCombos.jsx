"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

/* ---------------------------------------------------------
      PLAYER CARD (draggable, Apple-style)
---------------------------------------------------------- */
function PlayerCard({ id, player, size = "canvas" }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: 50,
  };

  if (!player) return null;

  const fallbackPhoto =
    `/playerPhotos/${player.firstName}${player.lastName}`.toLowerCase() + ".jpg";
  const defaultPhoto = "/playerPhotos/defaultProfile.png";
  const imagePath = player.photo || fallbackPhoto;

  /* Size presets */
  const isSidebar = size === "sidebar";

  const picSize = isSidebar ? "w-8 h-8" : "w-12 h-12";
  const textSize = isSidebar ? "text-[11px]" : "text-[13px]";
  const cardPadding = isSidebar ? "px-2 py-1.5" : "px-3 py-2";
  const shadowStyle = isSidebar ? "shadow-none" : "shadow-sm hover:shadow-md";
  const gapSize = isSidebar ? "gap-2" : "gap-3";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`
        relative
        ${cardPadding}
        bg-white 
        rounded-xl 
        border border-gray-200 
        ${shadowStyle}
        cursor-grab 
        select-none 
        hover:bg-gray-50 
        active:scale-[0.98]
        transition-all 
        duration-150 
        flex 
        items-center 
        ${gapSize}
      `}
    >
      {/* Jersey number badge — N3: transparent, thin border, minimal */}
      {!isSidebar && (
        <div
          className="
            absolute 
            -top-1.5 
            -right-1.5 
            w-6 h-6 
            rounded-full
            border border-gray-300
            text-gray-700 
            text-[10px]
            font-semibold
            flex items-center justify-center
            bg-transparent
            backdrop-blur-sm
          "
        >
          {player.jerseyNumber || "–"}
        </div>
      )}

      {/* Profile Picture */}
      <div
        className={`rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0 ${picSize}`}
      >
        <img
          src={imagePath}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultPhoto;
          }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Name */}
      <div className="flex flex-col min-w-0">
        <span
          className={`font-semibold text-gray-900 truncate ${textSize}`}
        >
          {player.firstName} {player.lastName}
        </span>
      </div>
    </div>
  );
}





/* ---------------------------------------------------------
      PLACEHOLDER SLOT (empty slot)
---------------------------------------------------------- */
function Placeholder({ id }) {
  const { setNodeRef } = useSortable({ id });

  // Label is in the parent context; we just render a clean empty slot
  return (
    <div
      ref={setNodeRef}
      className="
        px-4 py-3 
        bg-slate-50 
        text-[10px] 
        text-gray-400 
        rounded-xl 
        border border-dashed border-gray-300 
        flex items-center justify-center 
        min-w-[80px]
      "
    >
      Empty
    </div>
  );
}

/* ---------------------------------------------------------
      HELPERS
---------------------------------------------------------- */

function findContainer(state, itemId) {
  if (itemId.startsWith("placeholder-")) {
    return itemId.replace("placeholder-", "");
  }

  return (
    Object.keys(state).find((key) => {
      const arr = state[key];
      return Array.isArray(arr) && arr.includes(itemId);
    }) || null
  );
}

function getRoleFromSlotId(slotId) {
  return slotId.split("-")[1] || "";
}

/* Debounce to prevent spam writes to Firestore */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* Small UI wrappers for clean layout */
function SidebarSection({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-[11px] text-gray-600 mb-2 uppercase tracking-wide">
        {title}
      </h3>
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

function LineGroup({ title, children }) {
  return (
    <div
      className="
        bg-white 
        border border-gray-200 
        rounded-2xl 
        shadow-sm 
        px-4 py-3 
        flex flex-col gap-2
      "
    >
      <div className="text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {title}
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------
      MAIN COMPONENT
---------------------------------------------------------- */
export default function LineCombinations({ players, teamColors, teamId }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [activeId, setActiveId] = useState(null);
  const [mode, setMode] = useState("forwards");

  // Player groups
  const forwards = players.filter((p) =>
    p.position?.toUpperCase().startsWith("F")
  );
  const defense = players.filter((p) =>
    p.position?.toUpperCase().startsWith("D")
  );

  const allPlayers = players;

  const resetLines = () => {
  const emptyLines = {
    unit1: { LW: null, C: null, RW: null, LD: null, RD: null },
    unit2: { LW: null, C: null, RW: null, LD: null, RD: null },
    unit3: { LW: null, C: null, RW: null, LD: null, RD: null },
    unit4: { LW: null, C: null, RW: null, LD: null, RD: null },
    unit5: { LW: null, C: null, RW: null, LD: null, RD: null },
  };

  const clearedAvailable = players.map((p) => p.id);

  setLines(emptyLines);
  setAvailablePlayers(clearedAvailable);

  // Save reset to Firestore
  saveLines(emptyLines, clearedAvailable);
};


  /* ---------------------------------------------------------
          Setup slot IDs
  ---------------------------------------------------------- */
  const forwardSlots = [];
  const defenseSlots = [];
  const unitForwardSlots = [];
  const unitDefenseSlots = [];

  for (let i = 1; i <= 5; i++) {
    forwardSlots.push(`line${i}-LW`, `line${i}-C`, `line${i}-RW`);
    defenseSlots.push(`pair${i}-LD`, `pair${i}-RD`);

    unitForwardSlots.push(`unit${i}F-LW`, `unit${i}F-C`, `unit${i}F-RW`);
    unitDefenseSlots.push(`unit${i}D-LD`, `unit${i}D-RD`);
  }

  /* ---------------------------------------------------------
          State for each mode
  ---------------------------------------------------------- */
  const [forwardState, setForwardState] = useState(null);
  const [defenseState, setDefenseState] = useState(null);
  const [unitState, setUnitState] = useState(null);

  /* ---------------------------------------------------------
          Initialize empty state
  ---------------------------------------------------------- */
  useEffect(() => {
    const f = { available: forwards.map((p) => p.id) };
    forwardSlots.forEach((slot) => (f[slot] = []));
    setForwardState(f);

    const d = { available: defense.map((p) => p.id) };
    defenseSlots.forEach((slot) => (d[slot] = []));
    setDefenseState(d);

    const u = {
      availableForwards: forwards.map((p) => p.id),
      availableDefense: defense.map((p) => p.id),
    };
    unitForwardSlots.forEach((slot) => (u[slot] = []));
    unitDefenseSlots.forEach((slot) => (u[slot] = []));
    setUnitState(u);
  }, [players]);

  /* ---------------------------------------------------------
          Load saved lines from Firestore
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!teamId) return;

    const load = async () => {
      const ref = doc(db, "teams", teamId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();

      if (data.savedForwardLines) setForwardState(data.savedForwardLines);
      if (data.savedDefensePairs) setDefenseState(data.savedDefensePairs);
      if (data.savedUnits) setUnitState(data.savedUnits);
    };

    load();
  }, [teamId]);

  /* ---------------------------------------------------------
          SAVE to Firestore (debounced)
  ---------------------------------------------------------- */

  const saveForwards = useCallback(
    debounce((state) => {
      if (!teamId) return;
      updateDoc(doc(db, "teams", teamId), { savedForwardLines: state });
    }, 200),
    []
  );

  const saveDefensePairs = useCallback(
    debounce((state) => {
      if (!teamId) return;
      updateDoc(doc(db, "teams", teamId), { savedDefensePairs: state });
    }, 200),
    []
  );

  const saveUnits = useCallback(
    debounce((state) => {
      if (!teamId) return;
      updateDoc(doc(db, "teams", teamId), { savedUnits: state });
    }, 200),
    []
  );

  useEffect(() => {
    if (forwardState && teamId) saveForwards(forwardState);
  }, [forwardState, teamId]);

  useEffect(() => {
    if (defenseState && teamId) saveDefensePairs(defenseState);
  }, [defenseState, teamId]);

  useEffect(() => {
    if (unitState && teamId) saveUnits(unitState);
  }, [unitState, teamId]);

  /* ---------------------------------------------------------
          DRAG LOGIC
  ---------------------------------------------------------- */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const fromId = active.id;
    const toId = over.id;
    if (fromId === toId) return;

    if (mode === "forwards") {
      setForwardState((prev) => moveItem(prev, fromId, toId, "F"));
    } else if (mode === "defense") {
      setDefenseState((prev) => moveItem(prev, fromId, toId, "D"));
    } else if (mode === "units") {
      setUnitState((prev) => moveUnit(prev, fromId, toId));
    }

    setActiveId(null);
  };

  /* ---------------------------------------------------------
          MOVE LOGIC (for forwards and defense)
  ---------------------------------------------------------- */
  function moveItem(state, fromId, toId, type) {
    if (!state) return state;

    const newState = { ...state };
    const from = findContainer(newState, fromId);
    const to = findContainer(newState, toId);

    if (!from || !to) return state;

    const isForward = type === "F";

    // Enforce destination type (lines for F, pairs for D, or available)
    if (isForward && to !== "available" && !to.startsWith("line")) return state;
    if (!isForward && to !== "available" && !to.startsWith("pair")) return state;

    // Can't drop on a filled slot (non-available)
    if (to !== "available" && newState[to].length >= 1) {
      return state;
    }

    const fromArr = [...newState[from]];
    const idx = fromArr.indexOf(fromId);
    if (idx !== -1) fromArr.splice(idx, 1);

    const toArr = [...newState[to]];
    if (!toArr.includes(fromId)) toArr.push(fromId);

    newState[from] = fromArr;
    newState[to] = toArr;

    return newState;
  }

  /* ---------------------------------------------------------
          MOVE LOGIC (units)
  ---------------------------------------------------------- */
  function moveUnit(state, fromId, toId) {
    if (!state) return state;

    const newState = { ...state };
    const from = findContainer(newState, fromId);
    const to = findContainer(newState, toId);

    if (!from || !to) return state;

    const isForward = forwards.some((p) => p.id === fromId);
    const isDefenseP = defense.some((p) => p.id === fromId);

    const toIsForward =
      to === "availableForwards" || (to.startsWith("unit") && to.includes("F-"));
    const toIsDefense =
      to === "availableDefense" || (to.startsWith("unit") && to.includes("D-"));

    // Enforce F vs D separation
    if (isForward && !toIsForward) return state;
    if (isDefenseP && !toIsDefense) return state;

    // Only 1 per slot (non-available pools)
    if (
      to !== "availableForwards" &&
      to !== "availableDefense" &&
      newState[to].length >= 1
    ) {
      return state;
    }

    const fromArr = [...newState[from]];
    const idx = fromArr.indexOf(fromId);
    if (idx !== -1) fromArr.splice(idx, 1);

    const toArr = [...newState[to]];
    if (!toArr.includes(fromId)) toArr.push(fromId);

    newState[from] = fromArr;
    newState[to] = toArr;

    return newState;
  }

  /* ---------------------------------------------------------
          SIDEBAR RENDERERS
  ---------------------------------------------------------- */

  const renderSidebarForwards = () => {
    if (!forwardState) return null;
    const state = forwardState;

    return (
      <SidebarSection title="Available Forwards">
        <SortableContext
          id="available"
          items={
            state.available.length > 0
              ? state.available
              : ["placeholder-available"]
          }
          strategy={horizontalListSortingStrategy}
        >
          {state.available.length === 0 ? (
            <Placeholder id="placeholder-available" />
          ) : (
            state.available.map((id) => (
              <PlayerCard
                key={id}
                id={id}
                player={forwards.find((p) => p.id === id)}
                size = "sidebar"
              />
            ))
          )}
        </SortableContext>
      </SidebarSection>
    );
  };

  const renderSidebarDefense = () => {
    if (!defenseState) return null;
    const state = defenseState;

    return (
      <SidebarSection title="Available Defense">
        <SortableContext
          id="available"
          items={
            state.available.length > 0
              ? state.available
              : ["placeholder-available"]
          }
          strategy={horizontalListSortingStrategy}
        >
          {state.available.length === 0 ? (
            <Placeholder id="placeholder-available" />
          ) : (
            state.available.map((id) => (
              <PlayerCard
                key={id}
                id={id}
                player={defense.find((p) => p.id === id)}
                size = "sidebar"
              />
            ))
          )}
        </SortableContext>
      </SidebarSection>
    );
  };

  const renderSidebarUnits = () => {
  if (!unitState) return null;
  const state = unitState;

  return (
    <>
      <SidebarSection title="Available Forwards">
        <SortableContext
          id="availableForwards"
          items={
            state.availableForwards.length > 0
              ? state.availableForwards
              : ["placeholder-availableForwards"]
          }
          strategy={horizontalListSortingStrategy}
        >
          {state.availableForwards.length === 0 ? (
            <Placeholder id="placeholder-availableForwards" />
          ) : (
            state.availableForwards.map((id) => (
              <PlayerCard
                key={id}
                id={id}
                player={forwards.find((p) => p.id === id)}
                size="sidebar"
              />
            ))
          )}
        </SortableContext>
      </SidebarSection>

      <SidebarSection title="Available Defense">
  <SortableContext
    id="availableDefense"
    items={
      state.availableDefense.length > 0
        ? state.availableDefense
        : ["placeholder-availableDefense"]
    }
    strategy={horizontalListSortingStrategy}
  >
    {state.availableDefense.length === 0 ? (
      <Placeholder id="placeholder-availableDefense" />
    ) : (
      state.availableDefense.map((id) => (
        <PlayerCard
          key={id}
          id={id}
          player={defense.find((p) => p.id === id)}
          size="sidebar"     // ✅ FIXED
        />
      ))
    )}
  </SortableContext>
</SidebarSection>


    </>
  );
};


  /* ---------------------------------------------------------
          MAIN PANEL RENDERERS
  ---------------------------------------------------------- */

  const renderMainForwards = () => {
    if (!forwardState) return null;
    const state = forwardState;
    const lines = [1, 2, 3, 4, 5];

    return (
      <div className="space-y-4">
        {lines.map((n) => {
          const lw = `line${n}-LW`;
          const c = `line${n}-C`;
          const rw = `line${n}-RW`;

          return (
            <LineGroup key={n} title={`Line ${n}`}>
              {[lw, c, rw].map((slotId) => {
                const ids = state[slotId] || [];
                const items = ids.length > 0 ? ids : [`placeholder-${slotId}`];
                const role = getRoleFromSlotId(slotId);

                return (
                  <div className="flex flex-col items-center gap-1" key={slotId}>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      {role}
                    </span>
                    <SortableContext
                      id={slotId}
                      items={items}
                      strategy={horizontalListSortingStrategy}
                    >
                      {items.map((id) =>
                        id.startsWith("placeholder-") ? (
                          <Placeholder key={id} id={id} />
                        ) : (
                          <PlayerCard
                            key={id}
                            id={id}
                            player={forwards.find((p) => p.id === id)}
                            size = "canvas"
                          />
                        )
                      )}
                    </SortableContext>
                  </div>
                );
              })}
            </LineGroup>
          );
        })}
      </div>
    );
  };

  const renderMainDefense = () => {
    if (!defenseState) return null;
    const state = defenseState;
    const pairs = [1, 2, 3, 4, 5];

    return (
      <div className="space-y-4">
        {pairs.map((n) => {
          const ld = `pair${n}-LD`;
          const rd = `pair${n}-RD`;

          return (
            <LineGroup key={n} title={`Pair ${n}`}>
              {[ld, rd].map((slotId) => {
                const ids = state[slotId] || [];
                const items = ids.length > 0 ? ids : [`placeholder-${slotId}`];
                const role = getRoleFromSlotId(slotId);

                return (
                  <div className="flex flex-col items-center gap-1" key={slotId}>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">
                      {role}
                    </span>
                    <SortableContext
                      id={slotId}
                      items={items}
                      strategy={horizontalListSortingStrategy}
                    >
                      {items.map((id) =>
                        id.startsWith("placeholder-") ? (
                          <Placeholder key={id} id={id} />
                        ) : (
                          <PlayerCard
                            key={id}
                            id={id}
                            player={defense.find((p) => p.id === id)}
                          />
                        )
                      )}
                    </SortableContext>
                  </div>
                );
              })}
            </LineGroup>
          );
        })}
      </div>
    );
  };

  const renderMainUnits = () => {
    if (!unitState) return null;
    const state = unitState;
    const units = [1, 2, 3, 4, 5];

    return (
      <div className="space-y-4">
        {units.map((n) => {
          const fSlots = [
            `unit${n}F-LW`,
            `unit${n}F-C`,
            `unit${n}F-RW`,
          ];
          const dSlots = [`unit${n}D-LD`, `unit${n}D-RD`];

          return (
            <div
              key={n}
              className="
                bg-white 
                border border-gray-200 
                rounded-2xl 
                shadow-sm 
                px-4 py-3 
                flex flex-col gap-3
              "
            >
              <div className="text-[11px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Unit {n}
              </div>

              <LineGroup title="Forwards">
                {fSlots.map((slotId) => {
                  const ids = state[slotId] || [];
                  const items = ids.length ? ids : [`placeholder-${slotId}`];
                  const role = getRoleFromSlotId(slotId);

                  return (
                    <div
                      className="flex flex-col items-center gap-1"
                      key={slotId}
                    >
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {role}
                      </span>
                      <SortableContext
                        id={slotId}
                        items={items}
                        strategy={horizontalListSortingStrategy}
                      >
                        {items.map((id) =>
                          id.startsWith("placeholder-") ? (
                            <Placeholder key={id} id={id} />
                          ) : (
                            <PlayerCard
                              key={id}
                              id={id}
                              player={forwards.find((p) => p.id === id)}
                            />
                          )
                        )}
                      </SortableContext>
                    </div>
                  );
                })}
              </LineGroup>

              <LineGroup title="Defense">
                {dSlots.map((slotId) => {
                  const ids = state[slotId] || [];
                  const items = ids.length ? ids : [`placeholder-${slotId}`];
                  const role = getRoleFromSlotId(slotId);

                  return (
                    <div
                      className="flex flex-col items-center gap-1"
                      key={slotId}
                    >
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        {role}
                      </span>
                      <SortableContext
                        id={slotId}
                        items={items}
                        strategy={horizontalListSortingStrategy}
                      >
                        {items.map((id) =>
                          id.startsWith("placeholder-") ? (
                            <Placeholder key={id} id={id} />
                          ) : (
                            <PlayerCard
                              key={id}
                              id={id}
                              player={defense.find((p) => p.id === id)}
                              size = "canvas"
                            />
                          )
                        )}
                      </SortableContext>
                    </div>
                  );
                })}
              </LineGroup>
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------------------------------------------------------
          MAIN RENDER
  ---------------------------------------------------------- */
  return (
    <div className="w-full bg-gradient-to-b from-slate-50 to-white rounded-2xl shadow-lg ring-1 ring-slate-200 p-5 sm:p-6">
      {/* Header + mode toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Line Combinations
          </h2>
          <p className="text-xs text-gray-500">
            Drag players from the left panel into your lines, pairs, or units.
          </p>
        </div>

        

        <div className="flex flex-wrap gap-2 bg-slate-100 rounded-full p-1">
          {[
            { key: "forwards", label: "Forward Lines" },
            { key: "defense", label: "Defense Pairs" },
            { key: "units", label: "5-Man Units" },
          ].map((o) => (
            <button
              key={o.key}
              onClick={() => setMode(o.key)}
              className={`
                px-3 py-1.5 
                rounded-full 
                text-[11px] sm:text-xs 
                font-semibold 
                transition-all 
                duration-150
                ${
                  mode === o.key
                    ? `${teamColors?.bg || "bg-emerald-600"} text-white shadow-sm`
                    : "bg-transparent text-gray-600 hover:bg-white"
                }
              `}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: sidebar + canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="w-[250px] shrink-0">
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-3 max-h-[520px] overflow-y-auto">
              {mode === "forwards" && renderSidebarForwards()}
              {mode === "defense" && renderSidebarDefense()}
              {mode === "units" && renderSidebarUnits()}
            </div>
          </aside>

          {/* RIGHT MAIN CANVAS */}
          <main className="flex-1">
            {mode === "forwards" && renderMainForwards()}
            {mode === "defense" && renderMainDefense()}
            {mode === "units" && renderMainUnits()}
          </main>
        </div>

        {/* Drag preview */}
        <DragOverlay>
          {activeId && !activeId.startsWith("placeholder-") && (
            <PlayerCard
              id={activeId}
              player={allPlayers.find((p) => p.id === activeId)}
              size = "canvas"
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}









