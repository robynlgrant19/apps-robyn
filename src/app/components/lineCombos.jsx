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
      PLAYER CARD (draggable)
---------------------------------------------------------- */
function PlayerCard({ id, player }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: 50,
  };

  if (!player) return null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="px-3 py-2 text-center bg-white rounded-md border shadow-sm cursor-grab select-none hover:bg-gray-50 text-xs"
    >
      {player.firstName} {player.lastName}
    </div>
  );
}

/* ---------------------------------------------------------
      PLACEHOLDER SLOT (empty slot)
---------------------------------------------------------- */
function Placeholder({ id, label }) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="px-3 py-2 text-center bg-gray-100 text-gray-500 border border-dashed rounded-md text-[10px] min-w-[65px] select-none"
    >
      {label}
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
      updateDoc(doc(db, "teams", teamId), { savedForwardLines: state });
    }, 200),
    []
  );

  const saveDefensePairs = useCallback(
    debounce((state) => {
      updateDoc(doc(db, "teams", teamId), { savedDefensePairs: state });
    }, 200),
    []
  );

  const saveUnits = useCallback(
    debounce((state) => {
      updateDoc(doc(db, "teams", teamId), { savedUnits: state });
    }, 200),
    []
  );

  useEffect(() => {
    if (forwardState && teamId) saveForwards(forwardState);
  }, [forwardState]);

  useEffect(() => {
    if (defenseState && teamId) saveDefensePairs(defenseState);
  }, [defenseState]);

  useEffect(() => {
    if (unitState && teamId) saveUnits(unitState);
  }, [unitState]);

  /* ---------------------------------------------------------
          DRAG LOGIC
  ---------------------------------------------------------- */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const fromId = active.id;
    const toId = over.id;
    if (fromId === toId) return;

    // ACTIVE mode determines which state object to use
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

    // enforce F/D rules
    const isForward = type === "F";
    if (isForward && !to.includes("line") && to !== "available") return state;
    if (!isForward && !to.includes("pair") && to !== "available") return state;

    // Can't drop onto filled slot
    if (to !== "available" && newState[to].length >= 1) {
      return state;
    }

    // Remove from source
    const fromArr = [...newState[from]];
    const idx = fromArr.indexOf(fromId);
    if (idx !== -1) fromArr.splice(idx, 1);

    // Add to destination
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
      to === "availableForwards" || (to.includes("F-") && to.startsWith("unit"));
    const toIsDefense =
      to === "availableDefense" || (to.includes("D-") && to.startsWith("unit"));

    if (isForward && !toIsForward) return state;
    if (isDefenseP && !toIsDefense) return state;

    if (to !== "availableForwards" && to !== "availableDefense") {
      if (newState[to].length >= 1) return state;
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
          RENDER FORWARD LINES
  ---------------------------------------------------------- */
  const renderForwards = () => {
    if (!forwardState) return null;
    const state = forwardState;
    const lines = [1, 2, 3, 4, 5];

    return (
      <>
        {/* Available */}
        <Section title="Available Forwards">
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
                label="No forwards (drag from lines)"
              />
            ) : (
              state.available.map((id) => (
                <PlayerCard
                  key={id}
                  id={id}
                  player={forwards.find((p) => p.id === id)}
                />
              ))
            )}
          </SortableContext>
        </Section>

        {/* lines */}
        {lines.map((n) => {
          const lw = `line${n}-LW`;
          const c = `line${n}-C`;
          const rw = `line${n}-RW`;

          return (
            <Row key={n} title={`Line ${n} (LW / C / RW)`}>
              {[lw, c, rw].map((slotId) => {
                const ids = state[slotId] || [];
                const items = ids.length > 0 ? ids : [`placeholder-${slotId}`];
                const role = getRoleFromSlotId(slotId);

                return (
                  <SortableContext
                    key={slotId}
                    id={slotId}
                    items={items}
                    strategy={horizontalListSortingStrategy}
                  >
                    {items.map((id) =>
                      id.startsWith("placeholder-") ? (
                        <Placeholder key={id} id={id} label={`${role} Slot`} />
                      ) : (
                        <PlayerCard
                          key={id}
                          id={id}
                          player={forwards.find((p) => p.id === id)}
                        />
                      )
                    )}
                  </SortableContext>
                );
              })}
            </Row>
          );
        })}
      </>
    );
  };

  /* ---------------------------------------------------------
          RENDER DEFENSE PAIRS
  ---------------------------------------------------------- */
  const renderDefense = () => {
    if (!defenseState) return null;
    const state = defenseState;
    const pairs = [1, 2, 3, 4, 5];

    return (
      <>
        <Section title="Available Defense">
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
                label="No defense (drag from pairs)"
              />
            ) : (
              state.available.map((id) => (
                <PlayerCard
                  key={id}
                  id={id}
                  player={defense.find((p) => p.id === id)}
                />
              ))
            )}
          </SortableContext>
        </Section>

        {pairs.map((n) => {
          const ld = `pair${n}-LD`;
          const rd = `pair${n}-RD`;

          return (
            <Row key={n} title={`Pair ${n} (LD / RD)`}>
              {[ld, rd].map((slotId) => {
                const ids = state[slotId] || [];
                const items = ids.length > 0 ? ids : [`placeholder-${slotId}`];
                const role = getRoleFromSlotId(slotId);

                return (
                  <SortableContext
                    key={slotId}
                    id={slotId}
                    items={items}
                    strategy={horizontalListSortingStrategy}
                  >
                    {items.map((id) =>
                      id.startsWith("placeholder-") ? (
                        <Placeholder key={id} id={id} label={`${role} Slot`} />
                      ) : (
                        <PlayerCard
                          key={id}
                          id={id}
                          player={defense.find((p) => p.id === id)}
                        />
                      )
                    )}
                  </SortableContext>
                );
              })}
            </Row>
          );
        })}
      </>
    );
  };

  /* ---------------------------------------------------------
          RENDER UNITS (5 player units)
  ---------------------------------------------------------- */
  const renderUnits = () => {
    if (!unitState) return null;
    const state = unitState;
    const units = [1, 2, 3, 4, 5];

    return (
      <>
        {/* Available forwards + defense */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Section title="Available Forwards">
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
                  label="No forwards"
                />
              ) : (
                state.availableForwards.map((id) => (
                  <PlayerCard
                    key={id}
                    id={id}
                    player={forwards.find((p) => p.id === id)}
                  />
                ))
              )}
            </SortableContext>
          </Section>

          <Section title="Available Defense">
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
                  label="No defense"
                />
              ) : (
                state.availableDefense.map((id) => (
                  <PlayerCard
                    key={id}
                    id={id}
                    player={defense.find((p) => p.id === id)}
                  />
                ))
              )}
            </SortableContext>
          </Section>
        </div>

        {/* Units */}
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
              className="bg-gray-50 border rounded-lg p-3 flex flex-col gap-3 mb-3"
            >
              <div className="text-xs font-semibold text-gray-600">
                Unit {n}
              </div>

              <Row title="Forwards (LW/C/RW)">
                {fSlots.map((slotId) => {
                  const ids = state[slotId] || [];
                  const items = ids.length ? ids : [`placeholder-${slotId}`];
                  const role = getRoleFromSlotId(slotId);

                  return (
                    <SortableContext
                      key={slotId}
                      id={slotId}
                      items={items}
                      strategy={horizontalListSortingStrategy}
                    >
                      {items.map((id) =>
                        id.startsWith("placeholder-") ? (
                          <Placeholder key={id} id={id} label={`${role} Slot`} />
                        ) : (
                          <PlayerCard
                            key={id}
                            id={id}
                            player={forwards.find((p) => p.id === id)}
                          />
                        )
                      )}
                    </SortableContext>
                  );
                })}
              </Row>

              <Row title="Defense (LD/RD)">
                {dSlots.map((slotId) => {
                  const ids = state[slotId] || [];
                  const items = ids.length ? ids : [`placeholder-${slotId}`];
                  const role = getRoleFromSlotId(slotId);

                  return (
                    <SortableContext
                      key={slotId}
                      id={slotId}
                      items={items}
                      strategy={horizontalListSortingStrategy}
                    >
                      {items.map((id) =>
                        id.startsWith("placeholder-") ? (
                          <Placeholder key={id} id={id} label={`${role} Slot`} />
                        ) : (
                          <PlayerCard
                            key={id}
                            id={id}
                            player={defense.find((p) => p.id === id)}
                          />
                        )
                      )}
                    </SortableContext>
                  );
                })}
              </Row>
            </div>
          );
        })}
      </>
    );
  };

  /* ---------------------------------------------------------
          UI WRAPPERS
  ---------------------------------------------------------- */
  function Section({ title, children }) {
    return (
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 text-gray-700">{title}</h3>
        <div className="bg-gray-100 border rounded-lg p-3 flex flex-wrap gap-2">
          {children}
        </div>
      </div>
    );
  }

  function Row({ title, children }) {
    return (
      <div className="bg-gray-100 border rounded-lg p-3 flex flex-col gap-2">
        <div className="text-[11px] font-semibold text-gray-600">{title}</div>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    );
  }

  /* ---------------------------------------------------------
          MAIN RENDER
  ---------------------------------------------------------- */
  return (
    <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-6">
      {/* toggle buttons */}
      <div className="flex justify-center gap-2 mb-6">
        {[
          { key: "forwards", label: "Forward Lines" },
          { key: "defense", label: "Defense Pairs" },
          { key: "units", label: "5-Man Units" },
        ].map((o) => (
          <button
            key={o.key}
            onClick={() => setMode(o.key)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${
              mode === o.key
                ? `${teamColors?.bg || "bg-emerald-600"} text-white`
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {mode === "forwards" && renderForwards()}
        {mode === "defense" && renderDefense()}
        {mode === "units" && renderUnits()}

        <DragOverlay>
          {activeId && !activeId.startsWith("placeholder-") && (
            <PlayerCard
              id={activeId}
              player={players.find((p) => p.id === activeId)}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}







