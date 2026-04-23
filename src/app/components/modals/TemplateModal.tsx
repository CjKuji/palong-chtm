"use client";

import { useEffect, useState } from "react";
import { RoomService } from "@/app/services/room.service";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TemplateModal({ open, onClose }: Props) {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(null);

  const [template, setTemplate] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState(1);

  /* =========================================================
    LOAD ROOM TYPES
  ========================================================= */
  const loadRoomTypes = async () => {
    try {
      const data = await RoomService.getRoomTypes();
      const safe = data ?? [];

      setRoomTypes(safe);

      if (!selectedType && safe.length > 0) {
        setSelectedType(safe[0]);
      }
    } catch (err) {
      console.error("[TemplateModal] loadRoomTypes", err);
    }
  };

  /* =========================================================
    LOAD TEMPLATE (PER ROOM TYPE)
  ========================================================= */
  const loadTemplate = async (roomTypeId: number) => {
    setLoading(true);

    try {
      let tpl = await RoomService.getTemplateByRoomType(roomTypeId);

      if (!tpl) {
        tpl = await RoomService.createTemplate(roomTypeId);
      }

      const tplItems = await RoomService.getTemplateItems(tpl.id);

      setTemplate(tpl);
      setItems(tplItems ?? []);
    } catch (err) {
      console.error("[TemplateModal] loadTemplate", err);
      setTemplate(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
    ADD ITEM
  ========================================================= */
  const handleAddItem = async () => {
    if (!newItem.trim() || !template) return;

    try {
      const item = await RoomService.addTemplateItem(template.id, {
        item_name: newItem.trim(),
        default_quantity: 1,
      });

      setItems((prev) => [...prev, item]);
      setNewItem("");
    } catch (err) {
      console.error("[TemplateModal] handleAddItem", err);
    }
  };

  /* =========================================================
    DELETE ITEM
  ========================================================= */
  const handleDeleteItem = async (id: number) => {
    try {
      await RoomService.deleteTemplateItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("[TemplateModal] handleDeleteItem", err);
    }
  };

  /* =========================================================
    UPDATE ITEM
  ========================================================= */
  const handleUpdateItem = async (id: number, value: any) => {
    try {
      const updated = await RoomService.updateTemplateItem(id, value);

      setItems((prev) =>
        prev.map((i) => (i.id === id ? updated : i))
      );

      setEditingId(null);
      setEditName("");
      setEditQty(1);
    } catch (err) {
      console.error("[TemplateModal] handleUpdateItem", err);
    }
  };

  /* =========================================================
    EFFECTS
  ========================================================= */

  useEffect(() => {
    if (!open) return;

    loadRoomTypes();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (selectedType?.id) {
      loadTemplate(selectedType.id);

      // reset edit state when switching type
      setEditingId(null);
      setEditName("");
      setEditQty(1);
    }
  }, [selectedType, open]);

  useEffect(() => {
    if (!open) {
      setRoomTypes([]);
      setSelectedType(null);
      setTemplate(null);
      setItems([]);
      setNewItem("");
      setEditingId(null);
    }
  }, [open]);

  if (!open) return null;

  /* =========================================================
    UI
  ========================================================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[520px] max-h-[80vh] rounded-xl shadow-lg flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">
            Manage Checklist Templates
          </h2>

          <div className="flex gap-2 mt-3 flex-wrap">
            {roomTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 text-sm rounded transition ${
                  selectedType?.id === type.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* ADD ITEM */}
        <div className="p-4 border-b flex gap-2">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add checklist item..."
            className="flex-1 border px-2 py-1 text-sm rounded focus:outline-none focus:ring"
          />

          <button
            onClick={handleAddItem}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            Add
          </button>
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400">
              No checklist items yet
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="border rounded p-2 flex justify-between items-center"
              >
                {editingId === item.id ? (
                  <div className="flex gap-2 flex-1 items-center">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border px-2 py-1 text-sm flex-1"
                    />

                    <input
                      type="number"
                      min={1}
                      value={editQty}
                      onChange={(e) =>
                        setEditQty(Number(e.target.value))
                      }
                      className="border px-2 py-1 w-16 text-sm"
                    />

                    <button
                      onClick={() =>
                        handleUpdateItem(item.id, {
                          item_name: editName,
                          default_quantity: editQty,
                        })
                      }
                      className="text-green-600 text-sm hover:underline"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm">{item.item_name}</p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.default_quantity}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditName(item.item_name);
                          setEditQty(item.default_quantity);
                        }}
                        className="text-blue-500 text-sm hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}