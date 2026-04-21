"use client";

import { useEffect, useState } from "react";

type RoomModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (room: any) => void;
  room?: any;
  roomTypes: any[];
};

export default function RoomModal({
  open,
  onClose,
  onSaved,
  room,
  roomTypes,
}: RoomModalProps) {
  const isEdit = !!room;

  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [roomTypeId, setRoomTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("available");

  useEffect(() => {
    if (!open) return;

    if (room) {
        setRoomNumber(room.room_number ?? "");
        setFloor(room.floor ?? 1);
        setRoomTypeId(room.room_types?.id ?? null);
        setStatus(room.status ?? "available"); // ✅ ADD THIS
    } else {
        setRoomNumber("");
        setFloor(1);
        setRoomTypeId(roomTypes?.[0]?.id ?? null);
        setStatus("available"); // ✅ DEFAULT
    }
    }, [room, roomTypes, open]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!roomNumber || !roomTypeId) return;

    setLoading(true);

    try {
      const payload = {
        room_number: roomNumber,
        floor,
        room_type_id: roomTypeId,
        status,
      };

      await onSaved(payload);
      onClose();
    } catch (err) {
      console.error("[RoomModal]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-xl shadow-lg p-5 space-y-4">

        <h2 className="text-lg font-semibold">
          {isEdit ? "Edit Room" : "Add Room"}
        </h2>

        {/* ROOM NUMBER */}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Room Number
          </label>
          <input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 101"
            className="w-full border px-2 py-1 rounded text-sm mt-1"
          />
        </div>

        {/* FLOOR */}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Floor
          </label>
          <input
            type="number"
            value={floor}
            onChange={(e) => setFloor(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded text-sm mt-1"
          />
        </div>

        {/* ROOM TYPE */}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Room Type
          </label>
          <select
            value={roomTypeId ?? ""}
            onChange={(e) => setRoomTypeId(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded text-sm mt-1"
          >
            {roomTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}
        <div>
        <label className="text-xs font-medium text-gray-600">
            Status
        </label>

        <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border px-2 py-1 rounded text-sm mt-1"
        >
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="dirty">Dirty</option>
            <option value="cleaning">Cleaning</option>
            <option value="inspected">Inspected</option>
            <option value="maintenance">Maintenance</option>
        </select>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="border px-3 py-1 text-sm rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 text-white px-3 py-1 text-sm rounded"
          >
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}