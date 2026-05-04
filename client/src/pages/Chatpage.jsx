import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/Authcontext";
import { useSearchParams } from "react-router-dom";
import api from "../utils/Api";
import socket from "../utils/socket";
import { Send, Users, User as UserIcon, MessageSquare, Search, ArrowLeft } from "lucide-react";
import UniLifeLoader from "../components/Loader/UniLifeLoader";

// ✅ 1. IRONCLAD ERROR BOUNDARY: If a network error ever happens, it shows a safe recovery screen instead of a blank white page!
class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Chat Rendering Crash Prevented:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-[60vh] bg-rose-50 rounded-3xl border-2 border-rose-200 p-8 text-center">
          <MessageSquare className="w-16 h-16 text-rose-400 mb-4" />
          <h2 className="text-2xl font-bold text-rose-700 mb-2">Message Sync Interrupted</h2>
          <p className="text-rose-600 font-medium mb-6">A network mismatch occurred. Please refresh to sync your messages.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 shadow-md transition-all">
            Refresh Chat
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Safely format time to absolutely prevent Date crashing
const safeFormatTime = (dateString) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

// Safe scroll execution to prevent older browser crashes
const executeSmoothScroll = (container, behavior = "smooth") => {
  if (!container) return;
  try {
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({ top: container.scrollHeight, behavior });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  } catch (e) {
    container.scrollTop = container.scrollHeight;
  }
};

const ChatpageContent = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [contacts, setContacts] = useState({ groups: [], users: [] });
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const scrollContainerRef = useRef(null);
  const isFetchingInitialRef = useRef(false);

  // Fetch Contacts
  useEffect(() => {
    let isMounted = true;
    const fetchContacts = async () => {
      try {
        const res = await api.get("/chat/contacts");
        if (isMounted) {
          setContacts({
            groups: Array.isArray(res.data?.groups) ? res.data.groups : [],
            users: Array.isArray(res.data?.users) ? res.data.users : [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
        if (isMounted) setContacts({ groups: [], users: [] });
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchContacts();
    return () => { isMounted = false; };
  }, []);

  // Handle URL Params
  useEffect(() => {
    try {
      const groupsArray = Array.isArray(contacts?.groups) ? contacts.groups : [];
      const usersArray = Array.isArray(contacts?.users) ? contacts.users : [];

      if (groupsArray.length > 0 || usersArray.length > 0) {
        const activeGroupId = searchParams.get('activeGroup');
        const activePrivateId = searchParams.get('activePrivate');

        if (activeGroupId) {
          const targetGroup = groupsArray.find(g => String(g?._id) === String(activeGroupId));
          if (targetGroup) setActiveChat({ type: "group", target: targetGroup });
          searchParams.delete('activeGroup');
          setSearchParams(searchParams, { replace: true });
        } else if (activePrivateId) {
          const targetUser = usersArray.find(u => String(u?._id) === String(activePrivateId));
          if (targetUser) setActiveChat({ type: "private", target: targetUser });
          searchParams.delete('activePrivate');
          setSearchParams(searchParams, { replace: true });
        } else if (!activeChat && window.innerWidth >= 768) {
          if (groupsArray.length > 0) {
            setActiveChat({ type: "group", target: groupsArray[0] });
          } else if (usersArray.length > 0) {
            setActiveChat({ type: "private", target: usersArray[0] });
          }
        }
      }
    } catch (e) {
      console.error("URL Params Error:", e);
    }
  }, [contacts, searchParams, activeChat]);

  // Handle Room Switching, Message Fetching & Socket Connection
  useEffect(() => {
    if (!activeChat || !activeChat?.target || !activeChat?.target?._id) return;

    let isMounted = true;
    isFetchingInitialRef.current = true;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/chat/messages?targetId=${activeChat.target._id}&type=${activeChat.type}`);
        const fetchedMessages = Array.isArray(res.data) ? res.data : [];
        
        if (isMounted) {
          setMessages(fetchedMessages);
          
          // ✅ 2. THE PERFECT "ATTRACT" SCROLL ANIMATION
          // This starts the view ~10-15 messages higher, then smoothly glides down
          setTimeout(() => {
            const container = scrollContainerRef.current;
            if (container) {
              container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight - 800);
              
              requestAnimationFrame(() => {
                executeSmoothScroll(container, "smooth");
                isFetchingInitialRef.current = false;
              });
            }
          }, 100);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        if (isMounted) setMessages([]);
        isFetchingInitialRef.current = false;
      }
    };
    fetchMessages();

    // Socket Setup
    const roomId = activeChat.type === "group" 
      ? String(activeChat.target._id)
      : [String(user?._id || "unknown"), String(activeChat.target._id)].sort().join("_");

    if (socket && typeof socket.emit === 'function') {
      socket.emit("join_chat_room", roomId);
    }

    // ✅ 3. THE EXTREME SOCKET SANITIZER: Prevents cross-browser data corruption
    const handleNewMessage = (rawMsg) => {
      if (!rawMsg || typeof rawMsg !== 'object') return;

      try {
        const senderData = typeof rawMsg.sender === 'object' && rawMsg.sender !== null ? rawMsg.sender : {};
        const fallbackId = typeof rawMsg.sender === 'string' ? rawMsg.sender : "";

        const cleanMsg = {
           _id: String(rawMsg._id || Math.random()),
           text: String(rawMsg.text || ""),
           createdAt: String(rawMsg.createdAt || new Date().toISOString()),
           sender: { 
             _id: String(senderData._id || fallbackId || ""), 
             name: String(senderData.name || "Unknown"), 
             role: String(senderData.role || ""), 
             avatar: String(senderData.avatar || "") 
           }
        };

        setMessages((prev) => {
          const safePrev = Array.isArray(prev) ? prev : [];
          if (safePrev.some(m => String(m._id) === cleanMsg._id)) return safePrev;
          return [...safePrev, cleanMsg];
        });

        // Instant safe scroll for new real-time messages
        setTimeout(() => {
          if (!isFetchingInitialRef.current && scrollContainerRef.current) {
            executeSmoothScroll(scrollContainerRef.current, "smooth");
          }
        }, 50);

      } catch (err) {
        console.error("Safely blocked malformed socket message:", err);
      }
    };
    
    if (socket && typeof socket.on === 'function') {
      socket.on("receive_message", handleNewMessage);
    }

    return () => {
      isMounted = false;
      if (socket && typeof socket.emit === 'function') {
        socket.emit("leave_chat_room", roomId);
      }
      if (socket && typeof socket.off === 'function') {
        socket.off("receive_message", handleNewMessage);
      }
    };
  }, [activeChat, user?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !activeChat?.target?._id) return;

    try {
      const textToSend = inputText;
      setInputText(""); // Clear UI instantly for better feel
      
      await api.post("/chat/message", {
        targetId: activeChat.target._id,
        type: activeChat.type,
        text: textToSend,
      });
    } catch (err) {
      console.error("Send message error:", err);
      alert("Failed to send message.");
    }
  };

  const safeGroups = Array.isArray(contacts?.groups) ? contacts.groups : [];
  const safeUsers = Array.isArray(contacts?.users) ? contacts.users : [];
  const query = String(searchQuery || '').toLowerCase();

  const filteredGroups = safeGroups.filter(g => String(g?.name || '').toLowerCase().includes(query));
  const filteredUsers = safeUsers.filter(u => String(u?.name || '').toLowerCase().includes(query));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <UniLifeLoader size="md" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto h-[calc(100dvh-5rem)] lg:h-[82vh] bg-white rounded-none lg:rounded-3xl shadow-sm border-0 lg:border border-slate-200 overflow-hidden flex animate-in fade-in zoom-in-95 duration-500">
      
      {/* ---------------- LEFT SIDEBAR: CONTACTS LIST ---------------- */}
      <div className={`w-full md:w-80 lg:w-96 bg-slate-50 border-r border-slate-200 flex-col h-full shrink-0 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" /> Messages
          </h2>
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6 pb-20 md:pb-3">
          
          {/* GROUP CHATS */}
          {filteredGroups.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Group Chats</p>
              <div className="space-y-1">
                {filteredGroups.map(group => (
                  <button 
                    key={group?._id || Math.random()} 
                    onClick={() => setActiveChat({ type: 'group', target: group })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeChat?.target?._id === group?._id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-200/50 text-slate-700'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeChat?.target?._id === group?._id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className={`font-bold text-sm truncate ${activeChat?.target?._id === group?._id ? 'text-white' : 'text-slate-900'}`}>{String(group?.name || 'Group')}</p>
                      <p className={`text-xs truncate ${activeChat?.target?._id === group?._id ? 'text-indigo-200' : 'text-slate-500'}`}>Group Discussion</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PRIVATE CHATS */}
          {filteredUsers.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Direct Messages</p>
              <div className="space-y-1">
                {filteredUsers.map(u => (
                  <button 
                    key={u?._id || Math.random()} 
                    onClick={() => setActiveChat({ type: 'private', target: u })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeChat?.target?._id === u?._id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-200/50 text-slate-700'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${activeChat?.target?._id === u?._id ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
                      {u?.avatar ? (
                        <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`font-bold text-sm truncate ${activeChat?.target?._id === u?._id ? 'text-white' : 'text-slate-900'}`}>{String(u?.name || 'User')}</p>
                      <p className={`text-[10px] uppercase tracking-wide font-bold truncate ${activeChat?.target?._id === u?._id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {String(u?.role || '').replace('_', ' ')} {u?.groupName ? ` • ${u.groupName}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredGroups.length === 0 && filteredUsers.length === 0 && searchQuery && (
            <p className="text-sm text-slate-400 text-center mt-6">No conversations found.</p>
          )}
        </div>
      </div>

      {/* ---------------- RIGHT SIDEBAR: ACTIVE CHAT AREA ---------------- */}
      <div className={`flex-1 flex-col bg-slate-50/30 relative h-full ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            <div className="h-16 sm:h-20 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {activeChat?.type === 'group' ? (
                    <Users className="w-5 h-5 text-indigo-600"/>
                  ) : activeChat?.target?.avatar ? (
                    <img src={activeChat.target.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-600"/>
                  )}
                </div>

                <div className="overflow-hidden">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{String(activeChat?.target?.name || 'Chat')}</h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {activeChat?.type === 'group' ? 'Group Chat' : String(activeChat?.target?.role || '').replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 custom-scrollbar overscroll-contain">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <div className="p-4 bg-slate-100 rounded-full"><MessageSquare className="w-8 h-8 text-slate-300" /></div>
                  <p className="font-medium text-sm">Say hello to start the conversation.</p>
                </div>
              ) : (
                (Array.isArray(messages) ? messages : []).map((msg, index) => {
                  // ✅ 4. UN-CRASHABLE JSX RENDERER
                  if (!msg || typeof msg !== 'object') return null;

                  const sObj = (typeof msg.sender === 'object' && msg.sender !== null) ? msg.sender : {};
                  const isMe = Boolean(user?._id && String(sObj._id) === String(user._id));
                  const showSenderName = !isMe && activeChat?.type === 'group';
                  
                  return (
                    <div key={String(msg._id || index)} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      
                      {!isMe && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 mr-2 mt-auto mb-1 flex items-center justify-center">
                          {sObj.avatar ? (
                            <img src={sObj.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 m-1 sm:m-1.5" />
                          )}
                        </div>
                      )}

                      <div className={`max-w-[85%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showSenderName && (
                          <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1 truncate">{String(sObj.name || 'Unknown')}</span>
                        )}
                        <div 
                          className={`px-4 py-2.5 rounded-2xl text-sm sm:text-base shadow-sm wrap-break-word ${
                            isMe 
                              ? 'bg-indigo-600 text-white rounded-br-sm' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                          }`}
                        >
                          {String(msg.text || '')}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 mt-1 mx-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {safeFormatTime(msg.createdAt)}
                        </span>
                      </div>

                      {isMe && (
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 overflow-hidden shrink-0 ml-2 mt-auto mb-1 flex items-center justify-center">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Me" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 m-1 sm:m-1.5" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 z-10 pb-6 sm:pb-4">
              <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 bg-slate-100 border border-transparent rounded-full sm:rounded-xl px-5 py-3 sm:py-3.5 text-sm sm:text-base outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full sm:rounded-xl flex items-center justify-center transition-all shadow-md shrink-0 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  <Send className="w-5 h-5 sm:w-6 sm:h-6 ml-1 sm:ml-1.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full hidden md:flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="p-6 bg-slate-100 rounded-full"><MessageSquare className="w-12 h-12 text-slate-300" /></div>
            <p className="font-semibold text-lg text-slate-500">Your Messages</p>
            <p className="text-sm font-medium">Select a contact or group to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap the main component in the Error Boundary
export default function Chatpage() {
  return (
    <ChatErrorBoundary>
      <ChatpageContent />
    </ChatErrorBoundary>
  );
}