import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, BookOpen, ClipboardList } from "lucide-react";
import { message } from "antd";
import { adminService } from "../../api/admin.service";
import CourseModal from "./CourseModal";
import DeleteModal from "./DeleteModal";
import AddQuestion from "./AddQuestions";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [courseModal, setCourseModal] = useState({
    isOpen: false,
    mode: "add",
    courseId: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    course: null,
  });

  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const result = await adminService.getAllCourses();
      if (result.success) {
        setCourses(result.data);
      } else {
        message.error(result.error);
      }
    } catch {
      message.error("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const openAddCourseModal = () => {
    setCourseModal({ isOpen: true, mode: "add", courseId: null });
  };

  const openEditCourseModal = (course) => {
    setCourseModal({ isOpen: true, mode: "edit", courseId: course.course_id });
  };

  const closeCourseModal = () => {
    setCourseModal({ isOpen: false, mode: "add", courseId: null });
  };

  const handleCourseSuccess = () => {
    fetchCourses();
  };

  const openDeleteModal = (course) => {
    setDeleteModal({ isOpen: true, course });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, course: null });
  };

  const handleDeleteCourse = async (course) => {
    return await adminService.deleteCourse(course.course_id);
  };

  const handleDeleteSuccess = () => {
    fetchCourses();
  };

  const addQuestions = (course_id) => {
    setSelectedCourseId(course_id);
  };

  if (selectedCourseId) {
    return <AddQuestion courseId={selectedCourseId} onBack={() => setSelectedCourseId(null)} />;
  }

  return (
    <>
      {/* Page header */}
      <div className="admin-page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Course Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your courses and track student progress.
            </p>
          </div>
          <button
            onClick={openAddCourseModal}
            className="admin-btn admin-btn-primary"
          >
            <Plus size={15} />
            Add New Course
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <BookOpen size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-700 m-0">No courses yet</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4 max-w-md">
              Create your first course to add content, manage students, and track progress.
            </p>
            <button
              onClick={openAddCourseModal}
              className="admin-btn admin-btn-primary"
            >
              <Plus size={15} />
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {courses.map((course) => (
              <div
                key={course.course_id}
                className="border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 m-0 truncate">
                        {course.course_name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      {course.instructor && (
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span className="text-slate-500">Instructor:</span>
                          <span className="font-medium text-slate-800 truncate">
                            {course.instructor}
                          </span>
                        </div>
                      )}
                      {course.price && (
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-slate-500">Price:</span>
                          <span className="font-semibold text-emerald-600">
                            ${course.price}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                        <span className="text-slate-500">Students:</span>
                        <span className="font-medium text-slate-800">
                          {course.students || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => addQuestions(course.course_id)}
                      className="admin-btn admin-btn-primary"
                    >
                      <ClipboardList size={14} />
                      Manage Tests
                    </button>
                    <button
                      onClick={() => openEditCourseModal(course)}
                      className="admin-btn admin-btn-secondary"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteModal(course)}
                      className="admin-btn admin-btn-danger"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CourseModal
        isOpen={courseModal.isOpen}
        onClose={closeCourseModal}
        onSuccess={handleCourseSuccess}
        courseId={courseModal.courseId}
        mode={courseModal.mode}
      />
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onSuccess={handleDeleteSuccess}
        onDelete={handleDeleteCourse}
        item={deleteModal.course}
        itemType="Course"
        title="Delete Course"
        description="Are you sure you want to delete this course?"
        itemDisplayName={deleteModal.course?.course_name}
      />
    </>
  );
}

export default Courses;
