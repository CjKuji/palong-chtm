"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Topbar from "@/app/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useSidebar } from '@/app/context/SidebarContext';

interface Tool {
  id: string;
  name: string;
  category: "kitchen" | "bar" | "baking";
  quantity: number;
  total: number;
  status: "no_stck" | "low_stck" | "in_stck" | "full_stck" | "archived";
  last_checked: string;
  created_at: string;
}

export default function ToolInventory() {
  const { collapsed } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "kitchen" | "bar" | "baking"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [archivedTools, setArchivedTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  const [newTool, setNewTool] = useState({
    name: "",
    category: "kitchen" as Tool["category"],
    quantity: 0,
    total: 0,
  });

  // New: state for user role
  const [userRole, setUserRole] = useState<string | null>(null);

  // Check screen size with multiple breakpoints
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch user role dynamically
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        setUserRole(profile.role);
      } catch (error) {
        console.error("Unexpected error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Fetch tools
  useEffect(() => {
    fetchTools();
    fetchArchivedTools();
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error("Error fetching tools:", error);
      setTools([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedTools = async () => {
    try {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .eq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArchivedTools(data || []);
    } catch (error) {
      console.error("Error fetching archived tools:", error);
      setArchivedTools([]);
    }
  };

  const computeStatus = (quantity: number, total: number): Tool["status"] => {
    if (total === 0 || quantity === 0) return "no_stck";
    const pct = (quantity / total) * 100;
    if (pct === 100) return "full_stck";
    if (pct <= 50) return "low_stck";
    return "in_stck";
  };

  const getToolStatus = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      no_stck: { text: "No stock", color: "bg-red-100 text-red-700" },
      low_stck: { text: "Low stock", color: "bg-yellow-100 text-yellow-700" },
      in_stck: { text: "In stock", color: "bg-green-100 text-green-700" },
      full_stck: { text: "Full stock", color: "bg-teal-100 text-teal-700" },
    };
    return statusMap[status] || { text: status, color: "bg-gray-100 text-gray-700" };
  };

 const handleAddTool = async () => {
  if (!newTool.name.trim()) {
    alert("Tool name cannot be empty");
    return;
  }

  try {
    const status = computeStatus(newTool.quantity, newTool.total);
    const { error } = await supabase.from("tools").insert([
      {
        name: newTool.name.trim(),
        category: newTool.category, // must match enum
        quantity: Number(newTool.quantity),
        total: Number(newTool.total),
        status,
        last_checked: new Date().toISOString().split("T")[0],
      },
    ]);

    if (error) throw error;

    setIsModalOpen(false);
    setNewTool({ name: "", category: "kitchen", quantity: 0, total: 0 });
    fetchTools();
  } catch (error) {
    console.error("Error adding tool:", error);
    alert("Error adding tool. Please check console for details.");
  }
};

  const deleteTool = async (id: string) => {
    if (userRole !== "admin") return; // only admin can delete
    try {
      const { error } = await supabase.from("tools").delete().eq("id", id);
      if (error) throw error;
      fetchTools();
    } catch (error) {
      console.error("Error deleting tool:", error);
      alert("Error deleting tool. Please try again.");
    }
  };

  const archiveTool = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tools")
        .update({ status: "archived" })
        .eq("id", id);
      if (error) throw error;
      fetchTools();
      fetchArchivedTools();
    } catch (error) {
      console.error("Error archiving tool:", error);
      alert("Error archiving tool.");
    }
  };

  const filteredTools =
    categoryFilter === "all"
      ? tools
      : tools.filter((t) => t.category === categoryFilter);

  // Summary counts
  const kitchenTools = tools.filter((t) => t.category === "kitchen");
  const barTools = tools.filter((t) => t.category === "bar");
  const bakingTools = tools.filter((t) => t.category === "baking");

  const showSimplifiedColumns = categoryFilter !== "all";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
        <Sidebar activeMenu="tools" />
        <main className={`
          flex-1 transition-all duration-300 w-full
          ${isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}>
          <div className="w-full">
            <Topbar />
          </div>
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl mx-auto flex items-center justify-center h-96">
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
      <Sidebar activeMenu="tools" />
      
      <main className={`
        flex-1 transition-all duration-300 w-full
        ${isMobile ? 'ml-0' : collapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        <div className="w-full">
          <Topbar />
        </div>
        
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
          {/* Header - Increased margin to drag title down */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-10 gap-4 mt-24 sm:mt-32">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
              Tool Inventory
            </h1>
            <div className="flex gap-3 w-full sm:w-auto sm:justify-end">
              <button
                onClick={() => setArchiveModalOpen(true)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none min-w-[100px]"
              >
                Archive
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md text-sm flex-1 sm:flex-none min-w-[100px]"
              >
                + Add Tool
              </button>
            </div>
          </div>

          {/* Category Filters - Responsive */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 md:mb-8 hover:bg-pink-50 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter by category:</span>
              <div className="flex flex-wrap gap-2">
                {(["all", "kitchen", "bar", "baking"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-full transition ${
                      categoryFilter === cat
                        ? "bg-pink-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-pink-400 hover:text-white"
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Table - Fully Responsive */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm md:text-base">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {showSimplifiedColumns ? (
                      <>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">NAME OF TOOLS EQUIPMENT</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">QTY</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">TOTAL</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">STATUS</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">ACTIONS</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">Tool Name</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600 hidden sm:table-cell">Category</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">QTY</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">Total</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">Status</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600 hidden md:table-cell">Last Checked</th>
                        <th className="text-left py-3 px-3 sm:px-4 md:px-5 font-semibold text-gray-600">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredTools.map((tool) => (
                    <tr key={tool.id} className="border-b border-gray-100 hover:bg-pink-50 transition-colors duration-200">
                      <td className="py-3 px-3 sm:px-4 md:px-5 text-gray-800 max-w-[150px] sm:max-w-[200px] truncate">
                        {tool.name}
                      </td>
                      {!showSimplifiedColumns && (
                        <td className="py-3 px-3 sm:px-4 md:px-5 text-gray-800 capitalize hidden sm:table-cell">
                          {tool.category}
                        </td>
                      )}
                      <td className="py-3 px-3 sm:px-4 md:px-5 text-gray-800">{tool.quantity}</td>
                      <td className="py-3 px-3 sm:px-4 md:px-5 text-gray-800">{tool.total}</td>
                      <td className="py-3 px-3 sm:px-4 md:px-5">
                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${getToolStatus(tool.status).color}`}>
                          {getToolStatus(tool.status).text}
                        </span>
                      </td>
                      {!showSimplifiedColumns && (
                        <td className="py-3 px-3 sm:px-4 md:px-5 text-gray-800 hidden md:table-cell">
                          {tool.last_checked}
                        </td>
                      )}
                      <td className="py-3 px-3 sm:px-4 md:px-5">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setEditTool(tool);
                              setEditModalOpen(true);
                            }}
                            className="text-xs text-teal-600 hover:text-teal-800 font-medium whitespace-nowrap"
                          >
                            Edit
                          </button>
                          {userRole === "admin" && (
                            <button
                              onClick={() => deleteTool(tool.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium whitespace-nowrap"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() => archiveTool(tool.id)}
                            className="text-xs text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTools.length === 0 && (
                    <tr>
                      <td colSpan={showSimplifiedColumns ? 5 : 7} className="py-8 text-center text-gray-500 text-sm">
                        No tools found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mt-6 md:mt-8">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 border-l-4 border-teal-500 hover:bg-pink-50 transition-colors duration-200">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Tools</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{tools.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 border-l-4 border-green-500 hover:bg-pink-50 transition-colors duration-200">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Kitchen</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{kitchenTools.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 border-l-4 border-blue-500 hover:bg-pink-50 transition-colors duration-200">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Bar</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{barTools.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 border-l-4 border-purple-500 hover:bg-pink-50 transition-colors duration-200">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Baking</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{bakingTools.length}</p>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          {(isMobile || isTablet) && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => setArchiveModalOpen(true)}
                className="bg-gray-100 text-gray-700 p-3 rounded-lg text-center text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                View Archive
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-pink-100 text-pink-700 p-3 rounded-lg text-center text-sm font-medium hover:bg-pink-200 transition-colors"
              >
                Quick Add
              </button>
            </div>
          )}
        </div>
        
        {/* Modals - unchanged with responsive padding */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4">Add New Tool</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter tool name"
                    value={newTool.name}
                    onChange={(e) =>
                      setNewTool({ ...newTool, name: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newTool.category}
                    onChange={(e) =>
                      setNewTool({
                        ...newTool,
                        category: e.target.value as Tool["category"],
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="bar">Bar</option>
                    <option value="baking">Baking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={newTool.quantity}
                    onChange={(e) =>
                      setNewTool({
                        ...newTool,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total
                  </label>
                  <input
                    type="number"
                    placeholder="Enter total"
                    value={newTool.total}
                    onChange={(e) =>
                      setNewTool({
                        ...newTool,
                        total: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTool}
                  className="px-4 py-2 text-sm bg-pink-500 text-white rounded-md hover:bg-pink-600"
                >
                  Add Tool
                </button>
              </div>
            </div>
          </div>
        )}
        
        {editModalOpen && editTool && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-4">Edit Tool</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tool Name
                  </label>
                  <input
                    type="text"
                    value={editTool.name}
                    onChange={(e) =>
                      setEditTool({ ...editTool, name: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={editTool.category}
                    onChange={(e) =>
                      setEditTool({
                        ...editTool,
                        category: e.target.value as Tool["category"],
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="kitchen">Kitchen</option>
                    <option value="bar">Bar</option>
                    <option value="baking">Baking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editTool.quantity}
                    onChange={(e) =>
                      setEditTool({
                        ...editTool,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total
                  </label>
                  <input
                    type="number"
                    value={editTool.total}
                    onChange={(e) =>
                      setEditTool({
                        ...editTool,
                        total: Number(e.target.value),
                      })
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editTool) return;
                    try {
                      const status = computeStatus(
                        editTool.quantity,
                        editTool.total
                      );
                      const { error } = await supabase
                        .from("tools")
                        .update({
                          name: editTool.name,
                          category: editTool.category,
                          quantity: editTool.quantity,
                          total: editTool.total,
                          status,
                          last_checked: new Date()
                            .toISOString()
                            .split("T")[0],
                        })
                        .eq("id", editTool.id);

                      if (error) throw error;

                      setEditModalOpen(false);
                      setEditTool(null);
                      fetchTools();
                    } catch (error) {
                      console.error("Error updating tool:", error);
                      alert("Error updating tool. Please try again.");
                    }
                  }}
                  className="px-4 py-2 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        
        {archiveModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Archived Tools</h2>

                <button
                  onClick={() => setArchiveModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-2 sm:px-4">Name</th>
                      <th className="text-left py-2 px-2 sm:px-4">Category</th>
                      <th className="text-left py-2 px-2 sm:px-4">QTY</th>
                      <th className="text-left py-2 px-2 sm:px-4">Total</th>
                      <th className="text-left py-2 px-2 sm:px-4">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {archivedTools.map((tool) => (
                      <tr key={tool.id} className="border-b">
                        <td className="py-2 px-2 sm:px-4 text-sm truncate max-w-[120px] sm:max-w-[200px]">{tool.name}</td>
                        <td className="py-2 px-2 sm:px-4 text-sm capitalize">
                          {tool.category}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-sm">{tool.quantity}</td>
                        <td className="py-2 px-2 sm:px-4 text-sm">{tool.total}</td>

                        <td className="py-2 px-2 sm:px-4">
                          <button
                            onClick={async () => {
                              await supabase
                                .from("tools")
                                .update({ status: "in_stck" })
                                .eq("id", tool.id);

                              fetchTools();
                              fetchArchivedTools();
                            }}
                            className="text-xs text-teal-600 hover:text-teal-800 whitespace-nowrap"
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}

                    {archivedTools.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-6 text-gray-500 text-sm"
                        >
                          No archived tools
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}