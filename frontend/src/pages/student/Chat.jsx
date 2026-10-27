import React, { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Search } from "lucide-react";
import { messageAPI, userAPI } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { PageLoader, EmptyState, Input, Button } from "../../components/UI.jsx";
import { timeAgo, getErrorMessage } from "../../utils/helpers.js";

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [chatError, setChatError] = useState("");
  const messagesEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await messageAPI.getConversations();
        setConversations(res.data.conversations);
      } catch (err) {
        setChatError(getErrorMessage(err) || "Could not load conversations.");
      }
      setLoadingConvs(false);
    };
    load();
  }, []);

  // Join conversation room and load messages when active conversation changes
  useEffect(() => {
    if (!activeConv) return;

    socket?.emit("conversation:join", activeConv._id);

    const loadMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await messageAPI.getMessages(activeConv._id);
        setMessages(res.data.messages);
      } catch (err) {
        setChatError(getErrorMessage(err) || "Could not load messages.");
      }
      setLoadingMsgs(false);
    };
    loadMessages();
  }, [activeConv?._id]);

  // Listen for incoming messages in the active conversation
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation === activeConv?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket, activeConv?._id]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConv || !socket) return;
    setChatError("");
    socket.emit("message:send", { conversationId: activeConv._id, content: newMessage.trim() });
    setNewMessage("");
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    const query = searchUser.trim();
    setSearchError("");
    setSearchResults([]);
    if (query.length < 2) {
      setSearchError("Enter at least 2 characters to search.");
      return;
    }
    setSearching(true);
    try {
      const res = await userAPI.searchDirectory(query);
      setSearchResults(res.data.users || []);
      if (!res.data.users?.length) setSearchError("No active campus users found.");
    } catch (err) {
      setSearchError(getErrorMessage(err) || "Unable to search campus users.");
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (participantId) => {
    try {
      const res = await messageAPI.getOrCreate(participantId);
      const conv = res.data.conversation;
      setActiveConv(conv);
      setSearchResults([]);
      setSearchUser("");
      // Add to list if not already there
      setConversations((prev) =>
        prev.find((c) => c._id === conv._id) ? prev : [conv, ...prev]
      );
    } catch (err) {
      setChatError(getErrorMessage(err) || "Could not start this conversation.");
    }
  };

  const getOtherParticipant = (conv) =>
    conv.participants?.find((p) => p._id !== user._id);

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-blue-600" /> Campus Chat
      </h1>

      <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white" style={{ height: "70vh" }}>
        {/* Sidebar */}
        <div className="w-72 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100">
            <form onSubmit={handleSearchUser} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Find user..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <button type="submit" className="text-blue-600 text-xs font-medium hover:underline">Go</button>
            </form>

            {searching && <p className="mt-2 px-2 text-xs text-slate-500">Searching campus directory…</p>}
            {searchError && <p role="status" className="mt-2 px-2 text-xs text-amber-700">{searchError}</p>}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => startConversation(u._id)}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-blue-50 text-slate-700"
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-slate-400 ml-1 capitalize">({u.role})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loadingConvs ? (
              <PageLoader />
            ) : conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center p-4">Search for a user to start chatting.</p>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv);
                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition ${activeConv?._id === conv._id ? "bg-blue-50" : ""}`}
                  >
                    <p className="font-medium text-sm text-slate-800">{other?.name || "Unknown"}</p>
                    <p className="text-xs text-slate-400 truncate">{conv.lastMessage || "No messages yet"}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col min-w-0">
          {chatError && <div role="alert" className="mx-4 mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">{chatError}</div>}
          {!activeConv ? (
            <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose someone to message from the left panel." />
          ) : (
            <>
              {/* Header */}
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <p className="font-semibold text-slate-800">
                  {getOtherParticipant(activeConv)?.name}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {getOtherParticipant(activeConv)?.role}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMsgs ? (
                  <PageLoader />
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-400">No messages yet. Say hi!</p>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                    return (
                      <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                          isMine ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-slate-400"}`}>
                            {timeAgo(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={socket ? "Type a message..." : "Connecting to chat…"}
                  disabled={!socket}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Chat;
