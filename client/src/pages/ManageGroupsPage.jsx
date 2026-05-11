import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import { useSearchParams } from "react-router-dom";
import MyGroups from "../components/groups/MyGroups";
import CreateGroup from "../components/groups/CreateGroup";
import JoinGroup from "../components/groups/JoinGroup";
import RequestsApproval from "../components/groups/RequestsApproval";
import NoticeBoard from "../components/noticeboard/NoticeBoard";
import api from "../services/api";

const ManageGroupsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("my-groups");

  // Notice Board Modal State
  const [showNoticeBoard, setShowNoticeBoard] = useState(false);
  const [selectedGroupForNotices, setSelectedGroupForNotices] = useState(null);

  const isAdmin = user && ["admin", "teacher", "cr"].includes(user.role);

  // Handle URL parameters for notifications
  useEffect(() => {
    const openNotice = searchParams.get("openNotice");
    const groupId = searchParams.get("groupId");

    if (openNotice === "true" && groupId) {
      setActiveTab("my-groups");
      openNoticeBoardFromUrl(groupId);
      // Clean up URL after processing
      searchParams.delete("openNotice");
      searchParams.delete("groupId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const openNoticeBoardFromUrl = async (groupId) => {
    try {
      // We need the group name for the modal header.
      // We can fetch user's groups to find it.
      const response = await api.get("/groups/my-groups");
      if (response.data.success) {
        const groupItem = response.data.groups.find(
          (g) => g.group._id === groupId,
        );
        if (groupItem) {
          setSelectedGroupForNotices(groupItem.group);
          setShowNoticeBoard(true);
        }
      }
    } catch (error) {
      console.error("Error opening notice board from URL", error);
    }
  };

  const handleViewNotices = (group) => {
    setSelectedGroupForNotices(group);
    setShowNoticeBoard(true);
  };

  const tabs = [
    {
      id: "my-groups",
      label: "My Groups",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    { id: "create", label: "Create Group", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
    {
      id: "join",
      label: "Join Group",
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    },
  ];

  if (isAdmin) {
    tabs.push({
      id: "requests",
      label: "Requests Approval",
      icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    });
  }

  return (
    <div className="sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Groups</h2>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "text-blue-600 border-blue-600"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={tab.icon}
              />
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 sm:p-6">
        {activeTab === "my-groups" && (
          <MyGroups onViewNotices={handleViewNotices} />
        )}
        {activeTab === "create" && (
          <CreateGroup onGroupCreated={() => setActiveTab("my-groups")} />
        )}
        {activeTab === "join" && <JoinGroup />}
        {activeTab === "requests" && <RequestsApproval />}
      </div>

      {/* Notice Board Modal - Added here to handle URL redirects */}
      {showNoticeBoard && selectedGroupForNotices && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                Notice Board - {selectedGroupForNotices.name}
              </h2>
              <button
                onClick={() => {
                  setShowNoticeBoard(false);
                  setSelectedGroupForNotices(null);
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NoticeBoard
                groupId={selectedGroupForNotices._id}
                groupName={selectedGroupForNotices.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGroupsPage;
