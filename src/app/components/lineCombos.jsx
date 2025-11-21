"use client";

import React, { useState, useEffect } from "react";
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
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------- Sortable Player Card ----------
function PlayerCard({ id, player }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!player) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="px-3 py-2 mb-1 text-center bg-white rounded-lg border shadow-sm cursor-grab hover:bg-gray-50 text-xs sm:text-sm select-none"
    >
      {player.firstName} {player.lastName}
    </div>
  );
}

// ---------- Sortable Placeholder ----------
function Placeholder({ id, label }) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="px-3 py-2 mb-1 text-center text-gray-400 italic bg-gray-50 rounded-md border border-dashed text-[10px] sm:text-xs select-none"
    >
      {label || "Drag players here"}
    </div>
  );
}

// ---------- Helper: find container for an item ----------
function findContainer(state, itemId) {
  if (itemId.startsWith("placeholder-")) {
    // e.g. placeholder-line1F => line1F
    return itemId.replace("placeholder-", "");
  }
  return Object.keys(state).find((key) => state[key].includes(itemId)) || null;
}

export default function LineCombinations({ players, teamColors }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const [activeId, setActiveId] = useState(null);
  const [mode, setMode] = useState("forwards"); // "forwards" | "defense" | "units"

  // Split players by position
  const forwards = players.filter((p) =>
    p.position?.toUpperCase().startsWith("F")
  );
  const defense = players.filter((p) =>
    p.position?.toUpperCase().startsWith("D")
  );

  const allPlayers = [...forwards, ...defense];

  // ---------- State for each mode ----------
  const [forwardState, setForwardState] = useState({
    available: [],
    line1: [],
    line2: [],
    line3: [],
    line4: [],
    line5: [],
  });

  const [defenseState, setDefenseState] = useState({
    available: [],
    pair1: [],
    pair2: [],
    pair3: [],
    pair4: [],
    pair5: [],
  });

  const [unitState, setUnitState] = useState({
    availableForwards: [],
    availableDefense: [],
    unit1F: [],
    unit1D: [],
    unit2F: [],
    unit2D: [],
    unit3F: [],
    unit3D: [],
    unit4F: [],
    unit4D: [],
    unit5F: [],
    unit5D: [],
  });

  // Init state when players change
  useEffect(() => {
    setForwardState({
      available: forwards.map((p) => p.id),
      line1: [],
      line2: [],
      line3: [],
      line4: [],
      line5: [],
    });

    setDefenseState({
      available: defense.map((p) => p.id),
      pair1: [],
      pair2: [],
      pair3: [],
      pair4: [],
      pair5: [],
    });

    setUnitState({
      availableForwards: forwards.map((p) => p.id),
      availableDefense: defense.map((p) => p.id),
      unit1F: [],
      unit1D: [],
      unit2F: [],
      unit2D: [],
      unit3F: [],
      unit3D: [],
      unit4F: [],
      unit4D: [],
      unit5F: [],
      unit5D: [],
    });
  }, [players]);

  // ---------- Drag End Logic ----------
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (mode === "forwards") {
      setForwardState((prev) => {
        const state = { ...prev };
        const from = findContainer(state, activeId);
        const to = findContainer(state, overId);
        if (!from || !to) return prev;

        const fromItems = [...state[from]];
        const toItems = [...state[to]];

        const fromIndex = fromItems.indexOf(activeId);
        if (fromIndex !== -1) fromItems.splice(fromIndex, 1);

        // Max 3 per line, unlimited in available
        const max = to === "available" ? Infinity : 3;
        if (to !== "available" && toItems.length >= max) return prev;

        let insertIndex = toItems.length;
        if (!overId.startsWith("placeholder-")) {
          const overIndex = toItems.indexOf(overId);
          insertIndex = overIndex === -1 ? toItems.length : overIndex;
        }
        toItems.splice(insertIndex, 0, activeId);

        state[from] = fromItems;
        state[to] = toItems;
        return state;
      });
    } else if (mode === "defense") {
      setDefenseState((prev) => {
        const state = { ...prev };
        const from = findContainer(state, activeId);
        const to = findContainer(state, overId);
        if (!from || !to) return prev;

        const fromItems = [...state[from]];
        const toItems = [...state[to]];

        const fromIndex = fromItems.indexOf(activeId);
        if (fromIndex !== -1) fromItems.splice(fromIndex, 1);

        // Max 2 per pair, unlimited in available
        const max = to === "available" ? Infinity : 2;
        if (to !== "available" && toItems.length >= max) return prev;

        let insertIndex = toItems.length;
        if (!overId.startsWith("placeholder-")) {
          const overIndex = toItems.indexOf(overId);
          insertIndex = overIndex === -1 ? toItems.length : overIndex;
        }
        toItems.splice(insertIndex, 0, activeId);

        state[from] = fromItems;
        state[to] = toItems;
        return state;
      });
    } else if (mode === "units") {
      setUnitState((prev) => {
        const state = { ...prev };
        const from = findContainer(state, activeId);
        const to = findContainer(state, overId);
        if (!from || !to) return prev;

        // Determine if player is F or D
        const isForward = forwards.some((p) => p.id === activeId);
        const isDefensePlayer = defense.some((p) => p.id === activeId);

        const toIsForwardContainer =
          to === "availableForwards" || to.endsWith("F");
        const toIsDefenseContainer =
          to === "availableDefense" || to.endsWith("D");

        // Enforce F1 strict role at F/D level:
        // - forwards only in F containers
        // - D only in D containers
        if (isForward && !toIsForwardContainer && !from.endsWith("F")) {
          return prev;
        }
        if (isDefensePlayer && !toIsDefenseContainer && !from.endsWith("D")) {
          return prev;
        }

        const fromItems = [...state[from]];
        const toItems = [...state[to]];

        const fromIndex = fromItems.indexOf(activeId);
        if (fromIndex !== -1) fromItems.splice(fromIndex, 1);

        // Max slots: 3 for F units, 2 for D units, unlimited in available pools
        let max = Infinity;
        if (to.endsWith("F")) max = 3;
        if (to.endsWith("D")) max = 2;
        if (
          (to.endsWith("F") || to.endsWith("D")) &&
          toItems.length >= max
        ) {
          return prev;
        }

        let insertIndex = toItems.length;
        if (!overId.startsWith("placeholder-")) {
          const overIndex = toItems.indexOf(overId);
          insertIndex = overIndex === -1 ? toItems.length : overIndex;
        }
        toItems.splice(insertIndex, 0, activeId);

        state[from] = fromItems;
        state[to] = toItems;
        return state;
      });
    }
  };

  // ---------- Render Helpers ----------

  const renderForwardsMode = () => {
    const state = forwardState;
    const containers = ["line1", "line2", "line3", "line4", "line5"];
    const lineLabels = {
      line1: "Line 1 — LW / C / RW",
      line2: "Line 2 — LW / C / RW",
      line3: "Line 3 — LW / C / RW",
      line4: "Line 4 — LW / C / RW",
      line5: "Line 5 — LW / C / RW",
    };

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={(e) => {
          handleDragEnd(e);
          setActiveId(null);
        }}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Available Forwards */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-sm text-gray-700">
            Available Forwards
          </h3>
          <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg border p-3">
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
                <Placeholder
                  id="placeholder-available"
                  label="Drag forwards back here"
                />
              ) : (
                state.available.map((id) => {
                  const player = forwards.find((p) => p.id === id);
                  return <PlayerCard key={id} id={id} player={player} />;
                })
              )}
            </SortableContext>
          </div>
        </div>

        {/* Forward Lines (5 rows) */}
        <div className="flex flex-col gap-4">
          {containers.map((containerId) => {
            const ids = state[containerId];
            const items =
              ids.length > 0 ? ids : [`placeholder-${containerId}`];

            return (
              <div
                key={containerId}
                className="flex flex-col gap-1 bg-gray-50 rounded-lg border p-3"
              >
                <div className="text-xs font-semibold text-gray-600">
                  {lineLabels[containerId]}
                </div>
                <div className="flex items-center gap-2">
                  <SortableContext
                    id={containerId}
                    items={items}
                    strategy={horizontalListSortingStrategy}
                  >
                    {items.map((id) => {
                      if (id.startsWith("placeholder-")) {
                        return (
                          <Placeholder
                            key={id}
                            id={id}
                            label="Drop F here"
                          />
                        );
                      }
                      const player = forwards.find((p) => p.id === id);
                      return <PlayerCard key={id} id={id} player={player} />;
                    })}
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && !activeId.startsWith("placeholder-") && (
            <PlayerCard
              id={activeId}
              player={forwards.find((p) => p.id === activeId)}
            />
          )}
        </DragOverlay>
      </DndContext>
    );
  };

  const renderDefenseMode = () => {
    const state = defenseState;
    const containers = ["pair1", "pair2", "pair3", "pair4", "pair5"];
    const pairLabels = {
      pair1: "Pair 1 — LD / RD",
      pair2: "Pair 2 — LD / RD",
      pair3: "Pair 3 — LD / RD",
      pair4: "Pair 4 — LD / RD",
      pair5: "Pair 5 — LD / RD",
    };

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={(e) => {
          handleDragEnd(e);
          setActiveId(null);
        }}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Available Defense */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-sm text-gray-700">
            Available Defense
          </h3>
          <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg border p-3">
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
                <Placeholder
                  id="placeholder-available"
                  label="Drag D back here"
                />
              ) : (
                state.available.map((id) => {
                  const player = defense.find((p) => p.id === id);
                  return <PlayerCard key={id} id={id} player={player} />;
                })
              )}
            </SortableContext>
          </div>
        </div>

        {/* Defense Pairs */}
        <div className="flex flex-col gap-4">
          {containers.map((containerId) => {
            const ids = state[containerId];
            const items =
              ids.length > 0 ? ids : [`placeholder-${containerId}`];

            return (
              <div
                key={containerId}
                className="flex flex-col gap-1 bg-gray-50 rounded-lg border p-3"
              >
                <div className="text-xs font-semibold text-gray-600">
                  {pairLabels[containerId]}
                </div>
                <div className="flex items-center gap-2">
                  <SortableContext
                    id={containerId}
                    items={items}
                    strategy={horizontalListSortingStrategy}
                  >
                    {items.map((id) => {
                      if (id.startsWith("placeholder-")) {
                        return (
                          <Placeholder
                            key={id}
                            id={id}
                            label="Drop D here"
                          />
                        );
                      }
                      const player = defense.find((p) => p.id === id);
                      return <PlayerCard key={id} id={id} player={player} />;
                    })}
                  </SortableContext>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && !activeId.startsWith("placeholder-") && (
            <PlayerCard
              id={activeId}
              player={defense.find((p) => p.id === activeId)}
            />
          )}
        </DragOverlay>
      </DndContext>
    );
  };

  const renderUnitsMode = () => {
    const state = unitState;
    const units = [1, 2, 3, 4, 5];

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={(e) => {
          handleDragEnd(e);
          setActiveId(null);
        }}
        onDragCancel={() => setActiveId(null)}
      >
        {/* Available Forwards & Defense */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold mb-2 text-sm text-gray-700">
              Available Forwards
            </h3>
            <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg border p-3">
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
                  <Placeholder
                    id="placeholder-availableForwards"
                    label="Drag F back here"
                  />
                ) : (
                  state.availableForwards.map((id) => {
                    const player = forwards.find((p) => p.id === id);
                    return <PlayerCard key={id} id={id} player={player} />;
                  })
                )}
              </SortableContext>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-sm text-gray-700">
              Available Defense
            </h3>
            <div className="flex flex-wrap gap-2 bg-gray-100 rounded-lg border p-3">
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
                  <Placeholder
                    id="placeholder-availableDefense"
                    label="Drag D back here"
                  />
                ) : (
                  state.availableDefense.map((id) => {
                    const player = defense.find((p) => p.id === id);
                    return <PlayerCard key={id} id={id} player={player} />;
                  })
                )}
              </SortableContext>
            </div>
          </div>
        </div>

        {/* Units: each has F row + D row (U3) */}
        <div className="flex flex-col gap-4">
          {units.map((num) => {
            const fId = `unit${num}F`;
            const dId = `unit${num}D`;

            const fItems =
              state[fId].length > 0 ? state[fId] : [`placeholder-${fId}`];
            const dItems =
              state[dId].length > 0 ? state[dId] : [`placeholder-${dId}`];

            return (
              <div
                key={num}
                className="flex flex-col gap-2 bg-gray-50 rounded-lg border p-3"
              >
                <div className="text-xs font-semibold text-gray-600">
                  Unit {num}
                </div>

                {/* Forwards Row */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-gray-500">
                    Forwards — LW / C / RW
                  </div>
                  <div className="flex items-center gap-2">
                    <SortableContext
                      id={fId}
                      items={fItems}
                      strategy={horizontalListSortingStrategy}
                    >
                      {fItems.map((id) => {
                        if (id.startsWith("placeholder-")) {
                          return (
                            <Placeholder
                              key={id}
                              id={id}
                              label="Drop F here"
                            />
                          );
                        }
                        const player = forwards.find((p) => p.id === id);
                        return <PlayerCard key={id} id={id} player={player} />;
                      })}
                    </SortableContext>
                  </div>
                </div>

                {/* Defense Row */}
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-semibold text-gray-500">
                    Defense — LD / RD
                  </div>
                  <div className="flex items-center gap-2">
                    <SortableContext
                      id={dId}
                      items={dItems}
                      strategy={horizontalListSortingStrategy}
                    >
                      {dItems.map((id) => {
                        if (id.startsWith("placeholder-")) {
                          return (
                            <Placeholder
                              key={id}
                              id={id}
                              label="Drop D here"
                            />
                          );
                        }
                        const player = defense.find((p) => p.id === id);
                        return <PlayerCard key={id} id={id} player={player} />;
                      })}
                    </SortableContext>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && !activeId.startsWith("placeholder-") && (
            <PlayerCard
              id={activeId}
              player={allPlayers.find((p) => p.id === activeId)}
            />
          )}
        </DragOverlay>
      </DndContext>
    );
  };

  // ---------- Main Render ----------
  return (
    <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-6">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-2 sm:gap-4 mb-8 flex-wrap">
        {[
          { key: "forwards", label: "Forward Lines" },
          { key: "defense", label: "Defense Pairs" },
          { key: "units", label: "5-Player Units" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold ${
              mode === opt.key
                ? `${teamColors?.bg || "bg-emerald-600"} text-white`
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === "forwards" && renderForwardsMode()}
      {mode === "defense" && renderDefenseMode()}
      {mode === "units" && renderUnitsMode()}
    </div>
  );
}




