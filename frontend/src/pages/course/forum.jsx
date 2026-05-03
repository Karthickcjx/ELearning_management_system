import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, Users, Hash, Clock } from 'lucide-react'
import { courseService } from '../../api/course.service'

function Forum({ courseId }) {
  const taskRef = useRef("")
  const messagesEndRef = useRef(null)
  const [message, setMessage] = useState([])
  const [name] = useState(localStorage.getItem("name"))
  const [course, setCourse] = useState()
  const [sending, setSending] = useState(false)

  const [formData, setFormData] = useState({
    name: name,
    course_id: courseId,
    content: ''
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [message])

  useEffect(() => {
    const fetchData = async () => {
      const msgRes = await courseService.getMessages(courseId);
      if (msgRes.success) setMessage(msgRes.data);

      const courseRes = await courseService.getCourseById(courseId);
      if (courseRes.success) setCourse(courseRes.data);
    };

    if (courseId) fetchData();
  }, [courseId]);

  const addTask = async () => {
    if (!formData.content.trim()) {
      alert("Enter a Message")
      return
    }

    setSending(true)
    const res = await courseService.addMessage({
      ...formData,
      content: formData.content.trim(),
    })
    if (res.success) {
      setMessage([...message, res.data]);
      setFormData({ ...formData, content: "" })
      taskRef.current.value = ""
    } else {
      alert("Failed to send message")
    }
    setSending(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      addTask()
    }
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-primary', 'bg-accent', 'bg-emerald-500', 'bg-sky-500',
      'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500'
    ]
    const index = name?.length ? name.length % colors.length : 0
    return colors[index]
  }

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;

    return time.toLocaleString();
  };


  return (
    <div>
      <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-slate-900">{course?.course_name} Discussion</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{message.filter(m => m.content.trim() !== "").length} messages</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>Active discussion</span>
          </div>
        </div>
      </div>

      <div className="h-80 overflow-y-auto mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        {message.length > 0 ? (
          message.map((value, key) => (
            value.content.trim() !== "" && (
              <div key={key} className="mb-3 p-3 bg-white border border-slate-200 rounded-md">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 ${getAvatarColor(value.userName)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
                    {getInitials(value.userName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-900">{value.userName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(value.time)}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm">{value.content}</p>
                  </div>
                </div>
              </div>
            )
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <MessageCircle className="w-10 h-10 text-slate-300 mb-2" />
            <h4 className="text-base font-semibold text-slate-900">No messages yet</h4>
            <p className="text-sm text-slate-500 mt-1">Start the conversation.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <div className={`w-8 h-8 ${getAvatarColor(name)} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
          {getInitials(name)}
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={taskRef}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              onKeyPress={handleKeyPress}
              rows="3"
              className="w-full px-3 py-2 pr-12 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 resize-none text-sm text-slate-700"
              placeholder="Share your thoughts, ask questions, or help others..."
              disabled={sending}
            />
            <button
              onClick={addTask}
              disabled={sending || !formData.content.trim()}
              className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              Press <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">Enter</kbd> to send, <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">Shift + Enter</kbd> for new line
            </p>
            <p className="text-xs text-slate-400">
              {formData.content.length}/500
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forum
